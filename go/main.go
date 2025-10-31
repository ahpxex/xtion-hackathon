package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ahpxex/xtion-hackathon/config"
	"github.com/ahpxex/xtion-hackathon/llm"
	"github.com/ahpxex/xtion-hackathon/storage"
	"github.com/ahpxex/xtion-hackathon/websocket"
)

type Application struct {
	cfg          *config.Config
	router       *gin.Engine
	server       *http.Server
	storage      *storage.MemoryStore
	llmClient    *llm.LLMClient
	analyzer     *llm.StateAnalyzer
	hub          *websocket.Hub
}

func NewApplication() (*Application, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load configuration: %w", err)
	}

	app := &Application{
		cfg: cfg,
	}

	if err := app.setupComponents(); err != nil {
		return nil, fmt.Errorf("failed to setup components: %w", err)
	}

	if err := app.setupRoutes(); err != nil {
		return nil, fmt.Errorf("failed to setup routes: %w", err)
	}

	return app, nil
}

func (app *Application) setupComponents() error {
	app.storage = storage.NewMemoryStore(app.cfg.HistoryWindowSize)

	app.llmClient = llm.NewLLMClient(app.cfg)
	
	if err := app.llmClient.TestConnection(); err != nil {
		log.Printf("Warning: LLM connection test failed: %v", err)
		log.Println("Server will continue, but LLM analysis may not work")
	}

	app.analyzer = llm.NewStateAnalyzer(app.cfg, app.llmClient)
	app.hub = websocket.NewHub(app.cfg, app.storage.GetStateManager(), app.analyzer)

	return nil
}

func (app *Application) setupRoutes() error {
	gin.SetMode(gin.ReleaseMode)
	app.router = gin.New()
	app.router.Use(gin.Recovery())
	app.router.Use(corsMiddleware())

	app.router.GET("/health", app.healthHandler)
	app.router.GET("/metrics", app.metricsHandler)
	app.router.GET("/ws", gin.WrapH(http.HandlerFunc(app.hub.HandleWebSocket)))

	return nil
}

func (app *Application) healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "ok",
		"timestamp": time.Now().UTC(),
		"version":   "1.0.0",
	})
}

func (app *Application) metricsHandler(c *gin.Context) {
	sessionStats := app.storage.GetSessionStats()
	hubMetrics := app.hub.GetMetrics()

	metrics := gin.H{
		"server": gin.H{
			"uptime":    time.Since(time.Now()).String(),
			"timestamp": time.Now().UTC(),
		},
		"sessions": sessionStats,
		"websocket": hubMetrics,
		"llm": gin.H{
			"analyzer_running": app.analyzer.IsRunning(),
			"analysis_interval": app.cfg.AnalysisIntervalSeconds.String(),
		},
	}

	c.JSON(http.StatusOK, metrics)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func (app *Application) Start() error {
	app.server = &http.Server{
		Addr:         fmt.Sprintf(":%d", app.cfg.ServerPort),
		Handler:      app.router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go app.hub.Run()
	go app.analyzer.Start()

	go func() {
		log.Printf("Starting server on port %d", app.cfg.ServerPort)
		log.Printf("WebSocket endpoint available at: ws://localhost:%d/ws", app.cfg.ServerPort)
		log.Printf("Health check endpoint: http://localhost:%d/health", app.cfg.ServerPort)
		log.Printf("Metrics endpoint: http://localhost:%d/metrics", app.cfg.ServerPort)
		
		if err := app.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	return nil
}

func (app *Application) Shutdown() error {
	log.Println("Shutting down application...")

	if app.analyzer != nil {
		app.analyzer.Stop()
		log.Println("State analyzer stopped")
	}

	if app.hub != nil {
		app.hub.CleanupInactiveSessions()
		log.Println("WebSocket hub cleaned up")
	}

	if app.storage != nil {
		app.storage.Stop()
		log.Println("Memory store stopped")
	}

	if app.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := app.server.Shutdown(ctx); err != nil {
			log.Printf("Server forced to shutdown: %v", err)
			return err
		}
		log.Println("HTTP server stopped")
	}

	log.Println("Application shutdown complete")
	return nil
}

func main() {
	app, err := NewApplication()
	if err != nil {
		log.Fatalf("Failed to create application: %v", err)
	}

	if err := app.Start(); err != nil {
		log.Fatalf("Failed to start application: %v", err)
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	if err := app.Shutdown(); err != nil {
		log.Printf("Error during shutdown: %v", err)
		os.Exit(1)
	}

	log.Println("Application exited gracefully")
}