/**
 * Home Assistant WebSocket Client
 * 
 * Manages connection to Home Assistant, handles authentication,
 * subscribes to state changes, and provides reconnection logic
 * with exponential backoff.
 * 
 * This client is intentionally simple and focused:
 * - Read-only access to entity states
 * - Automatic reconnection on failure
 * - No caching or local storage
 * - Events for connection state and state changes
 */

import type {
  DomusConfig,
  HAMessage,
  HAEntityState,
  HAAuthRequired,
  HAAuthResponse,
  HAStatesResult,
  HAEventResult,
} from './types';

// =============================================================================
// Types
// =============================================================================

type ConnectionState = 'disconnected' | 'connecting' | 'authenticating' | 'connected';

interface HAClientEvents {
  /** Called when connection state changes */
  onConnectionChange: (state: ConnectionState) => void;
  
  /** Called when entity state changes */
  onStateChange: (entityId: string, state: HAEntityState) => void;
  
  /** Called when initial states are loaded */
  onStatesLoaded: (states: Map<string, HAEntityState>) => void;
  
  /** Called on error */
  onError: (error: Error) => void;
}

// =============================================================================
// Constants
// =============================================================================

/** Base delay for reconnection (ms) */
const BASE_RECONNECT_DELAY = 1000;

/** Maximum delay between reconnection attempts (ms) */
const MAX_RECONNECT_DELAY = 60000;

/** Entities we care about - only subscribe to these */
const WATCHED_ENTITIES = [
  'sensor.house_activity_state',
  'sensor.house_day_state',
];

// =============================================================================
// HAClient Class
// =============================================================================

export class HAClient {
  private config: DomusConfig;
  private events: Partial<HAClientEvents>;
  private ws: WebSocket | null = null;
  private messageId = 0;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private pendingRequests: Map<number, (result: unknown) => void> = new Map();
  
  constructor(config: DomusConfig, events: Partial<HAClientEvents> = {}) {
    this.config = config;
    this.events = events;
  }
  
  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  
  /** Start the connection (will auto-reconnect on failure) */
  connect(): void {
    if (this.connectionState !== 'disconnected') {
      return;
    }
    this.attemptConnection();
  }
  
  /** Gracefully disconnect */
  disconnect(): void {
    this.clearReconnectTimeout();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState('disconnected');
  }
  
  /** Get current connection state */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  // ---------------------------------------------------------------------------
  // Connection Logic
  // ---------------------------------------------------------------------------
  
  private attemptConnection(): void {
    this.setConnectionState('connecting');
    
    try {
      this.ws = new WebSocket(this.config.haUrl);
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (event) => this.handleError(event);
      this.ws.onclose = () => this.handleClose();
    } catch (error) {
      this.handleConnectionFailure(error as Error);
    }
  }
  
  private handleOpen(): void {
    // Connection opened, waiting for auth_required message
    this.setConnectionState('authenticating');
  }
  
  private handleMessage(event: MessageEvent): void {
    let message: HAMessage;
    
    try {
      message = JSON.parse(event.data as string);
    } catch {
      console.error('[HAClient] Failed to parse message:', event.data);
      return;
    }
    
    // Route message based on type
    switch (message.type) {
      case 'auth_required':
        this.handleAuthRequired(message as unknown as HAAuthRequired);
        break;
        
      case 'auth_ok':
        this.handleAuthOk();
        break;
        
      case 'auth_invalid':
        this.handleAuthInvalid(message as unknown as HAAuthResponse);
        break;
        
      case 'result':
        this.handleResult(message as unknown as HAStatesResult);
        break;
        
      case 'event':
        this.handleEvent(message as unknown as HAEventResult);
        break;
        
      default:
        // Ignore unrecognized message types
        break;
    }
  }
  
  private handleError(_event: Event): void {
    // WebSocket errors are followed by close, so we handle it there
    console.error('[HAClient] WebSocket error');
  }
  
  private handleClose(): void {
    this.ws = null;
    this.pendingRequests.clear();
    
    if (this.connectionState !== 'disconnected') {
      this.scheduleReconnect();
    }
  }
  
  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------
  
  private handleAuthRequired(_msg: HAAuthRequired): void {
    // Send authentication
    this.sendRaw({
      type: 'auth',
      access_token: this.config.haToken,
    });
  }
  
  private handleAuthOk(): void {
    this.setConnectionState('connected');
    this.reconnectAttempts = 0;
    
    // Subscribe to state changes and get initial states
    this.subscribeToStateChanges();
    this.fetchInitialStates();
  }
  
  private handleAuthInvalid(msg: HAAuthResponse): void {
    const error = new Error(`Authentication failed: ${msg.message || 'invalid token'}`);
    this.events.onError?.(error);
    
    // Don't reconnect on auth failure - token is invalid
    this.disconnect();
  }
  
  // ---------------------------------------------------------------------------
  // State Subscriptions
  // ---------------------------------------------------------------------------
  
  private subscribeToStateChanges(): void {
    const id = this.nextMessageId();
    
    this.send({
      id,
      type: 'subscribe_events',
      event_type: 'state_changed',
    });
  }
  
  private async fetchInitialStates(): Promise<void> {
    const id = this.nextMessageId();
    
    this.send({
      id,
      type: 'get_states',
    });
    
    // Result will be handled in handleResult
    this.pendingRequests.set(id, (result: unknown) => {
      const states = result as HAEntityState[];
      const stateMap = new Map<string, HAEntityState>();
      
      for (const state of states) {
        // Only keep entities we care about
        if (WATCHED_ENTITIES.includes(state.entity_id)) {
          stateMap.set(state.entity_id, state);
        }
      }
      
      this.events.onStatesLoaded?.(stateMap);
    });
  }
  
  private handleResult(msg: HAStatesResult): void {
    const handler = this.pendingRequests.get(msg.id);
    if (handler) {
      this.pendingRequests.delete(msg.id);
      handler(msg.result);
    }
  }
  
  private handleEvent(msg: HAEventResult): void {
    const { entity_id, new_state } = msg.event.data;
    
    // Only process entities we care about
    if (!WATCHED_ENTITIES.includes(entity_id)) {
      return;
    }
    
    if (new_state) {
      this.events.onStateChange?.(entity_id, new_state);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Reconnection Logic
  // ---------------------------------------------------------------------------
  
  private scheduleReconnect(): void {
    this.setConnectionState('disconnected');
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY
    );
    
    console.log(`[HAClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.attemptConnection();
    }, delay);
  }
  
  private handleConnectionFailure(error: Error): void {
    console.error('[HAClient] Connection failed:', error);
    this.events.onError?.(error);
    this.scheduleReconnect();
  }
  
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------
  
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.events.onConnectionChange?.(state);
    }
  }
  
  private nextMessageId(): number {
    return ++this.messageId;
  }
  
  private send(message: HAMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  private sendRaw(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

