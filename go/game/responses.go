package game

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type EncodedResponse struct {
	ItemID    int       `json:"item_id"`
	Category  string    `json:"category"`
	Response  string    `json:"response"`
	Timestamp time.Time `json:"timestamp"`
}

type ResponseSystem struct {
	responses map[int]string
	categories map[int]string
}

func NewResponseSystem() *ResponseSystem {
	rs := &ResponseSystem{
		responses:  make(map[int]string),
		categories: make(map[int]string),
	}
	rs.initializeResponses()
	return rs
}

func (rs *ResponseSystem) initializeResponses() {
	clickMultiplierResponses := map[int]string{
		0: "Your click multiplier feels... meaningless somehow.",
		3: "More clicks per click. What a profound achievement.",
		6: "Clicking harder. Is that really progress?",
	}

	autoClickerResponses := map[int]string{
		1: "An auto-clicker. Because clicking manually is too much effort.",
		4: "Automation for your automation. How meta.",
		7: "The machine clicks for you. Are you still playing?",
	}

	abstractMemeResponses := map[int]string{
		2: "You bought an abstract meme. The void is pleased.",
		5: "A digital concept. You can't even hold it.",
		8: "Consuming pixels. Modern life.",
	}

	for id, response := range clickMultiplierResponses {
		rs.responses[id] = response
		rs.categories[id] = "click_multiplier"
	}

	for id, response := range autoClickerResponses {
		rs.responses[id] = response
		rs.categories[id] = "auto_clicker"
	}

	for id, response := range abstractMemeResponses {
		rs.responses[id] = response
		rs.categories[id] = "abstract_meme"
	}
}

func (rs *ResponseSystem) GetResponse(itemID int) (*EncodedResponse, error) {
	if itemID < 0 || itemID > 8 {
		return nil, fmt.Errorf("item_id must be between 0 and 8")
	}

	response, exists := rs.responses[itemID]
	if !exists {
		response = "You bought something. Congratulations?"
	}

	category, exists := rs.categories[itemID]
	if !exists {
		category = "unknown"
	}

	return &EncodedResponse{
		ItemID:    itemID,
		Category:  category,
		Response:  response,
		Timestamp: time.Now(),
	}, nil
}

func (rs *ResponseSystem) GetCategory(itemID int) string {
	category, exists := rs.categories[itemID]
	if !exists {
		return "unknown"
	}
	return category
}

func (rs *ResponseSystem) GetAllResponses() map[int]*EncodedResponse {
	all := make(map[int]*EncodedResponse)
	for itemID := 0; itemID <= 8; itemID++ {
		if resp, err := rs.GetResponse(itemID); err == nil {
			all[itemID] = resp
		}
	}
	return all
}

func (rs *ResponseSystem) ValidateResponse(response string) bool {
	if len(strings.TrimSpace(response)) == 0 {
		return false
	}
	if len(response) > 200 {
		return false
	}
	return true
}

func (rs *ResponseSystem) EncodeResponse(response *EncodedResponse) ([]byte, error) {
	if response == nil {
		return nil, fmt.Errorf("response cannot be nil")
	}

	if !rs.ValidateResponse(response.Response) {
		return nil, fmt.Errorf("invalid response content")
	}

	data, err := json.Marshal(response)
	if err != nil {
		return nil, fmt.Errorf("failed to encode response: %w", err)
	}

	return data, nil
}

func (rs *ResponseSystem) DecodeResponse(data []byte) (*EncodedResponse, error) {
	var response EncodedResponse
	if err := json.Unmarshal(data, &response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if !rs.ValidateResponse(response.Response) {
		return nil, fmt.Errorf("invalid response content in decoded data")
	}

	return &response, nil
}

func GetItemCategory(itemID int) string {
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

func GetDefaultResponse(itemID int) string {
	switch itemID % 3 {
	case 0:
		return "Your click multiplier upgrade feels... somehow meaningless."
	case 1:
		return "An auto-clicker. Because manual effort is overrated."
	case 2:
		return "You bought an abstract concept. The void is amused."
	default:
		return "You purchased something. Is this progress?"
	}
}