export JAVA_HOME=/Library/Java/JavaVirtualMachines/open-jdk-21.0.3/
export PATH=$JAVA_HOME/bin:$PATH
cd backend && ./mvnw clean install -s settings.xml
cd ..
cd frontend && npm run build
cd ..
docker context use homelab
docker-compose down
docker-compose up -d --build
