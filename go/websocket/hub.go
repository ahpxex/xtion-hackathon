package websocket

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/ahpxex/xtion-hackathon/config"
	"github.com/ahpxex/xtion-hackathon/game"
	"github.com/ahpxex/xtion-hackathon/llm"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Hub struct {
	clients         map[*Client]bool
	register        chan *Client
	unregister      chan *Client
	messageHandler  *MessageHandler
	stateManager    *game.StateManager
	analyzer        *llm.StateAnalyzer
	cfg             *config.Config
	mu              sync.RWMutex
	metrics         *HubMetrics
}

type HubMetrics struct {
	ConnectionsTotal   int64     `json:"connections_total"`
	ConnectionsActive  int64     `json:"connections_active"`
	MessagesReceived   int64     `json:"messages_received"`
	MessagesSent       int64     `json:"messages_sent"`
	AnalysesTriggered  int64     `json:"analyses_triggered"`
	LLMResponsesSent   int64     `json:"llm_responses_sent"`
	LastActivity       time.Time `json:"last_activity"`
	mu                sync.RWMutex
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
		metrics: &HubMetrics{
			LastActivity: time.Now(),
		},
	}
}

func (h *Hub) Run() {
	log.Println("WebSocket hub started")

	for result := range h.analyzer.GetResults() {
		h.handleAnalysisResult(result)
	}

	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)
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

	go client.writePump()
	go client.readPump()

	h.register <- client
}

func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[client] = true
	
	session := h.stateManager.CreateSession(client.sessionID)
	client.sessionData = session

	h.metrics.mu.Lock()
	h.metrics.ConnectionsTotal++
	h.metrics.ConnectionsActive++
	h.metrics.LastActivity = time.Now()
	h.metrics.mu.Unlock()

	log.Printf("Client connected: %s (total: %d, active: %d)", 
		client.sessionID, h.metrics.ConnectionsTotal, h.metrics.ConnectionsActive)

	h.broadcastClientInfo(client, "connected")
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

		h.metrics.mu.Lock()
		h.metrics.ConnectionsActive--
		h.metrics.LastActivity = time.Now()
		h.metrics.mu.Unlock()

		log.Printf("Client disconnected: %s (active: %d)", client.sessionID, h.metrics.ConnectionsActive)
	}
}

func (h *Hub) handleClientMessage(client *Client, message interface{}) {
	h.metrics.mu.Lock()
	h.metrics.MessagesReceived++
	h.metrics.LastActivity = time.Now()
	h.metrics.mu.Unlock()

	switch msg := message.(type) {
	case *UserActionMessage:
		h.handleUserAction(client, msg)
	case *PurchaseMessage:
		h.handlePurchase(client, msg)
	default:
		log.Printf("Unknown message type from client %s: %T", client.sessionID, message)
	}
}

func (h *Hub) handleUserAction(client *Client, msg *UserActionMessage) {
	if err := h.messageHandler.ValidateUserAction(msg); err != nil {
		h.sendError(client, "invalid_user_action", err.Error())
		return
	}

	session, err := h.stateManager.UpdateSessionState(client.sessionID, msg.Stage, msg.Clicks)
	if err != nil {
		h.sendError(client, "session_error", err.Error())
		return
	}

	client.sessionData = session

	if h.analyzer.IsRunning() {
		userState := session.GetUserState()
		recentActions := session.GetRecentActions(h.cfg.HistoryWindowSize)

		req := &llm.AnalysisRequest{
			SessionID:    client.sessionID,
			UserState:    userState,
			RecentActions: recentActions,
			Timestamp:    time.Now(),
		}

		h.analyzer.QueueAnalysis(req)

		h.metrics.mu.Lock()
		h.metrics.AnalysesTriggered++
		h.metrics.mu.Unlock()
	}
}

func (h *Hub) handlePurchase(client *Client, msg *PurchaseMessage) {
	if err := h.messageHandler.ValidatePurchase(msg); err != nil {
		h.sendError(client, "invalid_purchase", err.Error())
		return
	}

	err := h.stateManager.AddSessionPurchase(client.sessionID, msg.ItemID)
	if err != nil {
		h.sendError(client, "session_error", err.Error())
		return
	}

	if client.sessionData != nil {
		client.sessionData.AddPurchase(msg.ItemID)
	}

	category := getPurchaseCategory(msg.ItemID)
	response := getEncodedResponse(msg.ItemID)

	respMsg := h.messageHandler.CreateResponse(
		category,
		response,
		"PURCHASE_RESPONSE",
	)

	h.sendMessage(client, respMsg)
}

func (h *Hub) handleAnalysisResult(result *llm.AnalysisResult) {
	h.mu.RLock()
	client, exists := h.findClientBySessionID(result.SessionID)
	h.mu.RUnlock()

	if !exists {
		log.Printf("Analysis result for unknown session: %s", result.SessionID)
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
			"LLM_ANALYSIS",
		)

		h.sendMessage(client, respMsg)

		h.metrics.mu.Lock()
		h.metrics.LLMResponsesSent++
		h.metrics.mu.Unlock()
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
		h.metrics.mu.Lock()
		h.metrics.MessagesSent++
		h.metrics.LastActivity = time.Now()
		h.metrics.mu.Unlock()
	default:
		log.Printf("Send buffer full for client %s, dropping message", client.sessionID)
		client.Close()
	}
}

func (h *Hub) sendError(client *Client, code, message string) {
	errorMsg := h.messageHandler.CreateError(code, message)
	h.sendMessage(client, errorMsg)
}

func (h *Hub) broadcastClientInfo(client *Client, action string) {
	h.metrics.mu.RLock()
	info := map[string]interface{}{
		"type":       "client_info",
		"action":     action,
		"session_id": client.sessionID,
		"timestamp":  time.Now().Unix(),
		"metrics":    h.metrics,
	}
	h.metrics.mu.RUnlock()

	h.sendMessage(client, info)
}

func (h *Hub) GetMetrics() *HubMetrics {
	h.metrics.mu.RLock()
	defer h.metrics.mu.RUnlock()

	metricsCopy := *h.metrics
	return &metricsCopy
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