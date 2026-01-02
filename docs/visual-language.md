# Visual Language

## The House Drawing

The house is a single continuous SVG path — one line that never breaks, drawn as if with a calm, steady hand. This creates visual cohesion and a sense of intentionality.

The drawing is abstract enough to represent "home" without being literal enough to mismatch any specific architecture.

```
        ____
       /    \
      /      \
     /________\
    |          |
    |   ____   |
    |  |    |  |
    |__|    |__|
```

The line weight is consistent throughout. The stroke is slightly softened with rounded caps and joins.

## Visual Elements

### Background Gradient (Day/Night)

The background is never flat. It breathes with the time of day.

| State    | Background                                         |
|----------|---------------------------------------------------|
| Day      | Soft blue-grey gradient, lighter at top           |
| Twilight | Warm amber bleeding into deep blue                |
| Night    | Deep charcoal with subtle purple undertone        |

Transitions between states take 30-60 seconds. The eye barely notices the change happening.

### Presence Pulses

When someone is home, soft circular pulses emanate from within the house.

- **Empty**: No pulses, complete stillness
- **Quiet**: Rare, slow pulses (every 30s), low opacity
- **Active**: Gentle pulses (every 15s), moderate opacity  
- **Busy**: More frequent pulses (every 8s), slightly larger

Pulses grow from the center outward and fade, like ripples in still water. They are never sharp, never demanding.

### Energy Flow Particles

Tiny dots move along invisible paths to show energy flow.

- **Self-powered**: No particles, or occasional internal circulation
- **Mixed**: Slow particles drifting inward (import) or outward (export)
- **Grid-dependent**: Steady stream of particles flowing inward

Particles are small (2-3px), slow-moving, and low-opacity. They suggest flow rather than demand attention.

### Comfort Indicators

Temperature state is conveyed through subtle ambient effects.

| State   | Visual Effect                                        |
|---------|-----------------------------------------------------|
| Cold    | Slight blue tinge to house line                     |
| Cool    | Subtle cool undertone                               |
| Neutral | No additional effect                                |
| Warm    | Gentle amber glow from floor area                   |
| Hot     | Stronger amber glow, faint heat shimmer             |

The comfort effect is always the subtlest layer — it tints the mood without dominating.

## Color Palette

The palette is muted and earthy. No pure whites, no saturated colors.

```css
/* Background */
--bg-day:      #e8e4df;
--bg-twilight: #6b5a4f;
--bg-night:    #1a1a1f;

/* House Line */
--line-default:  #3a3a3a;
--line-night:    #5a5a60;

/* Presence */
--pulse-color:   rgba(180, 160, 140, 0.3);

/* Energy */
--particle-in:   rgba(100, 140, 180, 0.5);
--particle-out:  rgba(180, 140, 100, 0.5);

/* Comfort */
--comfort-cold:  rgba(140, 160, 180, 0.2);
--comfort-warm:  rgba(180, 140, 100, 0.3);
```

## Animation Principles

### Timing

All animations are slow:
- Minimum transition duration: 2 seconds
- State changes: 3-5 seconds
- Background transitions: 30-60 seconds
- Particle movement: 10-20 seconds per screen width

### Easing

Use gentle easing functions:
- `ease-in-out` for most transitions
- Linear for particle movement
- Custom easing for organic effects

### Stillness

The default state is stillness. If no state changes are happening, the display should be nearly static — just enough subtle breathing to avoid looking frozen.

## Missing Data States

When data is unavailable:
- Affected elements fade to neutral (50% opacity of neutral state)
- No error indicators, no alerts
- The house remains calm and complete
- Transitions out of missing data are gentle (5+ seconds)

## Screen Boundaries

The house sits centered with generous margins:
- Minimum 15% margin on all sides
- Never touch the edge of the screen
- The house should feel like it has room to breathe

On the 7" Pi display (800×480), the house drawing occupies roughly the center 70% of the screen.

