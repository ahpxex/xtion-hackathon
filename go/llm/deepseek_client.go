package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/ahpxex/xtion-hackathon/config"
	"github.com/ahpxex/xtion-hackathon/game"
)

type DeepSeekRequest struct {
	Model    string                   `json:"model"`
	Messages []DeepSeekMessage       `json:"messages"`
	Stream   bool                     `json:"stream"`
	MaxTokens int                      `json:"max_tokens,omitempty"`
	Temperature float64                `json:"temperature,omitempty"`
	ResponseFormat *DeepSeekResponseFormat `json:"response_format,omitempty"`
}

type DeepSeekMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type DeepSeekResponseFormat struct {
	Type string `json:"type"`
}

type DeepSeekResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

type DeepSeekClient struct {
	client    *http.Client
	cfg       *config.Config
	apiKey    string
	baseURL   string
}

func NewDeepSeekClient(cfg *config.Config) *DeepSeekClient {
	return &DeepSeekClient{
		client:  &http.Client{Timeout: 30 * time.Second},
		cfg:     cfg,
		apiKey:  cfg.OpenAIAPIKey, // Reusing this field for DeepSeek API key
		baseURL: "https://api.deepseek.com",
	}
}

func (dc *DeepSeekClient) AnalyzeUserState(userState *game.UserState, recentActions []game.UserAction) (*LLMResponse, error) {
	if userState == nil {
		return nil, fmt.Errorf("user state is nil")
	}

	prompt := dc.buildPrompt(userState, recentActions)
	
	requestData := DeepSeekRequest{
		Model: dc.cfg.LLMModel,
		Messages: []DeepSeekMessage{
			{
				Role: "system",
				Content: `You are analyzing a user playing an existential clicking game. 
Your responses should be satirical, questioning of instant gratification, and minimalist.
Provide responses in JSON format with the specified schema.`,
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Stream:         false,
		MaxTokens:      dc.cfg.LLMMaxTokens,
		Temperature:    dc.cfg.LLMTemperature,
		ResponseFormat: &DeepSeekResponseFormat{Type: "json_object"},
	}

	jsonData, err := json.Marshal(requestData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(context.Background(), "POST", dc.baseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+dc.apiKey)

	resp, err := dc.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("DeepSeek API call failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("DeepSeek API error: %d, response: %s", resp.StatusCode, string(body))
	}

	var deepseekResp DeepSeekResponse
	if err := json.NewDecoder(resp.Body).Decode(&deepseekResp); err != nil {
		return nil, fmt.Errorf("failed to decode DeepSeek response: %w", err)
	}

	if len(deepseekResp.Choices) == 0 {
		return nil, fmt.Errorf("no response choices returned")
	}

	var llmResp LLMResponse
	if err := json.Unmarshal([]byte(deepseekResp.Choices[0].Message.Content), &llmResp); err != nil {
		return nil, fmt.Errorf("failed to parse LLM response: %w", err)
	}

	if err := dc.validateResponse(&llmResp); err != nil {
		return nil, fmt.Errorf("LLM response validation failed: %w", err)
	}

	return &llmResp, nil
}

func (dc *DeepSeekClient) buildPrompt(userState *game.UserState, recentActions []game.UserAction) string {
	prompt := fmt.Sprintf(`Analyze this user state and provide a satirical response.

Current State:
- Stage: %d
- Clicks: %d
- Engagement Rate: %.2f
- Previous Stage: %d
- Previous Clicks: %d

Recent Actions:`, 
		userState.Stage, userState.Clicks, userState.EngagementRate,
		userState.PreviousStage, userState.PreviousClicks)

	for i, action := range recentActions {
		prompt += fmt.Sprintf("\n%d. Stage: %d, Clicks: %d", i+1, action.Stage, action.Clicks)
	}

	prompt += `

Provide a JSON response with:
- message: Satirical/existential comment (max 200 chars, Chinese preferred)
- state_change: true if state should change
- new_state: one of "productive", "taking_break", "disengaged", "confused", "obsessed"
- urgency: "low", "medium", or "high"

Examples:
- High stage, low clicks: "哈？为什么不试试消费物品？"
- Confusing pattern: "???"
- Good progress: "Clicking. What an achievement."
`

	return prompt
}

func (dc *DeepSeekClient) validateResponse(response *LLMResponse) error {
	if response.Message == "" {
		return fmt.Errorf("message cannot be empty")
	}
	if len(response.Message) > 200 {
		return fmt.Errorf("message exceeds 200 characters")
	}
	if response.Urgency != "low" && response.Urgency != "medium" && response.Urgency != "high" {
		return fmt.Errorf("urgency must be low, medium, or high")
	}
	if response.StateChange && response.NewState != "" {
		validStates := map[string]bool{
			"productive":   true,
			"taking_break": true,
			"disengaged":   true,
			"confused":     true,
			"obsessed":     true,
		}
		if !validStates[response.NewState] {
			return fmt.Errorf("invalid new_state: %s", response.NewState)
		}
	}
	return nil
}

func (dc *DeepSeekClient) TestConnection() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	requestData := DeepSeekRequest{
		Model: dc.cfg.LLMModel,
		Messages: []DeepSeekMessage{
			{
				Role:    "user",
				Content: "Respond with a simple test message",
			},
		},
		Stream:    false,
		MaxTokens: 10,
	}

	jsonData, err := json.Marshal(requestData)
	if err != nil {
		return fmt.Errorf("failed to marshal test request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", dc.baseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create test request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+dc.apiKey)

	resp, err := dc.client.Do(req)
	if err != nil {
		return fmt.Errorf("connection test failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("connection test failed with status %d: %s", resp.StatusCode, string(body))
	}

	var deepseekResp DeepSeekResponse
	if err := json.NewDecoder(resp.Body).Decode(&deepseekResp); err != nil {
		return fmt.Errorf("failed to decode test response: %w", err)
	}

	if len(deepseekResp.Choices) == 0 {
		return fmt.Errorf("no response in connection test")
	}

	log.Printf("DeepSeek connection test successful: %s", deepseekResp.Choices[0].Message.Content)
	return nil
}