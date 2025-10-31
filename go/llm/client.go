package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/ahpxex/xtion-hackathon/config"
	"github.com/ahpxex/xtion-hackathon/game"
	"github.com/sashabaranov/go-openai"
)

type LLMClient struct {
	client *openai.Client
	cfg    *config.Config
}

func NewLLMClient(cfg *config.Config) *LLMClient {
	client := openai.NewClient(cfg.OpenAIAPIKey)
	return &LLMClient{
		client: client,
		cfg:    cfg,
	}
}

func (lc *LLMClient) AnalyzeUserState(userState *game.UserState, recentActions []game.UserAction) (*LLMResponse, error) {
	if userState == nil {
		return nil, fmt.Errorf("user state is nil")
	}

	prompt := lc.buildPrompt(userState, recentActions)

	resp, err := lc.client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: lc.cfg.LLMModel,
			Messages: []openai.ChatCompletionMessage{
				{
					Role: openai.ChatMessageRoleSystem,
					Content: `You are analyzing a user playing an existential clicking game. 
Your responses should be satirical, questioning of instant gratification, and minimalist.
Provide responses in JSON format with the specified schema.`,
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			MaxTokens:   lc.cfg.LLMMaxTokens,
			Temperature: float32(lc.cfg.LLMTemperature),
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
		},
	)

	if err != nil {
		return nil, fmt.Errorf("OpenAI API call failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response choices returned")
	}

	var llmResp LLMResponse
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &llmResp); err != nil {
		return nil, fmt.Errorf("failed to parse LLM response: %w", err)
	}

	if err := lc.validateResponse(&llmResp); err != nil {
		return nil, fmt.Errorf("LLM response validation failed: %w", err)
	}

	return &llmResp, nil
}

func (lc *LLMClient) buildPrompt(userState *game.UserState, recentActions []game.UserAction) string {
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

func (lc *LLMClient) validateResponse(response *LLMResponse) error {
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

func (lc *LLMClient) TestConnection() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resp, err := lc.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: lc.cfg.LLMModel,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Respond with a simple test message",
				},
			},
			MaxTokens: 10,
		},
	)

	if err != nil {
		return fmt.Errorf("connection test failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return fmt.Errorf("no response in connection test")
	}

	log.Printf("LLM connection test successful: %s", resp.Choices[0].Message.Content)
	return nil
}
