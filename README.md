# Domus

A calm, ambient home display for Raspberry Pi.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## What This Is

Domus is a fullscreen kiosk application that visualizes your home's *state* as a living, breathing organism. It connects to Home Assistant and renders a single continuous line drawing of a house that subtly shifts based on:

- **Presence** — Who is home, and where activity is detected
- **Energy** — Whether you're self-powered, importing, or exporting
- **Comfort** — The feeling of the indoor climate
- **Time** — Day, night, and twilight transitions

There are no numbers. No charts. No scrolling text. Just a calm visual that you can glance at and *feel* the state of your home.

## What This Is NOT

- ❌ A dashboard
- ❌ A monitoring system
- ❌ A data visualization tool
- ❌ A notification center
- ❌ An interactive application

Domus is meant to disappear into your home. If you find yourself staring at it, something is wrong.

## Philosophy

See [docs/philosophy.md](docs/philosophy.md) for the design principles behind Domus.

## Requirements

- Raspberry Pi (3B+ or newer recommended)
- 7-inch LCD display (official Raspberry Pi display works well)
- Home Assistant instance with WebSocket API access
- Long-lived access token from Home Assistant

## Quick Start

### 1. Configure Home Assistant

Copy the template sensors from `ha/template_sensors.yaml` into your Home Assistant configuration. These create the derived states that Domus reads.

Restart Home Assistant after adding the templates.

### 2. Create Access Token

In Home Assistant:
1. Go to your profile (bottom left)
2. Scroll to "Long-Lived Access Tokens"
3. Create a token named "domus"
4. Copy the token (you won't see it again)

### 3. Configure Domus

Create `frontend/config.js`:

```javascript
window.DOMUS_CONFIG = {
  haUrl: 'ws://homeassistant.local:8123/api/websocket',
  haToken: 'your-long-lived-access-token-here'
};
```

**Security note**: This file is gitignored. Never commit tokens.

### 4. Build & Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Copy dist/ to your Pi
scp -r dist/ pi@raspberrypi:~/domus/
```

### 5. Set Up Raspberry Pi

Follow [pi/setup.md](pi/setup.md) for kiosk configuration.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
domus/
├── README.md           # You are here
├── LICENSE             # MIT License
├── docs/
│   ├── philosophy.md   # Design principles
│   └── visual-language.md
├── ha/
│   └── template_sensors.yaml  # Home Assistant config
├── frontend/
│   ├── index.html      # Entry point
│   ├── src/
│   │   ├── main.ts         # Application entry
│   │   ├── ha_client.ts    # WebSocket client
│   │   ├── state_machine.ts
│   │   ├── renderer.ts     # SVG/Canvas rendering
│   │   └── transitions.ts  # Animation system
│   ├── assets/
│   │   └── house.svg
│   └── themes/
│       └── default.css
├── pi/
│   └── setup.md        # Raspberry Pi setup guide
├── package.json
└── tsconfig.json
```

## Security Considerations

- The Home Assistant token is read-only but still sensitive
- Never expose your Domus instance to the internet
- The Pi should be on the same network as Home Assistant
- Consider using HTTPS if your network isn't trusted

## Contributing

Contributions are welcome. Please keep the philosophy in mind:

- Prefer simplicity over features
- Prefer calm over activity
- Prefer restraint over expression

## License

MIT — See [LICENSE](LICENSE)

## Acknowledgments

Built with respect for the humans who will live with it.
