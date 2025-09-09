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

let protocol;
let deviceLedsPositions = [];
let allSubdeviceLedsPosition = [];
let uniqueSubdeviceLedPosition = [];
let subdeviceLedsCount = [];
let subdevices = [];

export function Initialize() {
	if (controller.zones.length > 1) {
		//create an array with the number of leds for each subdevice
		for (let i = 0; i < controller.zones.length; i++) {
			if (controller.zones[i].type === 0 || controller.zones[i].type === 1) {
				if (controller.zones[i].ledsCount > 0) {
					subdeviceLedsCount.push(controller.zones[i].ledsCount);
				}
			}
			if (controller.zones[i].type === 2) {
				let ledCount = 0;
				for (let j = 0; j < controller.zones[i].matrix.keys.length; j++) {
					ledCount += controller.zones[i].matrix.keys[j].filter((x) => x !== null).length;
				}
				subdeviceLedsCount.push(ledCount);
			}
		}
		device.log(subdeviceLedsCount);


		for (let i = 0; i < controller.zones.length; i++) {
			if (controller.zones[i].type === 0 || controller.zones[i].type === 1) {
				if (controller.zones[i].ledsCount > 0) {
					device.createSubdevice(controller.id + "_" + controller.zones[i].name);
					device.setSubdeviceName(controller.id + "_" + controller.zones[i].name, controller.zones[i].name);
					device.setSubdeviceSize(controller.id + "_" + controller.zones[i].name, controller.zones[i].ledsCount, 1);
					let subdeviceLedsNames = [];
					let subdeviceLedsPositionsX = [];
					let subdeviceLedsPositionsY = [0];
					let w = 0;
					let ledCount = subdeviceLedsCount[i];
					let previousLedCount = 0;
					for (let j = 0; j < i; j++) {
						previousLedCount += subdeviceLedsCount[j];
					}

					//for each led in the subdevice between the previousLedCount and the previousLedCount + ledCount
					for (let k = previousLedCount; k < previousLedCount + ledCount; k++) {

						subdeviceLedsNames.push(controller.leds[k].name);
						subdeviceLedsPositionsX.push(w);
						w++;
					}
					device.setSubdeviceLeds(controller.id + "_" + controller.zones[i].name, subdeviceLedsNames, subdeviceLedsPositionsX, subdeviceLedsPositionsY);

					subdevices.push(controller.id + "_" + controller.zones[i].name);

					uniqueSubdeviceLedPosition = subdeviceLedsPositionsX.map((x) => [x, subdeviceLedsPositionsY[0]]);
					allSubdeviceLedsPosition.push(uniqueSubdeviceLedPosition);
					device.log(allSubdeviceLedsPosition);
					device.log(uniqueSubdeviceLedPosition);

				}
			} else {
				if (controller.zones[i].type === 2) {
					//type 2 is a matrix of leds
					device.createSubdevice(controller.id + "_" + controller.zones[i].name);
					device.setSubdeviceName(controller.id + "_" + controller.zones[i].name, controller.zones[i].name);
					let matrixWidth = controller.zones[i].matrix.width;
					let matrixHeight = controller.zones[i].matrix.height;
					device.setSubdeviceSize(controller.id + "_" + controller.zones[i].name, matrixWidth, matrixHeight);


					let subdeviceLedsNames = [];
					let subdeviceLedsPositionsX = [];
					let subdeviceLedsPositionsY = [];
					let ledCount = subdeviceLedsCount[i];
					let previousLedCount = 0;
					for (let j = 0; j < i; j++) {
						previousLedCount += subdeviceLedsCount[j];
					}

					//for each led in the subdevice between the previousLedCount and the previousLedCount + ledCount
					for (let k = 0; k < ledCount; k++) {
						// Extract x and y coordinates from the matrix
						let matrix = controller.zones[i].matrix.keys;
						let x, y;
						for (let row = 0; row < matrix.length; row++) {
							let col = matrix[row].indexOf(k);
							if (col !== -1) {
								x = col;
								y = row;
								break;
							}
						}


						subdeviceLedsPositionsX.push(x);
						subdeviceLedsPositionsY.push(y);
					}

					for (let k = previousLedCount; k < previousLedCount + ledCount; k++) {
						subdeviceLedsNames.push(controller.leds[k].name);
					}

					device.log(subdeviceLedsNames);
					device.log(subdeviceLedsPositionsX);
					device.log(subdeviceLedsPositionsY);

					device.setSubdeviceLeds(controller.id + "_" + controller.zones[i].name, subdeviceLedsNames, subdeviceLedsPositionsX, subdeviceLedsPositionsY);

					subdevices.push(controller.id + "_" + controller.zones[i].name);

					uniqueSubdeviceLedPosition = subdeviceLedsPositionsX.map((x, i) => [x, subdeviceLedsPositionsY[i]]);
					allSubdeviceLedsPosition.push(uniqueSubdeviceLedPosition);
					device.log(allSubdeviceLedsPosition);
					device.log(uniqueSubdeviceLedPosition);

				}
			}
		}
		device.SetIsSubdeviceController(true)
	} else {
		if (controller.zones[0].type === 0 || controller.zones[0].type === 1) {

			let deviceLedsNames = [];
			let deviceLedsPositionsX = [];
			let deviceLedsPositionsY = [0];
			let w = 0;
			for (let i = 0; i < controller.leds.length; i++) {
				deviceLedsNames.push(controller.leds[i].name);
				deviceLedsPositionsX.push(w);
				w++;
			}
			deviceLedsPositions = deviceLedsPositionsX.map((x) => [x, deviceLedsPositionsY[0]]);
			device.log(deviceLedsPositions)
			device.log(controller.leds.length)
			device.setControllableLeds(deviceLedsNames, deviceLedsPositions);
			device.setSize([controller.leds.length, 1]);

		} else {
			if (controller.zones[0].type === 2) {
				//type 2 is a matrix of leds
				let matrixWidth = controller.zones[0].matrix.width;
				let matrixHeight = controller.zones[0].matrix.height;
				device.setSize([matrixWidth, matrixHeight]);


				let deviceLedsNames = [];
				let deviceLedsPositionsX = [];
				let deviceLedsPositionsY = [];

				//for each led in the subdevice between the previousLedCount and the previousLedCount + ledCount
				for (let i = 0; i < controller.leds.length; i++) {
					// Extract x and y coordinates from the matrix
					let matrix = controller.zones[0].matrix.keys;
					let x, y;
					for (let row = 0; row < matrix.length; row++) {
						let col = matrix[row].indexOf(i);
						if (col !== -1) {
							x = col;
							y = row;
							break;
						}
					}

					deviceLedsNames.push(controller.leds[i].name);
					deviceLedsPositionsX.push(x);
					deviceLedsPositionsY.push(y);
				}

				device.log(deviceLedsNames);
				device.log(deviceLedsPositionsX);
				device.log(deviceLedsPositionsY);

				deviceLedsPositions = deviceLedsPositionsX.map((x, i) => [x, deviceLedsPositionsY[i]]);
				device.setControllableLeds(deviceLedsNames, deviceLedsPositions);

			}
		}
	}
	device.setName(controller.name)
	device.ControllableParameters
	//device.setSize(10, 10)
	//device.setControllableLeds(["LED 1"], [[0, 0]]);
	device.setImageFromUrl('https://cdn.worldvectorlogo.com/logos/yeelight-1.svg');
	// Protocol will be created when device is added
}

export function Render() {
	device.log("Render called - subdevices length: " + subdevices.length);
	
	// Check if protocol exists
	if (!protocol) {
		device.log("No protocol available, skipping render");
		return;
	}
	
	if (subdevices.length > 0) {
		let color = [];
		for (let i = 0; i < subdevices.length; i++) {
			// device.log(allSubdeviceLedsPosition[i]);
			// device.log(subdeviceLedsCount[i]);
			// device.log(subdevices[i]);

			for (let j = 0; j < allSubdeviceLedsPosition[i].length; j++) {
				//for each led in the subdevice
				let ledX = allSubdeviceLedsPosition[i][j][0];
				let ledY = allSubdeviceLedsPosition[i][j][1];
				if (LightingMode === "Forced") {
					color = hexToRgb(forcedColor);
				} else {
					color.push(device.subdeviceColor(subdevices[i], ledX, ledY));
					// device.log(device.subdeviceColor(subdevices[i], ledX, ledY))
					// device.log(subdevices[i])
				}
			}
			//device.log(color);


		}
		protocol.setMultiColors(color);
	} else {
		// For single device without subdevices, get the average color from the device
		device.log("Using single device mode");
		let color = [];
		if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
			device.log("Using forced color: " + forcedColor);
		} else {
			// Get the average color from the device
			let avgColor = device.color(0, 0);
			device.log("Got color from device: " + avgColor);
			color.push(avgColor);
		}
		device.log("Sending colors to protocol: " + JSON.stringify(color));
		protocol.setMultiColors(color);
	}
	//device.log(subdevices);
	device.pause(2);
}

export function Shutdown() {
	device.pause(250);
	let color = hexToRgb(shutdownColor);
	protocol.setColors(color[0], color[1], color[2]);
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
		// Create protocol for this device
		protocol = new YeelightProtocol(yeelightDevice);
		service.log("Protocol created for device: " + yeelightDevice.id);
	};

	this.Update = function () {
		return;
	};
}

class YeelightDevice {
	constructor(deviceData) {
		service.log("YeelightDevice constructor called with device: " + JSON.stringify(deviceData));
		this.id = deviceData.deviceId || deviceData.id;
		this.name = deviceData.name;
		this.colors = deviceData.colors || [1]; // Default to 1 LED
		this.modes = deviceData.modes || [];
		this.activeMode = deviceData.activeMode || 0;
		this.zones = deviceData.zones || [];
		this.leds = deviceData.leds || [];
		service.log("Device ID set to: " + this.id);
		this.update();
	}

	update() {
		service.log("Updating device: " + this.name);
		service.log("Device ID: " + this.id);
		const controller = service.getController(this.id)
		if (controller === undefined) {
			service.addController(this);
			service.announceController(this);
			service.log("Controller added");
		} else {
			service.removeController(controller);
			service.suppressController(controller);
			service.addController(this);
			service.announceController(this);
			service.log("Controller updated");
		}
	};
}

class YeelightProtocol {
	constructor(device) {
		this.deviceId = device.id;
		this.colors = device.colors;
		this.host = '127.0.0.1'
		this.port = 8080
	}


	setColors(r, g, b) {
		const xhr = new XMLHttpRequest();
		
		device.log(`Setting color for device ${this.deviceId}: RGB(${r},${g},${b})`);

		xhr.open("POST", `http://localhost:${this.port}/devices/${this.deviceId}/color`, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4 && xhr.status === 200) {
				device.log(`Color set successfully for device ${this.deviceId}`);
			} else if (xhr.readyState === 4) {
				device.log(`Failed to set color for device ${this.deviceId}: ${xhr.status} ${xhr.responseText}`);
			}
		};
		xhr.send(JSON.stringify({
			r: r,
			g: g,
			b: b,
			brightness: 100
		}));
	}

	setMultiColors(colors) {
		//colors is an array of arrays of 3 integers, take the first color for single device
		if (colors.length > 0) {
			const color = colors[0];
			this.setColors(color[0], color[1], color[2]);
		}
	}
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);
	return colors;
}
