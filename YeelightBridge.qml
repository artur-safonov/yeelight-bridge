Item {
    anchors.fill : parent
    property var selectedDevices: []
    property var deviceList: []
    Component.onCompleted: {
    try {
    selectedDevices = JSON.parse(service.getSetting("General", "SelectedDevices"));
} catch (e) {
    selectedDevices = [];
}

    bridgeServerIP.text = service.getSetting("General", "BridgeServerIP") || "127.0.0.1"
    bridgeServerPort.text = service.getSetting("General", "BridgeServerPort") || "3000"
    if (bridgeServerIP.text !== "" && bridgeServerPort.text !== "")
    {
        checkConnectionButton.clicked();
    }
}

function addYeelightDevice() {
    const xhr = new XMLHttpRequest()
    const bridgehost = bridgeServerIP.text
    const bridgeport = bridgeServerPort.text
    
    const deviceData = {
        name: deviceName.text || (deviceModel.currentText + " (" + deviceIP.text + ")"),
        ip: deviceIP.text,
        token: deviceToken.text
    }
    
    xhr.open("POST", `http://${bridgehost}:${bridgeport}/bulbs`, true)
    xhr.setRequestHeader("Content-Type", "application/json")
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 201) {
            service.log("Device added successfully")
            // Clear the form
            deviceIP.text = ""
            deviceToken.text = ""
            deviceName.text = ""
            deviceModel.currentIndex = 0
            // Refresh the device list
            checkConnectionButton.clicked()
        } else if (xhr.readyState === 4) {
            service.log("Failed to add device: " + xhr.responseText)
        }
    }
    xhr.send(JSON.stringify(deviceData))
}

function deleteDevice(deviceId) {
    const xhr = new XMLHttpRequest()
    const bridgehost = bridgeServerIP.text
    const bridgeport = bridgeServerPort.text
    
    xhr.open("DELETE", `http://${bridgehost}:${bridgeport}/bulbs/${deviceId}`, true)
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            service.log("Device deleted successfully")
            // Refresh the device list
            checkConnectionButton.clicked()
        } else if (xhr.readyState === 4) {
            service.log("Failed to delete device: " + xhr.responseText)
        }
    }
    xhr.send()
}
Connections {
    target : bridgeServerIP
    function onTextEdited()
    {
        service.saveSetting("General", "BridgeServerIP", bridgeServerIP.text)
    }
}

Connections {
    target : bridgeServerPort
    function onTextEdited()
    {
        service.saveSetting("General", "BridgeServerPort", bridgeServerPort.text)
    }
}
    Flickable {
        anchors.fill: parent
        contentHeight: headerColumn.height

        		ScrollBar.vertical: ScrollBar {
			id: controllerListScrollBar
			anchors.right: parent.right
			width: 10
			visible: true //parent.height < parent.contentHeight
			policy: ScrollBar.AlwaysOn
			height: parent.availableHeight
			contentItem: Rectangle {
				radius: parent.width / 2
				color: theme.scrollBar
			}
		}
Column {
    id : headerColumn
    y : 0
    width : parent.width - 20
    spacing : 0
    Text {
        color : theme.primarytextcolor
        text : "Control Yeelight bulbs through SignalRGB. Start the bridge server (npm start), enable LAN control on your bulbs, then add them using IP and token."
        font.pixelSize : 14
        font.family : "Poppins"
        font.bold : false
        bottomPadding : 15
        width : parent.width
        wrapMode : Text.WordWrap
    }
Rectangle {
    width : parent.width
    height : 1
    color : "#444444"
}
Row {
    topPadding : 20
    spacing : 5
    Rectangle {
        x : 0
        y : 0
        width : 200
        height : 30
        radius : 2
        border.color : "#444444"
        border.width : 2
        color : "#141414"
        TextField {
            width : 180
            leftPadding : 0
            rightPadding : 10
            id : bridgeServerIP
            x : 10
            y : -5
            color : theme.primarytextcolor
            font.family : "Poppins"
            font.bold : true
            font.pixelSize : 16
            verticalAlignment : TextInput.AlignVCenter
            placeholderText : "Bridge Server IP"
            validator : RegularExpressionValidator {
                regularExpression : /^((?:[0-1]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.){0,3}(?:[0-1]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/
            }
            background : Item {
                width : parent.width
                height : parent.height
                Rectangle {
                    color : "transparent"
                    height : 1
                    width : parent.width
                    anchors.bottom : parent.bottom
                }
            }
        }
    }
    Rectangle {
        x : 0
        y : 0
        width : 60
        height : 30
        radius : 2
        border.color : "#444444"
        border.width : 2
        color : "#141414"
        TextField {
            width : 50
            leftPadding : 0
            rightPadding : 10
            id : bridgeServerPort
            x : 10
            y : -5
            color : theme.primarytextcolor
            font.family : "Poppins"
            font.bold : true
            font.pixelSize : 16
            verticalAlignment : TextInput.AlignVCenter
            placeholderText : "Port"
            validator : RegularExpressionValidator {
                regularExpression : /^([0-9]{1,4})$/
            }
            background : Item {
                width : parent.width
                height : parent.height
                Rectangle {
                    color : "transparent"
                    height : 1
                    width : parent.width
                    anchors.bottom : parent.bottom
                }
            }
        }
    }
    Item {
        Rectangle {
            width : 130
            height : 30
            color : "#009000"
            radius : 2
        }
        width : 135
        height : 30
        ToolButton {
            id: checkConnectionButton
            height : 30
            width : 130
            anchors.verticalCenter : parent.verticalCenter
            font.family : "Poppins"
            font.bold : true
            icon.source : "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAV0lEQVQ4jWP8//8/A0UAnwH///3r+P/vXwdevQQMuPv/37+7+AxgItaluMAwMIARGpIdDAwMoVjklaD0PSxyqxkYGSsodsFoNFLBABYC8qsJGcBIaXYGAFjoNxCMz3axAAAAAElFTkSuQmCC"
            text : "Check Connection"
            anchors.right : parent.center
            onClicked: {
                deviceList = []
                deviceRepeater.model = deviceList
                const xhr = new XMLHttpRequest()
                const bridgehost = bridgeServerIP.text
                const bridgeport = bridgeServerPort.text
                
                xhr.open("GET", `http://${bridgehost}:${bridgeport}/bulbs`, true)
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        service.log("Successfully connected to bridge server on port " + bridgeport)
                        let res = JSON.parse(xhr.responseText)
                        if (res.bulbs && res.bulbs.length > 0) {
                            deviceList = res.bulbs.map(bulb => ({
                                deviceId: bulb.id,
                                name: bulb.model || 'Yeelight Bulb',
                                id: bulb.id,
                                ip: bulb.address
                            }))
                            deviceRepeater.model = deviceList
                            try {
                                selectedDevices = JSON.parse(service.getSetting("General", "SelectedDevices"));
                            } catch (e) {
                                selectedDevices = [];
                            }

                            if (selectedDevices.length > 0) {
                                for (var i = 0; i < deviceRepeater.count; i++) {
                                    for (var j = 0; j < selectedDevices.length; j++) {
                                        if (deviceRepeater.itemAt(i).deviceId == selectedDevices[j].deviceId) {
                                            deviceRepeater.itemAt(i).color = "#209e20"
                                        }
                                    }
                                }
                            }
                            service.log("Found " + deviceList.length + " devices on bridge server")
                        } else {
                            service.log("No devices found on bridge server")
                        }
                    } else if (xhr.readyState === 4) {
                        service.log("Failed to connect to bridge server: " + xhr.status + " " + xhr.responseText)
                    }
                }
                xhr.send()
            }
}
}
Item {
    Rectangle {
        width : 130
        height : 30
        color : "#900000"
        radius : 2
    }
    width : 90
    height : 30
}
}
Column {
    width : 200
    spacing : 5
    topPadding : 10
    
    Text {
        id: test
        color : theme.primarytextcolor
        text : "Add Yeelight Device"
        font.pixelSize : 16
        font.family : "Poppins"
        font.bold : false
        bottomPadding : 10
        width : 400
        wrapMode : Text.WordWrap
    }
    
    // Device Input Form
    Rectangle {
        width : 400
        height : 120
        color : "#212d3a"
        radius : 2
        border.color : "#444444"
        border.width : 1
        
        Column {
            anchors.fill: parent
            anchors.margins: 10
            spacing: 5
            
            Row {
                spacing: 10
                width: parent.width
                
                Rectangle {
                    width: 200
                    height: 30
                    color: "#141414"
                    radius: 2
                    border.color: "#444444"
                    border.width: 1
                    
                    TextField {
                        id: deviceIP
                        anchors.fill: parent
                        anchors.margins: 2
                        color: theme.primarytextcolor
                        font.family: "Poppins"
                        font.pixelSize: 14
                        placeholderText: "Device IP (e.g., 192.168.1.100)"
                        validator: RegularExpressionValidator {
                            regularExpression: /^((?:[0-1]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\.){0,3}(?:[0-1]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/
                        }
                        background: Item {}
                    }
                }
                
                Rectangle {
                    width: 150
                    height: 30
                    color: "#141414"
                    radius: 2
                    border.color: "#444444"
                    border.width: 1
                    
                    TextField {
                        id: deviceToken
                        anchors.fill: parent
                        anchors.margins: 2
                        color: theme.primarytextcolor
                        font.family: "Poppins"
                        font.pixelSize: 14
                        placeholderText: "Device Token"
                        echoMode: TextInput.Password
                        background: Item {}
                    }
                }
            }
            
            Row {
                spacing: 10
                width: parent.width
                
                Rectangle {
                    width: 200
                    height: 30
                    color: "#141414"
                    radius: 2
                    border.color: "#444444"
                    border.width: 1
                    
                    TextField {
                        id: deviceName
                        anchors.fill: parent
                        anchors.margins: 2
                        color: theme.primarytextcolor
                        font.family: "Poppins"
                        font.pixelSize: 14
                        placeholderText: "Device Name (optional)"
                        background: Item {}
                    }
                }
                
                Rectangle {
                    width: 150
                    height: 30
                    color: "#141414"
                    radius: 2
                    border.color: "#444444"
                    border.width: 1
                    
                    ComboBox {
                        id: deviceModel
                        anchors.fill: parent
                        anchors.margins: 2
                        model: ["Color Bulb", "Color Strip", "Desk Lamp", "Ceiling Light", "Other"]
                        background: Item {}
                    }
                }
            }
            
            Rectangle {
                width: 100
                height: 30
                color: "#009000"
                radius: 2
                
                Text {
                    anchors.centerIn: parent
                    color: "white"
                    text: "Add Device"
                    font.family: "Poppins"
                    font.pixelSize: 14
                    font.bold: true
                }
                
                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        if (deviceIP.text && deviceToken.text) {
                            addYeelightDevice();
                        }
                    }
                }
            }
        }
    }
    
    Text {
        color : theme.primarytextcolor
        text : "Select the devices you want to control"
        font.pixelSize : 16
        font.family : "Poppins"
        font.bold : false
        bottomPadding : 10
        topPadding : 10
        width : 400
        wrapMode : Text.WordWrap
    }
    
    // Connect Devices Button
    Item {
        width : 150
        height : 30
        Rectangle {
            width : 150
            height : 30
            color : "#0066cc"
            radius : 2
        }
        ToolButton {
            id: connectDevicesButton
            height : 30
            width : 150
            anchors.verticalCenter : parent.verticalCenter
            font.family : "Poppins"
            font.bold : true
            icon.source : "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAV0lEQVQ4jWP8//8/A0UAnwH///3r+P/vXwdevQQMuPv/37+7+AxgItaluMAwMIARGpIdDAwMoVjklaD0PSxyqxkYGSsodsFoNFLBABYC8qsJGcBIaXYGAFjoNxCMz3axAAAAAElFTkSuQmCC"
            text : "Connect Devices"
            anchors.centerIn : parent
            onClicked: {
                try {
                    selectedDevices = JSON.parse(service.getSetting("General", "SelectedDevices"));
                } catch (e) {
                    selectedDevices = [];
                }
                
                if (selectedDevices.length > 0) {
                    service.log("Connecting " + selectedDevices.length + " devices to SignalRGB...")
                    discovery.connect(selectedDevices)
                    service.log("Devices connected successfully!")
                } else {
                    service.log("No devices selected. Please select devices first.")
                }
            }
        }
    }
    Repeater {
        id : deviceRepeater
        model : deviceList
        Rectangle {
            width : 400
            height : 30
            color : "#212d3a"
            radius : 2
            property var deviceId: modelData.deviceId
            
            Text {
                anchors.left: parent.left
                anchors.leftMargin: 10
                anchors.verticalCenter: parent.verticalCenter
                rightPadding: 50
                color : "white"
                text : modelData.name
                font.pixelSize : 16
                font.family : "Poppins"
                font.bold : true
                width : parent.width - 60
                elide : Text.ElideRight
            }
            
            Button {
                id: deleteDeviceButton
                text: "Delete"
                width: 50
                height: 20
                anchors.right: parent.right
                anchors.rightMargin: 5
                anchors.verticalCenter: parent.verticalCenter
                font.family: "Poppins"
                font.pixelSize: 10
                background: Rectangle {
                    color: parent.pressed ? "#cc0000" : "#ff0000"
                    radius: 2
                }
                contentItem: Text {
                    text: parent.text
                    color: "#ffffff"
                    font: parent.font
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                onClicked: {
                    deleteDevice(modelData.deviceId)
                }
            }
            
            MouseArea {
                anchors.fill : parent
                anchors.rightMargin: 60
                cursorShape : Qt.PointingHandCursor
                hoverEnabled : true
                onEntered: {
                    if (parent.color == "#212d3a")
                    {
                        parent.color = "#2e3f4f"
                    }
                }
                onExited: {
                    if (parent.color == "#2e3f4f")
                    {
                        parent.color = "#212d3a"
                    }
                }
                onClicked: {
                    try {
    selectedDevices = JSON.parse(service.getSetting("General", "SelectedDevices"));
} catch (e) {
    selectedDevices = [];
}

                        if (selectedDevices.length == 0)
                        {
                            selectedDevices.push(modelData)
                            parent.color = "#209e20"
                            service.saveSetting("General", "SelectedDevices", JSON.stringify(selectedDevices))
                            service.log("Device '" + modelData.name + "' selected. Click 'Connect Devices' to connect to SignalRGB.")
                        } else {
                        for (var i = 0; i < selectedDevices.length; i++) {
                            if (selectedDevices[i].deviceId === modelData.deviceId)
                            {
                                let deviceIdToRemove = modelData.deviceId
                                parent.color = "#212d3a";
                                selectedDevices.splice(i, 1);
                                service.saveSetting("General", "SelectedDevices", JSON.stringify(selectedDevices))

                                discovery.removedDevices(deviceIdToRemove);
                                service.log("Device '" + modelData.name + "' deselected.")
                                return
                            }
                        }
                        selectedDevices.push(modelData)
                        parent.color = "#209e20"
                        service.saveSetting("General", "SelectedDevices", JSON.stringify(selectedDevices))
                        service.log("Device '" + modelData.name + "' selected. Click 'Connect Devices' to connect to SignalRGB.")
                    }
                }
            }
        }
    }
}
}
}
}