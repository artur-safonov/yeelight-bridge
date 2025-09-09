const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const miio = require('miio');

class YeelightBridge {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.devices = new Map();
        this.connectedClients = new Set();
        this.port = this.getPortFromArgs();
        this.showConsole = process.argv.includes('--console');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    getPortFromArgs() {
        const portArg = process.argv.find(arg => arg.startsWith('--port='));
        return portArg ? parseInt(portArg.split('=')[1]) : 8080;
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', devices: this.devices.size });
        });

        // Get all devices
        this.app.get('/devices', (req, res) => {
            const deviceList = Array.from(this.devices.values()).map(device => ({
                id: device.id,
                name: device.name,
                ip: device.ip,
                model: device.model,
                connected: device.connected
            }));
            res.json(deviceList);
        });

        // Add device
        this.app.post('/devices', (req, res) => {
            const { name, ip, token, model = 'yeelight.color' } = req.body;
            
            if (!name || !ip || !token) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const deviceId = `yeelight_${Date.now()}`;
            const device = {
                id: deviceId,
                name,
                ip,
                token,
                model,
                connected: false,
                device: null
            };

            this.devices.set(deviceId, device);
            this.log(`Added device: ${name} (${ip})`);
            
            res.json({ id: deviceId, success: true });
        });

        // Remove device
        this.app.delete('/devices/:id', (req, res) => {
            const deviceId = req.params.id;
            if (this.devices.has(deviceId)) {
                const device = this.devices.get(deviceId);
                if (device.device) {
                    device.device.destroy();
                }
                this.devices.delete(deviceId);
                this.log(`Removed device: ${deviceId}`);
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Device not found' });
            }
        });

        // Connect to device
        this.app.post('/devices/:id/connect', async (req, res) => {
            const deviceId = req.params.id;
            const device = this.devices.get(deviceId);
            
            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            try {
                this.log(`Connecting to device: ${device.name} (${device.ip})`);
                const miioDevice = await miio.device({ address: device.ip, token: device.token });
                device.device = miioDevice;
                device.connected = true;
                this.log(`Connected to device: ${device.name}`);
                res.json({ success: true });
            } catch (error) {
                this.log(`Failed to connect to device ${device.name}: ${error.message}`);
                res.status(500).json({ error: error.message });
            }
        });

        // Disconnect from device
        this.app.post('/devices/:id/disconnect', (req, res) => {
            const deviceId = req.params.id;
            const device = this.devices.get(deviceId);
            
            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            if (device.device) {
                device.device.destroy();
                device.device = null;
                device.connected = false;
                this.log(`Disconnected from device: ${device.name}`);
            }
            
            res.json({ success: true });
        });

        // Set device color
        this.app.post('/devices/:id/color', async (req, res) => {
            const deviceId = req.params.id;
            const device = this.devices.get(deviceId);
            
            if (!device || !device.connected) {
                return res.status(404).json({ error: 'Device not found or not connected' });
            }

            const { r, g, b, brightness = 100 } = req.body;
            
            try {
                // Convert RGB to HSV for Yeelight
                const hsv = this.rgbToHsv(r, g, b);
                
                await device.device.call('set_hsv', [hsv.h, hsv.s, hsv.v]);
                await device.device.call('set_bright', [brightness]);
                
                this.log(`Set color for ${device.name}: RGB(${r},${g},${b}) HSV(${hsv.h},${hsv.s},${hsv.v})`);
                res.json({ success: true });
            } catch (error) {
                this.log(`Failed to set color for ${device.name}: ${error.message}`);
                res.status(500).json({ error: error.message });
            }
        });

        // Set device power
        this.app.post('/devices/:id/power', async (req, res) => {
            const deviceId = req.params.id;
            const device = this.devices.get(deviceId);
            
            if (!device || !device.connected) {
                return res.status(404).json({ error: 'Device not found or not connected' });
            }

            const { power } = req.body;
            
            try {
                await device.device.call('set_power', [power ? 'on' : 'off']);
                this.log(`Set power for ${device.name}: ${power ? 'on' : 'off'}`);
                res.json({ success: true });
            } catch (error) {
                this.log(`Failed to set power for ${device.name}: ${error.message}`);
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupWebSocket() {
        this.server = require('http').createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });

        this.wss.on('connection', (ws) => {
            this.connectedClients.add(ws);
            this.log('New WebSocket client connected');
            
            ws.on('close', () => {
                this.connectedClients.delete(ws);
                this.log('WebSocket client disconnected');
            });

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    this.log(`Invalid WebSocket message: ${error.message}`);
                }
            });
        });
    }

    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'getDevices':
                ws.send(JSON.stringify({
                    type: 'devices',
                    devices: Array.from(this.devices.values())
                }));
                break;
                
            case 'setColor':
                this.log(`Setting color for ${data.deviceId}: RGB(${data.r},${data.g},${data.b})`);
                this.setDeviceColor(data.deviceId, data.r, data.g, data.b, data.brightness);
                break;
                
            case 'setPower':
                this.log(`Setting power for ${data.deviceId}: ${data.power ? 'on' : 'off'}`);
                this.setDevicePower(data.deviceId, data.power);
                break;
        }
    }

    async setDeviceColor(deviceId, r, g, b, brightness = 100) {
        const device = this.devices.get(deviceId);
        if (!device || !device.connected) return;

        try {
            const hsv = this.rgbToHsv(r, g, b);
            await device.device.call('set_hsv', [hsv.h, hsv.s, hsv.v]);
            await device.device.call('set_bright', [brightness]);
            this.log(`Set color for ${device.name}: RGB(${r},${g},${b})`);
        } catch (error) {
            this.log(`Failed to set color for ${device.name}: ${error.message}`);
        }
    }

    async setDevicePower(deviceId, power) {
        const device = this.devices.get(deviceId);
        if (!device || !device.connected) return;

        try {
            await device.device.call('set_power', [power ? 'on' : 'off']);
            this.log(`Set power for ${device.name}: ${power ? 'on' : 'off'}`);
        } catch (error) {
            this.log(`Failed to set power for ${device.name}: ${error.message}`);
        }
    }

    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;

        let h = 0;
        if (diff !== 0) {
            if (max === r) {
                h = ((g - b) / diff) % 6;
            } else if (max === g) {
                h = (b - r) / diff + 2;
            } else {
                h = (r - g) / diff + 4;
            }
        }
        h = Math.round(h * 60);
        if (h < 0) h += 360;

        const s = max === 0 ? 0 : diff / max;
        const v = max;

        return {
            h: h,
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    }

    broadcastToClients(data) {
        const message = JSON.stringify(data);
        this.connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        if (this.showConsole) {
            console.log(logMessage);
        }
        
        // Broadcast to connected clients
        this.broadcastToClients({
            type: 'log',
            message: logMessage
        });
    }

    start() {
        this.server.listen(this.port, () => {
            this.log(`Yeelight Bridge server started on port ${this.port}`);
            this.log('Server is ready to accept connections');
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.log('Server stopped');
        }
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
const showConsole = args.includes('--console');
const noStartup = args.includes('--no-startup');

if (showConsole) {
    console.log('Console output enabled');
}

// Create and start the bridge
const bridge = new YeelightBridge();
bridge.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    bridge.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    bridge.stop();
    process.exit(0);
});
