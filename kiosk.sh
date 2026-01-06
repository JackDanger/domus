#!/bin/bash
# Kiosk launcher for Domus on Raspberry Pi
# Installs dependencies and launches Weston + Chromium in kiosk mode

set -e

# Launch Weston with kiosk shell and Chromium
weston \
  --backend=drm-backend.so \
  --shell=kiosk-shell.so \
  -- \
  chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-features=TranslateUI \
    --check-for-update-interval=31536000 \
    --no-first-run \
    --start-fullscreen \
    --window-size=800,480 \
    file:///home/pi/kiosk.html

