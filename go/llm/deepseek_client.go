package llm

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "log"
    "math/rand"
    "net/http"
    "regexp"
    "strings"
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
                Content: `你是一个存在主义游戏里的观察者，输出要严格遵循 JSON 字段 {"message","state_change","new_state","urgency"}。
对 "message" 的约束：
- 只输出一句话（中文优先），不要换行；
- 语气使用逆反（挑衅）或陪伴（温柔）来引导用户；
- 优先使用抽象的陈述句表达，尽量避免反问；如确有必要仅少量使用反问，不要依赖“吗/？/谁知道”等模板化表达；
- 直接称呼 "你"，避免技术词汇；
- 不要出现数字、点击、阶段、参与度等任何指标；
- 保持简短有力（≤120字），并且尽量多样化，不要重复固定句式；
- 当内部信号显示 clicks 与 stage 大致相等且都 > 1500 时，约 30% 概率在 message 中加入轻微购买诱导（例如“要不要试试商店里的东西？”），但仍不可出现任何数字或指标。`,
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

    // Sanitize message to avoid metric/technical terms and enforce single-sentence constraints
    dc.sanitizeLLMResponse(&llmResp)
    if err := dc.validateResponse(&llmResp); err != nil {
        // Fallback to safe, compliant message while keeping state fields
        log.Printf("LLM message failed validation, applying fallback: %v", err)
        llmResp.Message = dc.fallbackMessage()
        // Ensure urgency is valid in fallback
        if llmResp.Urgency != "low" && llmResp.Urgency != "medium" && llmResp.Urgency != "high" {
            llmResp.Urgency = "low"
        }
        // Final validation to guarantee compliance
        if vErr := dc.validateResponse(&llmResp); vErr != nil {
            return nil, fmt.Errorf("LLM response validation failed after fallback: %w", vErr)
        }
    }

    return &llmResp, nil
}

func (dc *DeepSeekClient) buildPrompt(userState *game.UserState, recentActions []game.UserAction) string {
    // Provide context and strict output constraints. Metrics are for reasoning only.
    prompt := fmt.Sprintf(`Context: The user is playing a minimalist, existential clicking game.

Task: Infer the user's mood/state from the context and produce ONE concise sentence that uses
reverse psychology or gentle companionship to nudge behavior.

Output JSON fields:
- message: one sentence, Chinese preferred, no numbers/clicks/stages/metrics.
- state_change: true only if the state should change.
- new_state: one of "productive", "taking_break", "disengaged", "confused", "obsessed".
- urgency: "low", "medium", or "high".

Internal signals (DO NOT mention in the message):
- Stage: %d
- Clicks: %d
- Engagement Rate: %.2f
- Previous Stage: %d
- Previous Clicks: %d

Recent Actions (for reasoning only):`, 
        userState.Stage, userState.Clicks, userState.EngagementRate,
        userState.PreviousStage, userState.PreviousClicks)

    for i, action := range recentActions {
        prompt += fmt.Sprintf("\n%d. Stage: %d, Clicks: %d", i+1, action.Stage, action.Clicks)
    }

    prompt += `

 Style requirements for "message":
 - Speak directly to "你"; keep it intimate or teasing.
 - Prefer abstract, declarative statements; use rhetorical questions only sparingly and avoid templated endings like "吗" or "？".
 - Use reverse psychology (挑衅) or companionship (陪伴) tone.
 - Be short, impactful, and avoid any numeric references.

 Purchase-nudge rule (do not reveal numbers in message):
 - If Stage and Clicks are roughly equal and both > 1500, you MAY choose to gently encourage a purchase with ~30% probability.
 - Example phrases (examples only, do not repeat verbatim): "要不要试试商店里的东西？", "不如买点什么让这世界动起来？"`

    return prompt
}

func (dc *DeepSeekClient) validateResponse(response *LLMResponse) error {
    if response.Message == "" {
        return fmt.Errorf("message cannot be empty")
    }
    // Enforce concise one-sentence and non-metric messaging per prompt constraints.
    if len(response.Message) > 120 {
        return fmt.Errorf("message exceeds 120 characters")
    }
    if strings.Contains(response.Message, "\n") {
        return fmt.Errorf("message should be a single sentence without newlines")
    }
    sepCount := strings.Count(response.Message, ".") +
        strings.Count(response.Message, "。") +
        strings.Count(response.Message, "?") +
        strings.Count(response.Message, "？") +
        strings.Count(response.Message, "!") +
        strings.Count(response.Message, "！")
    if sepCount > 1 {
        return fmt.Errorf("message should be exactly one sentence")
    }
    if regexp.MustCompile("[0-9]").MatchString(response.Message) {
        return fmt.Errorf("message should not include numeric references")
    }
    lower := strings.ToLower(response.Message)
    forbidden := []string{"click", "stage", "engagement", "rate", "点击", "阶段", "点击率", "参与度", "频率", "级别", "谁知道", "你似乎", "who knows"}
    for _, w := range forbidden {
        if strings.Contains(lower, w) {
            return fmt.Errorf("message should not mention metrics or technical terms")
        }
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

// sanitizeLLMResponse cleans up the message to avoid triggering validation failures
func (dc *DeepSeekClient) sanitizeLLMResponse(response *LLMResponse) {
    msg := response.Message
    if msg == "" {
        return
    }
    // Remove numeric references
    reDigits := regexp.MustCompile("[0-9]+")
    msg = reDigits.ReplaceAllString(msg, "")

    // Replace or remove metric/technical terms (both English and Chinese)
    replacements := map[string]string{
        "点击":   "动作",
        "阶段":   "进展",
        "点击率": "关注",
        "参与度": "热情",
        "频率":   "节奏",
        "级别":   "进展",
        "谁知道": "也许",
        "你似乎": "也许你",
    }
    for k, v := range replacements {
        msg = strings.ReplaceAll(msg, k, v)
    }
    // English terms case-insensitive
    reClick := regexp.MustCompile("(?i)\\bclicks?\\b")
    msg = reClick.ReplaceAllString(msg, "做这件事")
    reStage := regexp.MustCompile("(?i)\\bstage\\b")
    msg = reStage.ReplaceAllString(msg, "进展")
    reEngagement := regexp.MustCompile("(?i)\\bengagement\\b")
    msg = reEngagement.ReplaceAllString(msg, "热情")
    reRate := regexp.MustCompile("(?i)\\brate\\b")
    msg = reRate.ReplaceAllString(msg, "节奏")
    reWhoKnows := regexp.MustCompile("(?i)who knows")
    msg = reWhoKnows.ReplaceAllString(msg, "也许")

    // Ensure single-line and trim
    msg = strings.ReplaceAll(msg, "\n", " ")
    msg = strings.TrimSpace(msg)
    // Collapse multiple spaces
    msg = regexp.MustCompile("\\s+").ReplaceAllString(msg, " ")

    // Limit length to 120 chars
    if len([]rune(msg)) > 120 {
        // Truncate by runes to avoid breaking multibyte characters
        runes := []rune(msg)
        msg = string(runes[:120])
    }

    // If sanitization results in empty message, keep original intent with a safe fallback
    if msg == "" {
        msg = dc.fallbackMessage()
    }
    response.Message = msg
}

// fallbackMessage returns a compliant, non-metric, single-sentence Chinese line
func (dc *DeepSeekClient) fallbackMessage() string {
    phrases := []string{
        "你可以继续，也可以把注意力留给更重要的事。",
        "你在升级，也可以选择不被升级牵着走。",
        "你很会赢，也可以很会停。",
        "不必证明什么，你做你觉得重要的事。",
        "要不要把今天留给真正的事？",
        "你可以向前，也可以照顾好当下的自己。",
    }
    rand.Seed(time.Now().UnixNano())
    return phrases[rand.Intn(len(phrases))]
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