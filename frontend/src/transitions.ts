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
 * Very gentle ease for long transitions.
 * Almost linear but with soft edges.
 */
export const easeGentle: EasingFunction = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
  
  /** Slow transitions (comfort effects) */
  slow: 5000,
  
  /** Glacial transitions (background) */
  glacial: 30000,
  
  /** Pulse animation duration */
  pulse: 8000,
  
  /** Particle lifetime */
  particle: 15000,
} as const;

// =============================================================================
// Numeric Transition
// =============================================================================

export class NumericTransition {
  private from: number;
  private to: number;
  private startTime: number;
  private duration: number;
  private easing: EasingFunction;
  
  constructor(
    initialValue: number,
    duration: number = DURATIONS.normal,
    easing: EasingFunction = easeInOut
  ) {
    this.from = initialValue;
    this.to = initialValue;
    this.startTime = 0;
    this.duration = duration;
    this.easing = easing;
  }
  
  /** Start transitioning to a new value */
  transitionTo(target: number, duration?: number): void {
    // Start from current interpolated value for smooth blending
    this.from = this.getValue();
    this.to = target;
    this.startTime = performance.now();
    
    if (duration !== undefined) {
      this.duration = duration;
    }
  }
  
  /** Get the current interpolated value */
  getValue(): number {
    if (this.startTime === 0) {
      return this.to;
    }
    
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const eased = this.easing(progress);
    
    return this.from + (this.to - this.from) * eased;
  }
  
  /** Check if transition is complete */
  isComplete(): boolean {
    if (this.startTime === 0) {
      return true;
    }
    return performance.now() - this.startTime >= this.duration;
  }
  
  /** Get the target value */
  getTarget(): number {
    return this.to;
  }
  
  /** Instantly set to a value (skip transition) */
  setImmediate(value: number): void {
    this.from = value;
    this.to = value;
    this.startTime = 0;
  }
}

// =============================================================================
// Color Transition
// =============================================================================

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface RGBA extends RGB {
  a: number;
}

export class ColorTransition {
  private from: RGBA;
  private to: RGBA;
  private startTime: number;
  private duration: number;
  private easing: EasingFunction;
  
  constructor(
    initialColor: string,
    duration: number = DURATIONS.normal,
    easing: EasingFunction = easeInOut
  ) {
    const parsed = parseColor(initialColor);
    this.from = parsed;
    this.to = parsed;
    this.startTime = 0;
    this.duration = duration;
    this.easing = easing;
  }
  
  /** Start transitioning to a new color */
  transitionTo(target: string, duration?: number): void {
    this.from = this.getCurrentRGBA();
    this.to = parseColor(target);
    this.startTime = performance.now();
    
    if (duration !== undefined) {
      this.duration = duration;
    }
  }
  
  /** Get the current interpolated color as CSS string */
  getValue(): string {
    const current = this.getCurrentRGBA();
    
    if (current.a < 1) {
      return `rgba(${Math.round(current.r)}, ${Math.round(current.g)}, ${Math.round(current.b)}, ${current.a.toFixed(3)})`;
    }
    return `rgb(${Math.round(current.r)}, ${Math.round(current.g)}, ${Math.round(current.b)})`;
  }
  
  /** Get current RGBA values */
  private getCurrentRGBA(): RGBA {
    if (this.startTime === 0) {
      return { ...this.to };
    }
    
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const eased = this.easing(progress);
    
    return {
      r: this.from.r + (this.to.r - this.from.r) * eased,
      g: this.from.g + (this.to.g - this.from.g) * eased,
      b: this.from.b + (this.to.b - this.from.b) * eased,
      a: this.from.a + (this.to.a - this.from.a) * eased,
    };
  }
  
  /** Check if transition is complete */
  isComplete(): boolean {
    if (this.startTime === 0) {
      return true;
    }
    return performance.now() - this.startTime >= this.duration;
  }
}

// =============================================================================
// Color Parsing Utilities
// =============================================================================

function parseColor(color: string): RGBA {
  // Handle rgba()
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  
  // Handle hex colors
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
      a: 1,
    };
  }
  
  // Handle short hex
  const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return {
      r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
      g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
      b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
      a: 1,
    };
  }
  
  // Fallback to neutral gray
  console.warn(`[ColorTransition] Could not parse color: ${color}`);
  return { r: 128, g: 128, b: 128, a: 1 };
}

// =============================================================================
// Scheduled Actions
// =============================================================================

/**
 * A simple scheduler for recurring visual events (pulses, particles).
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

