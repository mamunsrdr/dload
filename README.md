# File Downloader with Server-Sent Events

A modern full-stack web application for downloading files with real-time progress tracking using Server-Sent Events (SSE) and reactive programming.

## Quick Start

### Prerequisites

- **For Native Mode**: Java 21+, Maven 3.6+, Node.js 18+, npm
- **For Docker Mode**: Docker and Docker Compose

### Deploy
`docker-compose up -d --build`

### NOTE: If you are running behind a proxy manage like nginx:
```
# SSE-specific configuration for Nginx Proxy Manager
location /api/downloads/stream {
    proxy_pass $forward_scheme://$server:$port;
    
    # Critical: Disable ALL buffering
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_cache off;
    
    # SSE headers
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Upgrade $http_upgrade;
    
    # Prevent caching
    proxy_set_header Cache-Control "no-cache, no-store, must-revalidate";
    proxy_set_header Pragma "no-cache";
    proxy_set_header Expires "0";
    
    # Critical for SSE streaming
    add_header X-Accel-Buffering "no";
    
    # Long timeout for streaming
    proxy_read_timeout 24h;
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    
    # No compression
    gzip off;
}

# Regular API endpoints
location /api/ {
    proxy_pass $forward_scheme://$server:$port;
    proxy_buffering off;
    proxy_request_buffering off;
}
```


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
