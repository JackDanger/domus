/**
 * Domus - Main Entry Point
 * 
 * This is the orchestration layer that connects:
 * - Home Assistant WebSocket client
 * - State machine
 * - Renderer
 * 
 * It initializes all components and wires them together.
 * The application is intentionally simple: connect, listen, render.
 */

import type { DomusConfig, HAEntityState } from './types';
import { HAClient } from './ha_client';
import { StateMachine } from './state_machine';
import { Renderer } from './renderer';

// =============================================================================
// Configuration
// =============================================================================

declare global {
  interface Window {
    DOMUS_CONFIG?: DomusConfig;
  }
}

function getConfig(): DomusConfig {
  if (window.DOMUS_CONFIG) {
    return window.DOMUS_CONFIG;
  }
  
  // Fallback for development - show helpful error
  console.error(
    '[Domus] No configuration found. Create frontend/config.js with:\n\n' +
    'window.DOMUS_CONFIG = {\n' +
    '  haUrl: "ws://homeassistant.local:8123/api/websocket",\n' +
    '  haToken: "your-token-here"\n' +
    '};'
  );
  
  // Return dummy config for demo mode
  return {
    haUrl: '',
    haToken: '',
  };
}

// =============================================================================
// Application
// =============================================================================

class Domus {
  private config: DomusConfig;
  private client: HAClient | null = null;
  private stateMachine: StateMachine;
  private renderer: Renderer;
  private demoMode: boolean = false;
  
  constructor() {
    this.config = getConfig();
    this.stateMachine = new StateMachine();
    this.renderer = new Renderer();
    
    // Check if we're in demo mode (no config)
    if (!this.config.haUrl || !this.config.haToken) {
      this.demoMode = true;
      console.log('[Domus] Running in demo mode (no HA connection)');
    }
  }
  
  /** Start the application */
  start(): void {
    console.log('[Domus] Starting...');
    
    // Subscribe renderer to state changes
    this.stateMachine.subscribe((state) => {
      this.renderer.update(state);
    });
    
    // Start the renderer
    this.renderer.start();
    
    if (this.demoMode) {
      this.startDemoMode();
    } else {
      this.connectToHomeAssistant();
    }
  }
  
  /** Connect to Home Assistant */
  private connectToHomeAssistant(): void {
    this.client = new HAClient(this.config, {
      onConnectionChange: (state) => {
        console.log(`[Domus] Connection: ${state}`);
        this.stateMachine.setConnected(state === 'connected');
      },
      
      onStatesLoaded: (states: Map<string, HAEntityState>) => {
        console.log(`[Domus] Loaded ${states.size} states`);
        this.stateMachine.loadInitialStates(states);
      },
      
      onStateChange: (entityId: string, state: HAEntityState) => {
        console.log(`[Domus] State change: ${entityId} = ${state.state}`);
        this.stateMachine.handleStateChange(entityId, state);
      },
      
      onError: (error: Error) => {
        console.error('[Domus] Error:', error.message);
      },
    });
    
    this.client.connect();
  }
  
  /** Run demo mode with cycling states */
  private startDemoMode(): void {
    // Set initial demo state
    const demoStates = new Map<string, HAEntityState>([
      ['sensor.house_activity_state', createDemoEntity('sensor.house_activity_state', 'quiet')],
      ['sensor.house_energy_state', createDemoEntity('sensor.house_energy_state', 'self_powered')],
      ['sensor.house_energy_flow', createDemoEntity('sensor.house_energy_flow', 'balanced')],
      ['sensor.house_comfort_state', createDemoEntity('sensor.house_comfort_state', 'neutral')],
      ['sensor.house_day_state', createDemoEntity('sensor.house_day_state', 'day')],
    ]);
    
    this.stateMachine.setConnected(true);
    this.stateMachine.loadInitialStates(demoStates);
    
    // Cycle through states for demonstration
    let demoIndex = 0;
    const demoSequence = [
      { entity: 'sensor.house_day_state', state: 'twilight' },
      { entity: 'sensor.house_activity_state', state: 'active' },
      { entity: 'sensor.house_energy_flow', state: 'exporting' },
      { entity: 'sensor.house_comfort_state', state: 'warm' },
      { entity: 'sensor.house_day_state', state: 'night' },
      { entity: 'sensor.house_activity_state', state: 'quiet' },
      { entity: 'sensor.house_energy_flow', state: 'importing' },
      { entity: 'sensor.house_energy_state', state: 'grid_dependent' },
      { entity: 'sensor.house_day_state', state: 'day' },
      { entity: 'sensor.house_activity_state', state: 'busy' },
      { entity: 'sensor.house_energy_state', state: 'self_powered' },
      { entity: 'sensor.house_energy_flow', state: 'balanced' },
      { entity: 'sensor.house_comfort_state', state: 'neutral' },
      { entity: 'sensor.house_activity_state', state: 'empty' },
    ];
    
    setInterval(() => {
      const change = demoSequence[demoIndex];
      this.stateMachine.handleStateChange(
        change.entity,
        createDemoEntity(change.entity, change.state)
      );
      
      demoIndex = (demoIndex + 1) % demoSequence.length;
    }, 10000); // Change every 10 seconds
  }
}

// =============================================================================
// Helpers
// =============================================================================

function createDemoEntity(entityId: string, state: string): HAEntityState {
  return {
    entity_id: entityId,
    state: state,
    attributes: {},
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

// =============================================================================
// Bootstrap
// =============================================================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new Domus();
    app.start();
  });
} else {
  const app = new Domus();
  app.start();
}

