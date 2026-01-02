/**
 * Renderer
 * 
 * Draws the house and all visual effects. This is the heart of Domus.
 * 
 * The renderer:
 * - Draws the continuous-line house SVG
 * - Manages presence pulses
 * - Animates energy particles
 * - Applies comfort effects (floor glow, cold tint)
 * - Transitions background based on day state
 * 
 * All animations are slow and gentle. When nothing is changing,
 * the screen should feel nearly still.
 */

import type {
  HouseState,
  ActivityState,
  EnergyFlow,
  ComfortState,
  DayState,
  Point,
  Particle,
  Pulse,
} from './types';

import {
  NumericTransition,
  IntervalScheduler,
  DURATIONS,
  easeInOut,
  easeGentle,
} from './transitions';

// =============================================================================
// Constants
// =============================================================================

/** Canvas dimensions (matches viewBox) */
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;

/** House center point */
const HOUSE_CENTER: Point = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

/** Pulse intervals by activity state (ms) */
const PULSE_INTERVALS: Record<ActivityState, number> = {
  empty: Infinity,     // No pulses
  quiet: 30000,        // Every 30 seconds
  active: 15000,       // Every 15 seconds
  busy: 8000,          // Every 8 seconds
};

/** Particle spawn rate by energy flow */
const PARTICLE_RATES: Record<EnergyFlow, number> = {
  balanced: Infinity,   // No particles
  importing: 4000,      // One every 4 seconds
  exporting: 4000,      // One every 4 seconds
};

// =============================================================================
// Renderer Class
// =============================================================================

export class Renderer {
  // DOM Elements
  private background: HTMLElement;
  private houseLayer: SVGGElement;
  private presenceLayer: SVGGElement;
  private energyLayer: SVGGElement;
  private comfortLayer: SVGGElement;
  private connectionStatus: HTMLElement;
  
  // Visual State
  private particles: Particle[] = [];
  private pulses: Pulse[] = [];
  private particleIdCounter = 0;
  private pulseIdCounter = 0;
  
  // Transitions
  private comfortOpacity = new NumericTransition(0, DURATIONS.slow, easeGentle);
  
  // Schedulers
  private pulseScheduler: IntervalScheduler;
  private particleScheduler: IntervalScheduler;
  
  // Current state (for reference)
  private currentState: HouseState | null = null;
  private animationFrame: number | null = null;
  
  constructor() {
    // Get DOM elements
    this.background = document.getElementById('background')!;
    this.houseLayer = document.getElementById('house-layer') as unknown as SVGGElement;
    this.presenceLayer = document.getElementById('presence-layer') as unknown as SVGGElement;
    this.energyLayer = document.getElementById('energy-layer') as unknown as SVGGElement;
    this.comfortLayer = document.getElementById('comfort-layer') as unknown as SVGGElement;
    this.connectionStatus = document.getElementById('connection-status')!;
    
    // Initialize schedulers
    this.pulseScheduler = new IntervalScheduler(
      () => this.spawnPulse(),
      PULSE_INTERVALS.quiet
    );
    
    this.particleScheduler = new IntervalScheduler(
      () => this.spawnParticle(),
      PARTICLE_RATES.balanced
    );
    
    // Draw the house
    this.drawHouse();
    this.drawComfortOverlay();
  }
  
  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  
  /** Start the render loop */
  start(): void {
    this.pulseScheduler.start();
    this.particleScheduler.start();
    this.animate();
  }
  
  /** Stop the render loop */
  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.pulseScheduler.stop();
    this.particleScheduler.stop();
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
    
    // Update particle spawning (energy flow)
    if (!previousState || previousState.energyFlow !== state.energyFlow) {
      this.updateParticleRate(state.energyFlow);
    }
    
    // Update comfort overlay
    if (!previousState || previousState.comfort !== state.comfort) {
      this.updateComfort(state.comfort);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Animation Loop
  // ---------------------------------------------------------------------------
  
  private animate = (): void => {
    const now = performance.now();
    
    // Update schedulers
    this.pulseScheduler.tick(now);
    this.particleScheduler.tick(now);
    
    // Update and render particles
    this.updateParticles();
    this.renderParticles();
    
    // Update and render pulses
    this.updatePulses(now);
    this.renderPulses();
    
    // Update comfort overlay opacity
    this.updateComfortOverlay();
    
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
    // This creates a simple, iconic house shape
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
    // then add interior details while staying connected
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
      
      // Move to left window (lift pen conceptually, but we'll connect it)
      // Actually, let's add windows as separate elements for simplicity
    ].join(' ');
    
    // For the continuous line aesthetic, we include windows as part of the main structure
    // but connected via the walls
    
    return path;
  }
  
  private drawComfortOverlay(): void {
    // Create floor glow rectangle
    const floorGlow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    floorGlow.setAttribute('cx', String(HOUSE_CENTER.x));
    floorGlow.setAttribute('cy', String(HOUSE_CENTER.y + 100));
    floorGlow.setAttribute('rx', '180');
    floorGlow.setAttribute('ry', '40');
    floorGlow.setAttribute('class', 'floor-glow');
    floorGlow.setAttribute('fill', 'rgba(200, 150, 100, 0.3)');
    floorGlow.setAttribute('filter', 'url(#warm-glow)');
    
    this.comfortLayer.appendChild(floorGlow);
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
      maxRadius: 80 + Math.random() * 30,
      opacity: 0.35,
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
      pulse.opacity = 0.35 * (1 - eased);
      
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
  // Energy Particles
  // ---------------------------------------------------------------------------
  
  private updateParticleRate(energyFlow: EnergyFlow): void {
    const interval = PARTICLE_RATES[energyFlow];
    
    if (interval === Infinity) {
      this.particleScheduler.stop();
    } else {
      this.particleScheduler.setInterval(interval);
      this.particleScheduler.start();
    }
  }
  
  private spawnParticle(): void {
    if (!this.currentState) return;
    
    const isImporting = this.currentState.energyFlow === 'importing';
    
    // Particles flow from edge to center (import) or center to edge (export)
    let start: Point;
    let end: Point;
    
    if (isImporting) {
      // Start from right edge, flow to house
      start = {
        x: CANVAS_WIDTH + 10,
        y: HOUSE_CENTER.y + (Math.random() - 0.5) * 100,
      };
      end = {
        x: HOUSE_CENTER.x + 50,
        y: HOUSE_CENTER.y + (Math.random() - 0.5) * 60,
      };
    } else {
      // Start from house, flow to right edge (solar export)
      start = {
        x: HOUSE_CENTER.x + 50,
        y: HOUSE_CENTER.y - 40 + (Math.random() - 0.5) * 40,
      };
      end = {
        x: CANVAS_WIDTH + 10,
        y: HOUSE_CENTER.y + (Math.random() - 0.5) * 100,
      };
    }
    
    const duration = DURATIONS.particle + (Math.random() - 0.5) * 4000;
    
    const particle: Particle = {
      id: `particle-${++this.particleIdCounter}`,
      position: { ...start },
      velocity: {
        x: (end.x - start.x) / duration,
        y: (end.y - start.y) / duration,
      },
      opacity: 0,
      type: isImporting ? 'import' : 'export',
      age: 0,
      maxAge: duration,
    };
    
    this.particles.push(particle);
  }
  
  private updateParticles(): void {
    const deltaTime = 16; // Approximate frame time
    
    this.particles = this.particles.filter(particle => {
      particle.age += deltaTime;
      
      if (particle.age >= particle.maxAge) {
        return false; // Remove expired particle
      }
      
      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      
      // Fade in at start, fade out at end
      const progress = particle.age / particle.maxAge;
      if (progress < 0.1) {
        particle.opacity = progress / 0.1 * 0.6;
      } else if (progress > 0.9) {
        particle.opacity = (1 - progress) / 0.1 * 0.6;
      } else {
        particle.opacity = 0.6;
      }
      
      return true;
    });
  }
  
  private renderParticles(): void {
    // Clear and redraw all particles
    this.energyLayer.innerHTML = '';
    
    for (const particle of this.particles) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(particle.position.x));
      circle.setAttribute('cy', String(particle.position.y));
      circle.setAttribute('r', '3');
      
      const color = particle.type === 'import'
        ? `rgba(100, 140, 180, ${particle.opacity})`
        : `rgba(180, 160, 100, ${particle.opacity})`;
      
      circle.setAttribute('fill', color);
      
      this.energyLayer.appendChild(circle);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Comfort Effects
  // ---------------------------------------------------------------------------
  
  private updateComfort(comfort: ComfortState): void {
    // Determine target opacity based on comfort state
    let targetOpacity = 0;
    
    switch (comfort) {
      case 'cold':
      case 'cool':
        // Could add cold effect here, but for now just hide warm glow
        targetOpacity = 0;
        break;
      case 'neutral':
        targetOpacity = 0;
        break;
      case 'warm':
        targetOpacity = 0.5;
        break;
      case 'hot':
        targetOpacity = 0.8;
        break;
    }
    
    this.comfortOpacity.transitionTo(targetOpacity, DURATIONS.slow);
  }
  
  private updateComfortOverlay(): void {
    const opacity = this.comfortOpacity.getValue();
    this.comfortLayer.style.opacity = String(opacity);
    
    if (opacity > 0.01) {
      this.comfortLayer.classList.add('active');
    } else {
      this.comfortLayer.classList.remove('active');
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

