# Philosophical Insights WebSocket Backend

A real-time user state analysis system with LLM integration that provides satirical responses to user clicking patterns in an existential clicking game.

## Features

- **WebSocket-based real-time communication** with <100ms message processing
- **LLM-powered state analysis** every 10 seconds using DeepSeek API
- **Immediate purchase responses** with 9 pre-encoded satirical messages
- **In-memory session management** with automatic cleanup
- **TDD implementation** with comprehensive test suite
- **Performance monitoring** with `/metrics` endpoint

## Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
DEEPSEEK_API_KEY=your_deepseek_api_key_here
SERVER_PORT=8080
LLM_MODEL=deepseek-chat
ANALYSIS_INTERVAL_SECONDS=10
STAGE_MAX_VALUE=3000
```

### 2. Running the Server

```bash
# Build and run
go run main.go

# Or build binary first
go build -o xtion-backend .
./xtion-backend
```

The server will start with:
- WebSocket endpoint: `ws://localhost:8080/ws`
- Health check: `http://localhost:8080/health`
- Metrics: `http://localhost:8080/metrics`

### 3. Testing with Test Client

```bash
# Run the test client
go run tests/client/test_client.go

# Or specify custom server
go run tests/client/test_client.go ws://localhost:8080/ws
```

## WebSocket Message Format

### Client → Server Messages

#### User Action
```json
{
  "type": "user_action",
  "stage": 100,
  "clicks": 1000,
  "timestamp": 1705295400
}
```

#### Purchase
```json
{
  "type": "purchase",
  "item_id": 5,
  "category": 2,
  "timestamp": 1705295401
}
```

### Server → Client Messages

#### Response (LLM Analysis)
```json
{
  "type": "response",
  "state": "taking_break",
  "message": "哈？为什么不试试消费物品？",
  "code": "LLM_ANALYSIS",
  "timestamp": 1705295402
}
```

#### Response (Purchase)
```json
{
  "type": "response",
  "state": "auto_clicker",
  "message": "The machine clicks for you. Are you still playing?",
  "code": "PURCHASE_RESPONSE",
  "timestamp": 1705295402
}
```

#### Error
```json
{
  "type": "error",
  "code": "invalid_user_action",
  "message": "Stage must be between 0 and 3000",
  "timestamp": 1705295403
}
```

## State Detection Logic

The system analyzes user patterns to detect:

- **Productive**: Active clicking and steady progression
- **Taking Break**: High stage but low click activity  
- **Disengaged**: Low activity across both metrics
- **Confused**: Erratic or unclear patterns
- **Obsessed**: Excessive clicking relative to progress

## Purchase Categories

Items are categorized by `item_id % 3`:
- **0**: Click multiplier upgrades
- **1**: Auto-clicker upgrades  
- **2**: Abstract meme purchases

## Running Tests

```bash
# Run all tests
go test ./...

# Run integration tests
go test ./tests/integration/ -v

# Run with coverage
go test -cover ./...
```

## Performance Targets

- **WebSocket processing**: <100ms
- **Purchase responses**: <50ms  
- **LLM analysis**: Every 10 seconds
- **Concurrent sessions**: Limited by available memory

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8080 | HTTP server port |
| `DEEPSEEK_API_KEY` | Required | DeepSeek API key |
| `LLM_MODEL` | deepseek-chat | DeepSeek model |
| `LLM_MAX_TOKENS` | 150 | Max tokens per response |
| `LLM_TEMPERATURE` | 0.7 | Response creativity |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | 6 | LLM API rate limit |
| `ANALYSIS_INTERVAL_SECONDS` | 10 | Analysis frequency |
| `STAGE_MAX_VALUE` | 3000 | Maximum game stage |
| `CLICKS_MAX_VALUE` | 10000 | Maximum clicks |
| `HISTORY_WINDOW_SIZE` | 10 | User action history size |

## Architecture

```
go/
├── main.go              # Application entry point
├── config/
│   └── config.go         # Configuration management
├── websocket/
│   ├── hub.go           # Connection manager
│   ├── client.go        # Individual client session
│   └── message.go       # Message handling & validation
├── llm/
│   ├── analyzer.go      # State analysis logic
│   └── client.go        # OpenAI integration
├── game/
│   ├── state.go         # User state management
│   └── responses.go     # Encoded response strings
├── storage/
│   └── memory.go        # In-memory session storage
└── tests/
    ├── integration/     # End-to-end tests
    └── client/          # Test client implementation
```

## Development

The project follows TDD principles with comprehensive test coverage. All core functionality is tested before implementation.

### Adding New Features

1. Write failing tests first
2. Implement minimal functionality to pass tests
3. Refactor while maintaining test coverage
4. Add integration tests as needed

## License

This project is part of the xtion-hackathon initiative.