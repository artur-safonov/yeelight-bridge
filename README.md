# Yeelight Bridge for SignalRGB

Control Yeelight smart bulbs through SignalRGB using a local bridge server with automatic device persistence and color optimization.

## Quick Start

### 1. Server Setup
```bash
npm install
npm start
```

### 2. Get Bulb IP and Token

**iPhone Method:**
1. Open Mi Home app → Add device → Yeelight bulb
2. Create iPhone backup via iTunes/Finder
3. Use iBackup Viewer to extract token from iPhone backup

**Android Method:**
1. Open Mi Home app → Add device → Yeelight bulb
2. **Option A**: Use third-party apps like "Mi Home Token Extractor"
3. **Option B**: Access Mi Home database file (requires root)

### 3. Install SignalRGB Addon

[![Add To Installation](https://marketplace.signalrgb.com/resources/add-extension-256.png 'Add to My SignalRGB Installation')](https://srgbmods.net/s?p=addon/install?url=https://github.com/artur-safonov/yeelight-bridge)

### 4. Add Devices
- Open Yeelight Bridge device in SignalRGB
- Enter server IP/port (default: 127.0.0.1:8888)
- Click "Check Connection"
- Add bulbs with IP and token
- Click "Connect All Devices"

## Auto-Start (Windows Service)

```bash
# Install as Windows service
npm run install-service

# Uninstall service
npm run uninstall-service
```

## Features

- **Auto-Persistence** - Devices survive server restarts
- **Color Optimization** - Reduces unnecessary requests
- **Real-time Sync** - Always shows current server devices
- **Simple UI** - Add/remove devices with one click
- **Auto-Reconnect** - Automatically reconnects on server restart

## API Endpoints

- `GET /bulbs` - List devices
- `POST /bulbs` - Add device
- `DELETE /bulbs/:id` - Remove device
- `POST /setColor` - Set colors

## Troubleshooting

- **Server won't start**: Check if port 8888 is available
- **Can't add bulb**: Verify IP/token and LAN control is enabled
- **Colors not updating**: Check server logs and network connectivity
- **Devices lost on restart**: Server now auto-restores devices from `devices.json`

## Files

- `server.js` - Bridge server with persistence
- `YeelightBridge.js` - SignalRGB addon logic
- `YeelightBridge.qml` - SignalRGB UI
- `devices.json` - Auto-created device storage