/**
 * Domus Configuration
 * 
 * Copy this file to config.js and update with your values.
 * The config.js file is gitignored to prevent token leakage.
 */

window.DOMUS_CONFIG = {
  // WebSocket URL for Home Assistant
  // Use ws:// for HTTP, wss:// for HTTPS
  haUrl: 'ws://homeassistant.local:8123/api/websocket',
  
  // Long-lived access token from Home Assistant
  // Create one at: Profile → Long-Lived Access Tokens
  haToken: 'your-long-lived-access-token-here'
};

