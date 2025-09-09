const miio = require('miio');

class YeelightDiscovery {
    constructor() {
        this.foundDevices = [];
    }

    async discoverDevices() {
        console.log('Scanning for Yeelight devices...');
        console.log('This may take a few moments...\n');

        try {
            // miio.device() can discover devices on the network
            const devices = await miio.devices();
            
            if (devices.length === 0) {
                console.log('No Yeelight devices found on the network.');
                console.log('Make sure your devices have LAN control enabled.');
                return [];
            }

            console.log(`Found ${devices.length} device(s):\n`);

            for (let i = 0; i < devices.length; i++) {
                const device = devices[i];
                try {
                    const info = await device.info();
                    const deviceInfo = {
                        name: info.name || `Yeelight Device ${i + 1}`,
                        ip: device.address,
                        model: info.model || 'unknown',
                        token: device.token,
                        id: info.id || 'unknown'
                    };

                    this.foundDevices.push(deviceInfo);

                    console.log(`Device ${i + 1}:`);
                    console.log(`  Name: ${deviceInfo.name}`);
                    console.log(`  IP: ${deviceInfo.ip}`);
                    console.log(`  Model: ${deviceInfo.model}`);
                    console.log(`  Token: ${deviceInfo.token}`);
                    console.log(`  ID: ${deviceInfo.id}`);
                    console.log('');

                } catch (error) {
                    console.log(`Device ${i + 1}: Error getting info - ${error.message}`);
                }
            }

            return this.foundDevices;

        } catch (error) {
            console.error('Discovery failed:', error.message);
            return [];
        }
    }

    generateConfig() {
        if (this.foundDevices.length === 0) {
            console.log('No devices found to generate config for.');
            return;
        }

        const config = {
            server: {
                port: 8080,
                host: "127.0.0.1"
            },
            devices: this.foundDevices.map(device => ({
                name: device.name,
                ip: device.ip,
                token: device.token,
                model: device.model,
                enabled: true
            })),
            settings: {
                autoConnect: true,
                reconnectInterval: 5000,
                logLevel: "info"
            }
        };

        console.log('\nGenerated configuration:');
        console.log(JSON.stringify(config, null, 2));
        
        return config;
    }

    async testDevice(deviceInfo) {
        console.log(`\nTesting device: ${deviceInfo.name} (${deviceInfo.ip})`);
        
        try {
            const device = await miio.device({
                address: deviceInfo.ip,
                token: deviceInfo.token
            });

            // Test basic functionality
            console.log('  ✓ Connected successfully');
            
            // Test power control
            await device.call('set_power', ['on']);
            console.log('  ✓ Power control working');
            
            // Test color control
            await device.call('set_hsv', [0, 100, 100]); // Red
            console.log('  ✓ Color control working');
            
            // Test brightness control
            await device.call('set_bright', [50]);
            console.log('  ✓ Brightness control working');
            
            device.destroy();
            console.log('  ✓ Device test completed successfully\n');
            
            return true;
        } catch (error) {
            console.log(`  ✗ Device test failed: ${error.message}\n`);
            return false;
        }
    }

    async testAllDevices() {
        console.log('Testing all discovered devices...\n');
        
        for (const device of this.foundDevices) {
            await this.testDevice(device);
        }
    }
}

// Main execution
async function main() {
    const discovery = new YeelightDiscovery();
    
    console.log('Yeelight Device Discovery Tool');
    console.log('==============================\n');
    
    // Discover devices
    await discovery.discoverDevices();
    
    if (discovery.foundDevices.length > 0) {
        // Test devices
        await discovery.testAllDevices();
        
        // Generate config
        discovery.generateConfig();
        
        console.log('\nDiscovery completed!');
        console.log('You can now use these device information in your SignalRGB Yeelight Bridge.');
    } else {
        console.log('\nNo devices found. Please check:');
        console.log('1. Yeelight devices are connected to the same network');
        console.log('2. LAN control is enabled on all devices');
        console.log('3. No firewall is blocking the discovery');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = YeelightDiscovery;
