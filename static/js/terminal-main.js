/**
 * Terminal Main JavaScript - Cyberpunk Terminal Interface
 * Contains terminal functionality, tab switching, device management, and media controls
 * UPDATED: Fixed duplicate device display in scan results
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
    
    // Media controls
    const mediaTab = document.getElementById('mediaTab');
    const mediaPrevious = document.getElementById('mediaPrevious');
    const mediaPlayPause = document.getElementById('mediaPlayPause');
    const mediaNext = document.getElementById('mediaNext');
    const mediaStop = document.getElementById('mediaStop');
    const volumeDown = document.getElementById('volumeDown');
    const volumeMute = document.getElementById('volumeMute');
    const volumeUp = document.getElementById('volumeUp');
    
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
    let mediaPlaying = false;
    let currentVolume = 50;
    let isMuted = false;
    let discoveredDevices = [];
    let pairedDevices = [];
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    initializeTerminal();
    setupTabSwitching();
    setupScanningIntegration();
    setupMediaControls();
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
        
        // Set initial media state
        updateMediaControls();
        
        addLog('Terminal ready for neural link operations', 'SUCCESS');
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
            case 'media':
                updateMediaControls();
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
    // MEDIA CONTROLS
    // ========================================
    
    function setupMediaControls() {
        if (mediaPrevious) {
            mediaPrevious.addEventListener('click', () => executeMediaCommand('previous'));
        }
        
        if (mediaPlayPause) {
            mediaPlayPause.addEventListener('click', () => executeMediaCommand('play_pause'));
        }
        
        if (mediaNext) {
            mediaNext.addEventListener('click', () => executeMediaCommand('next'));
        }
        
        if (mediaStop) {
            mediaStop.addEventListener('click', () => executeMediaCommand('stop'));
        }
        
        if (volumeDown) {
            volumeDown.addEventListener('click', () => executeMediaCommand('volume_down'));
        }
        
        if (volumeMute) {
            volumeMute.addEventListener('click', () => executeMediaCommand('mute'));
        }
        
        if (volumeUp) {
            volumeUp.addEventListener('click', () => executeMediaCommand('volume_up'));
        }
    }
    
    function executeMediaCommand(command) {
        addLog(`Executing media command: ${command.toUpperCase()}`, 'MEDIA');
        
        // Update button states with visual feedback
        const button = event.target.closest('.media-btn');
        if (button) {
            const originalContent = button.innerHTML;
            button.style.transform = 'scale(0.95)';
            button.style.opacity = '0.7';
            
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.style.opacity = '1';
            }, 150);
        }
        
        switch(command) {
            case 'play_pause':
                mediaPlaying = !mediaPlaying;
                updatePlayPauseButton();
                break;
            case 'volume_down':
                currentVolume = Math.max(0, currentVolume - 10);
                addLog(`Volume decreased to ${currentVolume}%`, 'MEDIA');
                break;
            case 'volume_up':
                currentVolume = Math.min(100, currentVolume + 10);
                addLog(`Volume increased to ${currentVolume}%`, 'MEDIA');
                break;
            case 'mute':
                isMuted = !isMuted;
                updateMuteButton();
                addLog(`Audio ${isMuted ? 'muted' : 'unmuted'}`, 'MEDIA');
                break;
            case 'stop':
                mediaPlaying = false;
                updatePlayPauseButton();
                addLog('Media playback stopped', 'MEDIA');
                break;
            case 'previous':
                addLog('Skipped to previous track', 'MEDIA');
                break;
            case 'next':
                addLog('Skipped to next track', 'MEDIA');
                break;
        }
        
        // Show toast notification
        if (typeof window.showToast === 'function') {
            window.showToast(`Media: ${command.replace('_', ' ').toUpperCase()}`, 'info', 2000);
        }
    }
    
    function updateMediaControls() {
        updatePlayPauseButton();
        updateMuteButton();
    }
    
    function updatePlayPauseButton() {
        if (!mediaPlayPause) return;
        
        const icon = mediaPlayPause.querySelector('svg');
        const text = mediaPlayPause.querySelector('span');
        
        if (mediaPlaying) {
            icon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
            text.textContent = 'PAUSE';
            mediaPlayPause.classList.add('playing');
        } else {
            icon.innerHTML = '<polygon points="5,3 19,12 5,21"></polygon>';
            text.textContent = 'PLAY';
            mediaPlayPause.classList.remove('playing');
        }
    }
    
    function updateMuteButton() {
        if (!volumeMute) return;
        
        const icon = volumeMute.querySelector('svg');
        const text = volumeMute.querySelector('span');
        
        if (isMuted) {
            icon.innerHTML = '<polygon points="11,5 6,9 2,9 2,15 6,15 11,19"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line>';
            text.textContent = 'UNMUTE';
            volumeMute.classList.add('muted');
        } else {
            icon.innerHTML = '<polygon points="11,5 6,9 2,9 2,15 6,15 11,19"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
            text.textContent = 'MUTE';
            volumeMute.classList.remove('muted');
        }
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
    
    console.log('Terminal main functionality loaded successfully');
});