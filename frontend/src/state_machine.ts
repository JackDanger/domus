/**
 * State Machine
 * 
 * Maps Home Assistant entity states to Domus house states.
 * This is intentionally simple because the real logic lives in
 * Home Assistant's template sensors.
 * 
 * The state machine:
 * - Maintains the current house state
 * - Validates incoming states
 * - Falls back to neutral values when data is missing
 * - Notifies listeners when state changes
 */

import type {
  HouseState,
  ActivityState,
  EnergyState,
  EnergyFlow,
  ComfortState,
  DayState,
  HAEntityState,
} from './types';

import { DEFAULT_HOUSE_STATE } from './types';

// =============================================================================
// Types
// =============================================================================

type StateChangeListener = (newState: HouseState, previousState: HouseState) => void;

// =============================================================================
// Valid State Values
// =============================================================================

const VALID_ACTIVITY: ActivityState[] = ['empty', 'quiet', 'active', 'busy'];
const VALID_ENERGY: EnergyState[] = ['self_powered', 'mixed', 'grid_dependent'];
const VALID_ENERGY_FLOW: EnergyFlow[] = ['importing', 'exporting', 'balanced'];
const VALID_COMFORT: ComfortState[] = ['cold', 'cool', 'neutral', 'warm', 'hot'];
const VALID_DAY: DayState[] = ['day', 'twilight', 'night'];

// =============================================================================
// State Machine Class
// =============================================================================

export class StateMachine {
  private currentState: HouseState;
  private listeners: Set<StateChangeListener> = new Set();
  
  constructor() {
    this.currentState = { ...DEFAULT_HOUSE_STATE };
  }
  
  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  
  /** Get the current house state */
  getState(): Readonly<HouseState> {
    return this.currentState;
  }
  
  /** Subscribe to state changes */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /** Update connection status */
  setConnected(connected: boolean): void {
    if (this.currentState.connected !== connected) {
      this.updateState({ connected });
    }
  }
  
  /** Process initial states from Home Assistant */
  loadInitialStates(states: Map<string, HAEntityState>): void {
    const updates: Partial<HouseState> = {
      lastUpdated: Date.now(),
    };
    
    for (const [entityId, state] of states) {
      Object.assign(updates, this.parseEntityState(entityId, state));
    }
    
    this.updateState(updates);
  }
  
  /** Process a state change from Home Assistant */
  handleStateChange(entityId: string, state: HAEntityState): void {
    const updates = this.parseEntityState(entityId, state);
    
    if (Object.keys(updates).length > 0) {
      updates.lastUpdated = Date.now();
      this.updateState(updates);
    }
  }
  
  // ---------------------------------------------------------------------------
  // State Parsing
  // ---------------------------------------------------------------------------
  
  private parseEntityState(entityId: string, state: HAEntityState): Partial<HouseState> {
    const value = state.state;
    
    switch (entityId) {
      case 'sensor.house_activity_state':
        return this.parseActivity(value);
        
      case 'sensor.house_energy_state':
        return this.parseEnergy(value);
        
      case 'sensor.house_energy_flow':
        return this.parseEnergyFlow(value);
        
      case 'sensor.house_comfort_state':
        return this.parseComfort(value);
        
      case 'sensor.house_day_state':
        return this.parseDayState(value);
        
      default:
        return {};
    }
  }
  
  private parseActivity(value: string): Partial<HouseState> {
    if (isValidActivity(value)) {
      return { activity: value };
    }
    console.warn(`[StateMachine] Invalid activity state: ${value}`);
    return {};
  }
  
  private parseEnergy(value: string): Partial<HouseState> {
    if (isValidEnergy(value)) {
      return { energy: value };
    }
    console.warn(`[StateMachine] Invalid energy state: ${value}`);
    return {};
  }
  
  private parseEnergyFlow(value: string): Partial<HouseState> {
    if (isValidEnergyFlow(value)) {
      return { energyFlow: value };
    }
    console.warn(`[StateMachine] Invalid energy flow: ${value}`);
    return {};
  }
  
  private parseComfort(value: string): Partial<HouseState> {
    if (isValidComfort(value)) {
      return { comfort: value };
    }
    console.warn(`[StateMachine] Invalid comfort state: ${value}`);
    return {};
  }
  
  private parseDayState(value: string): Partial<HouseState> {
    if (isValidDayState(value)) {
      return { dayState: value };
    }
    console.warn(`[StateMachine] Invalid day state: ${value}`);
    return {};
  }
  
  // ---------------------------------------------------------------------------
  // State Updates
  // ---------------------------------------------------------------------------
  
  private updateState(updates: Partial<HouseState>): void {
    const previousState = this.currentState;
    
    this.currentState = {
      ...this.currentState,
      ...updates,
    };
    
    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(this.currentState, previousState);
      } catch (error) {
        console.error('[StateMachine] Listener error:', error);
      }
    }
  }
}

// =============================================================================
// Type Guards
// =============================================================================

function isValidActivity(value: string): value is ActivityState {
  return VALID_ACTIVITY.includes(value as ActivityState);
}

function isValidEnergy(value: string): value is EnergyState {
  return VALID_ENERGY.includes(value as EnergyState);
}

function isValidEnergyFlow(value: string): value is EnergyFlow {
  return VALID_ENERGY_FLOW.includes(value as EnergyFlow);
}

function isValidComfort(value: string): value is ComfortState {
  return VALID_COMFORT.includes(value as ComfortState);
}

function isValidDayState(value: string): value is DayState {
  return VALID_DAY.includes(value as DayState);
}

