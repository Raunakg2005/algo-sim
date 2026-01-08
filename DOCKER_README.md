# Docker Setup for Algo-Sim

## Prerequisites
- Docker Desktop installed and running
- Docker Compose installed (comes with Docker Desktop)

## Environment Setup

1. Make sure your `.env.local` file has the correct values:
   - Update `MONGODB_URI` will be overridden by docker-compose
   - Keep all other variables (Google OAuth, Email, Admin emails, etc.)

## Running with Docker

### Start the application:
```bash
docker-compose up -d
```

This will:
- Create a MongoDB container (accessible at localhost:27017)
- Build and run the Next.js app (accessible at http://localhost:3000)
- Create a persistent volume for MongoDB data

### View logs:
```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just MongoDB
docker-compose logs -f mongodb
```

### Stop the application:
```bash
docker-compose down
```

### Stop and remove volumes (deletes all data):
```bash
docker-compose down -v
```

### Rebuild after code changes:
```bash
docker-compose up -d --build
```

## Access Points

- **Application**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017/algo-sim
- **Admin Panel**: http://localhost:3000/admin (login with admin email)

## Troubleshooting

### MongoDB connection issues:
- Check if MongoDB container is running: `docker-compose ps`
- View MongoDB logs: `docker-compose logs mongodb`

### App won't start:
- Check logs: `docker-compose logs app`
- Rebuild: `docker-compose up -d --build app`

### Port already in use:
- Stop existing processes using port 3000 or 27017
- Or change ports in docker-compose.yml

## Development vs Production

For development, you can still use `npm run dev` locally.
Docker setup is optimized for production deployment.

## Data Persistence

MongoDB data is stored in a Docker volume named `algo-sim_mongodb_data`.
To backup: `docker exec algo-sim-mongodb mongodump --out /backup`
