# --- Stage 1: Build the React Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build the Spring Boot Backend ---
FROM maven:3.8.8-eclipse-temurin-17 AS backend-builder
WORKDIR /app/backend
# Copy pom.xml and download dependencies first (for layer caching)
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B
# Copy backend source
COPY backend/src ./src
# Create static resources directory and copy built frontend assets from Stage 1
RUN mkdir -p src/main/resources/static
COPY --from=frontend-builder /app/frontend/dist/ src/main/resources/static/
# Package the unified Spring Boot JAR
RUN mvn clean package -DskipTests

# --- Stage 3: Package Run Environment ---
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=backend-builder /app/backend/target/github-profile-analyzer-1.0.0.jar app.jar
EXPOSE 8080
# Set active spring profile or other env options if needed
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "app.jar", "--server.port=${PORT}"]
