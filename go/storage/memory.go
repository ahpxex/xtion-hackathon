package storage

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/ahpxex/xtion-hackathon/game"
)

type MemoryStore struct {
	sessions      map[string]*game.SessionData
	stateManager  *game.StateManager
	mu            sync.RWMutex
	cleanupTicker *time.Ticker
	stopCleanup   chan struct{}
}

func NewMemoryStore(historySize int) *MemoryStore {
	ms := &MemoryStore{
		sessions:     make(map[string]*game.SessionData),
		stateManager: game.NewStateManager(historySize),
		stopCleanup:  make(chan struct{}),
	}

	ms.startCleanupRoutine()
	return ms
}

func (ms *MemoryStore) GetStateManager() *game.StateManager {
	return ms.stateManager
}

func (ms *MemoryStore) CreateSession(sessionID string) *game.SessionData {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	session := ms.stateManager.CreateSession(sessionID)
	ms.sessions[sessionID] = session

	log.Printf("Created new session: %s (total: %d)", sessionID, len(ms.sessions))
	return session
}

func (ms *MemoryStore) GetSession(sessionID string) (*game.SessionData, bool) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	session, exists := ms.sessions[sessionID]
	return session, exists
}

func (ms *MemoryStore) UpdateSessionState(sessionID string, stage, clicks int) (*game.SessionData, error) {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	session, err := ms.stateManager.UpdateSessionState(sessionID, stage, clicks)
	if err != nil {
		return nil, err
	}

	if _, exists := ms.sessions[sessionID]; !exists {
		ms.sessions[sessionID] = session
	}

	return session, nil
}

func (ms *MemoryStore) AddSessionPurchase(sessionID string, itemID int) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	err := ms.stateManager.AddSessionPurchase(sessionID, itemID)
	if err != nil {
		return err
	}

	if session, exists := ms.sessions[sessionID]; exists {
		session.AddPurchase(itemID)
	}

	return nil
}

func (ms *MemoryStore) DeleteSession(sessionID string) {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	delete(ms.sessions, sessionID)
	ms.stateManager.DeleteSession(sessionID)

	log.Printf("Deleted session: %s (remaining: %d)", sessionID, len(ms.sessions))
}

func (ms *MemoryStore) ListSessions() map[string]*game.SessionData {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	sessions := make(map[string]*game.SessionData)
	for id, session := range ms.sessions {
		sessions[id] = session
	}

	return sessions
}

func (ms *MemoryStore) GetSessionCount() int {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	return len(ms.sessions)
}

func (ms *MemoryStore) GetActiveSessionsCount(timeout time.Duration) int {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	count := 0
	for _, session := range ms.sessions {
		if session.IsActive(timeout) {
			count++
		}
	}

	return count
}

func (ms *MemoryStore) CleanupInactiveSessions(timeout time.Duration) int {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	deleted := 0
	for sessionID, session := range ms.sessions {
		if !session.IsActive(timeout) {
			delete(ms.sessions, sessionID)
			ms.stateManager.DeleteSession(sessionID)
			deleted++
		}
	}

	if deleted > 0 {
		log.Printf("Cleaned up %d inactive sessions (remaining: %d)", deleted, len(ms.sessions))
	}

	return deleted
}

func (ms *MemoryStore) ExportSessionData(sessionID string) (map[string]interface{}, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	session, exists := ms.sessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("session %s not found", sessionID)
	}

	userState := session.GetUserState()

	data := map[string]interface{}{
		"session_id":      session.ID,
		"current_state":   session.CurrentState,
		"last_analysis":   session.LastAnalysis,
		"created_at":      session.CreatedAt,
		"last_activity":   session.LastActivity,
		"stage_history":   session.StageHistory,
		"clicks_history":  session.ClicksHistory,
		"item_purchases":  session.ItemPurchases,
		"llm_responses":   session.LLMResponses,
		"total_purchases": len(session.ItemPurchases),
		"total_responses": len(session.LLMResponses),
		"current_stage":   userState.Stage,
		"current_clicks":  userState.Clicks,
		"engagement_rate": userState.EngagementRate,
		"is_active":       session.IsActive(5 * time.Minute),
	}

	return data, nil
}

func (ms *MemoryStore) startCleanupRoutine() {
	ms.cleanupTicker = time.NewTicker(5 * time.Minute)

	go func() {
		for {
			select {
			case <-ms.cleanupTicker.C:
				timeout := 30 * time.Minute
				deleted := ms.CleanupInactiveSessions(timeout)
				if deleted > 0 {
					log.Printf("Automatic cleanup removed %d inactive sessions", deleted)
				}
			case <-ms.stopCleanup:
				ms.cleanupTicker.Stop()
				return
			}
		}
	}()
}

func (ms *MemoryStore) Stop() {
	close(ms.stopCleanup)
	if ms.cleanupTicker != nil {
		ms.cleanupTicker.Stop()
	}
	log.Println("Memory store cleanup stopped")
}

func (ms *MemoryStore) ClearAll() {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	sessionCount := len(ms.sessions)
	ms.sessions = make(map[string]*game.SessionData)
	ms.stateManager = game.NewStateManager(10)

	log.Printf("Cleared all %d sessions from memory store", sessionCount)
}
