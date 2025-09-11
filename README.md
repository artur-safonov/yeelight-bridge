# Yeelight Bridge for SignalRGB

This addon allows SignalRGB to control Yeelight smart bulbs through a local bridge server that communicates using the miio protocol. Bulbs are added manually using IP address and token for reliable connection.

## Components

1. **YeelightBridge.js** - SignalRGB addon JavaScript logic
2. **YeelightBridge.qml** - SignalRGB addon user interface with bulb management
3. **server.js** - Node.js bridge server with manual bulb management
4. **package.json** - Server dependencies

## Server Setup

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)
- Yeelight bulbs on the same network
- Yeelight bulbs with "LAN Control" enabled in the Yeelight app
- miio command line tool for token discovery (optional but recommended)

### Installation

1. Create a new directory for the server:
```bash
mkdir yeelight-bridge-server
cd yeelight-bridge-server
```

2. Save the `server.js` and `package.json` files in this directory

3. Install dependencies:
```bash
npm install
```

4. Start the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### Server Configuration

The server runs on port 3000 by default. You can change this by setting the PORT environment variable:
```bash
PORT=8080 npm start
```

## Getting Bulb Tokens

### Method 1: Using miio CLI (Recommended)

1. Install miio command line tool globally:
```bash
npm install -g miio
```

2. Discover devices on your network:
```bash
miio discover
```

3. Look for your Yeelight bulbs in the output and note the IP addresses and tokens

### Method 2: Using miio-cli

1. Install miio-cli:
```bash
npm install -g miio-cli
```

2. Discover devices:
```bash
miio-cli discover
```

### Method 3: Manual Network Scan

If automatic discovery doesn't work, you can try connecting to known Yeelight IPs with common default tokens, though this is less reliable.

## SignalRGB Addon Setup

### Installation

1. Place `YeelightBridge.js` and `YeelightBridge.qml` in your SignalRGB plugins directory:
    - Windows: `%PROGRAMFILES%\SignalRGB\plugins\`
    - Or in the user plugins directory if available

2. Restart SignalRGB

3. The Yeelight Bridge device should appear in your device list

### Configuration

1. Add the Yeelight Bridge device to your setup
2. Configure the connection settings:
    - **Server Host**: IP address of the machine running the bridge server (default: localhost)
    - **Server Port**: Port the bridge server is running on (default: 3000)
    - **Connection Timeout**: How long to wait for server responses (default: 5000ms)
    - **Update Rate**: How often to send color updates (default: 50ms)

3. Add your bulbs using the "Add New Bulb" section:
    - **Bulb Name**: Friendly name for the bulb (optional)
    - **IP Address**: The IP address of your Yeelight bulb
    - **Token**: The 32-character hexadecimal token from discovery

4. Enable debug logging if you need troubleshooting information

## Adding Bulbs

### Using the SignalRGB Interface

1. Open the Yeelight Bridge device settings in SignalRGB
2. In the "Add New Bulb" section, enter:
    - Bulb name (optional, e.g., "Living Room")
    - IP address (e.g., "192.168.1.100")
    - Token (32-character hex string from discovery)
3. Click "Add Bulb"
4. The bulb should appear in the "Connected Bulbs" list

### Using the API Directly

You can also add bulbs directly via HTTP POST:

```bash
curl -X POST http://localhost:3000/addBulb \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100",
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "name": "Living Room Bulb"
  }'
```

## Yeelight Bulb Setup

### Enable LAN Control

1. Open the Yeelight app on your phone
2. Select your bulb
3. Go to bulb settings (usually a gear icon)
4. Find and enable "LAN Control" or "Developer Mode"
5. The bulb is now ready for local network control

### Supported Features

- **Color Control**: Full RGB color control
- **Brightness**: 1-100% brightness control
- **Power**: Turn bulbs on/off
- **Smooth Transitions**: Smooth color and brightness changes
- **Multiple Bulbs**: Control multiple bulbs simultaneously
- **Manual Management**: Add/remove bulbs as needed

## API Endpoints

The bridge server provides a REST API for controlling bulbs:

- `GET /status` - Get server and bulb status
- `GET /bulbs` - List all configured bulbs
- `GET /bulbs/:id` - Get specific bulb information
- `POST /addBulb` - Add a new bulb manually
- `DELETE /bulbs/:id` - Remove a bulb
- `POST /setColor` - Set bulb colors (RGB + brightness)
- `POST /setBrightness` - Set bulb brightness
- `POST /power` - Turn bulbs on/off

### Example API Usage

Add a bulb:
```bash
curl -X POST http://localhost:3000/bulbs \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.100", "token": "your-32-char-token", "name": "Bedroom"}'
```

Set color for all bulbs:
```bash
curl -X POST http://localhost:3000/setColor \
  -H "Content-Type: application/json" \
  -d '{"r": 255, "g": 0, "b": 0, "brightness": 80}'
```

Remove a bulb:
```bash
curl -X DELETE http://localhost:3000/bulbs/192.168.1.100_a1b2c3d4
```

## Troubleshooting

### Server Issues

1. **Cannot add bulb**:
    - Verify the IP address is correct and reachable
    - Ensure the token is exactly 32 hexadecimal characters
    - Check that LAN Control is enabled on the bulb
    - Test connectivity: `ping <bulb-ip>`

2. **Connection errors after adding**:
    - Verify the bulb token is correct
    - Check if the bulb IP changed (DHCP)
    - Restart the bulb and try again
    - Check server logs for specific error messages

3. **Token discovery issues**:
    - Ensure miio CLI is installed correctly
    - Try discovery multiple times
    - Make sure bulbs are in pairing mode
    - Check network connectivity between devices

### SignalRGB Addon Issues

1. **Addon not appearing**:
    - Check file placement in plugins directory
    - Restart SignalRGB completely
    - Check SignalRGB logs for loading errors

2. **Cannot add bulbs through interface**:
    - Verify server is running and accessible
    - Check server host/port settings
    - Test server status: `curl http://localhost:3000/status`

3. **Colors not updating**:
    - Enable debug logging to see communication
    - Check server logs for errors
    - Verify bulbs are responding to API calls
    - Check update rate settings (may be too fast)

### Network Configuration

- Ensure your firewall allows communication on the server port (default: 3000)
- Make sure the server machine and Yeelight bulbs are on the same network
- For remote control, configure port forwarding if the server and SignalRGB are on different networks
- Consider using static IP addresses for bulbs to prevent connection issues

## Advanced Configuration

### Custom Bulb Management

The server stores bulb configurations in memory. For persistent storage, you could modify the server to save bulb configurations to a file.

### Multiple Server Instances

You can run multiple bridge servers on different ports to separate bulb groups or for redundancy.

### Security Considerations

- The bridge server has no authentication - ensure it's only accessible from trusted networks
- Consider using a reverse proxy with authentication for remote access
- Monitor server logs for unusual activity
- Keep bulb tokens secure as they provide full control access

## Contributing

This addon is part of the SignalRGB community ecosystem. Feel free to modify and improve the code for your specific needs.

## License

MIT License - feel free to use and modify as needed.