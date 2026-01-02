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
- **One person home**: Gentle, occasional pulses (every ~20s)
- **Both people home**: More frequent pulses (every ~10s), slightly larger

Pulses grow from the center outward and fade, like ripples in still water. They are never sharp, never demanding.

The intensity of pulses (size and opacity) increases when both people are home, creating a subtle sense of fullness.

## Color Palette

The palette is muted and earthy. No pure whites, no saturated colors.

```css
/* Background */
--bg-day:      #d8d4cf;
--bg-twilight: #6b5a4f;
--bg-night:    #1a1a1f;

/* House Line */
--line-default:  #3a3a3a;
--line-night:    #5a5a60;

/* Presence */
--pulse-color:   rgba(180, 160, 140, 0.25);
--pulse-color-both: rgba(200, 180, 160, 0.35);
```

## Animation Principles

### Timing

All animations are slow:
- Minimum transition duration: 2 seconds
- State changes: 3-5 seconds
- Background transitions: 30-60 seconds
- Pulse duration: 8 seconds

### Easing

Use gentle easing functions:
- `ease-in-out` for most transitions
- Custom easing for organic effects

### Stillness

The default state is stillness. If no one is home, the display should be nearly static — just enough subtle life to avoid looking frozen (the slow background gradient shift provides this).

## Missing Data States

When data is unavailable:
- The house remains calm and complete
- No error indicators, no alerts
- Transitions out of missing data are gentle (5+ seconds)

## Screen Boundaries

The house sits centered with generous margins:
- Minimum 15% margin on all sides
- Never touch the edge of the screen
- The house should feel like it has room to breathe

On the 7" Pi display (800×480), the house drawing occupies roughly the center 70% of the screen.
