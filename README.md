# File Downloader with SSE

A full-stack application for downloading files with real-time progress tracking using Server-Sent Events (SSE).

## Architecture

- **Frontend**: React.js with real-time progress updates via SSE
- **Backend**: Spring Boot with RESTful API and SSE endpoints
- **Containerization**: Docker Compose for easy deployment

## Features

- 📥 Download files from URLs
- 📊 Real-time progress tracking
- ⚡ Server-Sent Events for live updates
- 🗂️ Download history and management
- ❌ Cancel downloads
- 🐳 Docker containerized deployment

## Quick Start

### Prerequisites

- **For Native Mode**: Java 21+, Maven 3.6+, Node.js 18+, npm
- **For Docker Mode**: Docker and Docker Compose

### Running Natively (Recommended for Development)

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dload
```

2. Start both applications:
```bash
./start.sh
```

This will:
- Build and start the Spring Boot backend on port 8080
- Install dependencies and start the React frontend on port 3000
- Run both applications in the background
- Show live logs

3. Open your browser to `http://localhost:3000`

4. To stop the applications:
```bash
# Press Ctrl+C in the terminal running start.sh, or run:
./stop.sh
```

### Running with Docker Compose

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dload
```

2. Start with Docker:
```bash
./start-docker.sh
```

3. Open your browser to `http://localhost:3000`

4. To stop:
```bash
docker-compose down
```

## Available Scripts

- `./start.sh` - Start both applications natively (recommended for development)
- `./start-docker.sh` - Start with Docker Compose
- `./stop.sh` - Stop native applications
- `docker-compose down` - Stop Docker containers

## Development

### Backend Development

2. Start the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

### Development Setup

#### Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```

#### Frontend (React)

```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Download Management
- `POST /api/downloads/start` - Start a new download
- `GET /api/downloads/stream/{downloadId}` - SSE stream for progress updates
- `GET /api/downloads/status/{downloadId}` - Get download status
- `GET /api/downloads/list` - List all downloads
- `DELETE /api/downloads/cancel/{downloadId}` - Cancel a download

### Request/Response Examples

#### Start Download
```bash
curl -X POST http://localhost:8080/api/downloads/start \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/file.zip", "filename": "my-file.zip"}'
```

#### Get Status
```bash
curl http://localhost:8080/api/downloads/status/{downloadId}
```

## Project Structure

```
dload/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   ├── mvnw
│   └── src/main/java/com/downloader/
│       ├── DownloaderApplication.java
│       ├── controller/DownloadController.java
│       ├── service/DownloadService.java
│       └── model/
│           ├── DownloadRequest.java
│           └── DownloadStatus.java
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.js
        ├── components/
        │   ├── DownloadForm.js
        │   ├── DownloadList.js
        │   └── DownloadItem.js
        └── index.js
```

## Technology Stack

### Backend
- **Spring Boot 3.2.0** - Application framework
- **Java 21** - Programming language
- **Maven** - Build tool
- **Server-Sent Events** - Real-time communication

### Frontend
- **React 18** - UI framework
- **HTML5 EventSource** - SSE client
- **CSS3** - Styling
- **Nginx** - Web server (in production)

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Configuration

### Environment Variables

#### Backend
- `SPRING_PROFILES_ACTIVE` - Active Spring profile (default: `docker`)

#### Frontend
- `REACT_APP_API_URL` - Backend API URL (default: `http://localhost:8080`)

### Docker Volumes

- `./downloads` - Directory for downloaded files (mounted to `/app/downloads` in backend)

## Development

### Adding New Features

1. **Backend**: Add endpoints in `DownloadController.java` and business logic in `DownloadService.java`
2. **Frontend**: Add React components in `src/components/` and update the main `App.js`

### Testing

#### Backend Tests
```bash
cd backend
./mvnw test
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### Building for Production

```bash
# Build both services
docker-compose build

# Run in production mode
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 8080 are available
2. **Download failures**: Check network connectivity and URL validity
3. **SSE connection issues**: Verify CORS settings and proxy configuration

### Logs

```bash
# View backend logs
docker-compose logs backend

# View frontend logs
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
