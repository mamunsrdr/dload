FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml
COPY pom.xml ./

# Download dependencies
RUN mvn -B -q -DskipTests dependency:go-offline

# Copy source code
COPY src src/

# Build the application
RUN mvn -B -q -DskipTests clean package -s settings.xml

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Security: non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Create downloads directory
RUN mkdir -p /app/downloads

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
