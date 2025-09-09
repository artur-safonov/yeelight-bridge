import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Dialogs 1.3

import WhirlwindFX.SignalRGB 1.0

Item {
    id: root
    width: 800
    height: 600

    property var devices: []
    property var connectedDevices: []
    property bool isConnected: false
    property string serverStatus: "Disconnected"
    property string serverIP: "127.0.0.1"
    property int serverPort: 8080

    ScrollView {
        anchors.fill: parent
        anchors.margins: 20

        ColumnLayout {
            width: parent.width
            spacing: 20

            // Header
            Text {
                text: "Yeelight Bridge"
                font.pixelSize: 24
                font.bold: true
                color: "#ffffff"
            }

            Text {
                text: "Control your Yeelight bulbs through SignalRGB"
                font.pixelSize: 14
                color: "#cccccc"
            }

            // Server Configuration
            GroupBox {
                title: "Server Configuration"
                Layout.fillWidth: true
                Layout.preferredHeight: 120

                ColumnLayout {
                    anchors.fill: parent
                    spacing: 10

                    RowLayout {
                        Text {
                            text: "Server IP:"
                            width: 100
                            color: "#ffffff"
                        }
                        TextField {
                            id: ipField
                            text: serverIP
                            placeholderText: "127.0.0.1"
                            Layout.fillWidth: true
                            onTextChanged: serverIP = text
                        }
                    }

                    RowLayout {
                        Text {
                            text: "Port:"
                            width: 100
                            color: "#ffffff"
                        }
                        TextField {
                            id: portField
                            text: serverPort.toString()
                            placeholderText: "8080"
                            Layout.fillWidth: true
                            validator: IntValidator { bottom: 1; top: 65535 }
                            onTextChanged: serverPort = parseInt(text) || 8080
                        }
                    }

                    RowLayout {
                        Button {
                            text: isConnected ? "Disconnect" : "Connect"
                            enabled: !isConnected || isConnected
                            onClicked: {
                                if (isConnected) {
                                    disconnectFromServer()
                                } else {
                                    connectToServer()
                                }
                            }
                        }
                        Text {
                            text: "Status: " + serverStatus
                            color: isConnected ? "#00ff00" : "#ff0000"
                        }
                    }
                }
            }

            // Device Configuration
            GroupBox {
                title: "Device Configuration"
                Layout.fillWidth: true
                Layout.preferredHeight: 200
                visible: isConnected

                ColumnLayout {
                    anchors.fill: parent
                    spacing: 10

                    RowLayout {
                        Button {
                            text: "Refresh Devices"
                            onClicked: refreshDevices()
                        }
                        Button {
                            text: "Delete All"
                            onClicked: deleteAllDevices()
                        }
                    }

                    ScrollView {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        clip: true

                        ListView {
                            id: deviceList
                            model: devices
                            spacing: 5

                            delegate: Rectangle {
                                width: deviceList.width
                                height: 60
                                color: "#333333"
                                radius: 5
                                border.color: "#555555"
                                border.width: 1

                                RowLayout {
                                    anchors.fill: parent
                                    anchors.margins: 10
                                    spacing: 10

                                    CheckBox {
                                        id: deviceCheckbox
                                        checked: connectedDevices.includes(modelData.id)
                                        onToggled: {
                                            if (checked) {
                                                addDevice(modelData)
                                            } else {
                                                removeDevice(modelData.id)
                                            }
                                        }
                                    }

                                    ColumnLayout {
                                        Layout.fillWidth: true
                                        spacing: 5

                                        Text {
                                            text: modelData.name || "Unknown Device"
                                            font.pixelSize: 14
                                            font.bold: true
                                            color: "#ffffff"
                                        }

                                        Text {
                                            text: "IP: " + modelData.ip + " | Model: " + (modelData.model || "Unknown")
                                            font.pixelSize: 12
                                            color: "#cccccc"
                                        }
                                    }

                                    Text {
                                        text: connectedDevices.includes(modelData.id) ? "Connected" : "Disconnected"
                                        color: connectedDevices.includes(modelData.id) ? "#00ff00" : "#ff0000"
                                        font.pixelSize: 12
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Add Device Manually
            GroupBox {
                title: "Add Device Manually"
                Layout.fillWidth: true
                Layout.preferredHeight: 150
                visible: isConnected

                ColumnLayout {
                    anchors.fill: parent
                    spacing: 10

                    RowLayout {
                        Text {
                            text: "Device Name:"
                            width: 100
                            color: "#ffffff"
                        }
                        TextField {
                            id: deviceNameField
                            placeholderText: "e.g., Living Room Light"
                            Layout.fillWidth: true
                        }
                    }

                    RowLayout {
                        Text {
                            text: "IP Address:"
                            width: 100
                            color: "#ffffff"
                        }
                        TextField {
                            id: deviceIpField
                            placeholderText: "192.168.1.100"
                            Layout.fillWidth: true
                        }
                    }

                    RowLayout {
                        Text {
                            text: "Token:"
                            width: 100
                            color: "#ffffff"
                        }
                        TextField {
                            id: deviceTokenField
                            placeholderText: "Your device token"
                            echoMode: TextInput.Password
                            Layout.fillWidth: true
                        }
                    }

                    Button {
                        text: "Add Device"
                        onClicked: addManualDevice()
                    }
                }
            }

            // Console Output
            GroupBox {
                title: "Console Output"
                Layout.fillWidth: true
                Layout.preferredHeight: 150
                visible: showConsole.checked

                ScrollView {
                    anchors.fill: parent
                    clip: true

                    Text {
                        id: consoleOutput
                        text: consoleText
                        color: "#ffffff"
                        font.family: "Consolas, Monaco, monospace"
                        font.pixelSize: 12
                        wrapMode: Text.Wrap
                    }
                }
            }

            CheckBox {
                id: showConsole
                text: "Show Console"
                checked: false
            }
        }
    }

    property string consoleText: ""

    function log(message) {
        var timestamp = new Date().toLocaleTimeString()
        consoleText += "[" + timestamp + "] " + message + "\n"
    }

    function connectToServer() {
        log("Connecting to server at " + serverIP + ":" + serverPort)
        // Implementation will be handled by the server
        serverStatus = "Connecting..."
        isConnected = true
        serverStatus = "Connected"
        log("Connected to server")
    }

    function disconnectFromServer() {
        log("Disconnecting from server")
        isConnected = false
        serverStatus = "Disconnected"
        devices = []
        connectedDevices = []
        log("Disconnected from server")
    }

    function refreshDevices() {
        log("Refreshing devices...")
        // This will be handled by the server
        devices = [
            {
                id: "yeelight_1",
                name: "Living Room Light",
                ip: "192.168.1.100",
                model: "yeelight.color",
                token: "your_token_here"
            }
        ]
        log("Found " + devices.length + " devices")
    }

    function addDevice(device) {
        if (!connectedDevices.includes(device.id)) {
            connectedDevices.push(device.id)
            log("Added device: " + device.name)
        }
    }

    function removeDevice(deviceId) {
        var index = connectedDevices.indexOf(deviceId)
        if (index > -1) {
            connectedDevices.splice(index, 1)
            log("Removed device: " + deviceId)
        }
    }

    function deleteAllDevices() {
        connectedDevices = []
        log("Removed all devices")
    }

    function addManualDevice() {
        if (deviceNameField.text && deviceIpField.text && deviceTokenField.text) {
            var device = {
                id: "yeelight_" + Date.now(),
                name: deviceNameField.text,
                ip: deviceIpField.text,
                token: deviceTokenField.text,
                model: "yeelight.color"
            }
            devices.push(device)
            log("Added manual device: " + device.name)
            
            // Clear fields
            deviceNameField.text = ""
            deviceIpField.text = ""
            deviceTokenField.text = ""
        }
    }

    Component.onCompleted: {
        log("Yeelight Bridge initialized")
    }
}
