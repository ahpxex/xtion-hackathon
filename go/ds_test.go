package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"testing"
	"time"
)

// DeepSeek API 请求结构
type DeepSeekRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// DeepSeek API 响应结构
type DeepSeekResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// 测试DeepSeek API连通性
func TestDeepSeekConnectivity(t *testing.T) {
	// 获取API密钥
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey == "" {
		apiKey = "sk-5882e9e6a74349b9b0598a5ad1814e6c"
	}

	// 准备请求数据
	requestData := DeepSeekRequest{
		Model: "deepseek-chat",
		Messages: []Message{
			{
				Role:    "user",
				Content: "请简单回复'连接成功'以确认API连通性",
			},
		},
		Stream: false,
	}

	// 序列化请求数据
	jsonData, err := json.Marshal(requestData)
	if err != nil {
		t.Fatalf("请求数据序列化失败: %v", err)
	}

	// 创建HTTP客户端
	client := &http.Client{Timeout: 30 * time.Second}

	// 创建HTTP请求
	req, err := http.NewRequest("POST", "https://api.deepseek.com/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		t.Fatalf("创建HTTP请求失败: %v", err)
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// 发送请求
	startTime := time.Now()
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("API请求失败: %v", err)
	}
	defer resp.Body.Close()

	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var response DeepSeekResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		t.Fatalf("响应解析失败: %v", err)
	}

	// 检查响应内容
	if len(response.Choices) == 0 || response.Choices[0].Message.Content == "" {
		t.Fatal("API返回空响应")
	}

	// 计算响应时间
	responseTime := time.Since(startTime)

	// 输出测试结果
	t.Logf("✅ DeepSeek API连通性测试成功!")
	t.Logf("响应时间: %v", responseTime)
	t.Logf("API回复: %s", response.Choices[0].Message.Content)
}
