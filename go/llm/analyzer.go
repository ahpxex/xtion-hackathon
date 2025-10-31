package llm

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/ahpxex/xtion-hackathon/config"
	"github.com/ahpxex/xtion-hackathon/game"
)

type LLMResponse struct {
	Message     string `json:"message" validate:"required,max=200"`
	StateChange bool   `json:"state_change" validate:"required"`
	NewState    string `json:"new_state,omitempty" validate:"max=50"`
	Urgency     string `json:"urgency" validate:"required,oneof=low medium high"`
}

type AnalysisRequest struct {
	SessionID   string          `json:"session_id"`
	UserState   *game.UserState `json:"user_state"`
	RecentActions []game.UserAction `json:"recent_actions"`
	Timestamp   time.Time       `json:"timestamp"`
}

type AnalysisResult struct {
	SessionID    string       `json:"session_id"`
	Response     *LLMResponse `json:"response"`
	PreviousState string       `json:"previous_state"`
	StateChange  bool         `json:"state_change"`
	Timestamp    time.Time    `json:"timestamp"`
}

type StateAnalyzer struct {
	cfg          *config.Config
	client       *LLMClient
	analysisChan chan *AnalysisRequest
	resultChan   chan *AnalysisResult
	ticker       *time.Ticker
	stopChan     chan struct{}
	mu           sync.RWMutex
	running      bool
}

func NewStateAnalyzer(cfg *config.Config, client *LLMClient) *StateAnalyzer {
	return &StateAnalyzer{
		cfg:          cfg,
		client:       client,
		analysisChan: make(chan *AnalysisRequest, 100),
		resultChan:   make(chan *AnalysisResult, 100),
		stopChan:     make(chan struct{}),
	}
}

func (sa *StateAnalyzer) Start() {
	sa.mu.Lock()
	defer sa.mu.Unlock()

	if sa.running {
		return
	}

	sa.running = true
	sa.ticker = time.NewTicker(sa.cfg.AnalysisIntervalSeconds)

	go sa.analysisWorker()
	go sa.tickerWorker()

	log.Printf("State analyzer started with %s interval", sa.cfg.AnalysisIntervalSeconds)
}

func (sa *StateAnalyzer) Stop() {
	sa.mu.Lock()
	defer sa.mu.Unlock()

	if !sa.running {
		return
	}

	sa.running = false
	if sa.ticker != nil {
		sa.ticker.Stop()
	}
	close(sa.stopChan)

	log.Println("State analyzer stopped")
}

func (sa *StateAnalyzer) QueueAnalysis(req *AnalysisRequest) {
	select {
	case sa.analysisChan <- req:
	default:
		log.Printf("Analysis queue full for session %s, dropping request", req.SessionID)
	}
}

func (sa *StateAnalyzer) GetResults() <-chan *AnalysisResult {
	return sa.resultChan
}

func (sa *StateAnalyzer) tickerWorker() {
	for {
		select {
		case <-sa.ticker.C:
			sa.processPendingRequests()
		case <-sa.stopChan:
			return
		}
	}
}

func (sa *StateAnalyzer) processPendingRequests() {
	pending := make([]*AnalysisRequest, 0)
	
	for {
		select {
		case req := <-sa.analysisChan:
			pending = append(pending, req)
		default:
			if len(pending) == 0 {
				return
			}
			sa.analyzeRequests(pending)
			return
		}
	}
}

func (sa *StateAnalyzer) analyzeRequests(requests []*AnalysisRequest) {
	for _, req := range requests {
		go func(r *AnalysisRequest) {
			result, err := sa.analyzeUserState(r)
			if err != nil {
				log.Printf("Analysis failed for session %s: %v", r.SessionID, err)
				return
			}

			select {
			case sa.resultChan <- result:
			default:
				log.Printf("Result channel full, dropping analysis for session %s", result.SessionID)
			}
		}(req)
	}
}

func (sa *StateAnalyzer) analysisWorker() {
	for {
		select {
		case req := <-sa.analysisChan:
			go func(r *AnalysisRequest) {
				result, err := sa.analyzeUserState(r)
				if err != nil {
					log.Printf("Analysis failed for session %s: %v", r.SessionID, err)
					return
				}

				select {
				case sa.resultChan <- result:
				default:
					log.Printf("Result channel full, dropping analysis for session %s", result.SessionID)
				}
			}(req)
		case <-sa.stopChan:
			return
		}
	}
}

func (sa *StateAnalyzer) analyzeUserState(req *AnalysisRequest) (*AnalysisResult, error) {
	if req.UserState == nil {
		return nil, fmt.Errorf("user state is nil")
	}

	llmResp, err := sa.client.AnalyzeUserState(req.UserState, req.RecentActions)
	if err != nil {
		return nil, fmt.Errorf("LLM analysis failed: %w", err)
	}

	previousState := req.UserState.CurrentState
	stateChange := llmResp.StateChange
	if llmResp.NewState != "" {
		stateChange = true
	}

	result := &AnalysisResult{
		SessionID:    req.SessionID,
		Response:     llmResp,
		PreviousState: previousState,
		StateChange:  stateChange,
		Timestamp:    time.Now(),
	}

	return result, nil
}

func (sa *StateAnalyzer) buildPrompt(userState *game.UserState, recentActions []game.UserAction) string {
	prompt := fmt.Sprintf(`Analyze the following user state and provide a response in the specified JSON format.

Current State:
- Stage: %d
- Clicks: %d  
- Engagement Rate: %.2f
- Current State: %s

Recent Actions:
`, userState.Stage, userState.Clicks, userState.EngagementRate, userState.CurrentState)

	for i, action := range recentActions {
		prompt += fmt.Sprintf("%d. Stage: %d, Clicks: %d\n", 
			i+1, action.Stage, action.Clicks)
	}

	prompt += `
You are analyzing a user playing an existential clicking game. Your responses should be:
1. Satirical and questioning of instant gratification
2. Minimalist and thought-provoking  
3. Match the user's current engagement pattern

Possible states and response themes:
- "productive": User is actively clicking and progressing
- "taking_break": High stage but low click activity (e.g., "哈？为什么不试试消费物品？", "Huh? Why are you taking a break?")
- "disengaged": Low activity across both metrics (e.g., "?", "Still here?")
- "confused": Erratic or unclear patterns (e.g., "???", "What are you doing?")
- "obsessed": Excessive clicking relative to progress

Respond with a JSON object:
{
  "message": "Your satirical response (max 200 chars)",
  "state_change": true/false,
  "new_state": "state if changed",
  "urgency": "low/medium/high"
}

The message should be in Chinese or English, preferably Chinese if appropriate.
`

	return prompt
}

func (sa *StateAnalyzer) getResponseSchema() map[string]interface{} {
	return map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"message": map[string]interface{}{
				"type":      "string",
				"maxLength": 200,
			},
			"state_change": map[string]interface{}{
				"type": "boolean",
			},
			"new_state": map[string]interface{}{
				"type":      "string",
				"maxLength": 50,
			},
			"urgency": map[string]interface{}{
				"type": "string",
				"enum": []string{"low", "medium", "high"},
			},
		},
		"required": []string{"message", "state_change", "urgency"},
	}
}

func (sa *StateAnalyzer) ValidateResponse(response *LLMResponse) error {
	if response.Message == "" {
		return fmt.Errorf("message cannot be empty")
	}
	if len(response.Message) > 200 {
		return fmt.Errorf("message exceeds maximum length of 200 characters")
	}
	if response.Urgency != "low" && response.Urgency != "medium" && response.Urgency != "high" {
		return fmt.Errorf("urgency must be one of: low, medium, high")
	}
	return nil
}

func (sa *StateAnalyzer) IsRunning() bool {
	sa.mu.RLock()
	defer sa.mu.RUnlock()
	return sa.running
}