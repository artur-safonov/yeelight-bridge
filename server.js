const express = require('express');
const miio = require('miio');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

class YeelightBridgeServer {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.bulbs = new Map();
        this.dataFile = path.join(__dirname, 'devices.json');
        this.setupMiddleware();
        this.setupRoutes();
        this.loadDevices();
    }

    setupMiddleware() {
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        this.app.use(express.json());

        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        this.app.get('/status', (req, res) => {
            res.json({
                status: 'ok',
                bulbs: Array.from(this.bulbs.values()).map(bulb => ({
                    id: bulb.id,
                    model: bulb.model,
                    connected: bulb.connected,
                    address: bulb.address
                })),
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/bulbs', (req, res) => {
            const bulbList = Array.from(this.bulbs.values()).map(bulb => ({
                id: bulb.id,
                model: bulb.model || 'Unknown',
                connected: bulb.connected,
                address: bulb.address,
                brightness: bulb.lastBrightness || 0,
                color: bulb.lastColor || { r: 255, g: 255, b: 255 }
            }));
            res.json({ bulbs: bulbList });
        });

        this.app.get('/bulbs/:id', (req, res) => {
            const bulb = this.bulbs.get(req.params.id);
            if (!bulb) {
                return res.status(404).json({ error: 'Bulb not found' });
            }
            res.json({
                id: bulb.id,
                model: bulb.model,
                connected: bulb.connected,
                address: bulb.address,
                brightness: bulb.lastBrightness || 0,
                color: bulb.lastColor || { r: 255, g: 255, b: 255 }
            });
        });

        this.app.post('/bulbs', async (req, res) => {
            try {
                const { ip, token, name } = req.body;
                if (!ip || !token || !name) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: ip, token, and name are required' 
                    });
                }
                const bulbId = `bulb_${Date.now()}`;
                const result = await this.addBulb(ip, token, name, bulbId);
                if (result.success) {
                    res.status(201).json(result);
                } else {
                    res.status(400).json(result);
                }
            } catch (error) {
                console.error('Error in POST /bulbs:', error);
                res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error' 
                });
            }
        });

        this.app.delete('/bulbs/:id', (req, res) => {
            const bulbId = req.params.id;
            const bulb = this.bulbs.get(bulbId);
            if (!bulb) {
                return res.status(404).json({ error: 'Bulb not found' });
            }
            try {
                if (bulb.device && bulb.device.destroy) {
                    bulb.device.destroy();
                }
                this.bulbs.delete(bulbId);
                this.saveDevices();
                res.json({ 
                    success: true, 
                    message: `Bulb ${bulb.name} removed successfully` 
                });
            } catch (error) {
                console.error(`Error removing bulb ${bulbId}:`, error);
                res.status(500).json({ 
                    success: false, 
                    error: 'Error disconnecting bulb' 
                });
            }
        });

        this.app.post('/setColor', async (req, res) => {
            try {
                const { r, g, b, brightness = 100, bulbs: targetBulbs } = req.body;
                if (r === undefined || g === undefined || b === undefined) {
                    return res.status(400).json({ error: 'RGB values are required' });
                }
                const results = [];
                const bulbsToUpdate = targetBulbs ?
                    targetBulbs.map(id => this.bulbs.get(id)).filter(Boolean) :
                    Array.from(this.bulbs.values());
                for (const bulb of bulbsToUpdate) {
                    if (bulb.connected) {
                        try {
                            const result = await this.setBulbColor(bulb, r, g, b, brightness);
                            results.push({ id: bulb.id, success: true, result });
                        } catch (error) {
                            console.error(`Error setting color for bulb ${bulb.id}:`, error.message);
                            results.push({ id: bulb.id, success: false, error: error.message });
                        }
                    } else {
                        results.push({ id: bulb.id, success: false, error: 'Bulb not connected' });
                    }
                }
                res.json({ results });
            } catch (error) {
                console.error('Error in setColor:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        this.app.post('/setBrightness', async (req, res) => {
            try {
                const { brightness, bulbs: targetBulbs } = req.body;
                if (brightness === undefined || brightness < 1 || brightness > 100) {
                    return res.status(400).json({ error: 'Brightness must be between 1 and 100' });
                }
                const results = [];
                const bulbsToUpdate = targetBulbs ?
                    targetBulbs.map(id => this.bulbs.get(id)).filter(Boolean) :
                    Array.from(this.bulbs.values());
                for (const bulb of bulbsToUpdate) {
                    if (bulb.connected) {
                        try {
                            const result = await this.setBulbBrightness(bulb, brightness);
                            results.push({ id: bulb.id, success: true, result });
                        } catch (error) {
                            console.error(`Error setting brightness for bulb ${bulb.id}:`, error.message);
                            results.push({ id: bulb.id, success: false, error: error.message });
                        }
                    } else {
                        results.push({ id: bulb.id, success: false, error: 'Bulb not connected' });
                    }
                }
                res.json({ results });
            } catch (error) {
                console.error('Error in setBrightness:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        this.app.post('/power', async (req, res) => {
            try {
                const { power, bulbs: targetBulbs } = req.body;
                if (typeof power !== 'boolean') {
                    return res.status(400).json({ error: 'Power must be true or false' });
                }
                const results = [];
                const bulbsToUpdate = targetBulbs ?
                    targetBulbs.map(id => this.bulbs.get(id)).filter(Boolean) :
                    Array.from(this.bulbs.values());
                for (const bulb of bulbsToUpdate) {
                    if (bulb.connected) {
                        try {
                            const result = await this.setBulbPower(bulb, power);
                            results.push({ id: bulb.id, success: true, result });
                        } catch (error) {
                            console.error(`Error setting power for bulb ${bulb.id}:`, error.message);
                            results.push({ id: bulb.id, success: false, error: error.message });
                        }
                    } else {
                        results.push({ id: bulb.id, success: false, error: 'Bulb not connected' });
                    }
                }
                res.json({ results });
            } catch (error) {
                console.error('Error in power:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    }

    async addBulb(ip, token, name, bulbId) {
        try {
            const device = await miio.device({
                address: ip,
                token: token
            });
            try {
                await device.call('get_prop', ['power']);
            } catch (testError) {
                if (device.destroy) device.destroy();
                return {
                    success: false,
                    error: `Could not communicate with bulb: ${testError.message}`
                };
            }
            const bulbInfo = {
                id: bulbId,
                device: device,
                name: name,
                ip: ip,
                token: token,
                model: 'Yeelight',
                address: ip,
                connected: true,
                lastBrightness: 100,
                lastColor: { r: 255, g: 255, b: 255 }
            };
            this.bulbs.set(bulbId, bulbInfo);
            device.on('error', (error) => {
                if (this.bulbs.has(bulbId)) {
                    this.bulbs.get(bulbId).connected = false;
                }
            });
            this.saveDevices();
            return {
                success: true,
                bulb: {
                    id: bulbId,
                    name: name,
                    ip: ip,
                    model: 'Yeelight',
                    connected: true
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }


    async setBulbColor(bulb, r, g, b, brightness = 100) {
        try {
            const { h, s, v } = this.rgbToHsv(r, g, b);
            await bulb.device.call('set_hsv', [Math.round(h), Math.round(s * 100), 'smooth', 500]);
//            await bulb.device.call('set_bright', [Math.round(brightness), 'smooth', 500]);
            bulb.lastColor = { r, g, b };
            bulb.lastBrightness = brightness;
            return { r, g, b, brightness };
        } catch (error) {
            console.error(`Error setting color for bulb ${bulb.id}:`, error);
            throw error;
        }
    }

    async setBulbBrightness(bulb, brightness) {
        try {
            await bulb.device.call('set_bright', [Math.round(brightness), 'smooth', 300]);
            bulb.lastBrightness = brightness;
            return { brightness };
        } catch (error) {
            console.error(`Error setting brightness for bulb ${bulb.id}:`, error);
            throw error;
        }
    }

    async setBulbPower(bulb, power) {
        try {
            const powerState = power ? 'on' : 'off';
            await bulb.device.call('set_power', [powerState, 'smooth', 300]);
            return { power };
        } catch (error) {
            console.error(`Error setting power for bulb ${bulb.id}:`, error);
            throw error;
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
        let s = 0;
        const v = max;

        if (diff !== 0) {
            s = diff / max;

            switch (max) {
                case r:
                    h = ((g - b) / diff) % 6;
                    break;
                case g:
                    h = (b - r) / diff + 2;
                    break;
                case b:
                    h = (r - g) / diff + 4;
                    break;
            }

            h *= 60;
            if (h < 0) h += 360;
        }

        return { h, s, v };
    }

    saveDevices() {
        try {
            const devicesData = Array.from(this.bulbs.values()).map(bulb => ({
                id: bulb.id,
                name: bulb.name,
                ip: bulb.ip,
                token: bulb.token,
                model: bulb.model,
                address: bulb.address,
                lastBrightness: bulb.lastBrightness,
                lastColor: bulb.lastColor
            }));
            fs.writeFileSync(this.dataFile, JSON.stringify(devicesData, null, 2));
        } catch (error) {
            console.error('Error saving devices:', error);
        }
    }

    async loadDevices() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                const devicesData = JSON.parse(data);
                
                for (const deviceData of devicesData) {
                    try {
                        const device = await miio.device({
                            address: deviceData.ip,
                            token: deviceData.token
                        });
                        
                        const bulbInfo = {
                            id: deviceData.id,
                            device: device,
                            name: deviceData.name,
                            ip: deviceData.ip,
                            token: deviceData.token,
                            model: deviceData.model,
                            address: deviceData.address,
                            connected: true,
                            lastBrightness: deviceData.lastBrightness || 100,
                            lastColor: deviceData.lastColor || { r: 255, g: 255, b: 255 }
                        };
                        
                        this.bulbs.set(deviceData.id, bulbInfo);
                        
                        device.on('error', (error) => {
                            if (this.bulbs.has(deviceData.id)) {
                                this.bulbs.get(deviceData.id).connected = false;
                            }
                        });
                        
                        console.log(`Restored device: ${deviceData.name} (${deviceData.id})`);
                    } catch (error) {
                        console.error(`Failed to restore device ${deviceData.name}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading devices:', error);
        }
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`Yeelight Bridge Server running on port ${this.port}`);
        });
    }
    
    stop() {
        for (const bulb of this.bulbs.values()) {
            if (bulb.device && bulb.device.destroy) {
                bulb.device.destroy();
            }
        }
        this.bulbs.clear();
        process.exit(0);
    }
}

const server = new YeelightBridgeServer(process.env.PORT || 3000);
server.start();

process.on('SIGINT', () => {
    server.stop();
});

process.on('SIGTERM', () => {
    server.stop();
});