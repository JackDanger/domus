/**
 * Transition System
 * 
 * Provides smooth interpolation between values over time.
 * All visual changes in Domus go through this system to ensure
 * calm, gradual transitions.
 * 
 * Key principles:
 * - Transitions are slow by default (seconds, not milliseconds)
 * - All easing is gentle (no bounce, no sharp changes)
 * - Interrupted transitions blend smoothly into new targets
 */

import type { EasingFunction } from './types';

// =============================================================================
// Easing Functions
// =============================================================================

/**
 * Standard ease-in-out for most transitions.
 * Gentle start and end, slightly faster in the middle.
 */
export const easeInOut: EasingFunction = (t: number): number => {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

/**
 * Linear interpolation (for particle movement).
 */
export const linear: EasingFunction = (t: number): number => t;

// =============================================================================
// Transition Durations (in milliseconds)
// =============================================================================

export const DURATIONS = {
  /** Fast transitions (state indicators) */
  fast: 1000,
  
  /** Normal transitions (most changes) */
  normal: 3000,
  
  /** Slow transitions */
  slow: 5000,
  
  /** Glacial transitions (background) */
  glacial: 30000,
  
  /** Pulse animation duration */
  pulse: 8000,
} as const;

// =============================================================================
// Scheduled Actions
// =============================================================================

/**
 * A simple scheduler for recurring visual events (pulses).
 * Provides randomized intervals for organic feel.
 */
export class IntervalScheduler {
  private callback: () => void;
  private baseInterval: number;
  private variance: number;
  private nextTime: number = 0;
  private active: boolean = false;
  
  constructor(
    callback: () => void,
    baseInterval: number,
    variance: number = 0.3
  ) {
    this.callback = callback;
    this.baseInterval = baseInterval;
    this.variance = variance;
  }
  
  /** Start the scheduler */
  start(): void {
    this.active = true;
    this.scheduleNext();
  }
  
  /** Stop the scheduler */
  stop(): void {
    this.active = false;
    this.nextTime = Infinity;
  }
  
  /** Update the interval timing */
  setInterval(baseInterval: number): void {
    this.baseInterval = baseInterval;
  }
  
  /** Check if it's time to trigger (call from animation loop) */
  tick(now: number): void {
    if (!this.active) return;
    
    if (now >= this.nextTime) {
      this.callback();
      this.scheduleNext();
    }
  }
  
  private scheduleNext(): void {
    // Add random variance for organic feel
    const variance = this.baseInterval * this.variance;
    const randomOffset = (Math.random() - 0.5) * 2 * variance;
    const interval = this.baseInterval + randomOffset;
    
    this.nextTime = performance.now() + interval;
  }
}
