// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const pairedDevicesList = document.getElementById('paired-devices-list');
    const connectedDeviceSection = document.getElementById('connected-device-section');
    const connectedDeviceContainer = document.getElementById('connected-device-container');
    const favoriteDevicesSection = document.getElementById('favorite-devices-section');
    const favoriteDevicesContainer = document.getElementById('favorite-devices-container');
    const refreshPairedDevicesBtn = document.getElementById('refresh-paired-devices');
    const toggleSections = document.querySelectorAll('.toggle-section');
    const sidebarFilterName = document.getElementById('sidebar-filter-name');
    const sidebarFilterType = document.getElementById('sidebar-filter-type');
    const deviceEditModal = document.getElementById('device-edit-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const editDeviceForm = document.getElementById('edit-device-form');
    const editDeviceAddress = document.getElementById('edit-device-address');
    const editDeviceName = document.getElementById('edit-device-name');
    const editDeviceType = document.getElementById('edit-device-type');
    
    // Initialize
    loadPairedDevices();
    
    // Event listeners
    if (refreshPairedDevicesBtn) {
        refreshPairedDevicesBtn.addEventListener('click', function() {
            loadPairedDevices(true);
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
                    
                    // Odczekaj chwilę, aby DOM się zaktualizował
                    setTimeout(function() {
                        // Przewijanie do aktualnie widocznej zawartości
                        document.querySelector('.sidebar').scrollTop = 0;
                    }, 50);
                }
            });
        });
    }
    
    // Apply filters when input changes
    if (sidebarFilterName) {
        sidebarFilterName.addEventListener('input', function() {
            applyDeviceFilters();
        });
    }
    
    // Obsługa zmiany typu urządzenia w selekcie
    if (sidebarFilterType) {
        sidebarFilterType.addEventListener('change', function() {
            applyDeviceFilters();
        });
    }
    
    // Dodaj obsługę przycisku "Wyczyść filtry"
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            if (sidebarFilterName) sidebarFilterName.value = '';
            if (sidebarFilterType) sidebarFilterType.value = '';
            
            applyDeviceFilters();
        });
    }
    
    // Close modal when clicking X
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            deviceEditModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === deviceEditModal) {
            deviceEditModal.style.display = 'none';
        }
    });
    
    // Edit device form submission
    if (editDeviceForm) {
        editDeviceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const deviceData = {
                address: document.getElementById('edit-device-address-hidden').value,
                name: document.getElementById('edit-device-name').value,
                type: document.getElementById('edit-device-type').value
            };
            
            updateDeviceData(deviceData);
            deviceEditModal.style.display = 'none';
        });
    }
    
    /**
     * Ładuje sparowane urządzenia tylko z localStorage
     * @param {boolean} forceRefresh - Czy wymusić odświeżenie
     */
    function loadPairedDevices(forceRefresh = false) {
        if (!pairedDevicesList) return;
        
        // Pokaż wskaźnik ładowania
        pairedDevicesList.innerHTML = `
            <div class="loading-device-item">
                <div class="loading-spinner-small"></div>
                <span>Ładowanie urządzeń...</span>
            </div>
        `;
        
        // Pobierz urządzenia z localStorage
        let pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
        
        // Jeśli nie wymuszamy odświeżenia, wyświetl je
        if (!forceRefresh) {
            displayPairedDevices(pairedDevices);
            return;
        }
        
        // Jeśli wymuszamy odświeżenie, sprawdź status podłączenia urządzeń
        fetch('/connection_status')
            .then(response => response.json())
            .then(data => {
                const isConnected = data.connected;
                const connectedAddress = data.address || '';
                
                // Zaktualizuj status podłączenia dla urządzeń
                pairedDevices.forEach(device => {
                    device.connected = (device.address === connectedAddress);
                });
                
                // Zapisz zaktualizowane dane w localStorage
                localStorage.setItem('pairedDevices', JSON.stringify(pairedDevices));
                
                // Wyświetl urządzenia
                displayPairedDevices(pairedDevices);
                
                addToLog(`Odświeżono listę ${pairedDevices.length} urządzeń`);
            })
            .catch(error => {
                console.error('Błąd podczas pobierania statusu połączenia:', error);
                displayPairedDevices(pairedDevices);
            });
    }
    
    /**
     * Wyświetla listę sparowanych urządzeń
     * @param {Array} devices - Lista urządzeń do wyświetlenia
     */
    function displayPairedDevices(devices) {
        if (!pairedDevicesList) return;
        
        // Najpierw sprawdź, czy jest jakieś podłączone urządzenie
        const connectedDevice = devices.find(device => device.connected);
        
        // Wyświetl podłączone urządzenie w osobnej sekcji, jeśli istnieje
        if (connectedDeviceSection && connectedDeviceContainer) {
            if (connectedDevice) {
                connectedDeviceSection.style.display = 'block';
                // Ręcznie dodajemy element urządzenia jako węzeł, a nie jako HTML string
                // To rozwiązuje problem z brakiem działających eventów w sekcji "AKTUALNIE POŁĄCZONE"
                const deviceElement = createDeviceElement(connectedDevice, false);
                connectedDeviceContainer.innerHTML = '';
                connectedDeviceContainer.appendChild(deviceElement);
            } else {
                connectedDeviceSection.style.display = 'none';
                connectedDeviceContainer.innerHTML = '';
            }
        }
        
        // Znajdź urządzenia ulubione - ale bez tych połączonych (będą wyświetlone w osobnej sekcji)
        const favoriteDevices = devices.filter(device => device.favorite && !device.connected);
        
        // Wyświetl ulubione urządzenia w osobnej sekcji
        if (favoriteDevicesSection && favoriteDevicesContainer) {
            if (favoriteDevices.length > 0) {
                favoriteDevicesSection.style.display = 'block';
                favoriteDevicesContainer.innerHTML = '';
                
                favoriteDevices.forEach(device => {
                    favoriteDevicesContainer.appendChild(createDeviceElement(device, false));
                });
            } else {
                favoriteDevicesSection.style.display = 'none';
                favoriteDevicesContainer.innerHTML = '';
            }
        }
        
        // Pokaż pozostałe urządzenia (które nie są ulubione ani połączone)
        const regularDevices = devices.filter(device => !device.favorite && !device.connected);
        
        // Jeśli nie ma urządzeń w żadnej kategorii, pokaż komunikat
        if (regularDevices.length === 0 && favoriteDevices.length === 0 && !connectedDevice) {
            pairedDevicesList.innerHTML = '<div class="no-devices-message">Brak sparowanych urządzeń</div>';
            return;
        }
        
        // Wyczyść kontener regularnych urządzeń
        pairedDevicesList.innerHTML = '';
        
        // Dodaj każde urządzenie do listy (które nie jest ulubione ani połączone)
        const deviceList = document.createDocumentFragment();
        
        regularDevices.forEach(device => {
            // Dodaj element urządzenia
            const deviceElement = createDeviceElement(device, false);
            deviceList.appendChild(deviceElement);
        });
        
        if (regularDevices.length === 0) {
            pairedDevicesList.innerHTML = '<div class="no-devices-message">Brak innych urządzeń</div>';
        } else {
            pairedDevicesList.appendChild(deviceList);
        }
        
        // Zastosuj filtry
        applyDeviceFilters();
    }
    
    /**
     * Tworzy element DOM reprezentujący urządzenie
     * @param {Object} device - Obiekt urządzenia
     * @param {boolean} limitActions - Czy ograniczyć dostępne akcje dla połączonego urządzenia
     * @returns {HTMLElement} - Element DOM
     */
    function createDeviceElement(device, limitActions = false) {
        const deviceElement = document.createElement('div');
        deviceElement.className = 'device-item';
        deviceElement.dataset.address = device.address;
        deviceElement.dataset.type = device.type || 'other';
        
        if (device.connected) {
            deviceElement.classList.add('connected');
        }
        
        // Ikona Bluetooth
        const iconElement = document.createElement('div');
        iconElement.className = 'device-icon';
        if (device.connected) {
            iconElement.classList.add('connected');
        }
        
        // Zamiast Font Awesome, używamy SVG dla ikony Bluetooth
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 448 512");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M292.6 171.1L249.7 214l-.3-86 43.2 43.1m-43.2 219.8l43.1-43.1-42.9-42.9-.2 86zM416 259.4C416 465 344.1 512 230.9 512S32 465 32 259.4 115.4 0 228.6 0 416 53.9 416 259.4zm-158.5 0l79.4-88.6L211.8 36.5v176.9L138 139.6l-27 26.9 92.7 93-92.7 93 26.9 26.9 73.8-73.8 2.3 170 127.4-127.5-83.9-88.7z");
        
        // Ustawiamy kolor w zależności od stanu połączenia
        if (device.connected) {
            path.setAttribute("fill", "#2ecc71"); // Zielony dla połączonych
        } else {
            path.setAttribute("fill", "#3498db"); // Niebieski dla niepołączonych
        }
        
        svg.appendChild(path);
        iconElement.appendChild(svg);
        
        // Dodaj tooltip do ikony Bluetooth
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = device.connected ? 'Rozłącz urządzenie' : 'Połącz z urządzeniem';
        iconElement.appendChild(tooltip);
        
        // Dodaj listener kliknięcia do ikony Bluetooth - connect/disconnect
        iconElement.addEventListener('click', function(e) {
            e.stopPropagation(); // Zatrzymaj propagację, aby nie uruchomić kliknięcia na całym elemencie
            if (!device.connected) {
                connectToDevice(device.address);
            } else {
                disconnectFromDevice(); 
            }
        });
        
        // Tekst urządzenia
        const textElement = document.createElement('div');
        textElement.className = 'device-text';
        
        // Nazwa urządzenia
        const nameElement = document.createElement('div');
        nameElement.className = 'device-name';
        nameElement.textContent = device.name || 'Nieznane urządzenie';
        
        // Adres MAC
        const addressElement = document.createElement('div');
        addressElement.className = 'device-address';
        addressElement.textContent = device.address;
        
        // Dodajemy elementy w odpowiedniej kolejności
        textElement.appendChild(nameElement);
        textElement.appendChild(addressElement);
        
        // Przyciski akcji 
        const actionsElement = document.createElement('div');
        actionsElement.className = 'device-actions';
        
        // Przycisk ulubionych 
        const favoriteButton = document.createElement('button');
        favoriteButton.className = 'device-action favorite';
        favoriteButton.title = device.favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych';
        if (device.favorite) favoriteButton.classList.add('active');
        favoriteButton.innerHTML = '<i class="fa-' + (device.favorite ? 'solid' : 'regular') + ' fa-star"></i>';
        
        favoriteButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Zatrzymaj propagację, aby nie uruchomić kliknięcia na elemencie urządzenia
            toggleFavorite(device.address);
        });
        
        actionsElement.appendChild(favoriteButton);
        
        // Przycisk edycji 
        const editButton = document.createElement('button');
        editButton.className = 'device-action edit';
        editButton.title = 'Edytuj urządzenie';
        editButton.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
        editButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Zatrzymaj propagację, aby nie uruchomić kliknięcia na elemencie urządzenia
            openEditModal(device);
        });
        
        actionsElement.appendChild(editButton);
        
        // Przycisk usuwania (tylko dla niepodłączonych urządzeń)
        // Przywrócono warunek blokujący możliwość usunięcia podłączonego urządzenia
        if (!device.connected) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'device-action delete';
            deleteButton.title = 'Usuń urządzenie';
            deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteButton.addEventListener('click', function(e) {
                e.stopPropagation(); // Zatrzymaj propagację, aby nie uruchomić kliknięcia na elemencie urządzenia
                if (confirm('Czy na pewno chcesz usunąć to urządzenie?')) {
                    deleteDevice(device.address);
                }
            });
            
            actionsElement.appendChild(deleteButton);
        }
        
        // Dodaj elementy do urządzenia
        deviceElement.appendChild(iconElement);
        deviceElement.appendChild(textElement);
        deviceElement.appendChild(actionsElement);
        
        // Obsługa kliknięcia w urządzenie (tylko zaznaczanie)
        deviceElement.addEventListener('click', function() {
            // Usuń klasę selected ze wszystkich urządzeń
            document.querySelectorAll('.device-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Dodaj klasę selected do klikniętego urządzenia
            deviceElement.classList.add('selected');
        });
        
        return deviceElement;
    }
    
    /**
     * Przełącza status ulubionego dla urządzenia
     * @param {string} address - Adres MAC urządzenia
     */
    function toggleFavorite(address) {
        let pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
        
        // Znajdź urządzenie o podanym adresie
        const deviceIndex = pairedDevices.findIndex(device => device.address === address);
        
        if (deviceIndex !== -1) {
            // Zmień status ulubionego
            pairedDevices[deviceIndex].favorite = !pairedDevices[deviceIndex].favorite;
            
            // Zapisz zaktualizowane dane w localStorage
            localStorage.setItem('pairedDevices', JSON.stringify(pairedDevices));
            
            // Odśwież listę urządzeń
            displayPairedDevices(pairedDevices);
            
            const status = pairedDevices[deviceIndex].favorite ? 'dodano do' : 'usunięto z';
            addToLog(`Urządzenie ${pairedDevices[deviceIndex].name} ${status} ulubionych`);
        }
    }
    
    /**
     * Otwiera modal do edycji urządzenia
     * @param {Object} device - Obiekt urządzenia do edycji
     */
    function openEditModal(device) {
        if (!deviceEditModal) return;
        
        // Wypełnij formularz danymi urządzenia
        document.getElementById('edit-device-address-hidden').value = device.address;
        document.getElementById('edit-device-address-display').value = device.address;
        document.getElementById('edit-device-name').value = device.name || '';
        document.getElementById('edit-device-type').value = device.type || 'other';
        
        // Wyświetl modal
        deviceEditModal.style.display = 'block';
    }
    
    /**
     * Aktualizuje dane urządzenia w localStorage
     * @param {Object} deviceData - Nowe dane urządzenia
     */
    function updateDeviceData(deviceData) {
        let pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
        
        // Znajdź urządzenie o podanym adresie
        const deviceIndex = pairedDevices.findIndex(device => device.address === deviceData.address);
        
        if (deviceIndex !== -1) {
            // Zachowaj flagi
            const isFavorite = pairedDevices[deviceIndex].favorite;
            const isConnected = pairedDevices[deviceIndex].connected;
            
            // Zaktualizuj dane urządzenia
            pairedDevices[deviceIndex].name = deviceData.name;
            pairedDevices[deviceIndex].type = deviceData.type;
            pairedDevices[deviceIndex].favorite = isFavorite;
            pairedDevices[deviceIndex].connected = isConnected;
            
            // Zapisz zaktualizowane dane w localStorage
            localStorage.setItem('pairedDevices', JSON.stringify(pairedDevices));
            
            // Odśwież listę urządzeń
            displayPairedDevices(pairedDevices);
            
            addToLog(`Zaktualizowano urządzenie: ${deviceData.name}`);
        }
    }
    
    /**
     * Usuwa urządzenie z localStorage
     * @param {string} address - Adres MAC urządzenia do usunięcia
     */
    function deleteDevice(address) {
        let pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
        
        // Znajdź urządzenie o podanym adresie
        const deviceIndex = pairedDevices.findIndex(device => device.address === address);
        
        if (deviceIndex !== -1) {
            // Zapisz nazwę urządzenia przed usunięciem
            const deviceName = pairedDevices[deviceIndex].name;
            
            // Usuń urządzenie
            pairedDevices.splice(deviceIndex, 1);
            
            // Zapisz zaktualizowane dane w localStorage
            localStorage.setItem('pairedDevices', JSON.stringify(pairedDevices));
            
            // Odśwież listę urządzeń
            displayPairedDevices(pairedDevices);
            
            addToLog(`Usunięto urządzenie: ${deviceName}`);
        }
    }
    
    /**
     * Filtruje urządzenia na podstawie ustawionych filtrów
     */
    function applyDeviceFilters() {
        const filterValue = sidebarFilterName ? sidebarFilterName.value.toLowerCase() : '';
        const typeFilter = sidebarFilterType ? sidebarFilterType.value : '';
        
        // Pobierz wszystkie listy urządzeń
        const allDeviceLists = [
            ...(favoriteDevicesContainer ? favoriteDevicesContainer.querySelectorAll('.device-item') : []),
            ...(pairedDevicesList ? pairedDevicesList.querySelectorAll('.device-item') : [])
        ];
        
        allDeviceLists.forEach(device => {
            const deviceName = device.querySelector('.device-name').textContent.toLowerCase();
            const deviceAddress = device.querySelector('.device-address').textContent.toLowerCase();
            const deviceType = device.dataset.type || 'other';
            
            let shouldShow = true;
            
            // Sprawdź filtr nazwy lub adresu MAC
            if (filterValue && !deviceName.includes(filterValue) && !deviceAddress.includes(filterValue)) {
                shouldShow = false;
            }
            
            // Sprawdź filtr typu
            if (typeFilter && deviceType !== typeFilter) {
                shouldShow = false;
            }
            
            // Zastosuj widoczność
            device.style.display = shouldShow ? 'flex' : 'none';
        });
    }
    
    /**
     * Dodaje urządzenie do listy sparowanych urządzeń
     * @param {Object} device - Obiekt urządzenia do dodania
     */
    function addPairedDevice(device) {
        // Pobierz aktualną listę urządzeń
        let pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
        
        // Sprawdź, czy urządzenie o podanym adresie już istnieje
        const existingDeviceIndex = pairedDevices.findIndex(d => d.address === device.address);
        
        if (existingDeviceIndex !== -1) {
            // Urządzenie już istnieje, zaktualizuj status połączenia
            pairedDevices[existingDeviceIndex].connected = device.connected || false;
        } else {
            // Dodaj nowe urządzenie
            pairedDevices.push({
                name: device.name || 'Nieznane urządzenie',
                address: device.address,
                type: device.type || 'other',
                connected: device.connected || false,
                favorite: false
            });
            
            addToLog(`Dodano nowe urządzenie: ${device.name || 'Nieznane urządzenie'}`);
        }
        
        // Zapisz zaktualizowane dane w localStorage
        localStorage.setItem('pairedDevices', JSON.stringify(pairedDevices));
        
        // Odśwież listę urządzeń
        displayPairedDevices(pairedDevices);
    }
    
    /**
     * Łączy z urządzeniem o podanym adresie MAC
     * @param {string} address - Adres MAC urządzenia
     */
    function connectToDevice(address) {
        addToLog(`Łączenie z urządzeniem: ${address}`);
        
        // Utwórz i wyślij formularz
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/connect';
        
        const addressInput = document.createElement('input');
        addressInput.type = 'hidden';
        addressInput.name = 'address';
        addressInput.value = address;
        
        form.appendChild(addressInput);
        document.body.appendChild(form);
        form.submit();
    }
    
    /**
     * Rozłącza bieżące urządzenie
     */
    function disconnectFromDevice() {
        addToLog('Rozłączanie urządzenia...');
        
        // Utwórz i wyślij formularz
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/disconnect';
        
        document.body.appendChild(form);
        form.submit();
    }
    
    /**
     * Dodaje wpis do logu na stronie
     * @param {string} message - Wiadomość do dodania
     */
    function addToLog(message) {
        const logContainer = document.querySelector('.log-container');
        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = `[SIDEBAR] ${message}`;
            logContainer.insertBefore(logEntry, logContainer.firstChild);
        }
        console.log(`[SIDEBAR] ${message}`);
    }
    
    /**
     * Funkcja do sprawdzania nowych połączeń i dodawania ich do localStorage
     */
    function checkAndAddConnectedDevice() {
        fetch('/connection_status')
            .then(response => response.json())
            .then(data => {
                const isConnected = data.connected;
                const connectedAddress = data.address || '';
                
                if (isConnected && connectedAddress) {
                    // Sprawdź czy urządzenie jest już w localStorage
                    let pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
                    const deviceExists = pairedDevices.some(device => device.address === connectedAddress);
                    
                    if (!deviceExists) {
                        // Urządzenie jest połączone ale nie ma go w localStorage - dodaj je
                        console.log(`Wykryto nowe połączone urządzenie: ${connectedAddress}`);
                        
                        // Pobierz więcej informacji o urządzeniu
                        fetch('/get_paired_devices')
                            .then(response => response.json())
                            .then(apiData => {
                                if (apiData.status === 'success' && apiData.devices) {
                                    // Szukaj urządzenia o tym adresie
                                    const deviceInfo = apiData.devices.find(d => d.address === connectedAddress);
                                    
                                    // Domyślne informacje o urządzeniu
                                    let newDevice = {
                                        name: 'Nieznane urządzenie',
                                        address: connectedAddress,
                                        connected: true,
                                        type: 'other'
                                    };
                                    
                                    // Jeśli znaleziono dodatkowe informacje, wykorzystaj je
                                    if (deviceInfo) {
                                        newDevice.name = deviceInfo.name || newDevice.name;
                                        newDevice.type = deviceInfo.type || newDevice.type;
                                    }
                                    
                                    // Dodaj urządzenie do listy
                                    pairedDevices.push(newDevice);
                                    localStorage.setItem('pairedDevices', JSON.stringify(pairedDevices));
                                    
                                    // Odśwież widok
                                    displayPairedDevices(pairedDevices);
                                    
                                    // Dodaj log
                                    addToLog(`Automatycznie dodano nowe urządzenie: ${newDevice.name} (${newDevice.address})`);
                                }
                            })
                            .catch(error => {
                                console.error('Błąd podczas pobierania dodatkowych informacji o urządzeniu:', error);
                                
                                // Dodaj urządzenie z minimalnymi informacjami
                                const newDevice = {
                                    name: 'Nieznane urządzenie',
                                    address: connectedAddress,
                                    connected: true,
                                    type: 'other'
                                };
                                
                                pairedDevices.push(newDevice);
                                localStorage.setItem('pairedDevices', JSON.stringify(pairedDevices));
                                displayPairedDevices(pairedDevices);
                                addToLog(`Dodano nowe urządzenie: ${newDevice.address}`);
                            });
                    }
                }
                
                // Zaktualizuj status wszystkich urządzeń
                let pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
                let updated = false;
                
                pairedDevices.forEach(device => {
                    if (device.address === connectedAddress) {
                        if (!device.connected) {
                            device.connected = true;
                            updated = true;
                        }
                    } else if (device.connected) {
                        device.connected = false;
                        updated = true;
                    }
                });
                
                // Jeśli były zmiany, zaktualizuj localStorage i wyświetlanie
                if (updated) {
                    localStorage.setItem('pairedDevices', JSON.stringify(pairedDevices));
                    displayPairedDevices(pairedDevices);
                }
            })
            .catch(error => {
                console.error('Błąd podczas sprawdzania statusu połączenia:', error);
            });
    }
    
    // Wywołuj funkcję co 5 sekund aby sprawdzać i dodawać urządzenia
    setInterval(checkAndAddConnectedDevice, 5000);
    
    // Sprawdź przy załadowaniu strony
    setTimeout(checkAndAddConnectedDevice, 2000);
    
    // Nasłuchiwanie na zdarzenie połączenia z urządzeniem
    window.addEventListener('deviceConnected', function(e) {
        if (e.detail && e.detail.device) {
            // Dodaj urządzenie do listy sparowanych
            addPairedDevice({
                name: e.detail.device.name,
                address: e.detail.device.address,
                connected: e.detail.device.connected || false,
                type: e.detail.device.type || 'other'
            });
        }
    });
    
    // Ustaw domyślne stany zwijania/rozwijania
    setTimeout(function() {
        // Domyślnie rozwiń filtry jeśli są aktywne
        const filtersContainer = document.getElementById('filters-container');
        const filtersToggle = document.querySelector('[data-target="filters-container"] .dropdown-toggle');
        if (filtersContainer && filtersToggle) {
            filtersContainer.style.display = 'none';
            filtersToggle.classList.remove('open');
        }
        
        // Domyślnie rozwiń ulubione i sparowane, jeśli istnieją
        if (favoriteDevicesContainer && favoriteDevicesContainer.children.length > 0) {
            favoriteDevicesContainer.style.display = 'block';
            const favoriteToggle = document.querySelector('[data-target="favorite-devices-container"] .dropdown-toggle');
            if (favoriteToggle) favoriteToggle.classList.add('open');
        }
        
        if (pairedDevicesList && pairedDevicesList.children.length > 0) {
            pairedDevicesList.style.display = 'block';
            const pairedToggle = document.querySelector('[data-target="paired-devices-list"] .dropdown-toggle');
            if (pairedToggle) pairedToggle.classList.add('open');
        }
    }, 100);
});