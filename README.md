# Home Library Service

## Prerequisites

Choose one of the following setup methods:

### Option A: Docker (Recommended)

- Git - [Download & Install Git](https://git-scm.com/downloads)
- Docker Engine - [Download & Install Docker](https://docs.docker.com/engine/install/)
- Docker Compose - [Download & Install Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

### Option B: Local Development

- Git - [Download & Install Git](https://git-scm.com/downloads)
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/) (version 24.10.0 or higher) and the npm package manager
- PostgreSQL - [Download & Install PostgreSQL](https://www.postgresql.org/download/)

## Setup and Running

### Docker Setup (Recommended)

Docker provides the easiest way to run the application with all dependencies pre-configured.

#### 1. Clone the repository

```bash
git clone {repository URL}
cd home-library
```

#### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit the `.env` file with your preferred values. For Docker, you can use the default values or customize:

```env
# Database Configuration (Docker)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=home_library

# Application Configuration
PORT=4000

# Security Configuration (CHANGE THESE IN PRODUCTION!)
CRYPT_SALT=10
JWT_SECRET_KEY=secret123123
JWT_SECRET_REFRESH_KEY=secret123123
TOKEN_EXPIRE_TIME=1h
TOKEN_REFRESH_EXPIRE_TIME=24h
```

#### 3. Start the application

**Production mode:**
```bash
docker-compose up
```

**Development mode (with hot-reload):**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

The application will be available at `http://localhost:4000`

#### 4. Common Docker commands

**Stop the application:**
```bash
docker-compose down
```

**Stop and remove all data (including database):**
```bash
docker-compose down -v
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

**Run commands inside containers:**
```bash
# Run tests
docker-compose exec app npm test

# Run linting
docker-compose exec app npm run lint

# Run formatting
docker-compose exec app npm run format

# Access application shell
docker-compose exec app sh

# Access database shell
docker-compose exec postgres psql -U postgres -d home_library
```

**Clean up Docker resources:**
```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove all unused resources
docker system prune -a
```

#### 5. Docker Troubleshooting

**Problem:** "Cannot connect to Docker daemon"
- **Solution:** Start Docker Desktop or Docker service: `sudo systemctl start docker` (Linux) or start Docker Desktop (Windows/Mac)

**Problem:** "Port 4000 already in use"
- **Solution:** Change `PORT` in `.env` file or stop the conflicting service

**Problem:** "Database connection refused"
- **Solution:** Wait for PostgreSQL healthcheck to complete (check with `docker-compose ps`), verify `DATABASE_URL` in logs

**Problem:** "Migration failed"
- **Solution:** Check logs with `docker-compose logs app`, verify Prisma schema, reset database with `docker-compose down -v` and restart

**Problem:** "Out of disk space"
- **Solution:** Clean up Docker resources: `docker system prune -a`

**Problem:** "Container keeps restarting"
- **Solution:** Check logs with `docker-compose logs app`, fix application errors, ensure all required environment variables are set

**Problem:** "Changes not reflected in development mode"
- **Solution:** Ensure you're using the dev compose file: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`

### Local Development Setup

If you prefer to run the application without Docker:

#### 1. Clone the repository

```bash
git clone {repository URL}
cd home-library
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Set up PostgreSQL

Create a PostgreSQL database and user, then configure environment variables.

#### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit the `.env` file with your local PostgreSQL connection:

```env
# Database Configuration (Local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/home_library

# Application Configuration
PORT=4000

# Security Configuration
CRYPT_SALT=10
JWT_SECRET_KEY=secret123123
JWT_SECRET_REFRESH_KEY=secret123123
TOKEN_EXPIRE_TIME=1h
TOKEN_REFRESH_EXPIRE_TIME=24h
```

#### 5. Run database migrations

```bash
npx prisma migrate deploy
```

#### 6. Start the application

```bash
npm start
```

## Checking the work

To check, use Postman or something similar.

At this stage, you can create users, tracks, albums, and artists, as well as read, edit, and delete information about them. You can also add and remove tracks, albums, and artists from your favorites.

**Required fields:**

Adding a user:

```
{
  login: string;
  password: string;
}
```

User update:

```
{
  oldPassword: string;
  newPassword: string;
}
```

Creating a track:

```
{
  name: string;
  duration: number;
}
```

Adding a artist:

```
{
  name: string;
  grammy: boolean;
}
```

Creating a album:

```
{
  name: string;
  year: number;
}
```

## Testing

### Docker Environment

When running with Docker, execute tests inside the container:

```bash
# Run all tests without authorization
docker-compose exec app npm run test

# Run specific test suite
docker-compose exec app npm run test -- <path to suite>

# Run all tests with authorization
docker-compose exec app npm run test:auth

# Run specific test suite with authorization
docker-compose exec app npm run test:auth -- <path to suite>
```

### Local Environment

After application is running, open a new terminal and enter:

```bash
# Run all tests without authorization
npm run test

# Run specific test suite
npm run test -- <path to suite>

# Run all tests with authorization
npm run test:auth

# Run specific test suite with authorization
npm run test:auth -- <path to suite>
```

### Linting and Formatting

**Docker environment:**
```bash
# Run linting
docker-compose exec app npm run lint

# Run formatting
docker-compose exec app npm run format
```

**Local environment:**
```bash
# Run linting
npm run lint

# Run formatting
npm run format
```

## Docker Optimization and Security

This section covers Docker image optimization, security scanning, and publishing to Docker Hub.

For detailed information, see [Docker Optimization Guide](docs/DOCKER_OPTIMIZATION.md).

### Building Optimized Production Images

Build an optimized production image using multi-stage builds:

```bash
# Build production image with no cache (ensures fresh build)
docker-compose build --no-cache

# Alternatively, build directly with Docker
docker build -t home-library-app:latest -f Dockerfile .
```

**Build process:**
1. **Builder stage:** Installs all dependencies, generates Prisma Client, and compiles TypeScript
2. **Production stage:** Creates minimal final image with only runtime dependencies and compiled code

**Optimization features:**
- ✅ Multi-stage build pattern
- ✅ Alpine Linux base image (minimal size)
- ✅ Layer caching for faster rebuilds
- ✅ Production dependencies only
- ✅ Aggressive cleanup (removes docs, tests, source maps)
- ✅ Non-root user for security
- ✅ Proper signal handling with dumb-init

**Expected results:**
- Image size: ~200-300 MB (60-70% reduction vs standard builds)
- Build time: 1-2 minutes for incremental builds
- Security: Minimal attack surface

### Security Scanning with Trivy

Trivy scans Docker images for known vulnerabilities (CVEs) in dependencies and base images.

#### Quick Start

**Linux/macOS:**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Build and scan in one command
./scripts/build-and-scan.sh latest

# Or scan existing image
./scripts/scan-image.sh home-library-app:latest
```

**Windows (PowerShell):**
```powershell
# Build and scan in one command
.\scripts\build-and-scan.ps1 -ImageTag "latest"

# Or scan existing image
.\scripts\scan-image.ps1 -ImageName "home-library-app:latest"
```

#### Install Trivy

**Linux:**
```bash
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
```

**macOS:**
```bash
brew install aquasecurity/trivy/trivy
```

**Windows:**
```powershell
# Using Chocolatey
choco install trivy

# Using Scoop
scoop install trivy
```

#### Manual Scanning

```bash
# Update vulnerability database
trivy image --download-db-only

# Scan with critical and high severity
trivy image --severity CRITICAL,HIGH home-library-app:latest

# Scan all severities
trivy image --severity CRITICAL,HIGH,MEDIUM,LOW home-library-app:latest

# Generate JSON report
trivy image --format json --output report.json home-library-app:latest

# Fail on vulnerabilities (for CI/CD)
trivy image --exit-code 1 --severity CRITICAL,HIGH home-library-app:latest
```

#### Using Docker Compose

```bash
# Build the application image first
docker-compose build

# Run security scan
docker-compose -f docker-compose.scan.yml up
```

#### CI/CD Integration

The repository includes a GitHub Actions workflow that automatically:
- Builds Docker images on every push/PR
- Scans for vulnerabilities using Trivy
- Uploads results to GitHub Security tab
- Comments on PRs with scan summary
- Fails builds on critical/high vulnerabilities
- Runs weekly scheduled scans

See `.github/workflows/docker-security-scan.yml` for details.

#### Vulnerability Response

When vulnerabilities are detected:

1. **Assess severity**: Focus on CRITICAL and HIGH first
2. **Update dependencies**: Run `npm audit fix` or update manually
3. **Update base image**: Check for newer Node.js Alpine versions
4. **Rebuild and verify**: Ensure vulnerabilities are resolved
5. **Document exceptions**: If unfixable, document the reason

### Building Production Images

Build an optimized production image using multi-stage builds:

```bash
# Build production image with no cache (ensures fresh build)
docker-compose build --no-cache

# Alternatively, build directly with Docker
docker build -t home-library-app:latest -f Dockerfile .
```

**Build optimization tips:**
- The build uses layer caching - unchanged layers are reused
- `.dockerignore` excludes unnecessary files from build context
- Alpine Linux base image keeps the final image size small
- Multi-stage build separates build-time and runtime dependencies

### Image Tagging Conventions

Proper tagging helps manage versions and deployments:

```bash
# Tag with semantic version
docker tag home-library-app:latest <your-dockerhub-username>/home-library-app:1.0.0

# Tag with major.minor version
docker tag home-library-app:latest <your-dockerhub-username>/home-library-app:1.0

# Tag with major version
docker tag home-library-app:latest <your-dockerhub-username>/home-library-app:1

# Tag as latest (default)
docker tag home-library-app:latest <your-dockerhub-username>/home-library-app:latest

# Tag with git commit SHA (for traceability)
docker tag home-library-app:latest <your-dockerhub-username>/home-library-app:$(git rev-parse --short HEAD)

# Tag with environment-specific labels
docker tag home-library-app:latest <your-dockerhub-username>/home-library-app:staging
docker tag home-library-app:latest <your-dockerhub-username>/home-library-app:production
```

**Recommended tagging strategy:**
- Always tag with specific version numbers (e.g., `1.0.0`)
- Use `latest` tag for the most recent stable release
- Include git commit SHA for debugging and rollback purposes
- Use environment tags (`staging`, `production`) for deployment tracking
- Never use `latest` in production - always pin to specific versions

### Security Scanning with Docker Scout

Docker Scout analyzes images for security vulnerabilities (CVEs) in dependencies and base images.

**Prerequisites:**
- Docker Desktop 4.17 or later (includes Docker Scout)
- Or install Docker Scout CLI: `docker scout version`

**Basic scanning:**

```bash
# Scan local image
docker scout cves home-library-app:latest

# Scan tagged image
docker scout cves <your-dockerhub-username>/home-library-app:1.0.0

# Scan with detailed output
docker scout cves --format only-packages home-library-app:latest
```

**Advanced scanning:**

```bash
# Export scan results to SARIF format (for CI/CD integration)
docker scout cves --format sarif --output report.sarif home-library-app:latest

# Export to JSON format
docker scout cves --format json --output report.json home-library-app:latest

# Show only high and critical vulnerabilities
docker scout cves --only-severity high,critical home-library-app:latest

# Compare with base image to see added vulnerabilities
docker scout compare --to node:24-alpine home-library-app:latest
```

**Interpreting results:**
- **Critical/High:** Address immediately before deploying
- **Medium:** Plan to fix in next release
- **Low:** Monitor and fix when convenient
- **Unspecified:** Review manually

**Remediation steps:**
1. Update base image: Change `FROM node:24-alpine` to newer version
2. Update dependencies: Run `npm audit fix` and rebuild
3. Review Docker Scout recommendations for specific packages
4. Consider alternative packages if vulnerabilities can't be fixed

### Docker Hub Authentication

**Login to Docker Hub:**

```bash
# Interactive login (prompts for username and password)
docker login

# Login with username (prompts for password)
docker login -u <your-dockerhub-username>

# Login with access token (recommended for CI/CD)
echo $DOCKER_HUB_TOKEN | docker login -u <your-dockerhub-username> --password-stdin
```

**Creating access tokens (recommended):**
1. Go to [Docker Hub Account Settings](https://hub.docker.com/settings/security)
2. Click "New Access Token"
3. Give it a description (e.g., "Home Library CI/CD")
4. Select permissions (Read, Write, Delete)
5. Copy the token and store it securely
6. Use token instead of password for authentication

**Logout:**
```bash
docker logout
```

### Publishing to Docker Hub

#### Public Repository

**1. Create repository on Docker Hub:**
- Go to [Docker Hub](https://hub.docker.com/)
- Click "Create Repository"
- Enter repository name: `home-library-app`
- Select "Public"
- Add description and README (optional)
- Click "Create"

**2. Push images:**

```bash
# Push specific version
docker push <your-dockerhub-username>/home-library-app:1.0.0

# Push latest tag
docker push <your-dockerhub-username>/home-library-app:latest

# Push all tags at once
docker push <your-dockerhub-username>/home-library-app --all-tags
```

**3. Verify publication:**
- Visit `https://hub.docker.com/r/<your-dockerhub-username>/home-library-app`
- Check that tags are visible
- Verify image size and last updated time

**4. Users can pull and run:**

```bash
# Pull the image
docker pull <your-dockerhub-username>/home-library-app:1.0.0

# Run with environment file
docker run -p 4000:4000 --env-file .env <your-dockerhub-username>/home-library-app:1.0.0

# Or use with docker-compose by updating image name in docker-compose.yml
```

#### Private Repository

**1. Create private repository:**
- Follow same steps as public repository
- Select "Private" instead of "Public"
- Only you and invited collaborators can access

**2. Push images (same as public):**

```bash
docker push <your-dockerhub-username>/home-library-app:1.0.0
docker push <your-dockerhub-username>/home-library-app:latest
```

**3. Grant access to collaborators:**
- Go to repository settings on Docker Hub
- Click "Collaborators"
- Add users by Docker Hub username
- Select permission level (Read, Write, Admin)

**4. Users must authenticate before pulling:**

```bash
# Login first
docker login

# Then pull
docker pull <your-dockerhub-username>/home-library-app:1.0.0
```

**5. Configure access in CI/CD:**
- Use Docker Hub access tokens (not passwords)
- Store tokens as secrets in CI/CD platform
- Login in CI/CD pipeline before pulling/pushing

### Complete Publishing Workflow

Here's a complete workflow from build to publish:

```bash
# 1. Build production image
docker-compose build --no-cache

# 2. Tag with version and latest
VERSION=1.0.0
docker tag home-library-app:latest <your-dockerhub-username>/home-library-app:$VERSION
docker tag home-library-app:latest <your-dockerhub-username>/home-library-app:latest

# 3. Scan for vulnerabilities
docker scout cves <your-dockerhub-username>/home-library-app:$VERSION

# 4. Review scan results and fix critical issues if needed

# 5. Login to Docker Hub
docker login

# 6. Push images
docker push <your-dockerhub-username>/home-library-app:$VERSION
docker push <your-dockerhub-username>/home-library-app:latest

# 7. Verify on Docker Hub
echo "Visit: https://hub.docker.com/r/<your-dockerhub-username>/home-library-app"

# 8. Test pulling and running
docker pull <your-dockerhub-username>/home-library-app:$VERSION
docker run -p 4000:4000 --env-file .env <your-dockerhub-username>/home-library-app:$VERSION
```

### Automated Publishing with CI/CD

Example GitHub Actions workflow for automated publishing:

```yaml
name: Build and Push Docker Image

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/home-library-app:${{ steps.version.outputs.VERSION }}
            ${{ secrets.DOCKERHUB_USERNAME }}/home-library-app:latest
          cache-from: type=registry,ref=${{ secrets.DOCKERHUB_USERNAME }}/home-library-app:latest
          cache-to: type=inline
      
      - name: Scan image
        run: |
          docker scout cves ${{ secrets.DOCKERHUB_USERNAME }}/home-library-app:${{ steps.version.outputs.VERSION }}
```

**Setup for CI/CD:**
1. Add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` to repository secrets
2. Create git tag: `git tag v1.0.0 && git push origin v1.0.0`
3. Workflow automatically builds, scans, and pushes image

### Debugging in VSCode

Press <kbd>F5</kbd> to debug.

For more information, visit: https://code.visualstudio.com/docs/editor/debugging
