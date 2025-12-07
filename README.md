# Home Library Service

RESTful API service for managing a home music library with users, tracks, albums, artists, and favorites.

## Installation and Running

### Installation via Docker

#### 1. Clone the repository

```bash
git clone {repository URL}
cd nodejs2025Q4-service
```

#### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit the `.env` file with your preferred values. **For Docker, use `postgres` as the database host:**

```env
# Database URL (use 'postgres' as host for Docker)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/home_library
```

#### 3. Start the application

```bash
docker-compose up
```

The application will be available at `http://localhost:4000`

#### 4. Basic Docker Commands

**Stop the application:**

```bash
docker-compose down
```

**View logs:**

```bash
# All services
docker-compose logs -f

# Application only
docker-compose logs -f app

# Database only
docker-compose logs -f postgres
```

**Rebuild containers after code changes:**

```bash
docker-compose build
docker-compose up
```

## Local Development

If you prefer to run the application without Docker, you have two options:

### Option 1: Local Application with Database in Docker

This approach runs the application locally, using Docker only for PostgreSQL.

**1. Clone the repository**

```bash
git clone {repository URL}
cd nodejs2025Q4-service
```

**2. Install dependencies**

```bash
npm install
```

**3. Start PostgreSQL in Docker**

```bash
docker-compose up postgres -d
```

**4. Configure environment variables**

```bash
cp .env.example .env
```

Edit the `.env` file to use `localhost` as the database host:

```env
# Database URL (use 'localhost' for local development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/home_library
```

**5. Run database migrations**

```bash
npx prisma migrate deploy
```

**6. Generate Prisma Client**

```bash
npx prisma generate
```

**7. Start the application**

**Development mode (with hot-reload):**

```bash
npm run start:dev
```

**Production mode:**

```bash
npm run build
npm run start:prod
```

The application will be available at `http://localhost:4000`

**8. Stop the database when finished**

```bash
docker-compose down
```

### Option 2: Fully Local Installation (Without Docker)

This approach runs everything locally without Docker.

**1. Clone the repository**

```bash
git clone {repository URL}
cd nodejs2025Q4-service
```

**2. Install dependencies**

```bash
npm install
```

**3. Install and start PostgreSQL**

**4. Create the database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE home_library;

# Exit psql
\q
```

**5. Configure environment variables**

```bash
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials:

```env
# Database URL (use 'localhost' for local PostgreSQL)
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/home_library
```

**6. Run database migrations**

```bash
npx prisma migrate deploy
```

**7. Generate Prisma Client**

```bash
npx prisma generate
```

**8. Start the application**

**Development mode (with hot-reload):**

```bash
npm run start:dev
```

**Production mode:**

```bash
npm run build
npm run start:prod
```

The application will be available at `http://localhost:4000`

## Testing

Use Postman or a similar tool for testing.

At this stage, you can create users, tracks, albums, and artists, as well as read, edit, and delete information about them. You can also add and remove tracks, albums, and artists from favorites.

**Search Docker Hub for images by name: "dololob"**

## Vulnerability Scanning

```bash
npm run audit
```

## Command Reference

### Docker Commands

```bash
# Start all services (production)
docker-compose up

# Start all services (development with hot-reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Stop all services
docker-compose down

# Rebuild containers
docker-compose build --no-cache

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f postgres

# Start only database (for local development)
docker-compose up postgres -d
```

### Local Development Commands

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start development server (with hot-reload)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test
npm run test:auth

# Run linting
npm run lint

# Run formatting
npm run format

# Run security audit
npm run audit
```

### Database Commands

```bash
# Connect to database (Docker)
docker-compose exec postgres psql -U postgres -d home_library

# Connect to database (Local)
psql -U postgres -d home_library

# View database tables
\dt

# Describe table structure
\d table_name

# Exit psql
\q
```

### Useful Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Validate Prisma schema
npx prisma validate

# Format Prisma schema
npx prisma format
```

## Project Structure

```
nodejs2025Q4-service/
├── src/                     # Application source code
│   ├── album/               # Album module
│   ├── artist/              # Artist module
│   ├── track/               # Track module
│   ├── user/                # User module
│   ├── favs/                # Favorites module
│   ├── prisma/              # Prisma service
│   ├── common/              # Common utilities
│   ├── types/               # Project types
│   └── main.ts              # Application entry point
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Prisma schema
│   └── migrations/          # Database migrations
├── doc/                     # Project documentation folder
│   └── api.yaml             # Documentation
├── test/                    # E2E tests
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Production Docker image
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment variables template
└── README.md                # This file
```
