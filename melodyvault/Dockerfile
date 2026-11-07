# =========================================================================
# MelodyVault Backend - Production Multi-Stage Dockerfile (Render Web Service)
# Base Image: Eclipse Temurin OpenJDK 21 (Ubuntu Jammy LTS)
# =========================================================================

# -------------------------------------------------------------------------
# Stage 1: Build Application with Maven Wrapper
# -------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /build

# Copy Maven Wrapper and POM first to leverage Docker layer caching
COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/pom.xml ./

# Normalize line endings and grant execute permissions to Maven Wrapper
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Download dependencies offline (cached layer)
RUN ./mvnw dependency:go-offline -B || true

# Copy backend source code
COPY backend/src ./src

# Build production JAR (skips unit tests in container build; tested during CI)
RUN ./mvnw clean package -DskipTests -B

# -------------------------------------------------------------------------
# Stage 2: Minimal Production JRE Runtime
# -------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy

# Create non-root system user and group for hardened production security
RUN addgroup --system --gid 1001 melodyvault && \
    adduser --system --uid 1001 --ingroup melodyvault melodyvault

WORKDIR /app

# Prepare directories for application, H2 database (dev mode), and demo music
RUN mkdir -p /app/data /app/public/demo-music && \
    chown -R melodyvault:melodyvault /app

# Copy compiled JAR from builder stage
COPY --from=builder --chown=melodyvault:melodyvault /build/target/melodyvault-backend-1.0.0.jar /app/app.jar

# Copy 19 approved demonstration MP3 tracks
COPY --chown=melodyvault:melodyvault public/demo-music/ /app/public/demo-music/

# Switch to non-root user
USER melodyvault

# Default environment variables (can be overridden in Render dashboard)
ENV PORT=8085
ENV MUSIC_LIBRARY_DIR=/app/public/demo-music
ENV SPRING_PROFILES_ACTIVE=dev

EXPOSE 8085

# Exec entrypoint ensures Java process is PID 1 and receives graceful shutdown signals
ENTRYPOINT ["sh", "-c", "exec java -Djava.security.egd=file:/dev/./urandom -jar /app/app.jar"]

