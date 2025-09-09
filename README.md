# SignalRGB Yeelight Bridge

An add-on for SignalRGB that allows you to control Yeelight bulbs through SignalRGB. This plugin enables you to sync your Yeelight smart bulbs with SignalRGB effects and create unified lighting experiences.

## Features

- Control Yeelight bulbs through SignalRGB
- Support for multiple devices and zones
- Real-time color synchronization
- WebSocket communication for low latency
- Easy device management interface
- Support for custom device configurations

## Prerequisites

- SignalRGB installed and running
- Yeelight bulbs with LAN control enabled
- Node.js (for the bridge server)
- Device IP addresses and tokens

## Installation

### 1. Enable LAN Control on Yeelight Bulbs

1. Open the Yeelight app on your phone
2. Go to device settings for each bulb
3. Enable "LAN Control" (Developer Mode)
4. Note down the IP address and token for each device

### 2. Install Dependencies

```bash
npm install
```

### 3. Add to SignalRGB

1. Click the "Add to SignalRGB" button (you'll need to create this functionality)
2. Accept opening the link with SignalRGB
3. In SignalRGB, click "Confirm" in the install add-on dialog
4. Wait for the plugin to download

### 4. Configure the Bridge

1. Navigate to the addon folder in SignalRGB cache
2. Launch `server.exe` or run `node server.js`
3. Allow the server through Windows Firewall
4. Restart SignalRGB
5. Go to "Network" and click on "Yeelight Bridge"
6. Configure your devices and connect

## Usage

### Adding Devices

1. **Manual Addition**: Use the "Add Device Manually" section to add devices by IP and token
2. **Auto Discovery**: The bridge will attempt to discover devices on your network

### Device Configuration

- **Device Name**: Give your device a friendly name
- **IP Address**: The local IP address of your Yeelight bulb
- **Token**: The authentication token from the Yeelight app

### Controlling Devices

Once connected, your Yeelight bulbs will appear in SignalRGB's device list and can be controlled like any other RGB device. You can:

- Apply effects to individual bulbs
- Group bulbs together for synchronized effects
- Control brightness and power states
- Create custom lighting zones

## Server Configuration

The bridge server supports several command-line options:

- `--port=8080`: Set custom port (default: 8080)
- `--console`: Show console output
- `--no-startup`: Don't start with Windows

Example:
```bash
node server.js --port=9000 --console
```

## API Endpoints

The bridge server provides REST API endpoints:

- `GET /health`: Server health check
- `GET /devices`: List all devices
- `POST /devices`: Add a new device
- `DELETE /devices/:id`: Remove a device
- `POST /devices/:id/connect`: Connect to device
- `POST /devices/:id/disconnect`: Disconnect from device
- `POST /devices/:id/color`: Set device color
- `POST /devices/:id/power`: Set device power

## Troubleshooting

### Common Issues

1. **Cannot connect to server**
   - Check if the server is running
   - Verify the IP address and port
   - Check Windows Firewall settings

2. **Device not responding**
   - Verify IP address and token are correct
   - Ensure LAN control is enabled on the device
   - Check network connectivity

3. **Colors not syncing**
   - Restart the bridge server
   - Reconnect the device in SignalRGB
   - Check device connection status

### Debug Mode

Run the server with console output to see detailed logs:

```bash
node server.js --console
```

## Development

### Project Structure

- `YeelightBridge.qml`: SignalRGB plugin interface
- `YeelightBridge.js`: JavaScript bridge logic
- `server.js`: Node.js server for device communication
- `package.json`: Dependencies and scripts

### Adding New Features

1. Modify the QML interface for UI changes
2. Update the JavaScript bridge for new functionality
3. Extend the server API for additional device controls
4. Test with your Yeelight devices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by the SignalRGB-To-OpenRGB-Bridge project
- Uses the miio library for Yeelight communication
- Built for the SignalRGB ecosystem
