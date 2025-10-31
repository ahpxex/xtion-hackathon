package client

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
)

type TestClient struct {
	conn       *websocket.Conn
	serverURL  string
	sessionID  string
	messages   []interface{}
	stopChan   chan struct{}
	mu         sync.Mutex
}

type TestMessage struct {
	Type      string      `json:"type"`
	Timestamp int64       `json:"timestamp"`
	Data      interface{} `json:"data,omitempty"`
}

type UserActionData struct {
	Stage  int `json:"stage"`
	Clicks int `json:"clicks"`
}

type PurchaseData struct {
	ItemID   int `json:"item_id"`
	Category int `json:"category"`
}

func NewTestClient(serverURL string) *TestClient {
	return &TestClient{
		serverURL: serverURL,
		messages:  make([]interface{}, 0),
		stopChan:  make(chan struct{}),
	}
}

func (tc *TestClient) Connect() error {
	u, err := url.Parse(tc.serverURL)
	if err != nil {
		return fmt.Errorf("invalid server URL: %w", err)
	}

	if u.Scheme == "http" {
		u.Scheme = "ws"
	} else if u.Scheme == "https" {
		u.Scheme = "wss"
	}

	log.Printf("Connecting to WebSocket at %s", u.String())

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		return fmt.Errorf("failed to connect to WebSocket: %w", err)
	}

	tc.conn = conn
	go tc.readMessages()

	log.Println("Connected to WebSocket server")
	return nil
}

func (tc *TestClient) readMessages() {
	defer tc.Close()

	for {
		select {
		case <-tc.stopChan:
			return
		default:
			var message TestMessage
			err := tc.conn.ReadJSON(&message)
			if err != nil {
				log.Printf("Read error: %v", err)
				return
			}

			tc.mu.Lock()
			tc.messages = append(tc.messages, message)
			tc.mu.Unlock()

			tc.handleMessage(message)
		}
	}
}

func (tc *TestClient) handleMessage(message TestMessage) {
	switch message.Type {
	case "response":
		log.Printf("📨 Response: %+v", message.Data)
	case "error":
		log.Printf("❌ Error: %+v", message.Data)
	case "client_info":
		log.Printf("ℹ️ Client Info: %+v", message.Data)
	default:
		log.Printf("📩 Unknown message type %s: %+v", message.Type, message.Data)
	}
}

func (tc *TestClient) SendUserAction(stage, clicks int) error {
	message := TestMessage{
		Type:      "user_action",
		Timestamp: time.Now().Unix(),
		Data: UserActionData{
			Stage:  stage,
			Clicks: clicks,
		},
	}

	return tc.sendMessage(message)
}

func (tc *TestClient) SendPurchase(itemID int) error {
	category := itemID % 3
	message := TestMessage{
		Type:      "purchase",
		Timestamp: time.Now().Unix(),
		Data: PurchaseData{
			ItemID:   itemID,
			Category: category,
		},
	}

	return tc.sendMessage(message)
}

func (tc *TestClient) sendMessage(message TestMessage) error {
	if tc.conn == nil {
		return fmt.Errorf("not connected")
	}

	tc.mu.Lock()
	defer tc.mu.Unlock()

	err := tc.conn.WriteJSON(message)
	if err != nil {
		return fmt.Errorf("failed to send message: %w", err)
	}

	log.Printf("📤 Sent %s message: %+v", message.Type, message.Data)
	return nil
}

func (tc *TestClient) GetMessages() []interface{} {
	tc.mu.Lock()
	defer tc.mu.Unlock()

	messages := make([]interface{}, len(tc.messages))
	copy(messages, tc.messages)
	return messages
}

func (tc *TestClient) CountMessages(messageType string) int {
	tc.mu.Lock()
	defer tc.mu.Unlock()

	count := 0
	for _, msg := range tc.messages {
		if tm, ok := msg.(TestMessage); ok && tm.Type == messageType {
			count++
		}
	}
	return count
}

func (tc *TestClient) Close() {
	close(tc.stopChan)
	if tc.conn != nil {
		tc.conn.Close()
	}
	log.Println("Test client disconnected")
}

func RunProgressiveScenario(client *TestClient) error {
	log.Println("🚀 Starting progressive scenario (stage 0 → 1000)")

	for stage := 0; stage <= 1000; stage += 10 {
		clicks := stage * 10

		if err := client.SendUserAction(stage, clicks); err != nil {
			return fmt.Errorf("failed to send user action at stage %d: %w", stage, err)
		}

		if stage%100 == 0 && stage > 0 {
			itemID := stage % 9
			if err := client.SendPurchase(itemID); err != nil {
				return fmt.Errorf("failed to send purchase at stage %d: %w", stage, err)
			}

			time.Sleep(100 * time.Millisecond)
		}

		time.Sleep(200 * time.Millisecond)
	}

	log.Println("✅ Progressive scenario completed (reached stage 1000)")
	return nil
}

func RunBreakDetectionScenario(client *TestClient) error {
	log.Println("🛌 Starting break detection scenario")

	for i := 0; i < 20; i++ {
		stage := 500 + i*10
		clicks := 500 + i*2

		if err := client.SendUserAction(stage, clicks); err != nil {
			return fmt.Errorf("failed to send break pattern at iteration %d: %w", i, err)
		}

		time.Sleep(500 * time.Millisecond)
	}

	log.Println("✅ Break detection scenario completed")
	return nil
}

func RunPurchaseScenario(client *TestClient) error {
	log.Println("🛒 Starting purchase scenario (all item categories)")

	for itemID := 0; itemID <= 8; itemID++ {
		if err := client.SendPurchase(itemID); err != nil {
			return fmt.Errorf("failed to purchase item %d: %w", itemID, err)
		}

		time.Sleep(100 * time.Millisecond)
	}

	log.Println("✅ Purchase scenario completed (all 9 items tested)")
	return nil
}

func main() {
	serverURL := "ws://localhost:8080/ws"
	if len(os.Args) > 1 {
		serverURL = os.Args[1]
	}

	client := NewTestClient(serverURL)

	if err := client.Connect(); err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Close()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Println("Running test scenarios...")

		log.Println("1. Testing user actions...")
		for i := 0; i < 5; i++ {
			if err := client.SendUserAction(i*10, i*50); err != nil {
				log.Printf("Error sending user action: %v", err)
			}
			time.Sleep(200 * time.Millisecond)
		}

		log.Println("2. Testing purchases...")
		for itemID := 0; itemID <= 2; itemID++ {
			if err := client.SendPurchase(itemID); err != nil {
				log.Printf("Error sending purchase: %v", err)
			}
			time.Sleep(100 * time.Millisecond)
		}

		log.Println("3. Running progressive scenario...")
		if err := RunProgressiveScenario(client); err != nil {
			log.Printf("Progressive scenario error: %v", err)
		}

		log.Println("✅ All test scenarios completed")
	}()

	select {
	case <-sigChan:
		log.Println("Received interrupt signal, shutting down...")
	case <-time.After(60 * time.Second):
		log.Println("Test timeout reached")
	}

	log.Printf("📊 Final statistics:")
	log.Printf("   Total messages received: %d", len(client.GetMessages()))
	log.Printf("   Response messages: %d", client.CountMessages("response"))
	log.Printf("   Error messages: %d", client.CountMessages("error"))
}