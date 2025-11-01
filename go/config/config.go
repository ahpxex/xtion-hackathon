package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/go-playground/validator/v10"
)

type Config struct {
	ServerPort                 int           `validate:"required,min=1,max=65535"`
	OpenAIAPIKey               string        `validate:"required"`
	LLMModel                   string        `validate:"required"`
	LLMMaxTokens               int           `validate:"required,min=1,max=4096"`
	LLMTemperature             float64       `validate:"required,min=0,max=2"`
	RateLimitRequestsPerMinute int           `validate:"required,min=1,max=60"`
	AnalysisIntervalSeconds    time.Duration `validate:"required,min=1s,max=1m"`
	StageMaxValue              int           `validate:"required,min=1"`
	ClicksMaxValue             int           `validate:"required,min=1"`
	HistoryWindowSize          int           `validate:"required,min=5,max=50"`
}

var validate = validator.New()

func Load() (*Config, error) {
	cfg := &Config{
		ServerPort:                 getEnvInt("SERVER_PORT", 8080),
		OpenAIAPIKey:               getEnvString("DEEPSEEK_API_KEY", "sk-5882e9e6a74349b9b0598a5ad1814e6c"),
		LLMModel:                   getEnvString("LLM_MODEL", "deepseek-chat"),
		LLMMaxTokens:               getEnvInt("LLM_MAX_TOKENS", 150),
		LLMTemperature:             getEnvFloat("LLM_TEMPERATURE", 0.7),
		RateLimitRequestsPerMinute: getEnvInt("RATE_LIMIT_REQUESTS_PER_MINUTE", 6),
		AnalysisIntervalSeconds:    time.Duration(getEnvInt("ANALYSIS_INTERVAL_SECONDS", 10)) * time.Second,
		StageMaxValue:              getEnvInt("STAGE_MAX_VALUE", 3000),
		ClicksMaxValue:             getEnvInt("CLICKS_MAX_VALUE", 10000),
		HistoryWindowSize:          getEnvInt("HISTORY_WINDOW_SIZE", 10),
	}

	if err := validate.Struct(cfg); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return cfg, nil
}

func getEnvString(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvFloat(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatValue, err := strconv.ParseFloat(value, 64); err == nil {
			return floatValue
		}
	}
	return defaultValue
}
