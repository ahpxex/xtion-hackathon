package websocket

import (
	"encoding/json"
	"fmt"
	"github.com/ahpxex/xtion-hackathon/config"
	"time"
)

// ClientMessage 统一的客户端消息结构，根据 type 携带不同字段
type ClientMessage struct {
	Type      string `json:"type"`
	Timestamp int64  `json:"timestamp,omitempty"`

	// user_action 专用字段
	Stage  int `json:"stage,omitempty"`
	Clicks int `json:"clicks,omitempty"`

	// purchase 专用字段
	ItemID   int `json:"item_id,omitempty"`
	Category int `json:"category,omitempty"`
}

type ResponseMessage struct {
	Type      string `json:"type" validate:"required,eq=response"`
	State     string `json:"state" validate:"required"`
	Message   string `json:"message" validate:"required,max=200"`
	Code      string `json:"code" validate:"required"`
	Timestamp int64  `json:"timestamp" validate:"required"`
}

type MessageHandler struct {
	cfg *config.Config
}

func NewMessageHandler(cfg *config.Config) *MessageHandler {
	return &MessageHandler{
		cfg: cfg,
	}
}

func (mh *MessageHandler) ParseMessage(data []byte) (*ClientMessage, error) {
	var msg ClientMessage
	if err := json.Unmarshal(data, &msg); err != nil {
		return nil, fmt.Errorf("invalid JSON format: %w", err)
	}

	switch msg.Type {
	case "user_action":
		if err := mh.ValidateUserAction(&msg); err != nil {
			return nil, fmt.Errorf("user_action validation failed: %w", err)
		}
		return &msg, nil
	case "purchase":
		if err := mh.ValidatePurchase(&msg); err != nil {
			return nil, fmt.Errorf("purchase validation failed: %w", err)
		}
		return &msg, nil
	default:
		return nil, fmt.Errorf("unknown message type: %s", msg.Type)
	}
}

func (mh *MessageHandler) CreateResponse(state, message string) map[string]interface{} {
	return map[string]interface{}{
		"type":      "response",
		"timestamp": time.Now().Unix(),
		"data": map[string]interface{}{
			"state":   state,
			"message": message,
		},
	}
}

func (mh *MessageHandler) ValidateUserAction(msg *ClientMessage) error {
	if msg.Stage < 0 || msg.Stage > mh.cfg.StageMaxValue {
		return fmt.Errorf("validation failed: stage must be between 0 and %d", mh.cfg.StageMaxValue)
	}
	if msg.Clicks < 0 || msg.Clicks > mh.cfg.ClicksMaxValue {
		return fmt.Errorf("validation failed: clicks must be between 0 and %d", mh.cfg.ClicksMaxValue)
	}
	if msg.Timestamp <= 0 {
		return fmt.Errorf("validation failed: timestamp must be a valid Unix timestamp")
	}
	return nil
}

func (mh *MessageHandler) ValidatePurchase(msg *ClientMessage) error {
	if msg.ItemID < 0 || msg.ItemID > 14 { // item_id 0..14 有效
		return fmt.Errorf("validation failed: item_id must be between 0 and 14")
	}
	if msg.Category < 0 || msg.Category > 2 {
		return fmt.Errorf("validation failed: category must be between 0 and 2")
	}
	if msg.Timestamp <= 0 {
		return fmt.Errorf("validation failed: timestamp must be a valid Unix timestamp")
	}
	return nil
}
