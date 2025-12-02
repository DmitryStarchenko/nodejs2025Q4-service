# Design Document: Docker Containerization

## Overview

Данный дизайн описывает архитектуру Docker-контейнеризации для Home Library Service - NestJS приложения с PostgreSQL базой данных и Prisma ORM. Решение использует Docker Compose для оркестрации двух основных сервисов: приложения и базы данных, обеспечивая изолированную среду выполнения с автоматической настройкой и управлением зависимостями.

Ключевые особенности:
- Многоконтейнерная архитектура с изолированной сетью
- Автоматическое применение Prisma миграций при старте
- Персистентное хранение данных через Docker Volumes
- Поддержка development и production режимов
- Оптимизированная сборка образов с кешированием слоев

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Host                          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Docker Network (app-network)           │  │
│  │                                                  │  │
│  │  ┌──────────────────┐    ┌──────────────────┐  │  │
│  │  │   Application    │    │   PostgreSQL     │  │  │
│  │  │   Container      │───▶│   Container      │  │  │
│  │  │                  │    │                  │  │  │
│  │  │  - NestJS App    │    │  - postgres:16   │  │  │
│  │  │  - Prisma Client │    │  - Port 5432     │  │  │
│  │  │  - Port 4000     │    │                  │  │  │
│  │  └──────────────────┘    └──────────────────┘  │  │
│  │           │                       │             │  │
│  └───────────┼───────────────────────┼─────────────┘  │
│              │                       │                │
│              ▼                       ▼                │
│      ┌──────────────┐        ┌──────────────┐        │
│      │ Host Port    │        │ Docker       │        │
│      │ 4000         │        │ Volume       │        │
│      │ (mapped)     │        │ (postgres-   │        │
│      └──────────────┘        │  data)       │        │
│                              └──────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Container Communication Flow

1. **Startup Sequence:**
   - Docker Compose создает изолированную сеть `app-network`
   - PostgreSQL контейнер стартует первым
   - Application контейнер ожидает готовности PostgreSQL (healthcheck)
   - Prisma выполняет миграции
   - NestJS приложение начинает принимать запросы

2. **Runtime Communication:**
   - Application подключается к PostgreSQL через hostname `postgres` внутри Docker сети
   - Внешние клиенты обращаются к приложению через проброшенный порт 4000
   - PostgreSQL недоступен извне (порт не пробрасывается)

## Components and Interfaces

### 1. Dockerfile (Application)

**Назначение:** Определяет образ для NestJS приложения с поддержкой multi-stage build.

**Структура:**

```dockerfile
# Stage 1: Dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:24-alpine AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
```

**Ключевые особенности:**
- Использование Alpine Linux для минимального размера образа
- Разделение на stages для оптимизации кеширования
- Генерация Prisma Client на этапе сборки
- Копирование только необходимых файлов в production stage

### 2. docker-compose.yml

**Назначение:** Оркестрация многоконтейнерного приложения.

**Структура:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: home-library-db
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-home_library}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: home-library-app
    ports:
      - "${PORT:-4000}:4000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-home_library}
      PORT: ${PORT:-4000}
      CRYPT_SALT: ${CRYPT_SALT:-10}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      JWT_SECRET_REFRESH_KEY: ${JWT_SECRET_REFRESH_KEY}
      TOKEN_EXPIRE_TIME: ${TOKEN_EXPIRE_TIME:-1h}
      TOKEN_REFRESH_EXPIRE_TIME: ${TOKEN_REFRESH_EXPIRE_TIME:-24h}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network
    command: sh -c "npx prisma migrate deploy && npm run start:prod"

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

**Ключевые особенности:**
- Healthcheck для PostgreSQL обеспечивает правильную последовательность запуска
- `depends_on` с условием `service_healthy` гарантирует готовность БД
- Использование переменных окружения с default значениями
- Изолированная bridge сеть для безопасности
- Named volume для персистентности данных

### 3. docker-compose.dev.yml

**Назначение:** Override конфигурация для development режима.

**Структура:**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    command: sh -c "npx prisma migrate deploy && npm run start:dev"
    environment:
      NODE_ENV: development
```

**Ключевые особенности:**
- Монтирование исходного кода для hot-reload
- Использование отдельного Dockerfile.dev
- Запуск в watch режиме

### 4. Dockerfile.dev

**Назначение:** Упрощенный образ для разработки.

```dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "start:dev"]
```

**Ключевые особенности:**
- Устанавливает все зависимости включая devDependencies (для линтеров, тестов)
- Копирует все файлы включая конфиги ESLint и Prettier
- В development режиме исходный код монтируется как volume, поэтому изменения видны сразу

### 5. .dockerignore

**Назначение:** Исключение ненужных файлов из контекста сборки.

**Содержимое:**
```
node_modules
dist
.git
.env
*.md
!README.md
test
coverage
.vscode
.idea
*.log
npm-debug.log*
.DS_Store
```

**Важные замечания:**
- `.eslintrc.js` и `.prettierrc` НЕ включены в .dockerignore, так как они нужны для работы линтеров внутри контейнера
- `.env` исключен для безопасности (используются переменные из docker-compose)
- `test/` исключен для production образа (но доступен в dev режиме через volume mount)
- `README.md` включен обратно через `!README.md` для документации

## Data Models

### Environment Variables Schema

```typescript
interface EnvironmentConfig {
  // Database Configuration
  POSTGRES_USER: string;      // default: 'postgres'
  POSTGRES_PASSWORD: string;  // default: 'postgres'
  POSTGRES_DB: string;        // default: 'home_library'
  DATABASE_URL: string;       // constructed: postgresql://USER:PASSWORD@HOST:PORT/DB
  
  // Application Configuration
  PORT: number;               // default: 4000
  
  // Security Configuration
  CRYPT_SALT: number;         // default: 10
  JWT_SECRET_KEY: string;     // required, example: 'secret123123'
  JWT_SECRET_REFRESH_KEY: string; // required, example: 'secret123123'
  TOKEN_EXPIRE_TIME: string;  // default: '1h'
  TOKEN_REFRESH_EXPIRE_TIME: string; // default: '24h'
}
```

**Важные замечания:**
- `DATABASE_URL` автоматически конструируется в docker-compose.yml из POSTGRES_* переменных
- Для Docker используется hostname `postgres`, для локального запуска - `localhost`
- `JWT_SECRET_KEY` и `JWT_SECRET_REFRESH_KEY` должны быть изменены в production
- Все переменные с default значениями опциональны

### Docker Compose Service Schema

```yaml
Service:
  image: string | null
  build: BuildConfig | null
  container_name: string
  ports: string[]
  environment: Record<string, string>
  volumes: string[]
  networks: string[]
  depends_on: Record<string, DependencyConfig>
  healthcheck: HealthcheckConfig | null
  command: string | null

BuildConfig:
  context: string
  dockerfile: string

DependencyConfig:
  condition: 'service_started' | 'service_healthy' | 'service_completed_successfully'

HealthcheckConfig:
  test: string[]
  interval: string
  timeout: string
  retries: number
```

## Correctness
 Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

После анализа acceptance criteria, большинство требований относятся к конфигурации инфраструктуры и документации, которые не поддаются автоматическому property-based тестированию. Однако мы можем определить несколько ключевых свойств для интеграционного тестирования:

**Property 1: Database persistence round-trip**
*For any* valid data written to the database, stopping and restarting the PostgreSQL container should preserve that data identically.
**Validates: Requirements 2.1, 2.2, 2.4**

**Property 2: Environment variable propagation**
*For any* valid environment variable defined in .env file, that variable should be accessible within the Application container with the correct value.
**Validates: Requirements 4.1, 4.2**

**Property 3: Default value substitution**
*For any* optional environment variable that is not defined, the system should use the documented default value.
**Validates: Requirements 4.4**

**Property 4: Port accessibility**
*For any* valid port number configured in PORT environment variable, the application should be accessible on that port from the host machine.
**Validates: Requirements 1.4**

**Property 5: Dockerignore exclusion**
*For any* file pattern listed in .dockerignore, files matching that pattern should not be present in the built Docker image.
**Validates: Requirements 8.4**

**Property 6: Migration ordering**
*For any* set of pending Prisma migrations, they should be applied in chronological order based on their timestamp.
**Validates: Requirements 3.4**

**Property 7: Database credential configuration**
*For any* valid set of database credentials (username, password, database name), the PostgreSQL container should accept connections using those credentials.
**Validates: Requirements 1.2, 4.3**

**Note:** Многие acceptance criteria (особенно в Requirements 7, 9, 10) касаются документации и не могут быть протестированы через property-based testing. Эти требования будут валидированы через code review и ручную проверку документации.

## Error Handling

### Container Startup Failures

**Scenario:** PostgreSQL контейнер не может запуститься

**Handling:**
- Docker Compose выведет ошибку в stderr
- Application контейнер будет ожидать healthcheck и в итоге завершится с timeout
- Логи доступны через `docker-compose logs postgres`

**Recovery:**
- Проверить переменные окружения (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)
- Проверить доступность порта 5432
- Проверить права доступа к volume

**Scenario:** Application контейнер не может подключиться к БД

**Handling:**
- Prisma выбросит `PrismaClientInitializationError`
- Контейнер завершится с non-zero exit code
- Ошибка будет залогирована в stdout/stderr

**Recovery:**
- Проверить DATABASE_URL в переменных окружения
- Убедиться что PostgreSQL контейнер healthy: `docker-compose ps`
- Проверить сетевую конфигурацию

### Migration Failures

**Scenario:** Prisma миграции не могут быть применены

**Handling:**
- `prisma migrate deploy` завершится с ошибкой
- Application контейнер не запустится
- Детальная ошибка будет в логах контейнера

**Recovery:**
- Проверить совместимость версий Prisma
- Проверить целостность файлов миграций в `prisma/migrations/`
- Откатить проблемную миграцию вручную если необходимо
- Использовать `prisma migrate resolve` для разрешения конфликтов

### Volume Permission Issues

**Scenario:** Docker не может записать в volume

**Handling:**
- PostgreSQL контейнер завершится с permission denied ошибкой
- Volume останется в inconsistent состоянии

**Recovery:**
- Удалить volume: `docker-compose down -v`
- Проверить права пользователя Docker
- Пересоздать volume с правильными permissions

### Build Failures

**Scenario:** Docker build не может завершиться

**Handling:**
- `docker-compose build` завершится с ошибкой
- Образ не будет создан
- Ошибка будет показана в build output

**Recovery:**
- Проверить Dockerfile синтаксис
- Убедиться что все COPY источники существуют
- Проверить доступность npm registry
- Очистить build cache: `docker-compose build --no-cache`

### Network Issues

**Scenario:** Контейнеры не могут взаимодействовать

**Handling:**
- Application не сможет резолвить hostname `postgres`
- Connection refused или timeout ошибки

**Recovery:**
- Проверить что оба контейнера в одной сети: `docker network inspect`
- Убедиться что network определена в docker-compose.yml
- Перезапустить Docker daemon если необходимо

## Verification Strategy

Поскольку Docker конфигурация - это инфраструктурный код, верификация будет выполняться вручную:

### Manual Verification Checklist

**1. Container Startup:**
- [ ] Запустить `docker-compose up` и убедиться что оба контейнера стартуют
- [ ] Проверить что PostgreSQL становится healthy
- [ ] Проверить что приложение запускается после миграций
- [ ] Проверить что приложение доступно на порту 4000

**2. Data Persistence:**
- [ ] Создать тестовые данные через API
- [ ] Остановить контейнеры: `docker-compose down`
- [ ] Запустить снова: `docker-compose up`
- [ ] Проверить что данные сохранились

**3. Environment Configuration:**
- [ ] Изменить переменные в .env
- [ ] Перезапустить контейнеры
- [ ] Проверить что новые значения применились

**4. Development Mode:**
- [ ] Запустить в dev режиме: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`
- [ ] Изменить исходный код
- [ ] Проверить что изменения отражаются без пересборки

**5. Production Build:**
- [ ] Собрать production образ: `docker-compose build`
- [ ] Проверить размер образа: `docker images home-library-app`
- [ ] Запустить контейнер и проверить работоспособность

**6. Security Scanning:**
- [ ] Запустить сканирование: `docker scout cves home-library-app:latest`
- [ ] Проверить отчет о уязвимостях
- [ ] Документировать критические проблемы

**7. Docker Hub Publishing:**
- [ ] Залогиниться: `docker login`
- [ ] Тегировать образ: `docker tag home-library-app:latest username/home-library-app:1.0.0`
- [ ] Запушить: `docker push username/home-library-app:1.0.0`
- [ ] Проверить доступность на Docker Hub

## Implementation Notes

### Development Workflow

1. **Initial Setup:**
   ```bash
   # Clone repository
   git clone <repo-url>
   cd home-library
   
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your values
   nano .env
   
   # Start in development mode
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

2. **Making Changes:**
   - Edit source code
   - Changes are reflected immediately (hot-reload)
   - No need to rebuild container

3. **Running Tests:**
   ```bash
   # Run tests inside container
   docker-compose exec app npm test
   
   # Run linting
   docker-compose exec app npm run lint
   
   # Run formatting
   docker-compose exec app npm run format
   ```

4. **Viewing Logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f app
   ```

5. **Stopping Services:**
   ```bash
   # Stop containers (preserve data)
   docker-compose down
   
   # Stop and remove volumes (delete data)
   docker-compose down -v
   ```

### Production Deployment

1. **Build Production Images:**
   ```bash
   docker-compose build --no-cache
   ```

2. **Tag Images:**
   ```bash
   docker tag home-library-app:latest username/home-library-app:1.0.0
   docker tag home-library-app:latest username/home-library-app:latest
   ```

3. **Scan for Vulnerabilities:**
   ```bash
   docker scout cves username/home-library-app:1.0.0
   ```

4. **Push to Docker Hub:**
   ```bash
   docker login
   docker push username/home-library-app:1.0.0
   docker push username/home-library-app:latest
   ```

5. **Deploy:**
   ```bash
   # On production server
   docker-compose -f docker-compose.yml up -d
   ```

### Security Considerations

1. **Secrets Management:**
   - Never commit .env file to git
   - Use Docker secrets in production
   - Rotate JWT secrets regularly

2. **Network Security:**
   - PostgreSQL port not exposed to host
   - Use internal Docker network for service communication
   - Consider using Docker secrets for sensitive data

3. **Image Security:**
   - Use official base images
   - Scan images regularly for vulnerabilities
   - Keep base images updated
   - Use specific version tags, not `latest`

4. **Volume Security:**
   - Set appropriate permissions on volumes
   - Backup volumes regularly
   - Encrypt sensitive data at rest

### Performance Optimization

1. **Build Performance:**
   - Order Dockerfile commands from least to most frequently changing
   - Use .dockerignore to exclude unnecessary files
   - Leverage multi-stage builds
   - Use BuildKit for parallel builds

2. **Runtime Performance:**
   - Use Alpine base images for smaller size
   - Limit container resources if needed
   - Use volume mounts for development only
   - Enable PostgreSQL connection pooling

3. **Storage Optimization:**
   - Regularly prune unused images: `docker image prune`
   - Regularly prune unused volumes: `docker volume prune`
   - Use named volumes instead of bind mounts in production

### Troubleshooting Guide

**Problem:** "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop or Docker service

**Problem:** "Port 4000 already in use"
**Solution:** Change PORT in .env or stop conflicting service

**Problem:** "Database connection refused"
**Solution:** Wait for PostgreSQL healthcheck, check DATABASE_URL

**Problem:** "Migration failed"
**Solution:** Check Prisma schema, verify database state, check logs

**Problem:** "Out of disk space"
**Solution:** Run `docker system prune -a` to clean up

**Problem:** "Container keeps restarting"
**Solution:** Check logs with `docker-compose logs app`, fix application errors

## Dependencies

### External Dependencies

- **Docker Engine:** 20.10 или выше
- **Docker Compose:** 2.0 или выше (V2 syntax)
- **Node.js:** 24.10.0 или выше (в образе)
- **PostgreSQL:** 16 (Alpine variant)

### NPM Dependencies

Все зависимости определены в package.json и устанавливаются автоматически при сборке образа:

- **Runtime:** @nestjs/*, @prisma/client, bcrypt, pg, и др.
- **Build-time:** @nestjs/cli, prisma, typescript
- **Development:** jest, supertest, eslint

### Docker Images

- **Base Image:** node:24-alpine
- **Database Image:** postgres:16-alpine

### Optional Tools

- **Docker Scout:** для сканирования уязвимостей
- **Docker Buildx:** для multi-platform builds
- **Dive:** для анализа слоев образа

## Future Enhancements

1. **Multi-stage Build Optimization:**
   - Добавить stage для тестирования
   - Использовать distroless образы для production

2. **Orchestration:**
   - Kubernetes manifests для production
   - Helm charts для упрощенного деплоя

3. **Monitoring:**
   - Добавить Prometheus metrics
   - Интегрировать с Grafana для визуализации

4. **Scaling:**
   - Поддержка горизонтального масштабирования приложения
   - Connection pooling для PostgreSQL (PgBouncer)

5. **CI/CD:**
   - Автоматическая сборка образов при push
   - Автоматический деплой в staging
   - Automated security scanning в pipeline

6. **Development Experience:**
   - Debugger support в Docker
   - Hot-reload для Prisma schema changes
   - Database seeding scripts
