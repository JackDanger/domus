# Raspberry Pi Setup Guide

This guide walks through setting up a Raspberry Pi as a dedicated Domus kiosk display.

## Hardware Requirements

- **Raspberry Pi**: 3B+ or newer recommended (Pi 4 works great)
- **Display**: Official Raspberry Pi 7" touchscreen, or any HDMI display
- **Power**: Official Raspberry Pi power supply (reliable power is important)
- **Storage**: 8GB+ microSD card (Class 10 or better)
- **Case**: Optional, but helps with heat and mounting

## Operating System Setup

### 1. Install Raspberry Pi OS Lite

Download and flash Raspberry Pi OS Lite (64-bit recommended) using the [Raspberry Pi Imager](https://www.raspberrypi.com/software/).

In the imager settings, configure:
- Hostname: `domus` (or your preference)
- Enable SSH
- Set username and password
- Configure WiFi (if not using ethernet)

### 2. First Boot

Insert the SD card and power on. SSH into the Pi:

```bash
ssh pi@domus.local
```

Update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Required Packages

Install a minimal X environment and Chromium:

```bash
sudo apt install -y \
  xserver-xorg \
  x11-xserver-utils \
  xinit \
  chromium-browser \
  unclutter \
  fonts-liberation
```

## Kiosk Configuration

### 1. Create the Kiosk Script

Create a script to launch Chromium in kiosk mode:

```bash
sudo nano /home/pi/kiosk.sh
```

Add the following content:

```bash
#!/bin/bash

# Wait for network
sleep 5

# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Hide mouse cursor after 0.5s of inactivity
unclutter -idle 0.5 -root &

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --check-for-update-interval=31536000 \
  --no-first-run \
  --start-fullscreen \
  --window-size=800,480 \
  --window-position=0,0 \
  file:///home/pi/domus/index.html

# Or use a local web server URL:
# http://localhost:8080/
```

Make it executable:

```bash
chmod +x /home/pi/kiosk.sh
```

### 2. Auto-start X with Kiosk

Edit the `.bash_profile` to auto-start X:

```bash
nano /home/pi/.bash_profile
```

Add:

```bash
if [[ -z $DISPLAY ]] && [[ $(tty) = /dev/tty1 ]]; then
  startx /home/pi/kiosk.sh --
fi
```

### 3. Enable Auto-login

Enable console auto-login:

```bash
sudo raspi-config
```

Navigate to: System Options → Boot / Auto Login → Console Autologin

### 4. Deploy Domus

Copy the built Domus files to the Pi:

```bash
# From your development machine
scp -r dist/* pi@domus.local:/home/pi/domus/
```

Create the configuration file on the Pi:

```bash
ssh pi@domus.local
nano /home/pi/domus/config.js
```

Add your configuration:

```javascript
window.DOMUS_CONFIG = {
  haUrl: 'ws://homeassistant.local:8123/api/websocket',
  haToken: 'your-token-here'
};
```

### 5. Reboot

```bash
sudo reboot
```

The Pi should now boot directly into the Domus display.

## Display Configuration

### Rotate Display (if needed)

For the official 7" display, you may need to rotate:

```bash
sudo nano /boot/config.txt
```

Add one of:
- `display_rotate=0` — Normal
- `display_rotate=1` — 90°
- `display_rotate=2` — 180°
- `display_rotate=3` — 270°

### Adjust Display Brightness

For the official touchscreen:

```bash
# Set brightness (0-255)
echo 128 | sudo tee /sys/class/backlight/rpi_backlight/brightness
```

To set on boot, add to `/etc/rc.local` before `exit 0`:

```bash
echo 128 > /sys/class/backlight/rpi_backlight/brightness
```

### Disable Overscan

If you see black borders:

```bash
sudo raspi-config
```

Navigate to: Display Options → Underscan → No

## Reliability Improvements

### 1. Read-Only Filesystem (Optional)

For maximum reliability, consider making the filesystem read-only:

```bash
sudo raspi-config
```

Navigate to: Performance Options → Overlay File System → Enable

This prevents SD card corruption from unexpected power loss.

### 2. Watchdog Timer

Enable the hardware watchdog to auto-reboot on freeze:

```bash
sudo nano /etc/systemd/system.conf
```

Uncomment and set:

```
RuntimeWatchdogSec=10
```

### 3. Automatic Updates (Optional)

Create a cron job to pull updates:

```bash
crontab -e
```

Add:

```
0 3 * * * /home/pi/update-domus.sh
```

Create the update script:

```bash
nano /home/pi/update-domus.sh
chmod +x /home/pi/update-domus.sh
```

```bash
#!/bin/bash
# Pull latest Domus and restart browser
cd /home/pi/domus
# Add your update method here (git pull, scp, etc.)
pkill chromium
/home/pi/kiosk.sh &
```

## Troubleshooting

### Black Screen

- Check HDMI connection
- Try `sudo raspi-config` → Display Options → Resolution
- Check `/var/log/Xorg.0.log` for errors

### Chromium Crashes

- Check memory: `free -h`
- Reduce GPU memory: `gpu_mem=128` in `/boot/config.txt`
- Check logs: `journalctl -xe`

### Network Issues

- Verify WiFi: `iwconfig`
- Check DNS: `nslookup homeassistant.local`
- Test connection: `curl -I http://homeassistant.local:8123`

### Touch Not Working

- Install touch drivers: `sudo apt install libinput-tools`
- Check: `libinput debug-events`

## Security Notes

- The Pi should be on a trusted local network only
- Never expose the Pi to the internet
- The HA token is stored in plaintext — physical access = token access
- Consider disabling SSH after setup if not needed

## Power Consumption

A typical Pi 4 with 7" display uses about 5-7W. For energy-conscious setups:

- Use a Pi Zero 2 W (lower power, still capable)
- Dim the display during night hours
- Consider using a smart plug to turn off at night

