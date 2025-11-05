const DEFAULT_WS_PORT = 8080;
const DEFAULT_WS_PATH = "/ws";

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parsePort(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const normalized = Math.floor(parsed);
  if (normalized <= 0 || normalized > 65535) {
    return undefined;
  }

  return normalized;
}

function sanitizePath(rawPath?: string): string {
  if (!rawPath) {
    return DEFAULT_WS_PATH;
  }

  const trimmed = rawPath.trim();
  if (!trimmed) {
    return DEFAULT_WS_PATH;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function formatHost(host: string, port: number | null): string {
  const trimmedHost = host.trim();
  const needsBrackets = trimmedHost.includes(":") && !trimmedHost.startsWith("[");
  const normalizedHost = needsBrackets ? `[${trimmedHost}]` : trimmedHost;

  if (port === null) {
    return normalizedHost;
  }

  return `${normalizedHost}:${port}`;
}

function determineProtocols(): string[] {
  const explicitProtocol = readEnv("NEXT_PUBLIC_WS_PROTOCOL");
  if (explicitProtocol) {
    const normalized = explicitProtocol.toLowerCase();
    if (normalized === "ws" || normalized === "wss") {
      return [normalized];
    }
  }

  const secureOverride = readEnv("NEXT_PUBLIC_WS_SECURE");
  if (secureOverride) {
    const normalized = secureOverride.toLowerCase();
    if (normalized === "true") {
      return ["wss"];
    }
    if (normalized === "false") {
      return ["ws"];
    }
  }

  const allowInsecureFallback =
    (readEnv("NEXT_PUBLIC_WS_INSECURE_FALLBACK") ?? "").toLowerCase() === "true";

  const isSecureOrigin =
    typeof window !== "undefined" && window.location.protocol === "https:";

  if (isSecureOrigin) {
    return allowInsecureFallback ? ["wss", "ws"] : ["wss"];
  }

  return ["ws"];
}

function resolveWebSocketCandidates(): string[] {
  const explicitUrl = readEnv("NEXT_PUBLIC_WS_URL");
  if (explicitUrl) {
    return [explicitUrl];
  }

  const path = sanitizePath(readEnv("NEXT_PUBLIC_WS_PATH"));

  if (typeof window === "undefined") {
    return [`ws://localhost:${DEFAULT_WS_PORT}${path}`];
  }

  const urls: string[] = [];
  const protocols = determineProtocols();

  const hostCandidates: string[] = [];
  const envHost = readEnv("NEXT_PUBLIC_WS_HOST");
  if (envHost) {
    hostCandidates.push(envHost);
  }
  if (window.location.hostname) {
    hostCandidates.push(window.location.hostname);
  }
  if (!hostCandidates.length) {
    hostCandidates.push("localhost");
  }
  const uniqueHosts = hostCandidates.filter(
    (value, index) => hostCandidates.indexOf(value) === index,
  );

  const portCandidates: Array<number | null> = [];
  const envPort = parsePort(readEnv("NEXT_PUBLIC_WS_PORT"));
  if (envPort !== undefined) {
    portCandidates.push(envPort);
  }
  portCandidates.push(DEFAULT_WS_PORT);

  const locationPort = parsePort(window.location.port || undefined);
  if (locationPort !== undefined) {
    portCandidates.push(locationPort);
  }
  portCandidates.push(null);

  const uniquePorts = portCandidates.filter(
    (value, index) => portCandidates.indexOf(value) === index,
  );

  protocols.forEach((protocol) => {
    uniqueHosts.forEach((host) => {
      uniquePorts.forEach((port) => {
        const url = `${protocol}://${formatHost(host, port)}${path}`;
        if (!urls.includes(url)) {
          urls.push(url);
        }
      });
    });
  });

  return urls;
}

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
  private candidateUrls: string[] = [];
  private candidateCursor = 0;
  private lastAttemptHadOpen = false;
  private lastSuccessfulUrl: string | null = null;
  private manualDisconnect = false;
  private candidateSignature = "";

  constructor(private readonly candidateResolver: () => string[]) {}

  connect(): void {
    if (typeof window === "undefined") {
      return;
    }

    const existingReadyState = this.socket?.readyState;
    if (existingReadyState === ReadyState.OPEN || existingReadyState === ReadyState.CONNECTING) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.refreshCandidates();
    if (!this.candidateUrls.length) {
      console.warn("GameWebSocketClient: no WebSocket endpoints resolved");
      return;
    }

    const targetIndex = this.candidateCursor % this.candidateUrls.length;
    const targetUrl = this.candidateUrls[targetIndex];

    this.isConnecting = true;
    this.lastAttemptHadOpen = false;
    this.manualDisconnect = false;

    let socket: WebSocket;
    try {
      socket = new WebSocket(targetUrl);
    } catch (error) {
      console.error(`Failed to initialize websocket for ${targetUrl}`, error);
      this.isConnecting = false;
      this.scheduleReconnect(true);
      return;
    }

    this.socket = socket;

    socket.addEventListener("open", () => {
      this.isConnecting = false;
      this.retryAttempt = 0;
      this.lastAttemptHadOpen = true;
      this.lastSuccessfulUrl = targetUrl;
      this.candidateCursor = this.candidateUrls.indexOf(targetUrl);
      this.flushQueue();
    });

    socket.addEventListener("message", (event) => {
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

    socket.addEventListener("close", () => {
      this.handleSocketClosure(!this.lastAttemptHadOpen);
    });

    socket.addEventListener("error", (event) => {
      console.error(`Websocket error (${targetUrl})`, event);
      this.handleSocketClosure(!this.lastAttemptHadOpen);
    });
  }

  disconnect(): void {
    if (typeof window === "undefined") {
      return;
    }

    if (this.reconnectTimeoutId) {
      window.clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    this.retryAttempt = 0;
    this.isConnecting = false;
    this.manualDisconnect = true;

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

  private handleSocketClosure(advanceCandidate: boolean): void {
    this.isConnecting = false;

    this.socket = null;

    if (this.manualDisconnect) {
      this.manualDisconnect = false;
      return;
    }

    this.scheduleReconnect(advanceCandidate);
  }

  private scheduleReconnect(advanceCandidate: boolean): void {
    if (this.reconnectTimeoutId !== null) {
      return;
    }

    if (advanceCandidate) {
      this.advanceCandidateCursor();
    }

    const delay = Math.min(1000 * Math.pow(2, this.retryAttempt), 10000);
    this.retryAttempt += 1;

    this.reconnectTimeoutId = window.setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.connect();
    }, delay);
  }

  private advanceCandidateCursor(): void {
    if (!this.candidateUrls.length) {
      this.refreshCandidates();
    }

    if (!this.candidateUrls.length) {
      return;
    }

    this.candidateCursor = (this.candidateCursor + 1) % this.candidateUrls.length;
  }

  private refreshCandidates(): void {
    const nextCandidates = this.candidateResolver();
    const signature = nextCandidates.join("||");

    if (signature === this.candidateSignature) {
      return;
    }

    this.candidateUrls = nextCandidates;
    this.candidateSignature = signature;

    if (this.lastSuccessfulUrl) {
      const index = this.candidateUrls.indexOf(this.lastSuccessfulUrl);
      this.candidateCursor = index >= 0 ? index : 0;
    } else {
      this.candidateCursor = 0;
    }
  }
}

const client = new GameWebSocketClient(resolveWebSocketCandidates);

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
