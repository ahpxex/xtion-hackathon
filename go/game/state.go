package game

import (
	"fmt"
	"sync"
	"time"
)

type GameState struct {
	Stage  int `json:"stage"`
	Clicks int `json:"clicks"`
}

type UserAction struct {
	Stage     int       `json:"stage"`
	Clicks    int       `json:"clicks"`
	Timestamp time.Time `json:"timestamp"`
}

type SessionData struct {
	ID            string    `json:"session_id"`
	CurrentState  string    `json:"current_state"`
	LastAnalysis  time.Time `json:"last_analysis"`
	StageHistory  []int     `json:"stage_history"`
	ClicksHistory []int     `json:"clicks_history"`
	ItemPurchases []int     `json:"item_purchases"`
	LLMResponses  []string  `json:"llm_responses"`
	CreatedAt     time.Time `json:"created_at"`
	LastActivity  time.Time `json:"last_activity"`
	historySize   int
	mu            sync.RWMutex
}

type UserState struct {
	CurrentState   string    `json:"current_state"`
	LastChange     time.Time `json:"last_change"`
	Stage          int       `json:"stage"`
	Clicks         int       `json:"clicks"`
	PreviousStage  int       `json:"previous_stage"`
	PreviousClicks int       `json:"previous_clicks"`
	EngagementRate float64   `json:"engagement_rate"`
}

func NewSessionData(sessionID string, historySize int) *SessionData {
	now := time.Now()
	return &SessionData{
		ID:            sessionID,
		CurrentState:  "new",
		LastAnalysis:  now,
		StageHistory:  make([]int, 0, historySize),
		ClicksHistory: make([]int, 0, historySize),
		ItemPurchases: make([]int, 0),
		LLMResponses:  make([]string, 0),
		CreatedAt:     now,
		LastActivity:  now,
		historySize:   historySize,
	}
}

func (sd *SessionData) UpdateState(stage, clicks int) {
	sd.mu.Lock()
	defer sd.mu.Unlock()

	sd.StageHistory = append(sd.StageHistory, stage)
	sd.ClicksHistory = append(sd.ClicksHistory, clicks)
	sd.LastActivity = time.Now()

	if len(sd.StageHistory) > sd.historySize {
		sd.StageHistory = sd.StageHistory[1:]
		sd.ClicksHistory = sd.ClicksHistory[1:]
	}
}

func (sd *SessionData) AddPurchase(itemID int) {
	sd.mu.Lock()
	defer sd.mu.Unlock()

	sd.ItemPurchases = append(sd.ItemPurchases, itemID)
	sd.LastActivity = time.Now()
}

func (sd *SessionData) AddLLMResponse(response string) {
	sd.mu.Lock()
	defer sd.mu.Unlock()

	sd.LLMResponses = append(sd.LLMResponses, response)
	sd.CurrentState = "analyzed"
	sd.LastAnalysis = time.Now()
}

func (sd *SessionData) UpdateCurrentState(state string) {
	sd.mu.Lock()
	defer sd.mu.Unlock()

	sd.CurrentState = state
	sd.LastActivity = time.Now()
}

func (sd *SessionData) GetUserState() *UserState {
	sd.mu.RLock()
	defer sd.mu.RUnlock()

	state := &UserState{
		CurrentState:   sd.CurrentState,
		LastChange:     sd.LastAnalysis,
		Stage:          0,
		Clicks:         0,
		PreviousStage:  0,
		PreviousClicks: 0,
		EngagementRate: 0.0,
	}

	historyLen := len(sd.StageHistory)
	if historyLen > 0 {
		state.Stage = sd.StageHistory[historyLen-1]
		state.Clicks = sd.ClicksHistory[historyLen-1]
	}

	if historyLen > 1 {
		state.PreviousStage = sd.StageHistory[historyLen-2]
		state.PreviousClicks = sd.ClicksHistory[historyLen-2]
		stageChange := float64(state.Stage - state.PreviousStage)
		clicksChange := float64(state.Clicks - state.PreviousClicks)

		if stageChange > 0 {
			state.EngagementRate = clicksChange / stageChange
		}
	}

	return state
}

func (sd *SessionData) GetRecentActions(limit int) []UserAction {
	sd.mu.RLock()
	defer sd.mu.RUnlock()

	count := len(sd.StageHistory)
	if count == 0 {
		return []UserAction{}
	}

	if limit > count {
		limit = count
	}

	actions := make([]UserAction, limit)
	start := count - limit

	for i := 0; i < limit; i++ {
		actions[i] = UserAction{
			Stage:     sd.StageHistory[start+i],
			Clicks:    sd.ClicksHistory[start+i],
			Timestamp: time.Now().Add(-time.Duration(limit-i) * time.Second),
		}
	}

	return actions
}

func (sd *SessionData) IsActive(timeout time.Duration) bool {
	sd.mu.RLock()
	defer sd.mu.RUnlock()

	return time.Since(sd.LastActivity) < timeout
}

type StateManager struct {
	sessions    map[string]*SessionData
	mu          sync.RWMutex
	historySize int
}

func NewStateManager(historySize int) *StateManager {
	return &StateManager{
		sessions:    make(map[string]*SessionData),
		historySize: historySize,
	}
}

func (sm *StateManager) CreateSession(sessionID string) *SessionData {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	session := NewSessionData(sessionID, sm.historySize)
	sm.sessions[sessionID] = session
	return session
}

func (sm *StateManager) GetSession(sessionID string) (*SessionData, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	session, exists := sm.sessions[sessionID]
	return session, exists
}

func (sm *StateManager) DeleteSession(sessionID string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	delete(sm.sessions, sessionID)
}

func (sm *StateManager) UpdateSessionState(sessionID string, stage, clicks int) (*SessionData, error) {
	session, exists := sm.GetSession(sessionID)
	if !exists {
		return nil, fmt.Errorf("session %s not found", sessionID)
	}

	session.UpdateState(stage, clicks)
	return session, nil
}

func (sm *StateManager) AddSessionPurchase(sessionID string, itemID int) error {
	session, exists := sm.GetSession(sessionID)
	if !exists {
		return fmt.Errorf("session %s not found", sessionID)
	}

	session.AddPurchase(itemID)
	return nil
}

func (sm *StateManager) CleanupInactiveSessions(timeout time.Duration) int {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	deleted := 0
	for sessionID, session := range sm.sessions {
		if !session.IsActive(timeout) {
			delete(sm.sessions, sessionID)
			deleted++
		}
	}

	return deleted
}
