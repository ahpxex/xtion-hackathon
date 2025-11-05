# Deployment Guide

This guide explains how to deploy the frontend and backend on the same server.

## Architecture

- **Frontend**: Next.js application (runs in browser)
- **Backend**: Go WebSocket server (port 8080)
- **Deployment**: Both services run on the same server

## Setup Instructions

### 1. Backend Setup (Go)

The Go backend must be configured to listen on all network interfaces (not just localhost):

```bash
cd go

# Set environment variables
export DEEPSEEK_API_KEY="your-api-key"
export SERVER_PORT=8080

# Build and run
go build -o xtion-backend .
./xtion-backend
```

The backend will automatically bind to `0.0.0.0:8080`, making it accessible from external connections.

### 2. Frontend Setup (Next.js)

#### For Production Deployment on the Same Server:

**Option A: Auto-detect (Recommended)**

Leave `NEXT_PUBLIC_WS_URL` empty in `.env` to automatically use the same hostname as the frontend:

```bash
# .env
NEXT_PUBLIC_WS_URL=
```

The client will automatically build the WebSocket URL as:
- `ws://your-server.com:8080/ws` (if accessed via HTTP)
- `wss://your-server.com:8080/ws` (if accessed via HTTPS)

**Option B: Explicit URL**

Set the full WebSocket URL in `.env`:

```bash
# .env
NEXT_PUBLIC_WS_URL=ws://your-server.com:8080/ws
```

Or for HTTPS:

```bash
# .env
NEXT_PUBLIC_WS_URL=wss://your-server.com:8080/ws
```

#### Build and Run Frontend:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### 3. Development Setup

For local development:

```bash
# .env
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

Then run:

```bash
# Terminal 1: Start backend
cd go
go run main.go

# Terminal 2: Start frontend
npm run dev
```

## Network Configuration

### Firewall Rules

Make sure these ports are open:

- **Port 3000**: Next.js frontend (or your chosen port)
- **Port 8080**: Go WebSocket backend

### Port Configuration

If you need to change the backend port:

1. Update the Go backend:
   ```bash
   export SERVER_PORT=9090
   ```

2. Update the frontend `.env`:
   ```bash
   NEXT_PUBLIC_WS_URL=ws://your-server.com:9090/ws
   ```

## Troubleshooting

### WebSocket Connection Fails

1. **Check backend is running**: `curl http://localhost:8080/health`
2. **Check backend is accessible externally**: `curl http://your-server.com:8080/health`
3. **Verify firewall allows port 8080**: Check your server's firewall rules
4. **Check WebSocket URL**: Open browser console and look for connection errors

### CORS Issues

The backend already includes CORS middleware that allows all origins. If you need to restrict this in production:

Edit `go/main.go` line 89:
```go
c.Header("Access-Control-Allow-Origin", "https://your-frontend-domain.com")
```

### HTTPS/WSS

If your frontend uses HTTPS, you MUST use WSS (WebSocket Secure) for the backend:

1. Set up SSL/TLS for the backend (use a reverse proxy like nginx)
2. Update `.env`:
   ```bash
   NEXT_PUBLIC_WS_URL=wss://your-server.com:8080/ws
   ```

Or let auto-detect handle it (recommended).

## Production Checklist

- [ ] Backend is built and running with proper environment variables
- [ ] Backend port (8080) is accessible from external connections
- [ ] Frontend `.env` is configured with correct WebSocket URL
- [ ] Frontend is built and running (`npm run build && npm start`)
- [ ] WebSocket connection works (check browser console)
- [ ] Firewall rules allow necessary ports
- [ ] HTTPS/WSS is configured if using HTTPS
- [ ] DEEPSEEK_API_KEY is set for the backend

## Monitoring

Check backend logs for WebSocket connections:
```bash
# Backend will log:
# "Starting server on port 8080"
# "WebSocket endpoint available at: ws://localhost:8080/ws"
```

Check browser console for frontend WebSocket status:
```javascript
// You should see:
// "✅ WebSocket connected"
```
