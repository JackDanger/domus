# Philosophy

Domus is not a dashboard. It is a window.

## Principles

### 1. State Over Metrics

A home is not a collection of numbers. It has a *feeling*.

We don't show "72°F" — we show warmth emanating from the floor. We don't show "85% battery" — we show the house breathing on its own power. The goal is emotional truth, not numerical precision.

### 2. Calm Technology

Domus should reduce cognitive load, not add to it.

- Motion happens slowly, over seconds
- Changes are interpolated, never jarring
- When nothing is happening, nothing moves
- The default state is peaceful stillness

This is based on the idea that ambient technology should *inform* without *demanding*. A good ambient display is like a houseplant — you're aware of it, it changes slowly, and you only really notice it when something is different.

### 3. Graceful Degradation

Data will be missing. Sensors will go offline. Networks will fail.

When this happens:
- Missing data fades to neutral, never to error states
- No red alerts, no warning icons, no error messages
- The house simply becomes more still, more quiet
- If everything fails, you see a peaceful house at rest

### 4. Dumb Frontend

All logic lives in Home Assistant. The frontend is a pure renderer.

This means:
- Template sensors in HA compute derived states
- The frontend reads pre-computed values like `house_energy_state`
- No business logic in TypeScript
- Changes to logic require only HA config updates, not code deploys

### 5. Longevity Over Features

This should run unchanged for 5+ years.

- Vanilla TypeScript, minimal dependencies
- No build system churn (simple, stable tooling)
- No framework lock-in
- No network requests beyond Home Assistant
- No analytics, no telemetry, no external services

### 6. Restraint

When in doubt, don't.

- Don't animate unless meaning changes
- Don't add features unless they serve calm
- Don't optimize unless there's a real problem
- Don't abstract unless there's duplication

## Influences

- **Calm Technology** by Amber Case
- **The Humane Interface** by Jef Raskin
- **Designing Calm Technology** by Amber Case (book)
- **Disappearing Computer** concept by Mark Weiser
- **Slow Media Manifesto** by Benedikt Köhler et al.

## Aesthetic Goals

Domus should feel like:
- A hearth, not a control panel
- A breath, not a heartbeat
- A painting, not a TV

It should blend into a home office or living room and become part of the architecture rather than demanding attention.

