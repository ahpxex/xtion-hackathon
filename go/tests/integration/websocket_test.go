package integration

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/ahpxex/xtion-hackathon/config"
	"github.com/ahpxex/xtion-hackathon/llm"
	"github.com/ahpxex/xtion-hackathon/storage"
	"github.com/ahpxex/xtion-hackathon/websocket"
)

func TestWebSocketConnection(t *testing.T) {
	cfg := &config.Config{
		ServerPort:                8080,
		OpenAIAPIKey:              "test-key",
		LLMModel:                  "gpt-4o-mini",
		LLMMaxTokens:              150,
		LLMTemperature:            0.7,
		RateLimitRequestsPerMinute: 6,
		AnalysisIntervalSeconds:   10 * time.Second,
		StageMaxValue:             3000,
		ClicksMaxValue:            10000,
		HistoryWindowSize:         10,
	}

	store := storage.NewMemoryStore(cfg.HistoryWindowSize)
	llmClient := llm.NewLLMClient(cfg)
	analyzer := llm.NewStateAnalyzer(cfg, llmClient)
	hub := websocket.NewHub(cfg, store.GetStateManager(), analyzer)

	server := httptest.NewServer(http.HandlerFunc(hub.HandleWebSocket))
	defer server.Close()

	t.Run("Successful Connection", func(t *testing.T) {
		wsURL := "ws" + server.URL[4:] + "/ws"

		conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)
		defer conn.Close()

		assert.NotNil(t, conn)
	})

	t.Run("Message Handling", func(t *testing.T) {
		wsURL := "ws" + server.URL[4:] + "/ws"

		conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)
		defer conn.Close()

		userAction := map[string]interface{}{
			"type":      "user_action",
			"stage":     100,
			"clicks":    1000,
			"timestamp": time.Now().Unix(),
		}

		err = conn.WriteJSON(userAction)
		require.NoError(t, err)

		conn.SetReadDeadline(time.Now().Add(5 * time.Second))
		var response map[string]interface{}
		err = conn.ReadJSON(&response)
		
		assert.NoError(t, err)
		assert.NotNil(t, response)
	})

	t.Run("Purchase Message", func(t *testing.T) {
		wsURL := "ws" + server.URL[4:] + "/ws"

		conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
		require.NoError(t, err)
		defer conn.Close()

		purchase := map[string]interface{}{
			"type":      "purchase",
			"item_id":   5,
			"category":  2,
			"timestamp": time.Now().Unix(),
		}

		err = conn.WriteJSON(purchase)
		require.NoError(t, err)

		conn.SetReadDeadline(time.Now().Add(2 * time.Second))
		var response map[string]interface{}
		err = conn.ReadJSON(&response)
		
		assert.NoError(t, err)
		assert.NotNil(t, response)
		
		responseType, ok := response["type"].(string)
		assert.True(t, ok)
		assert.Equal(t, "response", responseType)
	})
}

func TestMessageValidation(t *testing.T) {
	cfg := &config.Config{
		StageMaxValue:  3000,
		ClicksMaxValue: 10000,
	}

	handler := websocket.NewMessageHandler(cfg)

	t.Run("Valid User Action", func(t *testing.T) {
		message := map[string]interface{}{
			"type":      "user_action",
			"stage":     100,
			"clicks":    1000,
			"timestamp": time.Now().Unix(),
		}

		data, _ := json.Marshal(message)
		parsed, err := handler.ParseMessage(data)
		
		assert.NoError(t, err)
		assert.NotNil(t, parsed)
	})

	t.Run("Invalid Stage Value", func(t *testing.T) {
		message := map[string]interface{}{
			"type":      "user_action",
			"stage":     4000,
			"clicks":    1000,
			"timestamp": time.Now().Unix(),
		}

		data, _ := json.Marshal(message)
		_, err := handler.ParseMessage(data)
		
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "validation failed")
	})

	t.Run("Valid Purchase", func(t *testing.T) {
		message := map[string]interface{}{
			"type":      "purchase",
			"item_id":   5,
			"category":  2,
			"timestamp": time.Now().Unix(),
		}

		data, _ := json.Marshal(message)
		parsed, err := handler.ParseMessage(data)
		
		assert.NoError(t, err)
		assert.NotNil(t, parsed)
	})

	t.Run("Invalid Item ID", func(t *testing.T) {
		message := map[string]interface{}{
			"type":      "purchase",
			"item_id":   15,
			"category":  0,
			"timestamp": time.Now().Unix(),
		}

		data, _ := json.Marshal(message)
		_, err := handler.ParseMessage(data)
		
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "validation failed")
	})
}