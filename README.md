# File Downloader with Server-Sent Events

A modern full-stack web application for downloading files with real-time progress tracking using Server-Sent Events (SSE) and reactive programming.

## Quick Start

### Prerequisites

- **For Native Mode**: Java 21+, Maven 3.6+, Node.js 18+, npm
- **For Docker Mode**: Docker and Docker Compose

## API Endpoints

### Download Management
- `GET /api/downloads` - List all downloads
- `POST /api/downloads` - Start a new download
- `POST /api/downloads/{id}/pause` - Pause a specific download
- `POST /api/downloads/{id}/resume` - Resume a paused download
- `DELETE /api/downloads/{id}` - Cancel and remove a download

### Real-time Streaming
- `GET /api/downloads/stream` - SSE stream for all download progress updates
- `GET /api/downloads/{id}/stream` - SSE stream for specific download progress

### Request/Response Examples

#### Start Download
```bash
curl -X POST http://localhost:8080/api/downloads \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/file.zip",
    "filename": "my-file.zip",
    "outputPath": "/downloads"
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com/file.zip",
  "filename": "my-file.zip",
  "filePath": "/downloads/my-file.zip",
  "outputPath": "/downloads",
  "status": "QUEUED",
  "progress": 0.0,
  "totalSize": 0,
  "downloadedSize": 0,
  "speed": 0,
  "timeRemaining": 0,
  "version": 0
}
```

#### Pause Download
```bash
curl -X POST http://localhost:8080/api/downloads/{id}/pause
```

#### Resume Download
```bash
curl -X POST http://localhost:8080/api/downloads/{id}/resume
```

#### Cancel Download
```bash
curl -X DELETE http://localhost:8080/api/downloads/{id}
```

#### List Downloads
```bash
curl http://localhost:8080/api/downloads
```
