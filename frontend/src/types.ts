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

/** Overall activity level in the home */
export type ActivityState = 'empty' | 'quiet' | 'active' | 'busy';

/** Energy independence state */
export type EnergyState = 'self_powered' | 'mixed' | 'grid_dependent';

/** Direction of energy flow */
export type EnergyFlow = 'importing' | 'exporting' | 'balanced';

/** Indoor comfort feeling */
export type ComfortState = 'cold' | 'cool' | 'neutral' | 'warm' | 'hot';

/** Time of day state */
export type DayState = 'day' | 'twilight' | 'night';

/** Complete house state snapshot */
export interface HouseState {
  activity: ActivityState;
  energy: EnergyState;
  energyFlow: EnergyFlow;
  comfort: ComfortState;
  dayState: DayState;
  
  /** Timestamp of last update */
  lastUpdated: number;
  
  /** Whether we have valid connection to HA */
  connected: boolean;
}

/** Default/neutral house state for initialization and fallback */
export const DEFAULT_HOUSE_STATE: HouseState = {
  activity: 'quiet',
  energy: 'mixed',
  energyFlow: 'balanced',
  comfort: 'neutral',
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

/** An animated particle for energy visualization */
export interface Particle {
  id: string;
  position: Point;
  velocity: Point;
  opacity: number;
  type: 'import' | 'export' | 'internal';
  age: number;
  maxAge: number;
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

/** Current visual state being rendered */
export interface VisualState {
  /** Current background state */
  background: DayState;
  
  /** Active particles */
  particles: Particle[];
  
  /** Active pulses */
  pulses: Pulse[];
  
  /** Comfort overlay opacity and type */
  comfort: {
    type: 'none' | 'cold' | 'warm' | 'hot';
    opacity: number;
  };
  
  /** House line color (interpolated) */
  lineColor: string;
}

// =============================================================================
// Transition Types
// =============================================================================

/** An ongoing transition between values */
export interface Transition<T> {
  from: T;
  to: T;
  startTime: number;
  duration: number;
  easing: (t: number) => number;
}

/** Easing functions */
export type EasingFunction = (t: number) => number;

