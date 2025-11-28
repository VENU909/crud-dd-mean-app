# CRUD-DD-MEAN-APP


This README documents step-by-step setup, CI/CD (GitHub Actions) configuration, Docker image build & push, deployment instructions (Docker Compose and remote server via SSH), Nginx reverse-proxy configuration, and added the screenshots.

---

## Table of contents

- Project Overview
- Architecture & File Layout
- Prerequisites
- Environment variables
- GitHub Actions CI/CD example
- Deployment to remote server (SSH + docker-compose)
- Nginx configuration
- Screenshots

---

## Project Overview

This is a CRUD example implemented using the MEAN-style stack (MongoDB, Express/Node backend, Angular frontend) with TypeScript in parts of the stack. It provides REST endpoints, a UI to perform CRUD actions, and is containerized for deployment.

Goal of this README:
- Provide reproducible Docker builds and deployment instructions
- Provide a GitHub Actions workflow to build/test/push images and deploy
- Document an Nginx reverse proxy configuration for production

---

## Architecture & File Layout (example)

- /server — Node/Express backend (TypeScript)
- /client — Angular frontend (TypeScript)
- /docker — Docker-related compose files and nginx conf
- Dockerfile (backend) and Dockerfile (frontend) in respective directories

Adjust file paths above if your repository differs.

---

## Prerequisites

- Node.js (v18+ recommended) — required for building artifacts
- npm or yarn
- Docker (v20+) and Docker Compose (v2+)
- Git
- MongoDB (local or cloud such as MongoDB Atlas) — connection string
- (Optional) A server with Docker for production deployment (e.g., Ubuntu)
- (Optional) GitHub account and a container registry (Docker Hub or GitHub Container Registry)

---

## Environment variables

Create appropriate environment files for building and running (examples):

Backend (server/.env)
```
PORT=4000
MONGO_URI=mongodb://mongo:27017/crud-dd-mean-app
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://example.com
```

Frontend (client/src/environments/environment.prod.ts)
```ts
export const environment = {
  production: true,
  apiUrl: 'https://example.com/api'
};
```

Never commit secrets. Use GitHub Secrets for CI/CD.

---



## GitHub Actions CI/CD (example)

Below is a sample workflow that:
- installs dependencies
- runs tests, builds artifacts
- builds and pushes Docker images to registry
- deploys to a server via SSH (pull + docker compose up)

Create `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:

  build_and_push:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repo
      uses: actions/checkout@v4

    - name: Debug - List repo files
      run: ls -R .

    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}

    - name: Build & Push Backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        file: ./backend/Dockerfile.backend
        push: true
        tags: ${{ secrets.DOCKERHUB_USERNAME }}/crud-dd-backend:latest

    - name: Build & Push Frontend
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        file: ./frontend/Dockerfile.frontend
        push: true
        tags: ${{ secrets.DOCKERHUB_USERNAME }}/crud-dd-frontend:latest

  deploy:
    needs: build_and_push
    runs-on: ubuntu-latest

    steps:
    - name: Deploy to VM
      uses: appleboy/ssh-action@v0.1.8
      with:
        host: ${{ secrets.SSH_HOST }}
        username: ${{ secrets.SSH_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        port: ${{ secrets.SSH_PORT }}
        script: |
          cd ~/crud-dd-mean-app
          git fetch --all
          git reset --hard origin/main
          docker compose -f docker-compose.prod.yml pull
          docker compose -f docker-compose.prod.yml up -d
          docker image prune -f

```

Secrets to create in GitHub repository Settings > Secrets:
- REGISTRY_URL (for docker login, e.g., ghcr.io or docker.io)
- REGISTRY_USERNAME
- REGISTRY_TOKEN (or password)
- SERVER_HOST
- SERVER_USER
- SSH_PRIVATE_KEY

Replace actions and tags to match your registry and naming conventions.

---

## Deploy to remote server (SSH & docker-compose)

1. Server prerequisites
   - Install Docker & Docker Compose
   - Create a directory, e.g., /opt/apps/crud-dd-mean-app
   - Provide a docker-compose.yml on the server to run frontend, backend, mongo, and nginx

2. Example docker-compose for production (on server)
```yaml
services:
  backend:
    image: "venu0/crud-dd-backend:latest"
    container_name: crud-dd-backend
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - mongo

  frontend:
    image: "venu0/crud-dd-frontend:latest"
    container_name: crud-dd-frontend
    restart: always
    ports:
      - "80"
    depends_on:
      - backend

  mongo:
    image: mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  nginx:
    image: nginx
    restart: always
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro

volumes:
  mongo-data:
```

3. On server:
   - Pull images: docker compose pull
   - Start: docker compose up -d
   - Check logs: docker compose logs -f

---

## Nginx configuration

Place the following under `docker/nginx/default.conf` or server `/etc/nginx/conf.d/app.conf`

Example `app.conf` (reverse proxy for frontend + API):
```nginx
server {
    listen 80;
    server_name _;

    # Serve frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy API calls to backend
    location /api/ {
        proxy_pass http://backend:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # (Optional) Websocket support
    location /socket.io/ {
        proxy_pass http://backend:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```


## Screenshots


- CI/CD configuration and execution:
    <img width="1908" height="960" alt="CI-Cd" src="https://github.com/user-attachments/assets/f8719997-692f-454b-9c04-5b062407ac8e" />

- Docker image build and push process:
  <img width="1920" height="1080" alt="Screenshot 2025-11-28 175711" src="https://github.com/user-attachments/assets/e2e3b47f-9b3d-48b4-9ddd-903ebc674696" />

   
- Application deployment and working UI:
       <img width="1914" height="942" alt="UI" src="https://github.com/user-attachments/assets/d7f1c5b0-5a67-462c-b2e8-fd70a15fda91" />

- Nginx setup and infrastructure details:
   
        
    <img width="1920" height="1080" alt="Screenshot 2025-11-28 180111" src="https://github.com/user-attachments/assets/1e3593c7-5fbc-4f75-87ed-61e58c9ddce2" />

