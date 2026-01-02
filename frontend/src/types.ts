/**
 * Type definitions for Domus
 * 
 * These types define the shape of data flowing through the application,
 * from Home Assistant entities to visual states.
 */

// =============================================================================
// Configuration
// =============================================================================

export interface DomusConfig {
  /** WebSocket URL for Home Assistant (e.g., ws://homeassistant.local:8123/api/websocket) */
  haUrl: string;
  /** Long-lived access token from Home Assistant */
  haToken: string;
}

// =============================================================================
// House States (derived from Home Assistant)
// =============================================================================

/** How many people are home */
export type ActivityState = 'empty' | 'one' | 'both';

/** Time of day state */
export type DayState = 'day' | 'twilight' | 'night';

/** Complete house state snapshot */
export interface HouseState {
  activity: ActivityState;
  dayState: DayState;
  
  /** Timestamp of last update */
  lastUpdated: number;
  
  /** Whether we have valid connection to HA */
  connected: boolean;
}

/** Default/neutral house state for initialization and fallback */
export const DEFAULT_HOUSE_STATE: HouseState = {
  activity: 'empty',
  dayState: 'day',
  lastUpdated: 0,
  connected: false,
};

// =============================================================================
// Home Assistant WebSocket Types
// =============================================================================

/** Base message structure for HA WebSocket */
export interface HAMessage {
  id?: number;
  type: string;
  [key: string]: unknown;
}

/** Authentication required message */
export interface HAAuthRequired {
  type: 'auth_required';
  ha_version: string;
}

/** Authentication response */
export interface HAAuthResponse {
  type: 'auth_ok' | 'auth_invalid';
  message?: string;
}

/** State changed event */
export interface HAStateChangedEvent {
  event_type: 'state_changed';
  data: {
    entity_id: string;
    old_state: HAEntityState | null;
    new_state: HAEntityState | null;
  };
}

/** Entity state from Home Assistant */
export interface HAEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

/** Result of get_states call */
export interface HAStatesResult {
  id: number;
  type: 'result';
  success: boolean;
  result: HAEntityState[];
}

/** Event subscription result */
export interface HAEventResult {
  id: number;
  type: 'event';
  event: HAStateChangedEvent;
}

// =============================================================================
// Renderer Types
// =============================================================================

/** A 2D point */
export interface Point {
  x: number;
  y: number;
}

/** A presence pulse animation */
export interface Pulse {
  id: string;
  center: Point;
  radius: number;
  maxRadius: number;
  opacity: number;
  startTime: number;
  duration: number;
}

// =============================================================================
// Transition Types
// =============================================================================

/** Easing functions */
export type EasingFunction = (t: number) => number;
