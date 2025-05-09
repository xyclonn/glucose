class ArduinoMonitor {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
        
        // DOM elements
        this.connectButton = document.getElementById('connectButton');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.bpmValue = document.getElementById('bpmValue');
        this.spo2Value = document.getElementById('spo2Value');
        this.glucoseValue = document.getElementById('glucoseValue');
        
        // Bind event listeners
        this.connectButton.addEventListener('click', () => this.toggleConnection());
    }

    async toggleConnection() {
        if (!this.isConnected) {
            await this.connect();
        } else {
            await this.disconnect();
        }
    }

    async connect() {
        try {
            // Request Bluetooth device
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service'] // Add your Arduino's service UUID here
            });

            // Connect to the device
            const server = await this.device.gatt.connect();
            
            // Get the service
            const service = await server.getPrimaryService('battery_service'); // Replace with your service UUID
            
            // Get the characteristic for notifications
            this.characteristic = await service.getCharacteristic('battery_level'); // Replace with your characteristic UUID
            
            // Enable notifications
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', this.handleData.bind(this));
            
            // Update UI
            this.isConnected = true;
            this.connectButton.textContent = 'Disconnect';
            this.connectionStatus.textContent = 'Connected';
            this.connectionStatus.style.color = '#4CAF50';
            
            // Listen for disconnection
            this.device.addEventListener('gattserverdisconnected', () => this.handleDisconnection());
            
        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect to device: ' + error);
        }
    }

    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }
        this.handleDisconnection();
    }

    handleDisconnection() {
        this.isConnected = false;
        this.connectButton.textContent = 'Connect to Arduino';
        this.connectionStatus.textContent = 'Disconnected';
        this.connectionStatus.style.color = '#666';
        
        // Reset values
        this.bpmValue.textContent = '--';
        this.spo2Value.textContent = '--';
        this.glucoseValue.textContent = '--';
    }

    handleData(event) {
        const decoder = new TextDecoder('utf-8');
        const data = decoder.decode(event.target.value);
        
        // Parse the incoming data
        if (data.includes('Ortalama BPM:')) {
            const bpm = data.split(':')[1].trim();
            this.bpmValue.textContent = bpm;
        } else if (data.includes('Ortalama SpO2:')) {
            const spo2 = data.split(':')[1].trim();
            this.spo2Value.textContent = spo2;
        } else if (data.includes('Glukoz:')) {
            const glucose = data.split(':')[1].trim();
            this.glucoseValue.textContent = glucose;
        }
    }
}

// Initialize the application
const monitor = new ArduinoMonitor(); 