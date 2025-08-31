/**
 * Terminal Main JavaScript - Cyberpunk Terminal Interface
 * Contains terminal functionality, tab switching, device management, and device control panel
 * UPDATED: Removed media controls, added device control panel
 */

document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // DOM ELEMENTS
    // ========================================
    
    // Terminal elements
    const terminalInterface = document.querySelector('.terminal-interface');
    const terminalHeader = document.querySelector('.terminal-header');
    const terminalContent = document.querySelector('.terminal-content');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Device grid
    const devicesGrid = document.getElementById('devicesGrid');
    const devicesTab = document.getElementById('devicesTab');
    
    // Logs
    const logsTab = document.getElementById('logsTab');
    const logsContent = document.getElementById('logsContent');
    
    // Device Control Panel
    const controlPanelContent = document.getElementById('controlPanelContent');
    
    // Modal elements
    const scanModal = document.getElementById('scanModal');
    const scanModalContent = document.getElementById('scanModalContent');
    const closeScanModal = document.getElementById('closeScanModal');
    const deviceModal = document.getElementById('deviceModal');
    const deviceModalContent = document.getElementById('deviceModalContent');
    const closeDeviceModal = document.getElementById('closeDeviceModal');
    
    // Scan buttons
    const headerScanBtn = document.getElementById('header-scan-btn');
    const minecraftPlayBtn = document.querySelector('.minecraft-play-button');
    
    // ========================================
    // GLOBAL VARIABLES
    // ========================================
    
    let currentTab = 'devices';
    let logs = [];
    let isScanning = false;
    let discoveredDevices = [];
    let pairedDevices = [];
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    initializeTerminal();
    setupTabSwitching();
    setupScanningIntegration();
    setupDeviceControlPanel();
    setupModals();
    loadInitialData();
    
    console.log('Terminal interface initialized successfully');
    
    // ========================================
    // DEVICE NAME TRUNCATION FUNCTIONS
    // ========================================
    
    /**
     * Truncates device name for terminal cards (30 chars + "...")
     * @param {string} name - Device name
     * @param {number} maxLength - Maximum length (default 30)
     * @returns {string} - Truncated name
     */
    function truncateDeviceName(name, maxLength = 30) {
        if (!name || name === 'Unknown Device' || name === 'Nieznane urządzenie') {
            return name || 'Unknown Device';
        }
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength) + '...';
    }
    
    /**
     * Truncates device name responsively based on screen width
     * @param {string} name - Device name
     * @returns {string} - Responsively truncated name
     */
    function truncateDeviceNameResponsive(name) {
        if (!name || name === 'Unknown Device' || name === 'Nieznane urządzenie') {
            return name || 'Unknown Device';
        }
        
        const screenWidth = window.innerWidth;
        let maxLength;
        
        if (screenWidth <= 480) {
            maxLength = 18; // Very small screens
        } else if (screenWidth <= 768) {
            maxLength = 24; // Medium screens
        } else {
            maxLength = 30; // Large screens
        }
        
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength) + '...';
    }
    
    // ========================================
    // TERMINAL INITIALIZATION
    // ========================================
    
    function initializeTerminal() {
        addLog('NEURAL_INTERFACE_TERMINAL initialized', 'SUCCESS');
        addLog('Scanning for available protocols...', 'INFO');
        addLog('AES-256 encryption activated', 'SECURITY');
        
        // Initialize empty device grid
        updateDevicesGrid([]);
        
        // Initialize logs display
        updateLogsDisplay();
        
        // Initialize device control panel
        updateDeviceControlPanel();
        
        addLog('Terminal ready for neural link operations', 'SUCCESS');
    }
    
    // ========================================
    // DEVICE CONTROL PANEL
    // ========================================
    
    function setupDeviceControlPanel() {
        // Initial load only - no auto-refresh to allow editing
        updateDeviceControlPanelForConnection();
    }
    
    function updateDeviceControlPanel() {
        updateDeviceControlPanelForConnection();
    }
    
    function updateDeviceControlPanelForConnection() {
        fetch('/connection_status')
            .then(response => response.json())
            .then(data => {
                console.log('Connection status response:', data);
                if (!controlPanelContent) return;
                
                if (data.connected && data.address) {
                    // Show control panel for connected device
                    console.log('Showing control panel for device:', data.address);
                    showControlPanelForDevice(data.address);
                } else {
                    // Show no device connected message
                    console.log('No device connected, showing empty state');
                    showControlPanelEmptyState();
                }
            })
            .catch(error => {
                console.error('Failed to check connection status for control panel:', error);
                showControlPanelEmptyState();
            });
    }
    
    function showControlPanelForDevice(deviceAddress) {
        if (!controlPanelContent) return;
        
        // Show header and border when device is connected
        const controlPanelHeader = document.querySelector('.control-panel-header');
        const deviceControlPanel = document.querySelector('.device-control-panel');
        const deviceInfoSection = document.getElementById('deviceInfoSection');
        
        if (controlPanelHeader) {
            controlPanelHeader.style.display = 'flex';
            
            // Add ONLINE status to header
            let statusElement = controlPanelHeader.querySelector('.control-panel-status');
            if (!statusElement) {
                statusElement = document.createElement('div');
                statusElement.className = 'control-panel-status connection-status';
                statusElement.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(74 222 128)" stroke-width="2">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                        <line x1="12" y1="20" x2="12.01" y2="20"></line>
                    </svg>
                    <span>ONLINE</span>
                `;
                statusElement.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 6px;
                    padding: 8px 12px;
                    color: rgb(74 222 128);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.75rem;
                    font-weight: 500;
                `;
                controlPanelHeader.appendChild(statusElement);
            }
        }
        
        if (deviceControlPanel) {
            const controlPanelContentEl = deviceControlPanel.querySelector('.control-panel-content');
            if (controlPanelContentEl) {
                controlPanelContentEl.style.border = '2px solid rgb(74 222 128)';
                controlPanelContentEl.style.borderTop = 'none';
                controlPanelContentEl.style.borderRadius = '0 0 8px 8px';
            }
        }
        
        // Get device info from stored devices and load buttons
        let deviceName = 'Connected Device';
        let deviceType = 'Unknown';
        let deviceButtons = [];
        let deviceBattery = 85;
        let deviceSignal = -65;
        
        try {
            // Use same data sources as sidebar: favoriteDevices and discoveredDevices
            const favoriteDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
            const sidebarDiscoveredDevices = JSON.parse(localStorage.getItem('discoveredDevices') || '[]');
            
            console.log('Device lookup:', { 
                deviceAddress, 
                favoriteDevices, 
                sidebarDiscoveredDevices,
                terminalDiscoveredDevices: discoveredDevices 
            });
            
            // Check favorite devices first
            let connectedDevice = favoriteDevices.find(device => device.address === deviceAddress);
            
            // Then check sidebar's discovered devices
            if (!connectedDevice) {
                connectedDevice = sidebarDiscoveredDevices.find(device => device.address === deviceAddress);
            }
            
            // Finally check terminal's discovered devices
            if (!connectedDevice) {
                connectedDevice = discoveredDevices.find(device => device.address === deviceAddress);
            }
            
            console.log('Found device:', connectedDevice);
            
            if (connectedDevice) {
                deviceName = connectedDevice.name || 'Connected Device';
                deviceType = connectedDevice.type || 'Unknown';
                deviceBattery = connectedDevice.battery || Math.floor(Math.random() * 100) + 1;
                deviceSignal = connectedDevice.signal || -65;
            }
            
            console.log('Final device data:', { deviceName, deviceType, deviceBattery, deviceSignal });
            
            // Load device buttons from localStorage
            deviceButtons = getStoredDeviceButtons(deviceAddress);
        } catch (error) {
            console.error('Error loading device info:', error);
        }
        
        // Show and populate device info section
        if (deviceInfoSection) {
            deviceInfoSection.style.display = 'block';
            populateDeviceInfoSection(deviceName, deviceAddress, deviceType, deviceBattery, deviceSignal);
        }
        
        controlPanelContent.innerHTML = `
            <div class="control-panel-connected-state">
                <div class="control-interface-section">
                    <div class="control-interface-header">
                        <h3 class="control-interface-title">
                            CONTROL_INTERFACE:
                        </h3>
                        <button class="control-configure-btn" onclick="openDeviceEditModal('${deviceAddress}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span>CONFIGURE</span>
                        </button>
                    </div>
                    
                    <div class="control-quick-actions-section">
                        <h4 class="control-quick-actions-title">QUICK_ACTIONS:</h4>
                        <div class="control-quick-actions-grid">
                            <button class="control-quick-action-btn unpair-btn" onclick="unpairCurrentDevice('${deviceAddress}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                                    <rect x="2" y="9" width="4" height="12"/>
                                    <circle cx="4" cy="4" r="2"/>
                                    <line x1="22" y1="4" x2="16" y2="10"/>
                                    <line x1="16" y1="4" x2="22" y2="10"/>
                                </svg>
                                <span>UNPAIR</span>
                            </button>
                            <button class="control-quick-action-btn disconnect-btn" onclick="disconnectDevice('${deviceAddress}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                    <line x1="12" y1="2" x2="12" y2="12"></line>
                                </svg>
                                <span>DISCONNECT</span>
                            </button>
                            <button class="control-quick-action-btn refresh-btn" onclick="refreshDeviceConnection('${deviceAddress}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="1,4 1,10 7,10"></polyline>
                                    <polyline points="23,20 23,14 17,14"></polyline>
                                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                                </svg>
                                <span>REFRESH</span>
                            </button>
                            <button class="control-quick-action-btn add-btn" onclick="addCustomButton('${deviceAddress}')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>ADD_BTN</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="control-custom-controls-section">
                        <h4 class="control-custom-controls-title">CUSTOM_CONTROLS</h4>
                        <div class="control-custom-controls-grid" id="controlCustomButtonsGrid">
                            ${deviceButtons.length > 0 ? generateControlDeviceButtons(deviceButtons, deviceAddress) : generateControlEmptyButtonsState()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        addLog(`Device control panel activated for ${deviceAddress} with ${deviceButtons.length} buttons`, 'INFO');
    }
    
    function showControlPanelEmptyState() {
        if (!controlPanelContent) return;
        
        // Hide header and border when no device is connected
        const controlPanelHeader = document.querySelector('.control-panel-header');
        const deviceControlPanel = document.querySelector('.device-control-panel');
        const deviceInfoSection = document.getElementById('deviceInfoSection');
        
        if (controlPanelHeader) {
            controlPanelHeader.style.display = 'none';
            
            // Remove status element if it exists
            const statusElement = controlPanelHeader.querySelector('.control-panel-status');
            if (statusElement) {
                statusElement.remove();
            }
        }
        
        // Hide device info section
        if (deviceInfoSection) {
            deviceInfoSection.style.display = 'none';
        }
        
        if (deviceControlPanel) {
            deviceControlPanel.querySelector('.control-panel-content').style.border = 'none';
            deviceControlPanel.querySelector('.control-panel-content').style.borderRadius = '8px';
        }
        
        controlPanelContent.innerHTML = `
            <div class="control-panel-empty-state">
                <div class="control-panel-empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="12" cy="12" r="9.5" fill="none" stroke="#6b7280" stroke-width="0.5"/>
                        <circle cx="12" cy="12" r="5" fill="#6b7280" stroke="none"/>
                    </svg>
                </div>
                <h3>NO_ACTIVE_CONNECTION</h3>
                <p>Connect to a device to access control panel</p>
                <div class="control-panel-info">
                    <h4>CONTROL_FEATURES:</h4>
                    <ul>
                        <li>• Device status monitoring</li>
                        <li>• Custom button controls</li>
                        <li>• Quick disconnect option</li>
                        <li>• Real-time command execution</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    function generateControlDeviceButtons(buttons, deviceAddress) {
        if (!buttons || buttons.length === 0) {
            return generateControlEmptyButtonsState();
        }
        
        return buttons.map((button, index) => {
            const functionIcon = getControlFunctionIcon(button.function);
            const functionLabel = getControlFunctionLabel(button.function);
            return `
                <div class="control-device-button-item" data-button-index="${index}">
                    <div class="control-button-header">
                        <div class="control-button-icon">${functionIcon}</div>
                        <div class="control-button-info">
                            <div class="control-button-name">${button.name}</div>
                            <div class="control-button-function">${functionLabel}</div>
                        </div>
                    </div>
                    <div class="control-button-details">
                        <span class="control-button-commands">${button.commands.length} ${button.commands.length === 1 ? 'command' : 'commands'}</span>
                    </div>
                    <div class="control-button-actions">
                        <button class="control-test-btn" onclick="testDeviceButtonInControl(${index}, '${deviceAddress}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5,3 19,12 5,21"/>
                            </svg>
                            <span>EXECUTE</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function generateControlEmptyButtonsState() {
        return `
            <div class="control-custom-buttons-empty">
                <div class="control-custom-buttons-empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                        <path d="M9 9l6 6m0-6l-6 6"/>
                    </svg>
                </div>
                <h4>NO_DEVICE_BUTTONS</h4>
                <p>Configure device buttons in EDIT modal</p>
            </div>
        `;
    }
    
    function getControlFunctionIcon(functionType) {
        const icons = {
            power: '<i class="fas fa-power-off"></i>',
            'volume-up': '<i class="fas fa-volume-up"></i>',
            'volume-down': '<i class="fas fa-volume-down"></i>',
            'play-pause': '<i class="fas fa-play"></i>',
            next: '<i class="fas fa-step-forward"></i>',
            previous: '<i class="fas fa-step-backward"></i>',
            light: '<i class="fas fa-lightbulb"></i>',
            custom: '<i class="fas fa-cog"></i>'
        };
        
        return icons[functionType] || '<i class="fas fa-hand-pointer"></i>';
    }
    
    function getControlFunctionLabel(functionType) {
        const labels = {
            power: 'Power Control',
            'volume-up': 'Volume Up',
            'volume-down': 'Volume Down',
            'play-pause': 'Play/Pause',
            next: 'Next Track',
            previous: 'Previous Track',
            light: 'Light/LED',
            custom: 'Custom Function'
        };
        
        return labels[functionType] || 'Standard Control';
    }
    
    function testDeviceButtonInControl(buttonIndex, deviceAddress) {
        const deviceButtons = getStoredDeviceButtons(deviceAddress);
        const button = deviceButtons[buttonIndex];
        
        if (!button) {
            addLog('Button not found', 'ERROR');
            return;
        }
        
        addLog(`Executing button: ${button.name}`, 'INFO');
        
        // Find the button element and add visual feedback
        const buttonElement = document.querySelector(`[data-button-index="${buttonIndex}"] .control-test-btn`);
        if (buttonElement) {
            const originalContent = buttonElement.innerHTML;
            buttonElement.disabled = true;
            buttonElement.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="2"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3">
                        <animate attributeName="r" values="2;10;2" dur="1s" repeatCount="indefinite"/>
                    </circle>
                </svg>
                <span>SENDING...</span>
            `;
            
            setTimeout(() => {
                buttonElement.disabled = false;
                buttonElement.innerHTML = originalContent;
            }, 2000);
        }
        
        // Execute button commands
        executeButtonCommands(button.commands, deviceAddress);
        
        if (typeof window.showToast === 'function') {
            window.showToast(`Executed: ${button.name}`, 'info', 2000);
        }
    }
    
    function populateDeviceInfoSection(deviceName, deviceAddress, deviceType, battery, signal) {
        const deviceInfoName = document.getElementById('deviceInfoName');
        const deviceInfoMac = document.getElementById('deviceInfoMac');
        const deviceInfoProtocol = document.getElementById('deviceInfoProtocol');
        const deviceInfoBattery = document.getElementById('deviceInfoBattery');
        const deviceInfoBatteryBar = document.getElementById('deviceInfoBatteryBar');
        const deviceInfoSignal = document.getElementById('deviceInfoSignal');
        const deviceInfoSignalBar = document.getElementById('deviceInfoSignalBar');
        
        if (deviceInfoName) {
            deviceInfoName.textContent = deviceName.toUpperCase();
        }
        
        if (deviceInfoMac) {
            deviceInfoMac.textContent = deviceAddress;
        }
        
        if (deviceInfoProtocol) {
            deviceInfoProtocol.textContent = `${deviceType.toUpperCase()}_PROTOCOL`;
        }
        
        if (deviceInfoBattery && deviceInfoBatteryBar) {
            deviceInfoBattery.textContent = `${battery}%`;
            deviceInfoBatteryBar.style.width = `${battery}%`;
            
            // Update battery color classes
            deviceInfoBattery.classList.remove('low', 'medium');
            deviceInfoBatteryBar.classList.remove('low', 'medium');
            
            if (battery <= 30) {
                deviceInfoBattery.classList.add('low');
                deviceInfoBatteryBar.classList.add('low');
            } else if (battery <= 60) {
                deviceInfoBattery.classList.add('medium');
                deviceInfoBatteryBar.classList.add('medium');
            }
        }
        
        if (deviceInfoSignal && deviceInfoSignalBar) {
            deviceInfoSignal.textContent = `${signal}dBm`;
            
            // Calculate signal strength percentage like in device cards
            const signalStrength = Math.min(100, Math.max(0, ((signal + 100) * 1.25)));
            deviceInfoSignalBar.style.width = `${signalStrength}%`;
        }
    }
    
    // Global function for onclick handlers
    window.testDeviceButtonInControl = testDeviceButtonInControl;
    
    window.disconnectCurrentDevice = function(deviceAddress) {
        addLog(`Disconnecting from device ${deviceAddress}...`, 'DISCONNECT');
        
        fetch('/disconnect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `address=${encodeURIComponent(deviceAddress)}`
        })
        .then(response => {
            addLog(`Disconnected from device ${deviceAddress}`, 'SUCCESS');
            updateDeviceConnectionStatus(deviceAddress, false);
            refreshDevicesGrid();
            updateDeviceControlPanelForConnection();
            
            if (typeof window.showToast === 'function') {
                window.showToast(`Disconnected from device`, 'info', 3000);
            }
        })
        .catch(error => {
            console.error('Disconnect error:', error);
            addLog(`Failed to disconnect from ${deviceAddress}`, 'ERROR');
        });
    };
    
    window.openDeviceEditModal = function(deviceAddress) {
        // This would trigger the device edit modal from the main application
        // For now, we'll just log the action
        addLog(`Opening edit modal for device ${deviceAddress}`, 'INFO');
        
        if (typeof window.showToast === 'function') {
            window.showToast(`Edit functionality will be available soon`, 'info', 3000);
        }
    };
    
    window.unpairCurrentDevice = function(deviceAddress) {
        addLog(`Unpairing device ${deviceAddress}...`, 'WARNING');
        
        if (confirm(`Are you sure you want to unpair device ${deviceAddress}?`)) {
            // Remove from localStorage
            try {
                const favoriteDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
                const discoveredDevices = JSON.parse(localStorage.getItem('discoveredDevices') || '[]');
                
                const updatedFavorites = favoriteDevices.filter(d => d.address !== deviceAddress);
                const updatedDiscovered = discoveredDevices.filter(d => d.address !== deviceAddress);
                
                localStorage.setItem('favoriteDevices', JSON.stringify(updatedFavorites));
                localStorage.setItem('discoveredDevices', JSON.stringify(updatedDiscovered));
                
                // Also remove from pairedDevices if it exists
                const pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
                const updatedPaired = pairedDevices.filter(d => d.address !== deviceAddress);
                localStorage.setItem('pairedDevices', JSON.stringify(updatedPaired));
                
                addLog(`Device ${deviceAddress} unpaired successfully`, 'SUCCESS');
                
                // Disconnect first if connected
                disconnectCurrentDevice(deviceAddress);
                
                // Update UI
                refreshDevicesGrid();
                updateDeviceControlPanelForConnection();
                
                if (typeof window.showToast === 'function') {
                    window.showToast(`Device unpaired successfully`, 'success', 3000);
                }
            } catch (error) {
                console.error('Error unpairing device:', error);
                addLog(`Failed to unpair device ${deviceAddress}`, 'ERROR');
            }
        }
    };
    
    window.refreshDeviceConnection = function(deviceAddress) {
        addLog(`Refreshing connection for device ${deviceAddress}...`, 'INFO');
        
        // First disconnect
        disconnectCurrentDevice(deviceAddress);
        
        // Wait a bit then reconnect
        setTimeout(() => {
            // Find device name for connection
            try {
                const favoriteDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
                const discoveredDevices = JSON.parse(localStorage.getItem('discoveredDevices') || '[]');
                
                let device = favoriteDevices.find(d => d.address === deviceAddress) || 
                           discoveredDevices.find(d => d.address === deviceAddress);
                
                if (device) {
                    connectToDevice(deviceAddress, device.name);
                }
            } catch (error) {
                console.error('Error refreshing connection:', error);
            }
        }, 2000);
        
        if (typeof window.showToast === 'function') {
            window.showToast(`Refreshing connection...`, 'info', 3000);
        }
    };
    
    window.addCustomButton = function(deviceAddress) {
        addLog(`Adding custom button for device ${deviceAddress}...`, 'INFO');
        
        if (typeof window.showToast === 'function') {
            window.showToast(`Custom button functionality will be available soon`, 'info', 3000);
        }
    };
    
    function executeButtonCommands(commands, deviceAddress) {
        if (!commands || commands.length === 0) {
            addLog('No commands to execute', 'WARNING');
            return;
        }
        
        console.log('Executing button commands:', commands);
        addLog(`Executing ${commands.length} command${commands.length > 1 ? 's' : ''} for device ${deviceAddress}`, 'INFO');
        
        // Execute each command with proper delay
        commands.forEach((cmd, index) => {
            setTimeout(() => {
                const command = cmd.command || cmd.hex;
                if (command) {
                    sendCommandToDevice(command, deviceAddress);
                } else {
                    addLog(`Empty command at index ${index}`, 'WARNING');
                }
            }, cmd.delay || 0);
        });
    }
    
    function sendCommandToDevice(command, deviceAddress) {
        if (!command) {
            addLog('Empty command - skipping', 'WARNING');
            return;
        }
        
        addLog(`Sending command: ${command} to device ${deviceAddress}`, 'INFO');
        
        fetch('/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `data=${encodeURIComponent(command)}`
        })
        .then(response => response.text())
        .then(result => {
            if (result.includes('success') || result.includes('sent')) {
                addLog(`Command ${command} sent successfully`, 'SUCCESS');
            } else {
                addLog(`Command response: ${result}`, 'INFO');
            }
        })
        .catch(error => {
            console.error('Command send error:', error);
            addLog(`Error sending command ${command}: ${error.message}`, 'ERROR');
        });
    }
    
    function getStoredDeviceButtons(deviceAddress) {
        try {
            const key = `device_buttons_${deviceAddress}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading device buttons:', error);
            return [];
        }
    }
    
    // ========================================
    // TAB SWITCHING FUNCTIONALITY
    // ========================================
    
    function setupTabSwitching() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                switchTab(tabName);
            });
        });
    }
    
    function switchTab(tabName) {
        // Update tab buttons
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}Tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        currentTab = tabName;
        addLog(`Switched to ${tabName.toUpperCase()} tab`, 'INFO');
        
        // Trigger specific tab initialization
        switch(tabName) {
            case 'devices':
                refreshDevicesGrid();
                break;
            case 'logs':
                updateLogsDisplay();
                break;
        }
    }
    
    // ========================================
    // SCANNING INTEGRATION
    // ========================================
    
    function setupScanningIntegration() {
        // Integrate with header scan button
        if (headerScanBtn) {
            headerScanBtn.addEventListener('click', function() {
                startScanProcess();
            });
        }
        
        // Integrate with minecraft scan button if exists
        if (minecraftPlayBtn) {
            minecraftPlayBtn.addEventListener('click', function() {
                startScanProcess();
            });
        }
        
        // Listen for scan events from other modules
        window.addEventListener('scanStarted', function() {
            startScanProcess();
        });
        
        window.addEventListener('scanCompleted', function(e) {
            if (e.detail && e.detail.devices) {
                handleScanResults(e.detail.devices);
            }
        });
    }
    
    function startScanProcess() {
        if (isScanning) return;
        
        isScanning = true;
        showScanModal();
        addLog('Neural scan protocol initiated', 'SCAN');
        
        // Start actual scan
        fetch('/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'show_results=true'
        })
        .then(response => {
            console.log('Scan request completed');
            // Wait a bit then fetch results
            setTimeout(() => {
                fetchScanResults();
            }, 2000);
        })
        .catch(error => {
            console.error('Scan error:', error);
            addLog(`[ERROR] Scan failed: ${error.message}`, 'ERROR');
            showScanError();
        });
    }
    
    function fetchScanResults() {
        fetch('/get_discovered_devices')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const devices = data.devices || [];
                    const uniqueDevices = devices.filter((device, index, array) => 
                        array.findIndex(d => d.address === device.address) === index
                    );
                    handleScanResults(devices);
                    addLog(`Scan completed - ${uniqueDevices.length} unique devices detected`, 'SUCCESS');
                } else {
                    console.error('Failed to fetch scan results:', data.message);
                    showScanError();
                }
            })
            .catch(error => {
                console.error('Error fetching scan results:', error);
                showScanError();
            });
    }
    
    function handleScanResults(devices) {
        discoveredDevices = devices || [];
        
        // Count unique devices for accurate reporting
        const uniqueDevices = discoveredDevices.filter((device, index, array) => 
            array.findIndex(d => d.address === device.address) === index
        );
        const uniqueCount = uniqueDevices.length;
        
        completeScan(discoveredDevices);
        
        // Switch to devices tab to show results
        // This will trigger refreshDevicesGrid() automatically via switchTab()
        if (currentTab !== 'devices') {
            switchTab('devices');
        } else {
            // If already on devices tab, manually refresh
            refreshDevicesGrid();
        }
        
        isScanning = false;
        
        // Show notification
        if (typeof window.showToast === 'function') {
            if (uniqueCount === 0) {
                window.showToast('No devices found during scan', 'warning', 4000);
            } else {
                const deviceText = uniqueCount === 1 ? 'device' : 'devices';
                window.showToast(`Found ${uniqueCount} ${deviceText}`, 'success', 4000);
            }
        }
    }
    
    function showScanError() {
        isScanning = false;
        if (scanModalContent) {
            scanModalContent.innerHTML = `
                <div class="scan-progress">
                    <div class="scan-error-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ef4444;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </div>
                    <h3 style="color: #ef4444;">SCAN_FAILED</h3>
                    <p>Unable to complete neural network scan</p>
                    <button class="scan-connect-btn" onclick="scanModal.style.display = 'none';" style="margin-top: 1rem;">
                        CLOSE
                    </button>
                </div>
            `;
        }
        addLog('Scan protocol failed', 'ERROR');
    }
    
    // ========================================
    // DEVICE GRID MANAGEMENT
    // ========================================
    
    function updateDevicesGrid(devices = []) {
        if (!devicesGrid) return;
        
        if (devices.length === 0) {
            devicesGrid.innerHTML = `
                <div class="empty-terminal-state">
                    <div class="empty-terminal-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                    </div>
                    <h3>NO_DEVICES_DETECTED</h3>
                    <p>INITIATE_SCAN_PROTOCOL_TO_DISCOVER_TARGETS</p>
                    <div class="scan-tips">
                        <h4>SCAN_OPTIMIZATION_TIPS:</h4>
                        <ul>
                            <li>• ENABLE_BLUETOOTH_PROTOCOL</li>
                            <li>• ACTIVATE_DEVICE_PAIRING_MODE</li>
                            <li>• MAINTAIN_PROXIMITY_<10M</li>
                            <li>• CLEAR_INTERFERENCE_CHANNELS</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }
        
        // Remove duplicates based on device address
        const uniqueDevices = devices.filter((device, index, array) => 
            array.findIndex(d => d.address === device.address) === index
        );
        
        devicesGrid.innerHTML = uniqueDevices.map(device => createDeviceTerminalCard(device)).join('');
        addLog(`Updated devices grid with ${uniqueDevices.length} unique devices`, 'INFO');
    }
    
    function createDeviceTerminalCard(device) {
        const truncatedName = truncateDeviceNameResponsive(device.name || 'Unknown Device');
        const batteryLevel = device.battery || Math.floor(Math.random() * 100) + 1;
        const batteryColor = getBatteryColor(batteryLevel);
        const signalStrength = Math.min(100, ((device.signal || -70) + 100) * 1.25);
        const signalColor = getSignalColor(device.signal || -70);
        const isConnected = device.connected || false;
        const deviceAddress = device.address || '00:00:00:00:00:00';
        
        return `
            <div class="device-terminal-card" onclick="showDeviceModal('${deviceAddress}', '${device.name || 'Unknown Device'}')">
                
                    
                    <div class="device-badges">
                        ${isConnected ? `
                            <div class="device-badge connected">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22,4 12,14.01 9,11.01"></polyline>
                                </svg>
                                <span>ONLINE</span>
                            </div>
                        ` : ''}
                        <div class="device-badge security">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            <span>${device.security || 'AES-256'}</span>
                        </div>
                    </div>
                
                
                <div class="device-terminal-info">
                    <h3 title="${device.name || 'Unknown Device'}">${(truncatedName).toUpperCase()}</h3>
                    <div class="device-address">${deviceAddress}</div>
                    <div class="device-type">${(device.type || 'other').toUpperCase()}_PROTOCOL</div>
                </div>
                
                <div class="device-stats-grid">
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
                                    <line x1="23" y1="13" x2="23" y2="11"></line>
                                </svg>
                                <span>PWR</span>
                            </div>
                            <span class="stat-value" style="color: ${batteryColor}">${batteryLevel}%</span>
                        </div>
                        <div class="stat-bar">
                            <div class="stat-fill battery ${getBatteryClass(batteryLevel)}" style="width: ${batteryLevel}%"></div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-label">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M2 17h20v2H2zm1.15-4.05L4 11l.85 1.95L6.8 13l-1.95.85L4 15.8l-.85-1.95L1.2 13l1.95-.85zM17 3l.85 1.95L19.8 5l-1.95.85L17 7.8l-.85-1.95L14.2 5l1.95-.85L17 3zm-5 4l.85 1.95L14.8 9l-1.95.85L12 11.8l-.85-1.95L9.2 9l1.95-.85L12 7z"></path>
                                </svg>
                                <span>SIG</span>
                            </div>
                            <span class="stat-value" style="color: ${signalColor}">${device.signal || -70}dBm</span>
                        </div>
                        <div class="stat-bar">
                            <div class="stat-fill signal" style="width: ${signalStrength}%"></div>
                        </div>
                    </div>
                </div>
                
                ${!isConnected ? `
                    <button class="terminal-connect-btn" onclick="event.stopPropagation(); connectToDevice('${deviceAddress}', '${device.name || 'Unknown Device'}')">
                        ESTABLISH_CONNECTION
                    </button>

                ` : `
                    <button class="terminal-connect-btn" onclick="event.stopPropagation(); disconnectDevice('${deviceAddress}')" style="border-color: #ef4444; color: #ef4444;">
                        DISCONNECT
                    </button>
                `}
            </div>
        `;
    }
    
    function refreshDevicesGrid() {
        // Use discovered devices from scan results as primary source
        if (discoveredDevices.length > 0) {
            updateDevicesGrid(discoveredDevices);
        } else {
            // Fallback to paired devices if no scan results
            try {
                const storedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
                updateDevicesGrid(storedDevices);
            } catch (error) {
                console.error('Error loading stored devices:', error);
                updateDevicesGrid([]);
            }
        }
        
        addLog(`Refreshed devices grid`, 'INFO');
    }
    
    // ========================================
    // DEVICE UTILITY FUNCTIONS
    // ========================================
    
    function getDeviceIcon(type) {
        const icons = {
            headphones: '🎧',
            speaker: '🔊',
            mouse: '🖱️',
            keyboard: '⌨️',
            gamepad: '🎮',
            phone: '📱',
            tablet: '📱',
            laptop: '💻',
            desktop: '🖥️'
        };
        return icons[type] || '📱';
    }
    
    function getBatteryColor(battery) {
        if (battery > 60) return 'rgb(74 222 128)';
        if (battery > 30) return '#eab308';
        return '#ef4444';
    }
    
    function getBatteryClass(battery) {
        if (battery > 60) return '';
        if (battery > 30) return 'medium';
        return 'low';
    }
    
    function getSignalColor(signal) {
        if (signal > -70) return 'rgb(74 222 128)';
        if (signal > -85) return '#eab308';
        return '#ef4444';
    }
    
    // ========================================
    // DEVICE CONNECTION FUNCTIONS
    // ========================================
    
    window.connectToDevice = function(address, name) {
        addLog(`Initiating neural link with device ${address}...`, 'CONNECT');
        
        // Find and update connect button
        const deviceCard = document.querySelector(`[onclick*="${address}"]`);
        if (deviceCard) {
            const connectBtn = deviceCard.querySelector('.terminal-connect-btn');
            if (connectBtn) {
                const originalText = connectBtn.innerHTML;
                connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> LINKING...';
                connectBtn.disabled = true;
                
                // Attempt actual connection
                fetch('/connect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `address=${encodeURIComponent(address)}`
                })
                .then(response => {
                    setTimeout(() => {
                        checkConnectionResult(address, name, connectBtn);
                    }, 2000);
                })
                .catch(error => {
                    console.error('Connection error:', error);
                    addLog(`Neural link failed with ${address}: ${error.message}`, 'ERROR');
                    connectBtn.innerHTML = originalText;
                    connectBtn.disabled = false;
                    
                    if (typeof window.showToast === 'function') {
                        window.showToast(`Failed to connect to ${name}`, 'error', 5000);
                    }
                });
            }
        }
    };
    
    function checkConnectionResult(address, name, connectBtn) {
        fetch('/connection_status')
            .then(response => response.json())
            .then(data => {
                const isConnected = data.connected;
                const connectedAddress = data.address || '';
                
                if (isConnected && connectedAddress === address) {
                    addLog(`Neural link established with ${address}`, 'SUCCESS');
                    
                    connectBtn.innerHTML = 'CONNECTED';
                    connectBtn.style.backgroundColor = 'rgb(74 222 128)';
                    connectBtn.style.borderColor = 'rgb(74 222 128)';
                    connectBtn.style.color = '#000';
                    connectBtn.disabled = true;
                    
                    // Update device status in grid
                    updateDeviceConnectionStatus(address, true);
                    
                    // Update device control panel
                    updateDeviceControlPanelForConnection();
                    
                    // Trigger sidebar update
                    window.dispatchEvent(new CustomEvent('deviceConnectionChanged', {
                        detail: {
                            address: address,
                            connected: true
                        }
                    }));
                    
                    if (typeof window.showToast === 'function') {
                        window.showToast(`Successfully connected to ${name}`, 'success', 5000);
                    }
                } else {
                    addLog(`Neural link failed with ${address}`, 'ERROR');
                    connectBtn.innerHTML = 'ESTABLISH_CONNECTION';
                    connectBtn.disabled = false;
                    
                    if (typeof window.showToast === 'function') {
                        window.showToast(`Failed to connect to ${name}`, 'error', 5000);
                    }
                }
            })
            .catch(error => {
                console.error('Error checking connection status:', error);
                addLog(`Error checking connection status`, 'ERROR');
                connectBtn.innerHTML = 'ESTABLISH_CONNECTION';
                connectBtn.disabled = false;
            });
    }
    
    window.disconnectDevice = function(address) {
        addLog(`Disconnecting from device ${address}...`, 'DISCONNECT');
        
        fetch('/disconnect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `address=${encodeURIComponent(address)}`
        })
        .then(response => {
            addLog(`Disconnected from device ${address}`, 'SUCCESS');
            updateDeviceConnectionStatus(address, false);
            refreshDevicesGrid();
            
            // Update device control panel after disconnect
            updateDeviceControlPanelForConnection();
            
            if (typeof window.showToast === 'function') {
                window.showToast(`Disconnected from device`, 'info', 3000);
            }
        })
        .catch(error => {
            console.error('Disconnect error:', error);
            addLog(`Failed to disconnect from ${address}`, 'ERROR');
        });
    };
    
    function updateDeviceConnectionStatus(address, connected) {
        // Update in discovered devices array
        const deviceIndex = discoveredDevices.findIndex(device => device.address === address);
        if (deviceIndex !== -1) {
            discoveredDevices[deviceIndex].connected = connected;
        }
    }
    
    window.showDeviceModal = function(address, name) {
        if (!deviceModal || !deviceModalContent) return;
        
        const truncatedName = truncateDeviceName(name);
        const device = discoveredDevices.find(d => d.address === address) || { name, address };
        const isConnected = device.connected || false;
        
        deviceModalContent.innerHTML = `
            <div class="device-modal-content">
                <div class="device-modal-header">
                    <div class="device-modal-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                    </div>
                    <h3 title="${name}">${truncatedName}</h3>
                    <div class="device-address">${address}</div>
                    <div class="device-type">BLUETOOTH_PROTOCOL</div>
                </div>
                
                <div class="device-modal-stats">
                    <div class="device-modal-stat">
                        <div class="device-modal-stat-header">
                            <div class="device-modal-stat-label">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22,4 12,14.01 9,11.01"></polyline>
                                </svg>
                                <span>CONNECTION</span>
                            </div>
                            <div class="connection-badge ${isConnected ? 'online' : 'offline'}">
                                ${isConnected ? `
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                                    </svg>
                                    <span>ONLINE</span>
                                ` : `
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                    <span>OFFLINE</span>
                                `}
                            </div>
                        </div>
                    </div>
                    
                    <div class="device-modal-stat">
                        <div class="device-modal-stat-header">
                            <div class="device-modal-stat-label">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <span>SECURITY</span>
                            </div>
                            <div class="security-badge">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <span>AES-256</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="device-modal-actions">
                    ${!isConnected ? `
                        <button class="device-modal-primary-btn" onclick="connectToDevice('${address}', '${name}'); deviceModal.style.display = 'none';">
                            ESTABLISH_NEURAL_LINK
                        </button>
                    ` : `
                        <button class="device-modal-primary-btn" onclick="disconnectDevice('${address}'); deviceModal.style.display = 'none';" style="border-color: #ef4444; color: #ef4444;">
                            TERMINATE_CONNECTION
                        </button>
                    `}
                    
                    <div class="device-modal-secondary-actions">
                        <button class="device-modal-secondary-btn" onclick="addDeviceToSidebar('${address}', '${name}', '${device.type || 'other'}'); deviceModal.style.display = 'none';">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>ADD_TO_LIST</span>
                        </button>
                        <button class="device-modal-secondary-btn danger" onclick="deviceModal.style.display = 'none';">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            <span>CLOSE</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        deviceModal.style.display = 'flex';
        addLog(`Opened device analysis for ${truncatedName}`, 'INFO');
    };
    
    window.addDeviceToSidebar = function(address, name, type) {
        // Check if device already exists
        try {
            const pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
            const existingDevice = pairedDevices.find(device => device.address === address);
            
            if (existingDevice) {
                if (typeof window.showToast === 'function') {
                    window.showToast('Device already in paired list', 'warning', 4000);
                }
                return;
            }
            
            // Add device to sidebar
            const newDevice = {
                name: name || 'Unknown Device',
                address: address,
                type: type || 'other',
                connected: false,
                customNotes: ''
            };
            
            // Trigger device addition event
            window.dispatchEvent(new CustomEvent('deviceConnected', {
                detail: { device: newDevice }
            }));
            
            if (typeof window.showToast === 'function') {
                window.showToast(`Device added to paired list`, 'success', 4000);
            }
            
            addLog(`Added device ${name} to paired list`, 'SUCCESS');
            
        } catch (error) {
            console.error('Error adding device to sidebar:', error);
            addLog(`Failed to add device to paired list`, 'ERROR');
        }
    };
    
    // ========================================
    // LOGS MANAGEMENT
    // ========================================
    
    function addLog(message, level = 'INFO') {
        const timestamp = new Date();
        const logEntry = {
            timestamp,
            level,
            message
        };
        
        logs.unshift(logEntry);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs = logs.slice(0, 100);
        }
        
        updateLogsDisplay();
        console.log(`[${level}] ${message}`);
    }
    
    function updateLogsDisplay() {
        if (!logsContent) return;
        
        if (logs.length === 0) {
            logsContent.innerHTML = `
                <div class="logs-empty-state">
                    <div class="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10,9 9,9 8,9"></polyline>
                        </svg>
                    </div>
                    <h3>NO_SYSTEM_LOGS</h3>
                    <p>NEURAL_INTERFACE_OPERATIONS_WILL_APPEAR_HERE</p>
                </div>
            `;
            return;
        }
        
        logsContent.innerHTML = logs.map(log => `
            <div class="log-entry">
                <span class="log-timestamp">[${formatTimestamp(log.timestamp)}]</span>
                <span class="log-level ${log.level.toLowerCase()}">[${log.level}]</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
        
        // Auto-scroll to top (newest first)
        logsContent.scrollTop = 0;
    }
    
    function formatTimestamp(timestamp) {
        return timestamp.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    }
    
    // ========================================
    // MODAL MANAGEMENT
    // ========================================
    
    function setupModals() {
        // Scan modal
        if (closeScanModal) {
            closeScanModal.addEventListener('click', () => {
                scanModal.style.display = 'none';
            });
        }
        
        // Device modal
        if (closeDeviceModal) {
            closeDeviceModal.addEventListener('click', () => {
                deviceModal.style.display = 'none';
            });
        }
        
        // Close modals on overlay click
        [scanModal, deviceModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            }
        });
        
        // Close modals on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (scanModal && scanModal.style.display === 'flex') {
                    scanModal.style.display = 'none';
                }
                if (deviceModal && deviceModal.style.display === 'flex') {
                    deviceModal.style.display = 'none';
                }
            }
        });
    }
    
    function showScanModal() {
        if (!scanModal || !scanModalContent) return;
        
        scanModalContent.innerHTML = `
            <div class="scan-progress">
                <div class="scan-spinner">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                        <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
                        <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
                        <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
                        <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                        <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                </div>
                <h3>SCANNING_NEURAL_NETWORKS...</h3>
                <p>DETECTING_BLUETOOTH_SIGNATURES_IN_PROXIMITY</p>
            </div>
        `;
        
        scanModal.style.display = 'flex';
        addLog('Neural scan protocol initiated', 'SCAN');
    }
    
    function completeScan(devices) {
        if (!scanModalContent) return;
        
        if (devices.length === 0) {
            scanModalContent.innerHTML = `
                <div class="scan-progress">
                    <div style="margin-bottom: 1rem; color: #eab308; text-align: center;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #eab308;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3 style="color: #eab308;">NO_TARGETS_DETECTED</h3>
                    <p>No Bluetooth devices found in range</p>
                    <button class="scan-connect-btn" onclick="scanModal.style.display = 'none'; startScanProcess();" style="margin-top: 1rem;">
                        RESCAN
                    </button>
                </div>
            `;
            return;
        }
        
        // Remove duplicates based on device address before showing in modal
        const uniqueDevices = devices.filter((device, index, array) => 
            array.findIndex(d => d.address === device.address) === index
        );
        
        scanModalContent.innerHTML = `
            <div class="scan-results">
                <div style="margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between;">
                    <p style="color: rgb(74 222 128); font-family: 'JetBrains Mono', monospace;">
                        SCAN_COMPLETE: ${uniqueDevices.length} UNIQUE_TARGET${uniqueDevices.length !== 1 ? 'S' : ''}_DETECTED
                    </p>
                    <div style="color: #3b82f6; font-family: 'JetBrains Mono', monospace; font-size: 0.875rem;">
                        STATUS: READY_FOR_CONNECTION
                    </div>
                </div>
                
                ${uniqueDevices.map(device => {
                    const truncatedName = truncateDeviceName(device.name || 'Unknown Device', 20);
                    return `
                        <div class="scan-result-item">
                            <div class="scan-result-info">
                                <div class="scan-result-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                    </svg>
                                </div>
                                <div class="scan-result-details">
                                    <h4 title="${device.name || 'Unknown Device'}">${truncatedName.toUpperCase()}</h4>
                                    <div class="device-address">${device.address}</div>
                                    <div class="scan-result-meta">
                                        <span class="device-type">${(device.type || 'other').toUpperCase()}_PROTOCOL</span>
                                        <span class="device-security">AES-256</span>
                                        <span class="device-signal">SIG:${device.signal || -70}dBm</span>
                                    </div>
                                </div>
                            </div>
                            <button class="scan-connect-btn" onclick="connectToDevice('${device.address}', '${device.name || 'Unknown Device'}'); scanModal.style.display = 'none';">
                                CONNECT
                            </button>
                        </div>
                    `;
                }).join('')}
                
                <div style="margin-top: 1rem; text-align: center;">
                    <button class="scan-connect-btn" onclick="scanModal.style.display = 'none';" style="background: rgba(0, 255, 65, 0.1); border-color: rgb(74 222 128); color: rgb(74 222 128);">
                        VIEW_IN_TERMINAL
                    </button>
                </div>
            </div>
        `;
        
        isScanning = false;
        addLog(`Scan completed - ${uniqueDevices.length} unique devices detected`, 'SUCCESS');
    }
    
    // ========================================
    // DATA LOADING
    // ========================================
    
    function loadInitialData() {
        // Load initial logs
        addLog('System initialized successfully', 'SUCCESS');
        addLog('Bluetooth protocol v5.2 activated', 'INFO');
        addLog('Encryption protocols loaded', 'SECURITY');
        addLog('Ready for neural link operations', 'SUCCESS');
        
        // Load any existing devices
        refreshDevicesGrid();
    }
    
    // ========================================
    // EVENT LISTENERS FOR EXTERNAL INTEGRATION
    // ========================================
    
    // Listen for device updates from sidebar
    window.addEventListener('deviceListUpdated', function(e) {
        refreshDevicesGrid();
        addLog('Device list synchronized', 'INFO');
    });
    
    // Listen for connection status changes
    window.addEventListener('deviceConnectionChanged', function(e) {
        if (e.detail && e.detail.address) {
            addLog(`Connection status changed for ${e.detail.address}`, 'INFO');
            updateDeviceConnectionStatus(e.detail.address, e.detail.connected);
            refreshDevicesGrid();
            
            // Update device control panel when connection status changes
            updateDeviceControlPanelForConnection();
        }
    });
    
    // Handle responsive device name truncation on window resize
    window.addEventListener('resize', function() {
        if (currentTab === 'devices') {
            refreshDevicesGrid();
        }
    });
    
    // ========================================
    // GLOBAL FUNCTIONS FOR EXTERNAL ACCESS
    // ========================================
    
    // Make functions available globally
    window.terminalFunctions = {
        addLog,
        refreshDevicesGrid,
        updateDevicesGrid,
        showScanModal,
        switchTab,
        truncateDeviceName,
        truncateDeviceNameResponsive,
        startScanProcess,
        handleScanResults
    };
    
    // Export addLog for other modules
    window.addTerminalLog = addLog;
    
    // Export device name truncation
    window.truncateDeviceNameTerminal = truncateDeviceName;
    
    // Debug function to manually check connection status
    window.debugConnectionStatus = function() {
        console.log('=== DEBUG CONNECTION STATUS ===');
        fetch('/connection_status')
            .then(response => response.json())
            .then(data => {
                console.log('Connection status:', data);
                console.log('pairedDevices:', JSON.parse(localStorage.getItem('pairedDevices') || '[]'));
                console.log('discoveredDevices:', discoveredDevices);
                updateDeviceControlPanelForConnection();
            })
            .catch(error => console.error('Error:', error));
    };
    
    console.log('Terminal main functionality loaded successfully');
});