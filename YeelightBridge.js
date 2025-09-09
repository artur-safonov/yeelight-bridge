// SignalRGB Yeelight Bridge Plugin
// This file handles the communication between SignalRGB and the Yeelight devices

class YeelightBridge {
    constructor() {
        this.serverUrl = 'http://127.0.0.1:8080';
        this.wsUrl = 'ws://127.0.0.1:8080';
        this.devices = new Map();
        this.websocket = null;
        this.isConnected = false;
    }

    // Initialize the bridge
    async initialize() {
        try {
            await this.connectToServer();
            await this.loadDevices();
            this.setupWebSocket();
            return true;
        } catch (error) {
            console.error('Failed to initialize Yeelight Bridge:', error);
            return false;
        }
    }

    // Connect to the bridge server
    async connectToServer() {
        try {
            const response = await fetch(`${this.serverUrl}/health`);
            if (response.ok) {
                this.isConnected = true;
                console.log('Connected to Yeelight Bridge server');
                return true;
            } else {
                throw new Error('Server health check failed');
            }
        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.isConnected = false;
            return false;
        }
    }

    // Load devices from server
    async loadDevices() {
        try {
            const response = await fetch(`${this.serverUrl}/devices`);
            if (response.ok) {
                const deviceList = await response.json();
                this.devices.clear();
                deviceList.forEach(device => {
                    this.devices.set(device.id, device);
                });
                console.log(`Loaded ${deviceList.length} devices`);
                return deviceList;
            } else {
                throw new Error('Failed to load devices');
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
            return [];
        }
    }

    // Setup WebSocket connection for real-time updates
    setupWebSocket() {
        try {
            this.websocket = new WebSocket(this.wsUrl);
            
            this.websocket.onopen = () => {
                console.log('WebSocket connected');
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                // Attempt to reconnect after 5 seconds
                setTimeout(() => {
                    if (!this.websocket || this.websocket.readyState === WebSocket.CLOSED) {
                        this.setupWebSocket();
                    }
                }, 5000);
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
        }
    }

    // Handle WebSocket messages
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'devices':
                this.updateDevices(data.devices);
                break;
            case 'log':
                console.log('Server:', data.message);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    // Update devices list
    updateDevices(deviceList) {
        this.devices.clear();
        deviceList.forEach(device => {
            this.devices.set(device.id, device);
        });
    }

    // Add a new device
    async addDevice(deviceData) {
        try {
            const response = await fetch(`${this.serverUrl}/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deviceData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Device added:', result.id);
                await this.loadDevices(); // Refresh devices list
                return result;
            } else {
                throw new Error('Failed to add device');
            }
        } catch (error) {
            console.error('Failed to add device:', error);
            throw error;
        }
    }

    // Remove a device
    async removeDevice(deviceId) {
        try {
            const response = await fetch(`${this.serverUrl}/devices/${deviceId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('Device removed:', deviceId);
                this.devices.delete(deviceId);
                return true;
            } else {
                throw new Error('Failed to remove device');
            }
        } catch (error) {
            console.error('Failed to remove device:', error);
            return false;
        }
    }

    // Connect to a specific device
    async connectDevice(deviceId) {
        try {
            const response = await fetch(`${this.serverUrl}/devices/${deviceId}/connect`, {
                method: 'POST'
            });

            if (response.ok) {
                console.log('Connected to device:', deviceId);
                return true;
            } else {
                throw new Error('Failed to connect to device');
            }
        } catch (error) {
            console.error('Failed to connect to device:', error);
            return false;
        }
    }

    // Disconnect from a specific device
    async disconnectDevice(deviceId) {
        try {
            const response = await fetch(`${this.serverUrl}/devices/${deviceId}/disconnect`, {
                method: 'POST'
            });

            if (response.ok) {
                console.log('Disconnected from device:', deviceId);
                return true;
            } else {
                throw new Error('Failed to disconnect from device');
            }
        } catch (error) {
            console.error('Failed to disconnect from device:', error);
            return false;
        }
    }

    // Set device color
    async setDeviceColor(deviceId, r, g, b, brightness = 100) {
        try {
            const response = await fetch(`${this.serverUrl}/devices/${deviceId}/color`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ r, g, b, brightness })
            });

            if (response.ok) {
                console.log(`Set color for device ${deviceId}: RGB(${r},${g},${b})`);
                return true;
            } else {
                throw new Error('Failed to set device color');
            }
        } catch (error) {
            console.error('Failed to set device color:', error);
            return false;
        }
    }

    // Set device power
    async setDevicePower(deviceId, power) {
        try {
            const response = await fetch(`${this.serverUrl}/devices/${deviceId}/power`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ power })
            });

            if (response.ok) {
                console.log(`Set power for device ${deviceId}: ${power ? 'on' : 'off'}`);
                return true;
            } else {
                throw new Error('Failed to set device power');
            }
        } catch (error) {
            console.error('Failed to set device power:', error);
            return false;
        }
    }

    // Get all devices
    getDevices() {
        return Array.from(this.devices.values());
    }

    // Get device by ID
    getDevice(deviceId) {
        return this.devices.get(deviceId);
    }

    // Check if connected to server
    isServerConnected() {
        return this.isConnected;
    }

    // Cleanup
    destroy() {
        if (this.websocket) {
            this.websocket.close();
        }
        this.devices.clear();
        this.isConnected = false;
    }
}

// Export for use in SignalRGB
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YeelightBridge;
} else if (typeof window !== 'undefined') {
    window.YeelightBridge = YeelightBridge;
}
