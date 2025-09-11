export function Name() { return "Yeelight Bridge"; }
export function Version() { return "1.1.0"; }
export function Type() { return "network"; }
export function Publisher() { return "Yeelight Bridge"; }
export function Size() { return [1, 1]; }
export function DefaultPosition() { return [0, 70]; }
export function DefaultScale() { return 1.0; }
export function ControllableParameters() {
	return [
		{ "property": "shutdownColor", "group": "lighting", "label": "Shutdown Color", "min": "0", "max": "360", "type": "color", "default": "#009bde" },
		{ "property": "LightingMode", "group": "lighting", "label": "Lighting Mode", "type": "combobox", "values": ["Canvas", "Forced"], "default": "Canvas" },
		{ "property": "forcedColor", "group": "lighting", "label": "Forced Color", "min": "0", "max": "360", "type": "color", "default": "#009bde" }
	];
}

export function Initialize() {
	device.setName(controller.name);
	device.setSize([1, 1]);
	device.setControllableLeds(["LED 1"], [[0, 0]]);
	device.setImageFromUrl('https://cdn.worldvectorlogo.com/logos/yeelight-1.svg');
}

export function Render() {
	let color = [];
	if (LightingMode === "Forced") {
		color = hexToRgb(forcedColor);
	} else {
		color = device.color(0, 0);
	}
	setColors(color[0], color[1], color[2]);
	device.pause(500);
}

export function Shutdown() {
	device.pause(250);
	let color = hexToRgb(shutdownColor);
	setColors(color[0], color[1], color[2]);
}


export function DiscoveryService() {
    this.IconUrl = "https://cdn.worldvectorlogo.com/logos/yeelight-1.svg";

	this.connect = function (devices) {
		for (let i = 0; i < devices.length; i++) {
			this.AddDevice(devices[i]);
		}
	};

	this.removedDevices = function (deviceId) {
		let controller = service.getController(deviceId);
		if (controller !== undefined) {
			service.removeController(controller);
			service.suppressController(controller);
		}
	}

	this.AddDevice = function (deviceData) {
		const yeelightDevice = new YeelightDevice(deviceData);
		service.addController(yeelightDevice);
	};

	this.Update = function () {
		return;
	};
}

class YeelightDevice {
	constructor(deviceData) {
		this.id = deviceData.deviceId || deviceData.id;
		this.name = deviceData.name;
		this.setServiceSettings();
		this.update();
	}

	setServiceSettings() {
	    this.serverHost = service.getSetting("General", "BridgeServerIP") || '127.0.0.1';
    	this.serverPort = service.getSetting("General", "BridgeServerPort") || '3000';
	}

	update() {
		const controller = service.getController(this.id)
		if (controller === undefined) {
			service.addController(this);
			service.announceController(this);
		} else {
			service.removeController(controller);
			service.suppressController(controller);
			service.addController(this);
			service.announceController(this);
		}
	};
}

function setColors(r, g, b) {
	const host = controller.serverHost;
	const port = controller.serverPort;
	
	const xhr = new XMLHttpRequest();
	xhr.open("POST", `http://${host}:${port}/setColor`, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(JSON.stringify({
		r: r,
		g: g,
		b: b,
		brightness: 100,
		bulbs: [controller.id]
	}));
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);
	return colors;
}
