// Cyberpunk Sidebar functionality - POPRAWIONA WERSJA
// Fixes: 
// - Gradient scrollbar working properly
// - Devices now save to localStorage properly (favorites + discovered)
// - New devices go to "discovered" by default, not "favorites"  
// - Connected devices appear in "active connection" only
// - Auto-refresh temporarily disabled
// - Connected devices have simplified UI (no favorite star, no edit button, no device type)
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

    function getBatteryLevel() {
        // Symulowana funkcja - w rzeczywistości można by pobierać te dane z API
        return Math.floor(Math.random() * 100);
    }

    function getSignalStrength() {
        // Symulowana funkcja - w rzeczywistości można by pobierać te dane z API
        return Math.floor(Math.random() * 100);
    }
    
    /**
     * Ładuje urządzenia z API i localStorage - POPRAWIONA WERSJA
     */
    async function loadPairedDevices() {
        try {
            // Pobierz ulubione urządzenia z localStorage
            pairedDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
            
            // Pobierz discovered devices z localStorage
            discoveredDevices = JSON.parse(localStorage.getItem('discoveredDevices') || '[]');
            
            addToLog(`Loaded from localStorage: ${pairedDevices.length} favorite devices and ${discoveredDevices.length} discovered devices`, 'INFO');
            
            // Pobierz urządzenia z API
            const response = await fetch('/get_paired_devices');
            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                    // Sprawdź które urządzenia z API nie są jeszcze w naszych listach
                    const apiDevices = result.devices;
                    
                    apiDevices.forEach(apiDevice => {
                        const deviceData = {
                            ...apiDevice,
                            id: apiDevice.address,
                            type: getDeviceTypeFromName(apiDevice.name),
                            connected: false,
                            favorite: false
                        };
                        
                        // Sprawdź czy urządzenie nie istnieje już w favorites lub discovered
                        const existsInFavorites = pairedDevices.find(d => d.address === apiDevice.address);
                        const existsInDiscovered = discoveredDevices.find(d => d.address === apiDevice.address);
                        
                        if (!existsInFavorites && !existsInDiscovered) {
                            // Dodaj do discovered devices
                            discoveredDevices.push(deviceData);
                            addToLog(`Added new API device to discovered: ${apiDevice.name}`, 'INFO');
                        }
                    });
                    
                    // Zapisz zaktualizowane discovered devices
                    localStorage.setItem('discoveredDevices', JSON.stringify(discoveredDevices));
                    
                    addToLog(`Total after API sync: ${discoveredDevices.length} discovered devices and ${pairedDevices.length} favorite devices`, 'SUCCESS');
                }
            }
        } catch (error) {
            addToLog(`Failed to load devices: ${error.message}`, 'ERROR');
            // Fallback do localStorage
            pairedDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
            discoveredDevices = JSON.parse(localStorage.getItem('discoveredDevices') || '[]');
        }
        
        // Sprawdź status połączenia
        await checkConnectionStatus();
        
        // Wyświetl urządzenia
        displayPairedDevices();
        displayDiscoveredDevices();
    }
    
    /**
     * Sprawdza status połączenia - POPRAWIONA WERSJA
     */
    async function checkConnectionStatus() {
        try {
            const response = await fetch('/connection_status');
            if (response.ok) {
                const result = await response.json();
                isConnected = result.connected;
                
                if (result.connected && result.address) {
                    // Znajdź połączone urządzenie w pairedDevices
                    const pairedDevice = pairedDevices.find(d => d.address === result.address);
                    
                    // Znajdź połączone urządzenie w discoveredDevices
                    const discoveredDevice = discoveredDevices.find(d => d.address === result.address);
                    
                    if (pairedDevice) {
                        connectedDevice = { ...pairedDevice, connected: true };
                        pairedDevice.connected = true;
                    } else if (discoveredDevice) {
                        connectedDevice = { ...discoveredDevice, connected: true };
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
                    
                    // Zaktualizuj status połączenia we wszystkich listach
                    pairedDevices.forEach(device => {
                        device.connected = device.address === result.address;
                    });
                    
                    discoveredDevices.forEach(device => {
                        device.connected = device.address === result.address;
                    });
                    
                } else {
                    connectedDevice = null;
                    // Oznacz wszystkie urządzenia jako niepołączone
                    pairedDevices.forEach(device => {
                        device.connected = false;
                    });
                    discoveredDevices.forEach(device => {
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
     * Wyświetla znalezione urządzenia - POPRAWIONA WERSJA
     */
    function displayDiscoveredDevices() {
        if (!discoveredDevicesList) return;
        
        // Filtruj połączone urządzenia z listy discovered (podobnie jak w pairedDevices)
        const nonConnectedDiscoveredDevices = discoveredDevices.filter(device => !device.connected);
        
        if (nonConnectedDiscoveredDevices.length === 0) {
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
            discoveredDevicesList.innerHTML = nonConnectedDiscoveredDevices.map(device => createDeviceCard(device)).join('');
        }
        
        // Zastosuj filtry
        applyDeviceFilters();
    }
    
    /**
     * Aktualizuje wyświetlanie połączonego urządzenia - POPRAWIONA WERSJA
     */
    function updateConnectionDisplay() {
        if (!connectedDeviceSection || !connectedDeviceContainer) return;
        
        addToLog(`Updating connection display: isConnected=${isConnected}, connectedDevice=${connectedDevice ? connectedDevice.name : 'null'}`, 'DEBUG');
        
        if (isConnected && connectedDevice) {
            connectedDeviceSection.style.display = 'block';
            connectedDeviceContainer.innerHTML = createDeviceCard(connectedDevice, true);
            addToLog(`Connected device section shown for: ${connectedDevice.name} (${connectedDevice.address})`, 'INFO');
        } else {
            connectedDeviceSection.style.display = 'none';
            addToLog('Connected device section hidden', 'INFO');
        }
    }
    
    /**
     * Tworzy kartę urządzenia - ZMODYFIKOWANA WERSJA
     * Dla połączonych urządzeń (isConnected = true) nie pokazuje:
     * - gwiazdki do dodawania do ulubionych
     * - przycisku edit
     * - typu urządzenia
     * Przycisk disconnect rozciąga się na całą szerokość
     */
    function createDeviceCard(device, isConnected = false) {
        if (isConnected) {
            // Uproszczona wersja dla połączonego urządzenia
            return `
                <div class="device-card connected" data-device='${JSON.stringify(device)}'>
                    <div class="device-info connected-device-info">
                        <div class="device-name">${(device.name).toUpperCase()}</div>
                        <div class="device-address">${device.address}</div>
                    </div>
                    
                    <div class="device-card-footer connected-device-footer">
                        <button class="disconnect-btn full-width" onclick="disconnectFromDevice()">TERMINATE_CONNECTION</button>
                    </div>
                </div>
            `;
        } else {
            // Standardowa wersja dla niepołączonych urządzeń
            return `
                <div class="device-card" data-device='${JSON.stringify(device)}'>
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
                            <button class="connect-btn" onclick="connectToDevice('${device.address}')">CONNECT</button>
                        </div>
                    </div>
                </div>
            `;
        }
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
                    displayDiscoveredDevices();
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
     * Rozłącza urządzenie - POPRAWIONA WERSJA
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
                
                discoveredDevices.forEach(device => {
                    device.connected = false;
                });
                
                // Zapisz stan do localStorage
                localStorage.setItem('favoriteDevices', JSON.stringify(pairedDevices));
                localStorage.setItem('discoveredDevices', JSON.stringify(discoveredDevices));
                
                updateConnectionDisplay();
                displayPairedDevices();
                displayDiscoveredDevices();
                
                addToLog('Device disconnected', 'SUCCESS');
                if (typeof window.showToast === 'function') {
                    window.showToast('Urządzenie rozłączone', 'info');
                }
            } else {
                throw new Error('Disconnection failed');
            }
        } catch (error) {
            addToLog(`Failed to disconnect: ${error.message}`, 'ERROR');
            if (typeof window.showToast === 'function') {
                window.showToast('Nie udało się rozłączyć urządzenia', 'error');
            }
        }
    };
    
    /**
     * Przełącza status ulubionego dla urządzenia - POPRAWIONA WERSJA
     */
    function toggleFavorite(address) {
        // Sprawdź czy urządzenie jest obecnie połączone
        const isCurrentlyConnected = (connectedDevice && connectedDevice.address === address);
        
        if (isCurrentlyConnected) {
            addToLog('Cannot change favorite status of connected device', 'WARNING');
            showToast('Nie można zmienić statusu ulubionego dla połączonego urządzenia', 'warning');
            return;
        }
        
        // Sprawdź czy urządzenie jest już w ulubionych
        let deviceIndex = pairedDevices.findIndex(device => device.address === address);
        
        if (deviceIndex !== -1) {
            // Urządzenie jest w ulubionych - usuń je i przenieś z powrotem do discovered
            const device = pairedDevices[deviceIndex];
            
            // Nie przenoś jeśli jest połączone
            if (device.connected) {
                addToLog('Cannot remove connected device from favorites', 'WARNING');
                showToast('Nie można usunąć połączonego urządzenia z ulubionych', 'warning');
                return;
            }
            
            // Usuń z favorites
            pairedDevices.splice(deviceIndex, 1);
            localStorage.setItem('favoriteDevices', JSON.stringify(pairedDevices));
            
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
            
            // Zapisz discovered devices
            localStorage.setItem('discoveredDevices', JSON.stringify(discoveredDevices));
            
            addToLog(`Device removed from favorites: ${device.name}`, 'INFO');
            showToast(`Urządzenie "${device.name}" usunięte z ulubionych`, 'info');
        } else {
            // Urządzenie nie jest w ulubionych - znajdź je w discovered i dodaj do ulubionych
            const discoveredIndex = discoveredDevices.findIndex(device => device.address === address);
            if (discoveredIndex !== -1) {
                const device = discoveredDevices[discoveredIndex];
                
                // Nie przenoś jeśli jest połączone
                if (device.connected) {
                    addToLog('Cannot add connected device to favorites - it should be in active connection', 'WARNING');
                    showToast('Połączone urządzenie powinno być w sekcji aktywnego połączenia', 'warning');
                    return;
                }
                
                // Usuń z discovered
                discoveredDevices.splice(discoveredIndex, 1);
                localStorage.setItem('discoveredDevices', JSON.stringify(discoveredDevices));
                
                // Dodaj do ulubionych
                pairedDevices.push({
                    ...device,
                    favorite: true
                });
                localStorage.setItem('favoriteDevices', JSON.stringify(pairedDevices));
                
                addToLog(`Device ${device.name} added to favorites`, 'INFO');
                showToast(`Urządzenie "${device.name}" dodane do ulubionych`, 'success');
            }
        }
        
        // Odśwież wyświetlanie
        displayPairedDevices();
        displayDiscoveredDevices();
    }
    
    /**
     * Dodaje urządzenie do discovered devices (nie favorites!) - POPRAWIONA WERSJA
     */
    function addPairedDevice(device) {
        // Sprawdź czy urządzenie już istnieje w którrejś z list
        const existsInFavorites = pairedDevices.find(d => d.address === device.address);
        const existsInDiscovered = discoveredDevices.find(d => d.address === device.address);
        
        if (existsInFavorites) {
            // Zaktualizuj istniejące urządzenie w favorites
            const deviceIndex = pairedDevices.findIndex(d => d.address === device.address);
            pairedDevices[deviceIndex] = { ...pairedDevices[deviceIndex], ...device };
            localStorage.setItem('favoriteDevices', JSON.stringify(pairedDevices));
            addToLog(`Updated existing favorite device: ${device.name || 'Unknown Device'}`, 'INFO');
        } else if (existsInDiscovered) {
            // Zaktualizuj istniejące urządzenie w discovered
            const deviceIndex = discoveredDevices.findIndex(d => d.address === device.address);
            discoveredDevices[deviceIndex] = { ...discoveredDevices[deviceIndex], ...device };
            localStorage.setItem('discoveredDevices', JSON.stringify(discoveredDevices));
            addToLog(`Updated existing discovered device: ${device.name || 'Unknown Device'}`, 'INFO');
        } else {
            // Dodaj nowe urządzenie do DISCOVERED DEVICES (nie favorites!)
            const newDevice = {
                name: device.name || 'Unknown Device',
                address: device.address,
                type: device.type || getDeviceTypeFromName(device.name || ''),
                connected: device.connected || false,
                favorite: false // Domyślnie nie jest ulubione
            };
            
            discoveredDevices.push(newDevice);
            localStorage.setItem('discoveredDevices', JSON.stringify(discoveredDevices));
            
            addToLog(`Added new device to DISCOVERED: ${device.name || 'Unknown Device'}`, 'SUCCESS');
        }
        
        // Odśwież wyświetlanie
        displayPairedDevices();
        displayDiscoveredDevices();
    }
    
    /**
     * Dodaje urządzenie bezpośrednio do ulubionych
     */
    function addDeviceToFavorites(device) {
        const existingDeviceIndex = pairedDevices.findIndex(d => d.address === device.address);
        
        if (existingDeviceIndex !== -1) {
            // Zaktualizuj istniejące urządzenie
            pairedDevices[existingDeviceIndex] = { ...pairedDevices[existingDeviceIndex], ...device, favorite: true };
        } else {
            // Dodaj nowe urządzenie do ulubionych
            pairedDevices.push({
                name: device.name || 'Unknown Device',
                address: device.address,
                type: device.type || getDeviceTypeFromName(device.name || ''),
                connected: device.connected || false,
                favorite: true
            });
        }
        
        // Usuń z discovered jeśli tam było
        const discoveredIndex = discoveredDevices.findIndex(d => d.address === device.address);
        if (discoveredIndex !== -1) {
            discoveredDevices.splice(discoveredIndex, 1);
            localStorage.setItem('discoveredDevices', JSON.stringify(discoveredDevices));
        }
        
        localStorage.setItem('favoriteDevices', JSON.stringify(pairedDevices));
        
        addToLog(`Added device to FAVORITES: ${device.name || 'Unknown Device'}`, 'SUCCESS');
        
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
    
    /**
     * Funkcje pomocnicze do debugowania
     */
    function clearAllDevices() {
        pairedDevices = [];
        discoveredDevices = [];
        localStorage.removeItem('favoriteDevices');
        localStorage.removeItem('discoveredDevices');
        displayPairedDevices();
        displayDiscoveredDevices();
        addToLog('All devices cleared', 'INFO');
    }
    
    function getDeviceStats() {
        const stats = {
            favorites: pairedDevices.length,
            discovered: discoveredDevices.length,
            connected: connectedDevice ? 1 : 0,
            total: pairedDevices.length + discoveredDevices.length
        };
        addToLog(`Device stats: ${JSON.stringify(stats)}`, 'INFO');
        return stats;
    }
    
    // Sprawdzaj status połączenia co 5 sekund - WYŁĄCZONE TYMCZASOWO
    // setInterval(checkConnectionStatus, 5000);
    
    // Nasłuchuj na zdarzenia połączenia z urządzeniem
    window.addEventListener('deviceConnected', function(e) {
        if (e.detail && e.detail.device) {
            addPairedDevice(e.detail.device);
        }
    });
    
    // Udostępnij funkcje globalnie
    window.toggleFavorite = toggleFavorite;
    window.addPairedDevice = addPairedDevice;
    window.addDeviceToFavorites = addDeviceToFavorites;
    window.loadPairedDevices = loadPairedDevices;
    window.checkConnectionStatus = checkConnectionStatus;
    window.editDevice = editDevice;
    window.clearAllDevices = clearAllDevices;
    window.getDeviceStats = getDeviceStats;
});