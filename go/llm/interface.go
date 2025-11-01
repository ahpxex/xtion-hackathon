package llm

import (
	"github.com/ahpxex/xtion-hackathon/game"
)

// LLMProvider interface defines the contract for LLM providers
type LLMProvider interface {
	AnalyzeUserState(userState *game.UserState, recentActions []game.UserAction) (*LLMResponse, error)
	TestConnection() error
}

// Ensure DeepSeekClient implements the LLMProvider interface
var _ LLMProvider = (*DeepSeekClient)(nil)