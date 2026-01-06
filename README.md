# Domus

A calm, ambient home display for Raspberry Pi.

## Quick Start

### Build

```bash
npm install
./build.sh "ws://homeassistant.local:8123/api/websocket" "your-token-here"
```

This builds the app and inlines your configuration directly into `dist/index.html` for `file://` protocol compatibility.

### Deploy to Pi

```bash
scp -r dist/* pi@raspberrypi.local:/home/pi/domus/
```

### Run on Pi

```bash
ssh pi@raspberrypi.local
cd /home/pi/domus
./kiosk.sh
```

The `kiosk.sh` script installs dependencies (weston, chromium) and launches the kiosk.

## Home Assistant Setup

Create template sensors in Home Assistant:

```yaml
template:
  - sensor:
      - name: "House Activity State"
        unique_id: domus_house_activity_state
        state: >
          {% set you_home = is_state('person.you', 'home') %}
          {% set partner_home = is_state('person.partner', 'home') %}
          {% if you_home and partner_home %}
            both
          {% elif you_home or partner_home %}
            one
          {% else %}
            empty
          {% endif %}
      
      - name: "House Day State"
        unique_id: domus_house_day_state
        state: >
          {% set sun_state = states('sun.sun') %}
          {% set elevation = state_attr('sun.sun', 'elevation') | float(0) %}
          {% if sun_state == 'below_horizon' %}
            {% if elevation > -6 %}
              twilight
            {% else %}
              night
            {% endif %}
          {% else %}
            {% if elevation < 6 %}
              twilight
            {% else %}
              day
            {% endif %}
          {% endif %}
```

## Development

```bash
npm run dev
```

## License

MIT
