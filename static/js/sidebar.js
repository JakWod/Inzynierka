// Cyberpunk Sidebar functionality - UPDATED VERSION
// New Features: 
// - Loading state for connect button with spinner and 15-second timeout
// - Full edit functionality with device removal (no device status section)
// - Modal integration for editing devices
// Previous Features:
// - Collapsible filters section
// - Disabled edit button for connected devices on lists
// - Scrollbar moved to device-lists instead of sidebar-content
// - Gradient scrollbar working properly  
// - Devices save to localStorage properly (favorites + discovered)
// - New devices go to "discovered" by default, not "favorites"  
// - Connected devices appear in "active connection" AND remain in their original lists
// - Connected devices in lists have hidden connect and pulsing indicator, but normal styling
// - Star animation changed from aura to opacity pulsing
// - Edit and favorite buttons remain fully functional for connected devices (NOW EDIT IS DISABLED)
// - Fixed gap disappearing when scrollbar disappears

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarContent = document.getElementById('sidebarContent');
    const deviceLists = document.querySelector('.device-lists'); // DODANO - element ze scrollbarem
    const pairedDevicesList = document.getElementById('paired-devices-list');
    const discoveredDevicesList = document.getElementById('discovered-devices-list');
    const connectedDeviceSection = document.getElementById('connected-device-section');
    const connectedDeviceContainer = document.getElementById('connected-device-container');
    const favoriteDevicesSection = document.getElementById('favorite-devices-section');
    const sidebarFilterName = document.getElementById('sidebar-filter-name');
    const sidebarFilterType = document.getElementById('sidebar-filter-type');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const toggleSections = document.querySelectorAll('.toggle-section');
    
    // Edit modal elements
    const editModal = document.getElementById('device-edit-modal');
    const editForm = document.getElementById('edit-device-form');
    const editDeviceName = document.getElementById('edit-device-name');
    const editDeviceType = document.getElementById('edit-device-type');
    const editDeviceAddressHidden = document.getElementById('edit-device-address-hidden');
    const editDeviceAddressDisplay = document.getElementById('edit-device-address-display');
    
    // Global variables
    let pairedDevices = [];
    let discoveredDevices = [];
    let connectedDevice = null;
    let isConnected = false;
    let currentEditingDevice = null;
    
    // Initialize
    loadPairedDevices();
    setupEditModal();
    
    // Funkcja do sprawdzania czy scrollbar jest widoczny - ZMIENIONO NA DEVICE-LISTS
    function checkScrollbar() {
        if (deviceLists) {
            const hasScrollbar = deviceLists.scrollHeight > deviceLists.clientHeight;
            if (hasScrollbar) {
                deviceLists.classList.add('has-scrollbar');
                sidebar.classList.add('has-scrollbar'); // Dodano dla stabilności
            } else {
                deviceLists.classList.remove('has-scrollbar');
                sidebar.classList.remove('has-scrollbar'); // Dodano dla stabilności
            }
            
            // Debug log
            console.log(`Scrollbar check: scrollHeight=${deviceLists.scrollHeight}, clientHeight=${deviceLists.clientHeight}, hasScrollbar=${hasScrollbar}`);
        }
    }
    
    // Sprawdź scrollbar przy inicjalizacji i zmianach
    checkScrollbar();
    
    // Obserwuj zmiany w zawartości device-lists - ZMIENIONO Z SIDEBAR-CONTENT
    if (deviceLists) {
        const resizeObserver = new ResizeObserver(() => {
            checkScrollbar();
        });
        resizeObserver.observe(deviceLists);
        
        // Również sprawdzaj przy zmianie zawartości
        const mutationObserver = new MutationObserver(() => {
            setTimeout(checkScrollbar, 100); // Małe opóźnienie dla animacji
        });
        mutationObserver.observe(deviceLists, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        // Dodatkowo obserwuj zmiany w sidebar-content dla sticky elementów
        if (sidebarContent) {
            const sidebarMutationObserver = new MutationObserver(() => {
                setTimeout(checkScrollbar, 100);
            });
            sidebarMutationObserver.observe(sidebarContent, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    }
    
    // Sidebar toggle functionality
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            addToLog('Sidebar toggled', 'INFO');
            // Sprawdź scrollbar po zmianie stanu sidebara
            setTimeout(checkScrollbar, 300); // Czas na animację
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
    
    // Obsługa zwijania/rozwijania sekcji - PRZEPISANO NA KLASY CSS
    if (toggleSections) {
        toggleSections.forEach(section => {
            section.addEventListener('click', function() {
                const targetId = this.dataset.target;
                const targetElement = document.getElementById(targetId);
                const toggleIcon = this.querySelector('.dropdown-toggle');
                
                if (targetElement) {
                    // Mapowanie targetId na sekcję rodzica
                    let parentSectionId = null;
                    switch(targetId) {
                        case 'connected-device-container':
                        case 'connected-device-content':
                            parentSectionId = 'connected-device-section';
                            break;
                        case 'paired-devices-list':
                        case 'favorite-devices-content':
                            parentSectionId = 'favorite-devices-section';
                            break;
                        case 'discovered-devices-list':
                        case 'discovered-devices-content':
                            parentSectionId = 'discovered-devices-section';
                            break;
                    }
                    
                    const parentSection = parentSectionId ? document.getElementById(parentSectionId) : null;
                    
                    // Używamy klas CSS zamiast style.display
                    if (targetElement.classList.contains('collapsed')) {
                        targetElement.classList.remove('collapsed');
                        if (toggleIcon) toggleIcon.classList.add('open');
                        
                        // Usuń klasę section-collapsed z sekcji rodzica
                        if (parentSection) {
                            parentSection.classList.remove('section-collapsed');
                        }
                        
                        addToLog(`Section expanded: ${targetId}`, 'INFO');
                    } else {
                        targetElement.classList.add('collapsed');
                        if (toggleIcon) toggleIcon.classList.remove('open');
                        
                        // Dodaj klasę section-collapsed do sekcji rodzica
                        if (parentSection) {
                            parentSection.classList.add('section-collapsed');
                        }
                        
                        addToLog(`Section collapsed: ${targetId}`, 'INFO');
                    }
                    
                    // Sprawdź scrollbar po zwijaniu/rozwijaniu sekcji
                    setTimeout(checkScrollbar, 300);
                }
            });
        });
    }
    
    /**
     * USUNIĘTE FUNKCJE - teraz w inline script:
     * - setupEditModal() 
     * - openEditModal()
     * - closeEditModal() 
     * - saveEditedDevice()
     * - deleteCurrentDevice()
     * - addDeleteButtonToEditForm()
     */
    
    /**
     * NOWA FUNKCJA: Set Button Loading State - używa globalnej funkcji
     */
    function setButtonLoadingState(button, isLoading, originalText = 'CONNECT') {
        if (typeof window.setButtonLoadingState === 'function') {
            window.setButtonLoadingState(button, isLoading, originalText);
        } else {
            // Fallback implementation
            if (!button) return;
            
            if (isLoading) {
                button.classList.add('loading');
                button.innerHTML = `
                    <span class="loading-spinner"></span>
                    <span>CONNECTING...</span>
                `;
                button.disabled = true;
            } else {
                button.classList.remove('loading');
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }
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
                        discoveredDevice.connected = true;
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
     * Wyświetla ulubione urządzenia - UŻYCIE KLAS CSS
     * Teraz pokazuje wszystkie urządzenia, nawet połączone
     */
    function displayPairedDevices() {
        if (!pairedDevicesList || !favoriteDevicesSection) return;
        
        // Wyświetl wszystkie ulubione urządzenia (bez filtrowania połączonych)
        const favoriteDevices = pairedDevices;
        
        // Wyświetl ulubione urządzenia
        if (favoriteDevices.length === 0) {
            // Ukryj całą sekcję jeśli brak ulubionych
            favoriteDevicesSection.style.display = 'none';
        } else {
            // Pokaż sekcję i urządzenia
            favoriteDevicesSection.style.display = 'block';
            pairedDevicesList.innerHTML = favoriteDevices.map(device => createDeviceCard(device, false, true)).join('');
            // Upewnij się, że lista nie jest zwinięta
            pairedDevicesList.classList.remove('collapsed');
            
            // Dodaj event listenery dla przycisków edit
            addEditButtonListeners(pairedDevicesList);
        }
        
        // Zastosuj filtry
        applyDeviceFilters();
        
        // Sprawdź scrollbar po zmianie zawartości
        setTimeout(checkScrollbar, 100);
    }
    
    /**
     * Wyświetla znalezione urządzenia - ZMODYFIKOWANA WERSJA
     * Teraz pokazuje wszystkie urządzenia, nawet połączone
     */
    function displayDiscoveredDevices() {
        if (!discoveredDevicesList) return;
        
        // Wyświetl wszystkie discovered devices (bez filtrowania połączonych)
        const allDiscoveredDevices = discoveredDevices;
        
        if (allDiscoveredDevices.length === 0) {
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
            discoveredDevicesList.innerHTML = allDiscoveredDevices.map(device => createDeviceCard(device, false, true)).join('');
            
            // Dodaj event listenery dla przycisków edit
            addEditButtonListeners(discoveredDevicesList);
        }
        
        // Zastosuj filtry
        applyDeviceFilters();
        
        // Sprawdź scrollbar po zmianie zawartości
        setTimeout(checkScrollbar, 100);
    }
    
    /**
     * Aktualizuje wyświetlanie połączonego urządzenia - UŻYCIE KLAS CSS
     */
    function updateConnectionDisplay() {
        if (!connectedDeviceSection || !connectedDeviceContainer) return;
        
        addToLog(`Updating connection display: isConnected=${isConnected}, connectedDevice=${connectedDevice ? connectedDevice.name : 'null'}`, 'DEBUG');
        
        if (isConnected && connectedDevice) {
            // Używamy klasy 'active' dla connected-device
            connectedDeviceSection.classList.add('active');
            connectedDeviceContainer.innerHTML = createDeviceCard(connectedDevice, true, false);
            addToLog(`Connected device section shown for: ${connectedDevice.name} (${connectedDevice.address})`, 'INFO');
            // Sprawdź scrollbar po dodaniu połączonego urządzenia
            setTimeout(checkScrollbar, 100);
        } else {
            // Usuwamy klasę 'active' dla connected-device
            connectedDeviceSection.classList.remove('active');
            addToLog('Connected device section hidden', 'INFO');
            // Sprawdź scrollbar po ukryciu połączonego urządzenia
            setTimeout(checkScrollbar, 100);
        }
    }
    
    /**
     * Dodaj event listenery do przycisków edit
     * @param {HTMLElement} container - Kontener z kartami urządzeń
     */
    function addEditButtonListeners(container) {
        const editButtons = container.querySelectorAll('.device-edit:not(.disabled)');
        editButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const deviceCard = button.closest('.device-card');
                const address = deviceCard.getAttribute('data-address');
                if (address) {
                    editDevice(address);
                }
            });
        });
    }
    
    /**
     * Tworzy kartę urządzenia - ZMODYFIKOWANA WERSJA Z LOADING STATE
     * @param {Object} device - Obiekt urządzenia
     * @param {boolean} isConnectedSection - Czy to sekcja active connection
     * @param {boolean} showInLists - Czy to urządzenie w głównych listach
     */
    function createDeviceCard(device, isConnectedSection = false, showInLists = false) {
        if (isConnectedSection) {
            // Uproszczona wersja dla sekcji połączonego urządzenia (active connection)
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
        } else if (showInLists) {
            // Wersja dla urządzeń w głównych listach - NOWA LOGIKA DLA EDIT BUTTON I LOADING STATE
            const isConnected = device.connected === true;
            const connectBtnClass = isConnected ? 'connect-btn hidden' : 'connect-btn';
            const connectAction = isConnected ? '' : `onclick="connectToDevice('${device.address}')"`;
            
            // NOWE: Edit button - wyłączony jeśli urządzenie jest połączone
            const editBtnClass = isConnected ? 'device-edit disabled' : 'device-edit';
            const editTitle = isConnected ? 'Nie można edytować połączonego urządzenia' : 'Edytuj urządzenie';
            
            // Migająca lampka dla połączonych urządzeń
            const connectionIndicator = isConnected ? '<div class="connection-indicator"></div>' : '';
            
            return `
                <div class="device-card" data-device='${JSON.stringify(device)}' data-address="${device.address}">
                    <div class="device-info">
                        <div class="device-name">
                            ${(device.name).toUpperCase()}
                            ${connectionIndicator}
                        </div>
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
                            <button class="${editBtnClass}" title="${editTitle}">EDIT</button>
                            <button class="${connectBtnClass}" ${connectAction} data-original-text="CONNECT">CONNECT</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Standardowa wersja dla innych przypadków
            return `
                <div class="device-card" data-device='${JSON.stringify(device)}' data-address="${device.address}">
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
                            <button class="device-edit" title="Edytuj urządzenie">EDIT</button>
                            <button class="connect-btn" onclick="connectToDevice('${device.address}')" data-original-text="CONNECT">CONNECT</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Filtruje urządzenia - UŻYCIE KLAS ZAMIAST STYLE.DISPLAY
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
                
                // Zastosuj widoczność UŻYWAJĄC KLAS
                if (shouldShow) {
                    card.classList.remove('hidden-by-filter');
                } else {
                    card.classList.add('hidden-by-filter');
                }
            } catch (error) {
                console.warn('Error filtering device:', error);
            }
        });
        
        // Sprawdź scrollbar po zastosowaniu filtrów
        setTimeout(checkScrollbar, 50);
    }
    
    /**
     * Łączy z urządzeniem - używa globalnej funkcji
     */
    window.connectToDevice = window.connectToDevice || async function(address) {
        // This will be handled by the inline script in HTML
        console.log('Using fallback connectToDevice function');
        if (typeof window.connectToDevice === 'function') {
            return window.connectToDevice(address);
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
        // Sprawdź czy urządzenie jest już w ulubionych
        let deviceIndex = pairedDevices.findIndex(device => device.address === address);
        
        if (deviceIndex !== -1) {
            // Urządzenie jest w ulubionych - usuń je i przenieś z powrotem do discovered
            const device = pairedDevices[deviceIndex];
            
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
     * Edytuje urządzenie - ZMODYFIKOWANA WERSJA
     */
    function editDevice(address) {
        const device = [...pairedDevices, ...discoveredDevices].find(d => d.address === address);
        if (device) {
            // NOWE: Sprawdź czy urządzenie jest połączone
            if (device.connected) {
                addToLog(`Edit blocked: Device ${device.name} is currently connected`, 'WARNING');
                showToast('Nie można edytować połączonego urządzenia', 'warning');
                return;
            }
            
            addToLog(`Opening edit dialog for device: ${device.name}`, 'INFO');
            // Use global function
            if (typeof window.openEditModal === 'function') {
                window.openEditModal(device);
            } else {
                console.error('openEditModal function not available');
            }
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
    window.addDeviceToFavorites = addDeviceToFavorites;
    window.loadPairedDevices = loadPairedDevices;
    window.checkConnectionStatus = checkConnectionStatus;
    window.editDevice = editDevice;
    window.clearAllDevices = clearAllDevices;
    window.getDeviceStats = getDeviceStats;
    window.checkScrollbar = checkScrollbar;
});