#!/bin/bash

echo "Installing dependencies..."
sudo apt update
sudo apt install -y \
  weston \
  chromium-browser \
  xwayland

echo "Setting up systemd service..."
sudo usermod -aG video,input,audio pi

sudo cp ./kiosk.service /etc/systemd/system/kiosk.service
sudo systemctl daemon-reload
sudo systemctl enable kiosk.service
sudo systemctl start kiosk.service
