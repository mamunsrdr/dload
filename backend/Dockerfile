FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY target/dload.jar /app

RUN mkdir /downloads

EXPOSE 8080

CMD ["sh", "-c", "java ${JAVA_OPTS:-} -jar dload.jar"]
