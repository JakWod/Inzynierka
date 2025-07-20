// Cyberpunk Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarContent = document.getElementById('sidebarContent');
    const pairedDevicesList = document.getElementById('paired-devices-list');
    const discoveredDevicesList = document.getElementById('discovered-devices-list');
    const connectedDeviceSection = document.getElementById('connected-device-section');
    const connectedDeviceContainer = document.getElementById('connected-device-container');
    const favoriteDevicesSection = document.getElementById('favorite-devices-section');
    const sidebarFilterName = document.getElementById('sidebar-filter-name');
    const sidebarFilterType = document.getElementById('sidebar-filter-type');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const toggleSections = document.querySelectorAll('.toggle-section');
    
    // Global variables
    let pairedDevices = [];
    let discoveredDevices = [];
    let connectedDevice = null;
    let isConnected = false;
    
    // Initialize
    loadPairedDevices();
    
    // Sidebar toggle functionality
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            addToLog('Sidebar toggled', 'INFO');
        });
    }
    
    // Filter event listeners
    if (sidebarFilterName) {
        sidebarFilterName.addEventListener('input', function() {
            applyDeviceFilters();
        });
    }
    
    if (sidebarFilterType) {
        sidebarFilterType.addEventListener('change', function() {
            applyDeviceFilters();
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            if (sidebarFilterName) sidebarFilterName.value = '';
            if (sidebarFilterType) sidebarFilterType.value = '';
            applyDeviceFilters();
            addToLog('Filters cleared', 'INFO');
        });
    }
    
    // Obsługa zwijania/rozwijania sekcji
    if (toggleSections) {
        toggleSections.forEach(section => {
            section.addEventListener('click', function() {
                const targetId = this.dataset.target;
                const targetElement = document.getElementById(targetId);
                const toggleIcon = this.querySelector('.dropdown-toggle');
                
                if (targetElement) {
                    if (targetElement.style.display === 'none') {
                        targetElement.style.display = 'block';
                        if (toggleIcon) toggleIcon.classList.add('open');
                    } else {
                        targetElement.style.display = 'none';
                        if (toggleIcon) toggleIcon.classList.remove('open');
                    }
                }
            });
        });
    }
    
    /**
     * Utility Functions
     */
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

    function getDeviceTypeFromName(name) {
        const nameLower = name.toLowerCase();
        if (nameLower.includes('headphone') || nameLower.includes('headset') || 
            nameLower.includes('earphone') || nameLower.includes('earbud')) {
            return 'headphones';
        } else if (nameLower.includes('speaker') || nameLower.includes('soundbar')) {
            return 'speaker';
        } else if (nameLower.includes('mouse')) {
            return 'mouse';
        } else if (nameLower.includes('keyboard')) {
            return 'keyboard';
        } else if (nameLower.includes('gamepad') || nameLower.includes('controller') || nameLower.includes('joystick')) {
            return 'gamepad';
        } else if (nameLower.includes('phone')) {
            return 'phone';
        } else if (nameLower.includes('tablet') || nameLower.includes('ipad')) {
            return 'tablet';
        } else if (nameLower.includes('laptop') || nameLower.includes('notebook')) {
            return 'laptop';
        } else if (nameLower.includes('desktop') || nameLower.includes('pc')) {
            return 'desktop';
        }
        return 'other';
    }
    
    /**
     * Ładuje urządzenia z API i localStorage
     */
    async function loadPairedDevices() {
        try {
            // Pobierz ulubione urządzenia z localStorage
            pairedDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
            
            // Pobierz urządzenia z API
            const response = await fetch('/get_paired_devices');
            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                    // Wszystkie urządzenia z API trafiają do discovered
                    discoveredDevices = result.devices.map(device => ({
                        ...device,
                        id: device.address,
                        type: getDeviceTypeFromName(device.name),
                        connected: false,
                        favorite: false // Początkowo nie są ulubione
                    }));
                    
                    addToLog(`Loaded ${discoveredDevices.length} discovered devices and ${pairedDevices.length} favorite devices`, 'SUCCESS');
                }
            }
        } catch (error) {
            addToLog(`Failed to load devices: ${error.message}`, 'ERROR');
            // Fallback do localStorage
            pairedDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
            discoveredDevices = [];
        }
        
        // Sprawdź status połączenia
        await checkConnectionStatus();
        
        // Wyświetl urządzenia
        displayPairedDevices();
        displayDiscoveredDevices();
    }
    
    /**
     * Sprawdza status połączenia
     */
    async function checkConnectionStatus() {
        try {
            const response = await fetch('/connection_status');
            if (response.ok) {
                const result = await response.json();
                isConnected = result.connected;
                
                if (result.connected && result.address) {
                    // Znajdź połączone urządzenie
                    const device = pairedDevices.find(d => d.address === result.address);
                    if (device) {
                        connectedDevice = { ...device, connected: true };
                        device.connected = true;
                    } else {
                        connectedDevice = {
                            name: 'Connected Device',
                            address: result.address,
                            type: 'other',
                            connected: true,
                            battery: getBatteryLevel(),
                            signal: getSignalStrength(),
                            security: 'AES-256'
                        };
                    }
                } else {
                    connectedDevice = null;
                    // Oznacz wszystkie urządzenia jako niepołączone
                    pairedDevices.forEach(device => {
                        device.connected = false;
                    });
                }
                
                updateConnectionDisplay();
            }
        } catch (error) {
            addToLog(`Failed to check connection status: ${error.message}`, 'ERROR');
        }
    }
    
    /**
     * Wyświetla ulubione urządzenia
     */
    function displayPairedDevices() {
        if (!pairedDevicesList || !favoriteDevicesSection) return;
        
        // Filtruj urządzenia (usuń połączone z głównej listy)
        const favoriteDevices = pairedDevices.filter(device => !device.connected);
        
        // Wyświetl ulubione urządzenia
        if (favoriteDevices.length === 0) {
            // Ukryj sekcję jeśli brak ulubionych
            favoriteDevicesSection.style.display = 'none';
        } else {
            // Pokaż sekcję i urządzenia
            favoriteDevicesSection.style.display = 'block';
            pairedDevicesList.innerHTML = favoriteDevices.map(device => createDeviceCard(device)).join('');
        }
        
        // Zastosuj filtry
        applyDeviceFilters();
    }
    
    /**
     * Wyświetla znalezione urządzenia
     */
    function displayDiscoveredDevices() {
        if (!discoveredDevicesList) return;
        
        if (discoveredDevices.length === 0) {
            discoveredDevicesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>
                    <p>NO_DEVICES_DETECTED</p>
                    <small>RUN_SCAN_PROTOCOL</small>
                </div>
            `;
        } else {
            discoveredDevicesList.innerHTML = discoveredDevices.map(device => createDeviceCard(device)).join('');
        }
        
        // Zastosuj filtry
        applyDeviceFilters();
    }
    
    /**
     * Aktualizuje wyświetlanie połączonego urządzenia
     */
    function updateConnectionDisplay() {
        if (!connectedDeviceSection || !connectedDeviceContainer) return;
        
        if (isConnected && connectedDevice) {
            connectedDeviceSection.style.display = 'block';
            connectedDeviceContainer.innerHTML = createDeviceCard(connectedDevice, true);
        } else {
            connectedDeviceSection.style.display = 'none';
        }
    }
    
    /**
     * Tworzy kartę urządzenia
     */
    function createDeviceCard(device, isConnected = false) {
        return `
            <div class="device-card ${isConnected ? 'connected' : ''}" data-device='${JSON.stringify(device)}'>
                <div class="device-info">
                    <div class="device-name">${(device.name).toUpperCase()}</div>
                    <div class="device-address">${device.address}</div>
                    <div class="device-type">${(device.type || 'other').toUpperCase()}</div>
                </div>
                
                <div class="device-card-footer">
                    <div class="device-favorite ${device.favorite ? 'active' : ''}" onclick="toggleFavorite('${device.address}')" title="${device.favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${device.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                    </div>
                    <div class="device-actions">
                        <button class="device-edit" onclick="editDevice('${device.address}')" title="Edytuj urządzenie">EDIT</button>
                        ${
                            !isConnected && !device.connected
                                ? `<button class="connect-btn" onclick="connectToDevice('${device.address}')">CONNECT</button>`
                                : isConnected
                                    ? `<button class="disconnect-btn" onclick="disconnectFromDevice()">DISCONNECT</button>`
                                    : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Filtruje urządzenia
     */
    function applyDeviceFilters() {
        const nameFilter = sidebarFilterName ? sidebarFilterName.value.toLowerCase() : '';
        const typeFilter = sidebarFilterType ? sidebarFilterType.value : '';
        
        // Filtruj wszystkie listy urządzeń
        const allDeviceCards = [
            ...(pairedDevicesList ? pairedDevicesList.querySelectorAll('.device-card') : []),
            ...(discoveredDevicesList ? discoveredDevicesList.querySelectorAll('.device-card') : [])
        ];
        
        allDeviceCards.forEach(card => {
            try {
                const deviceData = JSON.parse(card.dataset.device);
                const deviceName = deviceData.name.toLowerCase();
                const deviceAddress = deviceData.address.toLowerCase();
                const deviceType = deviceData.type || 'other';
                
                let shouldShow = true;
                
                // Sprawdź filtr nazwy lub adresu MAC
                if (nameFilter && !deviceName.includes(nameFilter) && !deviceAddress.includes(nameFilter)) {
                    shouldShow = false;
                }
                
                // Sprawdź filtr typu
                if (typeFilter && deviceType !== typeFilter) {
                    shouldShow = false;
                }
                
                // Zastosuj widoczność
                card.style.display = shouldShow ? 'block' : 'none';
            } catch (error) {
                console.warn('Error filtering device:', error);
            }
        });
    }
    
    /**
     * Łączy z urządzeniem
     */
    window.connectToDevice = async function(address) {
        try {
            addToLog(`Attempting to connect to ${address}...`, 'CONNECT');
            
            const formData = new FormData();
            formData.append('address', address);
            
            const response = await fetch('/connect', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                setTimeout(async () => {
                    await checkConnectionStatus();
                    displayPairedDevices();
                }, 2000);
                
                addToLog(`Connection request sent for ${address}`, 'INFO');
                showToast(`Connecting to device ${address}...`, 'info');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            addToLog(`Failed to connect to ${address}: ${error.message}`, 'ERROR');
            showToast(`Failed to connect to device`, 'error');
        }
    };
    
    /**
     * Rozłącza urządzenie
     */
    window.disconnectFromDevice = async function() {
        try {
            addToLog('Disconnecting device...', 'DISCONNECT');
            
            const response = await fetch('/disconnect', {
                method: 'POST'
            });
            
            if (response.ok) {
                isConnected = false;
                connectedDevice = null;
                
                // Oznacz wszystkie urządzenia jako niepołączone
                pairedDevices.forEach(device => {
                    device.connected = false;
                });
                
                updateConnectionDisplay();
                displayPairedDevices();
                
                addToLog('Device disconnected', 'SUCCESS');
                showToast('Device disconnected', 'info');
            } else {
                throw new Error('Disconnection failed');
            }
        } catch (error) {
            addToLog(`Failed to disconnect: ${error.message}`, 'ERROR');
            showToast('Failed to disconnect device', 'error');
        }
    };
    
    /**
     * Przełącza status ulubionego dla urządzenia
     */
    function toggleFavorite(address) {
        // Sprawdź czy urządzenie jest już w ulubionych
        let deviceIndex = pairedDevices.findIndex(device => device.address === address);
        
        if (deviceIndex !== -1) {
            // Urządzenie jest w ulubionych - usuń je i przenieś z powrotem do discovered
            const device = pairedDevices[deviceIndex];
            pairedDevices.splice(deviceIndex, 1);
            
            // Sprawdź czy nie ma już w discovered
            const existsInDiscovered = discoveredDevices.find(d => d.address === address);
            if (!existsInDiscovered) {
                // Dodaj z powrotem do discovered z favorite: false
                discoveredDevices.push({
                    ...device,
                    favorite: false
                });
            } else {
                // Zaktualizuj status w discovered
                const discoveredIndex = discoveredDevices.findIndex(d => d.address === address);
                if (discoveredIndex !== -1) {
                    discoveredDevices[discoveredIndex].favorite = false;
                }
            }
            
            addToLog(`Device removed from favorites`, 'INFO');
        } else {
            // Urządzenie nie jest w ulubionych - znajdź je w discovered i dodaj do ulubionych
            const discoveredIndex = discoveredDevices.findIndex(device => device.address === address);
            if (discoveredIndex !== -1) {
                const device = discoveredDevices[discoveredIndex];
                
                // Dodaj do ulubionych
                pairedDevices.push({
                    ...device,
                    favorite: true
                });
                
                // Usuń z discovered
                discoveredDevices.splice(discoveredIndex, 1);
                
                addToLog(`Device ${device.name} added to favorites`, 'INFO');
            }
        }
        
        // Zapisz w localStorage
        localStorage.setItem('favoriteDevices', JSON.stringify(pairedDevices));
        
        // Odśwież wyświetlanie
        displayPairedDevices();
        displayDiscoveredDevices();
    }
    
    /**
     * Dodaje urządzenie do ulubionych
     */
    function addPairedDevice(device) {
        const existingDeviceIndex = pairedDevices.findIndex(d => d.address === device.address);
        
        if (existingDeviceIndex !== -1) {
            // Zaktualizuj istniejące urządzenie
            pairedDevices[existingDeviceIndex] = { ...pairedDevices[existingDeviceIndex], ...device };
        } else {
            // Dodaj nowe urządzenie do ulubionych
            pairedDevices.push({
                name: device.name || 'Unknown Device',
                address: device.address,
                type: device.type || getDeviceTypeFromName(device.name || ''),
                connected: device.connected || false,
                favorite: true
            });
            
            addToLog(`Added new device to favorites: ${device.name || 'Unknown Device'}`, 'SUCCESS');
        }
        
        // Zapisz w localStorage
        localStorage.setItem('favoriteDevices', JSON.stringify(pairedDevices));
        
        // Odśwież wyświetlanie
        displayPairedDevices();
        displayDiscoveredDevices();
    }
    
    /**
     * Edytuje urządzenie
     */
    function editDevice(address) {
        const device = [...pairedDevices, ...discoveredDevices].find(d => d.address === address);
        if (device) {
            addToLog(`Opening edit dialog for device: ${device.name}`, 'INFO');
            // Tutaj można dodać modal do edycji urządzenia
            // Na razie tylko log
            console.log('Edit device:', device);
        }
    }
    
    /**
     * Dodaje wpis do logu
     */
    function addToLog(message, level = 'INFO') {
        const logContainer = document.querySelector('.log-container');
        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] [${level}] ${message}`;
            logContainer.insertBefore(logEntry, logContainer.firstChild);
        }
        console.log(`[${level}] ${message}`);
    }
    
    /**
     * Wyświetla toast notification
     */
    function showToast(message, type = 'info') {
        // Implementacja toast notification jeśli istnieje
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        }
    }
    
    // Sprawdzaj status połączenia co 5 sekund
    setInterval(checkConnectionStatus, 5000);
    
    // Nasłuchuj na zdarzenia połączenia z urządzeniem
    window.addEventListener('deviceConnected', function(e) {
        if (e.detail && e.detail.device) {
            addPairedDevice(e.detail.device);
        }
    });
    
    // Udostępnij funkcje globalnie
    window.toggleFavorite = toggleFavorite;
    window.addPairedDevice = addPairedDevice;
    window.loadPairedDevices = loadPairedDevices;
    window.checkConnectionStatus = checkConnectionStatus;
    window.editDevice = editDevice;
});