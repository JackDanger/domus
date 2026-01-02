/**
 * Renderer
 * 
 * Draws the house and all visual effects. This is the heart of Domus.
 * 
 * The renderer:
 * - Draws the continuous-line house SVG
 * - Manages presence pulses based on who's home
 * - Transitions background based on day state
 * 
 * All animations are slow and gentle. When nothing is changing,
 * the screen should feel nearly still.
 */

import type {
  HouseState,
  ActivityState,
  DayState,
  Point,
  Pulse,
} from './types';

import {
  IntervalScheduler,
  DURATIONS,
  easeInOut,
} from './transitions';

// =============================================================================
// Constants
// =============================================================================

/** Canvas dimensions (matches viewBox) */
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;

/** House center point */
const HOUSE_CENTER: Point = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

/** 
 * Pulse intervals by activity state (ms)
 * empty = no pulses (house is still)
 * one = occasional pulses (someone is home)
 * both = more frequent pulses (household is active)
 */
const PULSE_INTERVALS: Record<ActivityState, number> = {
  empty: Infinity,     // No pulses when empty
  one: 20000,          // Every 20 seconds when one person home
  both: 10000,         // Every 10 seconds when both home
};

/** 
 * Pulse visual intensity by activity state
 * Controls max radius and opacity
 */
const PULSE_INTENSITY: Record<ActivityState, { maxRadius: number; opacity: number }> = {
  empty: { maxRadius: 0, opacity: 0 },
  one: { maxRadius: 70, opacity: 0.25 },
  both: { maxRadius: 90, opacity: 0.35 },
};

// =============================================================================
// Renderer Class
// =============================================================================

export class Renderer {
  // DOM Elements
  private background: HTMLElement;
  private houseLayer: SVGGElement;
  private presenceLayer: SVGGElement;
  private connectionStatus: HTMLElement;
  
  // Visual State
  private pulses: Pulse[] = [];
  private pulseIdCounter = 0;
  
  // Schedulers
  private pulseScheduler: IntervalScheduler;
  
  // Current state (for reference)
  private currentState: HouseState | null = null;
  private animationFrame: number | null = null;
  
  constructor() {
    // Get DOM elements
    this.background = document.getElementById('background')!;
    this.houseLayer = document.getElementById('house-layer') as unknown as SVGGElement;
    this.presenceLayer = document.getElementById('presence-layer') as unknown as SVGGElement;
    this.connectionStatus = document.getElementById('connection-status')!;
    
    // Initialize scheduler
    this.pulseScheduler = new IntervalScheduler(
      () => this.spawnPulse(),
      PULSE_INTERVALS.empty
    );
    
    // Draw the house
    this.drawHouse();
  }
  
  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  
  /** Start the render loop */
  start(): void {
    this.pulseScheduler.start();
    this.animate();
  }
  
  /** Stop the render loop */
  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.pulseScheduler.stop();
  }
  
  /** Update the visual state based on house state */
  update(state: HouseState): void {
    const previousState = this.currentState;
    this.currentState = state;
    
    // Update connection indicator
    this.updateConnectionStatus(state.connected);
    
    // Update background (day state)
    if (!previousState || previousState.dayState !== state.dayState) {
      this.updateBackground(state.dayState);
    }
    
    // Update pulse frequency (activity)
    if (!previousState || previousState.activity !== state.activity) {
      this.updatePulseRate(state.activity);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Animation Loop
  // ---------------------------------------------------------------------------
  
  private animate = (): void => {
    const now = performance.now();
    
    // Update scheduler
    this.pulseScheduler.tick(now);
    
    // Update and render pulses
    this.updatePulses(now);
    this.renderPulses();
    
    // Continue loop
    this.animationFrame = requestAnimationFrame(this.animate);
  };
  
  // ---------------------------------------------------------------------------
  // House Drawing
  // ---------------------------------------------------------------------------
  
  private drawHouse(): void {
    // Clear existing
    this.houseLayer.innerHTML = '';
    
    // The house is drawn as a single continuous path
    const housePath = this.createHousePath();
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', housePath);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    
    this.houseLayer.appendChild(path);
  }
  
  /**
   * Creates a continuous-line house path.
   * The path is designed to be drawn with a single stroke,
   * giving it a hand-drawn, intentional quality.
   */
  private createHousePath(): string {
    // House dimensions (centered at HOUSE_CENTER)
    const width = 280;
    const height = 180;
    const roofHeight = 90;
    
    // Calculate key points
    const left = HOUSE_CENTER.x - width / 2;
    const right = HOUSE_CENTER.x + width / 2;
    const top = HOUSE_CENTER.y - height / 2 - roofHeight;
    const roofBase = HOUSE_CENTER.y - height / 2;
    const bottom = HOUSE_CENTER.y + height / 2;
    
    // Door dimensions
    const doorWidth = 50;
    const doorHeight = 80;
    const doorLeft = HOUSE_CENTER.x - doorWidth / 2;
    const doorRight = HOUSE_CENTER.x + doorWidth / 2;
    
    // Build the path as one continuous line
    // Start from bottom-left, go up to roof peak, down to bottom-right,
    // then trace the door
    const path = [
      // Start at bottom-left corner
      `M ${left} ${bottom}`,
      
      // Up the left wall
      `L ${left} ${roofBase}`,
      
      // Up to roof peak
      `L ${HOUSE_CENTER.x} ${top}`,
      
      // Down to right wall
      `L ${right} ${roofBase}`,
      
      // Down the right wall
      `L ${right} ${bottom}`,
      
      // Along the bottom to door right
      `L ${doorRight} ${bottom}`,
      
      // Up the door right side
      `L ${doorRight} ${bottom - doorHeight}`,
      
      // Across door top
      `L ${doorLeft} ${bottom - doorHeight}`,
      
      // Down door left side
      `L ${doorLeft} ${bottom}`,
      
      // Continue along bottom to start
      `L ${left} ${bottom}`,
    ].join(' ');
    
    return path;
  }
  
  // ---------------------------------------------------------------------------
  // Background Updates
  // ---------------------------------------------------------------------------
  
  private updateBackground(dayState: DayState): void {
    // Remove all state classes
    this.background.classList.remove('day', 'twilight', 'night');
    
    // Add new state class
    this.background.classList.add(dayState);
    
    // Also update document body for global styles
    document.body.classList.remove('day', 'twilight', 'night');
    document.body.classList.add(dayState);
  }
  
  // ---------------------------------------------------------------------------
  // Presence Pulses
  // ---------------------------------------------------------------------------
  
  private updatePulseRate(activity: ActivityState): void {
    const interval = PULSE_INTERVALS[activity];
    
    if (interval === Infinity) {
      this.pulseScheduler.stop();
    } else {
      this.pulseScheduler.setInterval(interval);
      this.pulseScheduler.start();
    }
  }
  
  private spawnPulse(): void {
    if (!this.currentState) return;
    
    const intensity = PULSE_INTENSITY[this.currentState.activity];
    if (intensity.maxRadius === 0) return;
    
    // Create pulse at house center with slight random offset
    const offset = {
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 40,
    };
    
    const pulse: Pulse = {
      id: `pulse-${++this.pulseIdCounter}`,
      center: {
        x: HOUSE_CENTER.x + offset.x,
        y: HOUSE_CENTER.y + offset.y + 20, // Slightly lower, inside house
      },
      radius: 20,
      maxRadius: intensity.maxRadius + Math.random() * 20,
      opacity: intensity.opacity,
      startTime: performance.now(),
      duration: DURATIONS.pulse,
    };
    
    this.pulses.push(pulse);
  }
  
  private updatePulses(now: number): void {
    // Update each pulse and remove completed ones
    this.pulses = this.pulses.filter(pulse => {
      const elapsed = now - pulse.startTime;
      const progress = elapsed / pulse.duration;
      
      if (progress >= 1) {
        return false; // Remove completed pulse
      }
      
      // Update radius and opacity
      const eased = easeInOut(progress);
      pulse.radius = 20 + (pulse.maxRadius - 20) * eased;
      pulse.opacity = pulse.opacity * (1 - eased);
      
      return true;
    });
  }
  
  private renderPulses(): void {
    // Clear and redraw all pulses
    this.presenceLayer.innerHTML = '';
    
    for (const pulse of this.pulses) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(pulse.center.x));
      circle.setAttribute('cy', String(pulse.center.y));
      circle.setAttribute('r', String(pulse.radius));
      circle.setAttribute('fill', `rgba(180, 160, 140, ${pulse.opacity})`);
      circle.setAttribute('filter', 'url(#glow)');
      
      this.presenceLayer.appendChild(circle);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Connection Status
  // ---------------------------------------------------------------------------
  
  private updateConnectionStatus(connected: boolean): void {
    if (connected) {
      this.connectionStatus.classList.add('hidden');
    } else {
      this.connectionStatus.classList.remove('hidden');
    }
  }
}
