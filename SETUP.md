# Yeelight Bridge Setup Guide

This guide will help you set up the SignalRGB Yeelight Bridge to control your Yeelight bulbs.

## Prerequisites

1. **SignalRGB** - Download and install from [signalrgb.com](https://signalrgb.com)
2. **Node.js** - Download from [nodejs.org](https://nodejs.org) (LTS version recommended)
3. **Yeelight bulbs** with LAN control enabled
4. **Device IP addresses and tokens** for your Yeelight bulbs

## Step 1: Enable LAN Control on Yeelight Bulbs

1. Open the **Yeelight** app on your phone
2. Select each bulb you want to control
3. Go to **Settings** → **LAN Control**
4. Enable **LAN Control** (Developer Mode)
5. Note down the **IP address** and **token** for each device

## Step 2: Install the Bridge

1. **Download** this repository or clone it
2. **Open Command Prompt** in the project folder
3. **Install dependencies**:
   ```bash
   npm install
   ```
   Or run: `install.bat`

## Step 3: Discover Your Devices

1. **Run device discovery**:
   ```bash
   npm run discover
   ```
   Or: `node discover-devices.js`

2. **Note down** the device information (IP, token, model)

## Step 4: Start the Bridge Server

1. **Start the server**:
   ```bash
   npm start
   ```
   Or run: `start-server.bat`

2. **Allow through Windows Firewall** when prompted

3. **Keep the server running** (minimize the window)

## Step 5: Add to SignalRGB

### Method 1: Manual Installation (Recommended)

1. **Copy** the entire project folder to:
   ```
   %localappdata%\WhirlwindFX\SignalRgb\cache\addons\yeelight-bridge\
   ```

2. **Restart SignalRGB**

3. **Go to** Settings → Network → Add-ons

4. **Look for** "Yeelight Bridge" and enable it

### Method 2: Create SignalRGB Addon Package

1. **Create** a zip file with these files:
   - `YeelightBridge.qml`
   - `YeelightBridge.js`
   - `server.js`
   - `package.json`

2. **Rename** the zip to `yeelight-bridge.addon`

3. **Import** into SignalRGB

## Step 6: Configure Devices

1. **Open SignalRGB**
2. **Go to** Network → Yeelight Bridge
3. **Enter server details**:
   - IP: `127.0.0.1`
   - Port: `8080`
4. **Click Connect**
5. **Add your devices**:
   - Click "Add Device Manually"
   - Enter device name, IP, and token
   - Click "Add Device"
6. **Select devices** you want to control
7. **Test** by applying effects in SignalRGB

## Troubleshooting

### Server Won't Start
- Check if port 8080 is available
- Try a different port: `node server.js --port=9000`
- Run as administrator

### Devices Not Found
- Verify IP addresses are correct
- Check that LAN control is enabled
- Ensure devices are on the same network
- Try the discovery tool: `npm run discover`

### Colors Not Syncing
- Restart the bridge server
- Reconnect devices in SignalRGB
- Check device connection status
- Verify tokens are correct

### Performance Issues
- Close unnecessary applications
- Check network latency
- Reduce number of controlled devices
- Use wired connection if possible

## Advanced Configuration

### Custom Port
```bash
node server.js --port=9000
```

### Console Output
```bash
node server.js --console
```

### Multiple Options
```bash
node server.js --port=9000 --console
```

## Device Management

### Adding New Devices
1. Enable LAN control on the new device
2. Run discovery: `npm run discover`
3. Add device in SignalRGB interface
4. Configure and test

### Removing Devices
1. Go to SignalRGB → Yeelight Bridge
2. Select device to remove
3. Click "Remove Device"
4. Restart if needed

## Support

If you encounter issues:

1. **Check logs** in the server console
2. **Verify** all prerequisites are met
3. **Test** device connectivity manually
4. **Restart** both server and SignalRGB
5. **Check** Windows Firewall settings

## Tips

- **Keep the server running** while using SignalRGB
- **Use static IPs** for your Yeelight devices
- **Group similar devices** for better performance
- **Test effects** before creating complex setups
- **Backup** your device configurations

## Next Steps

Once everything is working:

1. **Create lighting zones** in SignalRGB
2. **Set up effects** for your Yeelight bulbs
3. **Sync with other RGB devices**
4. **Customize** colors and brightness
5. **Enjoy** your unified lighting experience!
