FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY target/dload.jar /app

RUN mkdir /downloads \
    && useradd -u 1000 -m appuser \
    && chown -R appuser /app /downloads

USER appuser

EXPOSE 8080

CMD ["sh", "-c", "java ${JAVA_OPTS:-} -jar dload.jar"]
