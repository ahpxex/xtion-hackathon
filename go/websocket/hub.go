package websocket

import (
    "log"
    "net/http"
    "sync"
    "time"

    "github.com/ahpxex/xtion-hackathon/config"
    "github.com/ahpxex/xtion-hackathon/game"
    "github.com/ahpxex/xtion-hackathon/llm"
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Hub struct {
	clients        map[*Client]bool
	register       chan *Client
	unregister     chan *Client
	messageHandler *MessageHandler
	stateManager   *game.StateManager
	analyzer       *llm.StateAnalyzer
	cfg            *config.Config
	mu             sync.RWMutex
}

func NewHub(cfg *config.Config, stateManager *game.StateManager, analyzer *llm.StateAnalyzer) *Hub {
	return &Hub{
		clients:        make(map[*Client]bool),
		register:       make(chan *Client),
		unregister:     make(chan *Client),
		messageHandler: NewMessageHandler(cfg),
		stateManager:   stateManager,
		analyzer:       analyzer,
		cfg:            cfg,
	}
}

func (h *Hub) Run() {
	log.Println("WebSocket hub started")

	// Process analyzer results and client register/unregister concurrently
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case result := <-h.analyzer.GetResults():
			h.handleAnalysisResult(result)
		}
	}
}

func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	sessionID := generateSessionID()
	client := NewClient(conn, sessionID, h)

	// Register the client first so session exists before any messages are processed
	h.registerClient(client)

	// Then start read/write pumps
	go client.writePump()
	go client.readPump()
}

func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[client] = true

	session := h.stateManager.CreateSession(client.sessionID)
	client.sessionData = session
}

func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		close(client.send)

		if client.sessionID != "" {
			h.stateManager.DeleteSession(client.sessionID)
		}
	}
}

func (h *Hub) handleClientMessage(client *Client, msg *ClientMessage) {
	switch msg.Type {
	case "user_action":
		h.handleUserAction(client, msg)
	case "purchase":
		h.handlePurchase(client, msg)
	default:
		log.Printf("Unknown message type from client %s: %s", client.sessionID, msg.Type)
	}
}

func (h *Hub) handleUserAction(client *Client, msg *ClientMessage) {
    if err := h.messageHandler.ValidateUserAction(msg); err != nil {
        log.Printf("Validation error for client %s: %v", client.sessionID, err)
        h.sendErr(client, err)
        return
    }

    session, err := h.stateManager.UpdateSessionState(client.sessionID, msg.Stage, msg.Clicks)
    if err != nil {
        h.sendErr(client, err)
        return
    }

    client.sessionData = session

    if h.analyzer.IsRunning() {
        userState := session.GetUserState()
        recentActions := session.GetRecentActions(h.cfg.HistoryWindowSize)

        req := &llm.AnalysisRequest{
            SessionID:     client.sessionID,
            UserState:     userState,
            RecentActions: recentActions,
            Timestamp:     time.Now(),
        }

        h.analyzer.QueueAnalysis(req)
    }
}

func (h *Hub) handlePurchase(client *Client, msg *ClientMessage) {

	err := h.stateManager.AddSessionPurchase(client.sessionID, msg.ItemID)
	if err != nil {
		respMsg := h.messageHandler.CreateResponse(
			"PURCHASE_RESPONSE",
			err.Error(),
		)
		h.sendMessage(client, respMsg)
		return
	}

	if client.sessionData != nil {
		client.sessionData.AddPurchase(msg.ItemID)
	}

	response := getEncodedResponse(msg.ItemID)

	respMsg := h.messageHandler.CreateResponse(
		"PURCHASE_RESPONSE",
		response,
	)

	h.sendMessage(client, respMsg)
}

func (h *Hub) handleAnalysisResult(result *llm.AnalysisResult) {
	h.mu.RLock()
	client, exists := h.findClientBySessionID(result.SessionID)
	h.mu.RUnlock()

	if !exists {
		//log.Printf("Analysis result for unknown session: %s", result.SessionID)
		return
	}

	if result.StateChange && result.Response != nil {
		session, exists := h.stateManager.GetSession(result.SessionID)
		if exists {
			currentState := result.Response.NewState
			if currentState == "" {
				currentState = result.PreviousState
			}
			session.UpdateCurrentState(currentState)
			session.AddLLMResponse(result.Response.Message)
		}

		currentState := result.PreviousState
		if result.Response.NewState != "" {
			currentState = result.Response.NewState
		}

		respMsg := h.messageHandler.CreateResponse(
			currentState,
			result.Response.Message,
		)

		h.sendMessage(client, respMsg)
	}
}

func (h *Hub) findClientBySessionID(sessionID string) (*Client, bool) {
	for client := range h.clients {
		if client.sessionID == sessionID {
			return client, true
		}
	}
	return nil, false
}

func (h *Hub) sendMessage(client *Client, message interface{}) {
	select {
	case client.send <- message:
	default:
		log.Printf("Send buffer full for client %s, dropping message", client.sessionID)
		client.Close()
	}
}

func (h *Hub) broadcastClientInfo(client *Client, action string) {
	info := map[string]interface{}{
		"type":       "client_info",
		"action":     action,
		"session_id": client.sessionID,
		"timestamp":  time.Now().Unix(),
	}

	h.sendMessage(client, info)
}

func (h *Hub) CleanupInactiveSessions() {
	timeout := 5 * time.Minute
	deleted := h.stateManager.CleanupInactiveSessions(timeout)

	h.mu.Lock()
	for client := range h.clients {
		if client.sessionData != nil && !client.sessionData.IsActive(timeout) {
			client.Close()
		}
	}
	h.mu.Unlock()

	if deleted > 0 {
		log.Printf("Cleaned up %d inactive sessions", deleted)
	}
}

func getPurchaseCategory(itemID int) string {
	switch itemID % 3 {
	case 0:
		return "click_multiplier"
	case 1:
		return "auto_clicker"
	case 2:
		return "abstract_meme"
	default:
		return "unknown"
	}
}

func getEncodedResponse(itemID int) string {
	responses := map[int]string{
		0: "Your click multiplier feels... meaningless somehow.",
		1: "An auto-clicker. Because clicking manually is too much effort.",
		2: "You bought an abstract meme. The void is pleased.",
		3: "More clicks per click. What a profound achievement.",
		4: "Automation for your automation. How meta.",
		5: "A digital concept. You can't even hold it.",
		6: "Clicking harder. Is that really progress?",
		7: "The machine clicks for you. Are you still playing?",
		8: "Consuming pixels. Modern life.",
	}

	if response, exists := responses[itemID]; exists {
		return response
	}
	return "You bought something. Congratulations?"
}

func generateSessionID() string {
	return time.Now().Format("20060102-150405") + "-" +
		string(rune(time.Now().UnixNano()%26+65)) +
		string(rune((time.Now().UnixNano()/1000)%26+65))
}

func (h *Hub) sendErr(client *Client, err error) {
	respMsg := h.messageHandler.CreateResponse(
		"PURCHASE_RESPONSE",
		err.Error(),
	)
	h.sendMessage(client, respMsg)
}
