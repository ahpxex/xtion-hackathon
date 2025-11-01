package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/ahpxex/xtion-hackathon/game"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

type Client struct {
	hub         *Hub
	conn        *websocket.Conn
	send        chan interface{}
	sessionID   string
	sessionData *game.SessionData
	closed      bool
	closeChan   chan struct{}
}

func NewClient(conn *websocket.Conn, sessionID string, hub *Hub) *Client {
	return &Client{
		hub:       hub,
		conn:      conn,
		send:      make(chan interface{}, 256),
		sessionID: sessionID,
		closed:    false,
		closeChan: make(chan struct{}),
	}
}

func (c *Client) readPump() {
	defer func() {
		c.Close()
		c.hub.unregister <- c
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for client %s: %v", c.sessionID, err)
			}
			break
		}

		msg, err := c.hub.messageHandler.ParseMessage(messageBytes)
		if err != nil {
			log.Printf("Message parsing error for client %s: %v", c.sessionID, err)
			continue
		}

		c.hub.handleClientMessage(c, msg)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.writeJSON(message); err != nil {
				log.Printf("Write error for client %s: %v", c.sessionID, err)
				return
			}
			time.Sleep(1 * time.Second)

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("Ping error for client %s: %v", c.sessionID, err)
				return
			}

		case <-c.closeChan:
			return
		}
	}
}

func (c *Client) writeJSON(v interface{}) error {
	if c.closed {
		return websocket.ErrCloseSent
	}

	w, err := c.conn.NextWriter(websocket.TextMessage)
	if err != nil {
		return err
	}

	encoder := json.NewEncoder(w)
	if err := encoder.Encode(v); err != nil {
		w.Close()
		return err
	}

	return w.Close()
}

func (c *Client) Close() {
	if c.closed {
		return
	}

	c.closed = true
	close(c.closeChan)

	if c.conn != nil {
		c.conn.SetWriteDeadline(time.Now().Add(writeWait))
		c.conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		c.conn.Close()
	}

	log.Printf("Client %s connection closed", c.sessionID)
}

func (c *Client) IsClosed() bool {
	return c.closed
}

func (c *Client) GetSessionID() string {
	return c.sessionID
}

func (c *Client) GetSessionData() *game.SessionData {
	return c.sessionData
}

func (c *Client) SetSessionData(sessionData *game.SessionData) {
	c.sessionData = sessionData
}

func (c *Client) SendMessage(message interface{}) error {
	if c.closed {
		return websocket.ErrCloseSent
	}

	select {
	case c.send <- message:
		return nil
	default:
		log.Printf("Send buffer full for client %s, dropping message", c.sessionID)
		return websocket.ErrCloseSent
	}
}

func (c *Client) SendResponse(state, message string) error {
	respMsg := c.hub.messageHandler.CreateResponse(state, message)
	return c.SendMessage(respMsg)
}

func (c *Client) UpdateLastActivity() {
	if c.sessionData != nil {
		c.sessionData.UpdateCurrentState(c.sessionData.CurrentState)
	}
}

func (c *Client) IsActive(timeout time.Duration) bool {
	if c.sessionData == nil {
		return false
	}
	return c.sessionData.IsActive(timeout)
}

func (c *Client) GetConnectionInfo() map[string]interface{} {
	info := map[string]interface{}{
		"session_id":    c.sessionID,
		"connected_at":  time.Now().Format(time.RFC3339),
		"is_active":     !c.closed,
		"last_activity": time.Now().Format(time.RFC3339),
	}

	if c.sessionData != nil {
		userState := c.sessionData.GetUserState()
		info["current_state"] = userState.CurrentState
		info["stage"] = userState.Stage
		info["clicks"] = userState.Clicks
		info["engagement_rate"] = userState.EngagementRate
		info["messages_count"] = len(c.sessionData.LLMResponses)
		info["purchases_count"] = len(c.sessionData.ItemPurchases)
	}

	return info
}
