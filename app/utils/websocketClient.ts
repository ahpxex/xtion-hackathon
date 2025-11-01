const DEFAULT_WS_URL = "ws://localhost:8080/ws";

const ITEM_ID_MAP: Record<string, number> = {
  multiplier: 0,
  factory: 1,
  bonus: 2,
  "display-upgrade": 3,
  leaderboard: 4,
  "leaderboard-upgrade": 5,
  "button-upgrade": 6,
  penguin: 7,
  skeleton: 8,
  "stage-indicator": 9,
  "ai-panel": 10,
  rocket: 11,
};

const DEFAULT_ITEM_ID = 8;

export interface ServerMessage {
  type?: string;
  timestamp?: number;
  data?: {
    state?: string;
    message?: string;
    [key: string]: unknown;
  };
  message?: string;
  state?: string;
  [key: string]: unknown;
}

export interface PurchaseStatePayload {
  itemId: string;
  itemName?: string;
  pricePaid?: number;
  clickCount?: number;
  stage?: number;
  clickMultiplier?: number;
  currentLevel?: number | null;
  nextLevel?: number | null;
  repeatable?: boolean;
}

export interface UserActionPayload {
  stage: number;
  clicks: number;
}

type MessageListener = (message: ServerMessage) => void;

type OutgoingPayload = Record<string, unknown>;

const enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
}

class GameWebSocketClient {
  private socket: WebSocket | null = null;
  private isConnecting = false;
  private readonly listeners = new Set<MessageListener>();
  private reconnectTimeoutId: number | null = null;
  private retryAttempt = 0;
  private readonly queuedMessages: string[] = [];

  constructor(private readonly url: string) {}

  connect(): void {
    if (typeof window === "undefined") {
      return;
    }

    if (this.socket && this.socket.readyState === ReadyState.OPEN) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = new WebSocket(this.url);
    } catch (error) {
      console.error("Failed to initialize websocket", error);
      this.scheduleReconnect();
      this.isConnecting = false;
      return;
    }

    this.socket.addEventListener("open", () => {
      this.isConnecting = false;
      this.retryAttempt = 0;
      this.flushQueue();
    });

    this.socket.addEventListener("message", (event) => {
      let parsed: ServerMessage | null = null;
      try {
        parsed = JSON.parse(event.data as string) as ServerMessage;
      } catch (error) {
        console.error("Failed to parse websocket message", error, event.data);
        return;
      }

      this.listeners.forEach((listener) => {
        try {
          listener(parsed as ServerMessage);
        } catch (listenerError) {
          console.error("Game socket listener error", listenerError);
        }
      });
    });

    this.socket.addEventListener("close", () => {
      this.isConnecting = false;
      this.scheduleReconnect();
    });

    this.socket.addEventListener("error", (event) => {
      console.error("Websocket error", event);
      this.socket?.close();
    });
  }

  disconnect(): void {
    if (this.reconnectTimeoutId) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.retryAttempt = 0;
    this.isConnecting = false;

    if (this.socket && this.socket.readyState <= ReadyState.OPEN) {
      this.socket.close();
    }

    this.socket = null;
  }

  subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  send(payload: OutgoingPayload): void {
    const serialized = JSON.stringify(payload);

    if (this.socket?.readyState === ReadyState.OPEN) {
      this.socket.send(serialized);
      return;
    }

    this.queuedMessages.push(serialized);

    if (!this.socket || this.socket.readyState !== ReadyState.CONNECTING) {
      this.connect();
    }
  }

  private flushQueue(): void {
    while (this.queuedMessages.length > 0) {
      const message = this.queuedMessages.shift();
      if (!message || this.socket?.readyState !== ReadyState.OPEN) {
        if (message) {
          this.queuedMessages.unshift(message);
        }
        break;
      }
      this.socket.send(message);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId !== null) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.retryAttempt), 10000);
    this.retryAttempt += 1;

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.connect();
    }, delay);
  }
}

const socketUrl = process.env.NEXT_PUBLIC_WS_URL || DEFAULT_WS_URL;

const client = new GameWebSocketClient(socketUrl);

export function ensureGameSocketConnected(): void {
  client.connect();
}

export function subscribeToGameSocket(listener: MessageListener): () => void {
  ensureGameSocketConnected();
  return client.subscribe(listener);
}

export function disconnectGameSocket(): void {
  client.disconnect();
}

function resolveServerItemId(itemId: string): number {
  return ITEM_ID_MAP[itemId] ?? DEFAULT_ITEM_ID;
}

export function sendPurchaseEvent(payload: PurchaseStatePayload): void {
  const {
    itemId,
    itemName,
    pricePaid,
    clickCount,
    stage,
    clickMultiplier,
    currentLevel,
    nextLevel,
    repeatable,
  } = payload;

  const serverItemId = resolveServerItemId(itemId);

  client.send({
    type: "purchase",
    item_id: serverItemId,
    item_name: itemName,
    price_paid: pricePaid,
    click_count: clickCount,
    stage,
    click_multiplier: clickMultiplier,
    current_level: currentLevel,
    next_level: nextLevel,
    repeatable,
    original_item_id: itemId,
    timestamp: Math.floor(Date.now() / 1000),
  });
}

export function sendUserAction(payload: UserActionPayload): void {
  client.send({
    type: "user_action",
    stage: payload.stage,
    clicks: payload.clicks,
    timestamp: Math.floor(Date.now() / 1000),
  });
}
