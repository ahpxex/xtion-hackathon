package websocket

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/ahpxex/xtion-hackathon/config"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

type BaseMessage struct {
	Type      string    `json:"type" validate:"required"`
	Timestamp time.Time `json:"timestamp"`
}

type UserActionMessage struct {
	Type      string `json:"type" validate:"required,eq=user_action"`
	Stage     int    `json:"stage" validate:"required,min=0,max=3000"`
	Clicks    int    `json:"clicks" validate:"required,min=0"`
	Timestamp int64  `json:"timestamp" validate:"required"`
}

type PurchaseMessage struct {
	Type      string `json:"type" validate:"required,eq=purchase"`
	ItemID    int    `json:"item_id" validate:"required,min=0,max=8"`
	Category  int    `json:"category" validate:"required,min=0,max=2"`
	Timestamp int64  `json:"timestamp" validate:"required"`
}

type ResponseMessage struct {
	Type      string `json:"type" validate:"required,eq=response"`
	State     string `json:"state" validate:"required"`
	Message   string `json:"message" validate:"required,max=200"`
	Code      string `json:"code" validate:"required"`
	Timestamp int64  `json:"timestamp" validate:"required"`
}

type ErrorMessage struct {
	Type      string `json:"type" validate:"required,eq=error"`
	Code      string `json:"code" validate:"required"`
	Message   string `json:"message" validate:"required"`
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

func (mh *MessageHandler) ParseMessage(data []byte) (interface{}, error) {
	var base BaseMessage
	if err := json.Unmarshal(data, &base); err != nil {
		return nil, fmt.Errorf("invalid JSON format: %w", err)
	}

	switch base.Type {
	case "user_action":
		var msg UserActionMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			return nil, fmt.Errorf("invalid user_action message: %w", err)
		}
		if err := validate.Struct(&msg); err != nil {
			return nil, fmt.Errorf("user_action validation failed: %w", err)
		}
		return &msg, nil

	case "purchase":
		var msg PurchaseMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			return nil, fmt.Errorf("invalid purchase message: %w", err)
		}
		if err := validate.Struct(&msg); err != nil {
			return nil, fmt.Errorf("purchase validation failed: %w", err)
		}
		return &msg, nil

	default:
		return nil, fmt.Errorf("unknown message type: %s", base.Type)
	}
}

func (mh *MessageHandler) CreateResponse(state, message, code string) *ResponseMessage {
	return &ResponseMessage{
		Type:      "response",
		State:     state,
		Message:   message,
		Code:      code,
		Timestamp: time.Now().Unix(),
	}
}

func (mh *MessageHandler) CreateError(code, message string) *ErrorMessage {
	return &ErrorMessage{
		Type:      "error",
		Code:      code,
		Message:   message,
		Timestamp: time.Now().Unix(),
	}
}

func (mh *MessageHandler) ValidateUserAction(msg *UserActionMessage) error {
	if msg.Stage < 0 || msg.Stage > mh.cfg.StageMaxValue {
		return fmt.Errorf("stage must be between 0 and %d", mh.cfg.StageMaxValue)
	}
	if msg.Clicks < 0 || msg.Clicks > mh.cfg.ClicksMaxValue {
		return fmt.Errorf("clicks must be between 0 and %d", mh.cfg.ClicksMaxValue)
	}
	if msg.Timestamp <= 0 {
		return fmt.Errorf("timestamp must be a valid Unix timestamp")
	}
	return nil
}

func (mh *MessageHandler) ValidatePurchase(msg *PurchaseMessage) error {
	if msg.ItemID < 0 || msg.ItemID > 8 {
		return fmt.Errorf("item_id must be between 0 and 8")
	}
	if msg.Category != msg.ItemID%3 {
		return fmt.Errorf("category must match item_id %% 3")
	}
	if msg.Timestamp <= 0 {
		return fmt.Errorf("timestamp must be a valid Unix timestamp")
	}
	return nil
}