/**
 * Main JavaScript file for Bluetooth Manager
 * Contains core application functionality, scanning, and toast notifications
 * ADDED: Device name truncation support for scan results
 * FIXED: Custom notes support dla ręcznego dodawania urządzeń
 */

document.addEventListener('DOMContentLoaded', function() {
  // ========================================
  // DOM ELEMENTS
  // ========================================
  
  const scanForm = document.getElementById('scan-form');
  const scanResultsSection = document.getElementById('scan-results-section');
  const scanResultsContainer = document.getElementById('scan-results-container');
  const clearScanResults = document.getElementById('clear-scan-results');
  const refreshScanResults = document.getElementById('refresh-scan-results');
  const openManualDeviceModal = document.getElementById('open-manual-device-modal');
  const manualDeviceModal = document.getElementById('add-manual-device-modal');
  const scanResultsFilterInput = document.getElementById('scan-results-filter-input');
  const addManualDeviceForm = document.getElementById('add-manual-device-form');
  
  // ========================================
  // GLOBAL VARIABLES
  // ========================================
  
  let scanResultsVisible = false;
  
  // ========================================
  // DEVICE NAME TRUNCATION FUNCTIONS
  // ========================================
  
  /**
   * Skraca nazwę urządzenia dla wyników skanowania (25 znaków + "...")
   * @param {string} name - Nazwa urządzenia
   * @param {number} maxLength - Maksymalna długość (domyślnie 25)
   * @returns {string} - Skrócona nazwa
   */
  function truncateDeviceName(name, maxLength = 25) {
    if (!name || name === 'Nieznane urządzenie') return name || 'Nieznane urządzenie';
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  }
  
  /**
   * Skraca nazwę urządzenia w zależności od szerokości ekranu (dla responsywności)
   * @param {string} name - Nazwa urządzenia
   * @returns {string} - Skrócona nazwa dostosowana do ekranu
   */
  function truncateDeviceNameResponsive(name) {
    if (!name || name === 'Nieznane urządzenie') return name || 'Nieznane urządzenie';
    
    const screenWidth = window.innerWidth;
    let maxLength;
    
    if (screenWidth <= 480) {
      maxLength = 15; // Bardzo małe ekrany
    } else if (screenWidth <= 768) {
      maxLength = 20; // Średnie ekrany  
    } else {
      maxLength = 25; // Duże ekrany
    }
    
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  }
  
  // ========================================
  // INITIALIZATION
  // ========================================
  
  initializeApplication();
  
  /**
   * Initialize the main application
   */
  function initializeApplication() {
    console.log('Inicjalizacja głównej aplikacji...');
    
    setupScanningFunctionality();
    setupManualDeviceModal();
    setupToastSystem();
    updateScanButtonText();
    
    console.log('Główna aplikacja zainicjalizowana pomyślnie');
  }
  
  // ========================================
  // SCANNING FUNCTIONALITY
  // ========================================
  
  /**
   * Setup scanning functionality
   */
  function setupScanningFunctionality() {
    // Obsługa formularza skanowania
    if (scanForm) {
      scanForm.addEventListener('submit', function(e) {
        e.preventDefault();
        startScanning();
      });
    }
    
    // Obsługa przycisków w sekcji wyników
    if (clearScanResults) {
      clearScanResults.addEventListener('click', function() {
        hideScanResults();
      });
    }
    
    if (refreshScanResults) {
      refreshScanResults.addEventListener('click', function() {
        refreshScanResultsList();
      });
    }
    
    // Filtrowanie wyników skanowania
    if (scanResultsFilterInput) {
      scanResultsFilterInput.addEventListener('input', function() {
        filterScanResults();
      });
    }
  }
  
  /**
   * Start the scanning process
   */
  function startScanning() {
    const minecraftBtn = document.querySelector('.minecraft-play-button');
    const headerScanBtn = document.getElementById('header-scan-btn');
    
    // Update minecraft button
    if (minecraftBtn) {
      minecraftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SKANOWANIE...';
      minecraftBtn.disabled = true;
      minecraftBtn.style.opacity = "0.7";
    }
    
    // Update header scan button if it exists and isn't already spinning
    if (headerScanBtn && !headerScanBtn.querySelector('.fa-spinner')) {
      const originalHeaderContent = headerScanBtn.innerHTML;
      headerScanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Scanning...</span>';
      headerScanBtn.disabled = true;
      headerScanBtn.style.opacity = "0.7";
      
      // Store original content for later restoration
      headerScanBtn.dataset.originalContent = originalHeaderContent;
    }
    
    if (!scanResultsVisible) {
      hideScanResults();
    }
    
    fetch('/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'show_results=true'
    })
    .then(response => {
      console.log('Skanowanie zakończone pomyślnie');
      
      setTimeout(() => {
        fetchScanResults();
        
        // Reset minecraft button
        if (minecraftBtn) {
          updateScanButtonText();
          minecraftBtn.disabled = false;
          minecraftBtn.style.opacity = "1";
        }
        
        // Reset header scan button
        if (headerScanBtn) {
          const originalContent = headerScanBtn.dataset.originalContent || '<i class="fas fa-search"></i><span>Scan</span>';
          headerScanBtn.innerHTML = originalContent;
          headerScanBtn.disabled = false;
          headerScanBtn.style.opacity = "1";
          headerScanBtn.classList.remove('scanning');
          delete headerScanBtn.dataset.originalContent;
        }
      }, 2000);
    })
    .catch(error => {
      console.error('Błąd podczas skanowania:', error);
      addToMainLog(`[BŁĄD] Błąd podczas skanowania: ${error}`);
      showToast('Błąd podczas skanowania urządzeń', 'error', 5000);
      
      // Reset minecraft button
      if (minecraftBtn) {
        updateScanButtonText();
        minecraftBtn.disabled = false;
        minecraftBtn.style.opacity = "1";
      }
      
      // Reset header scan button
      if (headerScanBtn) {
        const originalContent = headerScanBtn.dataset.originalContent || '<i class="fas fa-search"></i><span>Scan</span>';
        headerScanBtn.innerHTML = originalContent;
        headerScanBtn.disabled = false;
        headerScanBtn.style.opacity = "1";
        headerScanBtn.classList.remove('scanning');
        delete headerScanBtn.dataset.originalContent;
      }
    });
  }
  
  /**
   * Fetch scan results from server
   */
  function fetchScanResults() {
    fetch('/get_discovered_devices')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          displayScanResults(data.devices);
          addToMainLog(`[SKANOWANIE] Znaleziono ${data.devices.length} urządzeń`);
          
          // Update terminal-main.js devices grid if available
          if (typeof window.terminalFunctions !== 'undefined' && window.terminalFunctions.updateDevicesGrid) {
            window.terminalFunctions.updateDevicesGrid(data.devices);
          }
          
          if (data.devices.length === 0) {
            showToast('Nie znaleziono żadnych urządzeń Bluetooth', 'warning', 4000);
          } else {
            const deviceText = data.devices.length === 1 ? 'urządzenie' : 
                             data.devices.length < 5 ? 'urządzenia' : 'urządzeń';
            showToast(`Znaleziono ${data.devices.length} ${deviceText} Bluetooth`, 'success', 4000);
          }
        } else {
          console.error('Błąd pobierania wyników:', data.message);
          addToMainLog(`[BŁĄD] Nie udało się pobrać wyników skanowania`);
          showToast('Nie udało się pobrać wyników skanowania', 'error', 5000);
        }
      })
      .catch(error => {
        console.error('Błąd podczas pobierania wyników:', error);
        addToMainLog(`[BŁĄD] Błąd podczas pobierania wyników skanowania`);
        showToast('Błąd podczas pobierania wyników skanowania', 'error', 5000);
      });
  }
  
  /**
   * Display scan results in the UI
   * @param {Array} devices - Array of discovered devices
   */
  function displayScanResults(devices) {
    if (!scanResultsContainer || !scanResultsSection) {
      return;
    }
    
    const wasHidden = !scanResultsVisible;
    
    scanResultsContainer.innerHTML = '';
    
    if (scanResultsFilterInput && wasHidden) {
      scanResultsFilterInput.value = '';
    }
    
    if (devices.length === 0) {
      scanResultsContainer.innerHTML = `
        <div class="no-scan-results">
          <i class="fas fa-search"></i>
          <p>Nie znaleziono żadnych urządzeń Bluetooth</p>
          <p>Sprawdź, czy urządzenia są włączone i widoczne</p>
        </div>
      `;
    } else {
      const sortedDevices = devices.sort((a, b) => {
        const aExists = checkDeviceExists(a.address);
        const bExists = checkDeviceExists(b.address);
        
        if (aExists && !bExists) return 1;
        if (!aExists && bExists) return -1;
        return 0;
      });
      
      const newDevices = sortedDevices.filter(device => !checkDeviceExists(device.address));
      const existingDevices = sortedDevices.filter(device => checkDeviceExists(device.address));
      
      if (newDevices.length > 0) {
        const newDevicesHeader = document.createElement('div');
        newDevicesHeader.className = 'devices-section-header';
        scanResultsContainer.appendChild(newDevicesHeader);
        
        newDevices.forEach(device => {
          const deviceElement = createScanDeviceElement(device);
          scanResultsContainer.appendChild(deviceElement);
        });
      }
      
      if (existingDevices.length > 0) {
        const existingDevicesHeader = document.createElement('div');
        existingDevicesHeader.className = 'devices-section-header existing';
        scanResultsContainer.appendChild(existingDevicesHeader);
        
        existingDevices.forEach(device => {
          const deviceElement = createScanDeviceElement(device);
          scanResultsContainer.appendChild(deviceElement);
        });
      }
    }
    
    scanResultsSection.style.display = 'block';
    scanResultsVisible = true;
    
    updateScanButtonText();
    
    // Apply any existing header search filter to the new results
    const headerSearch = document.getElementById('header-search');
    if (headerSearch && headerSearch.value.trim()) {
      // Use the header filtering function if available
      setTimeout(() => {
        if (typeof window.headerFunctions !== 'undefined' && window.headerFunctions.filterScanResultsFromHeader) {
          window.headerFunctions.filterScanResultsFromHeader(headerSearch.value);
        }
      }, 100); // Small delay to ensure DOM is updated
    }
    
    if (wasHidden) {
      setTimeout(() => {
        scanResultsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }
  
  /**
   * Create a device element for scan results
   * UPDATED: Added device name truncation for better UI
   * @param {Object} device - Device data
   * @returns {HTMLElement} - Device element
   */
  function createScanDeviceElement(device) {
    const deviceElement = document.createElement('div');
    deviceElement.className = 'scan-device-item';
    
    const existingDevice = checkDeviceExists(device.address);
    
    if (existingDevice) {
      deviceElement.classList.add('device-exists');
    }
    
    const iconElement = document.createElement('div');
    iconElement.className = 'scan-device-icon';
    iconElement.innerHTML = `
      <svg viewBox="0 0 448 512">
        <path d="M292.6 171.1L249.7 214l-.3-86 43.2 43.1m-43.2 219.8l43.1-43.1-42.9-42.9-.2 86zM416 259.4C416 465 344.1 512 230.9 512S32 465 32 259.4 115.4 0 228.6 0 416 53.9 416 259.4zm-158.5 0l79.4-88.6L211.8 36.5v176.9L138 139.6l-27 26.9 92.7 93-92.7 93 26.9 26.9 73.8-73.8 2.3 170 127.4-127.5-83.9-88.7z"/>
      </svg>
    `;
    
    const infoElement = document.createElement('div');
    infoElement.className = 'scan-device-info';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'scan-device-name';
    
    // UPDATED: Skróć nazwę urządzenia responsywnie
    const originalName = device.name || 'Nieznane urządzenie';
    const truncatedName = truncateDeviceNameResponsive(originalName);
    nameElement.textContent = truncatedName;
    
    // Dodaj tooltip z pełną nazwą jeśli została skrócona
    if (truncatedName !== originalName) {
      nameElement.title = originalName;
      nameElement.style.cursor = 'help';
    }
    
    const addressElement = document.createElement('div');
    addressElement.className = 'scan-device-address';
    addressElement.textContent = device.address;
    
    infoElement.appendChild(nameElement);
    infoElement.appendChild(addressElement);
    
    if (existingDevice) {
      const existingIndicator = document.createElement('div');
      existingIndicator.className = 'device-existing-indicator';
      existingIndicator.textContent = 'Już na liście';
      infoElement.appendChild(existingIndicator);
    }
    
    const actionsElement = document.createElement('div');
    actionsElement.className = 'scan-device-actions';
    
    const connectBtn = document.createElement('button');
    connectBtn.className = 'scan-device-connect-btn';
    connectBtn.textContent = 'Połącz';
    connectBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      connectToDevice(device.address);
    });
    
    const addBtn = document.createElement('button');
    if (existingDevice) {
      addBtn.className = 'scan-device-add-btn scan-device-existing-btn';
      addBtn.textContent = 'Już dodane';
      addBtn.disabled = true;
      addBtn.title = 'To urządzenie jest już na liście sparowanych';
    } else {
      addBtn.className = 'scan-device-add-btn';
      addBtn.textContent = 'Dodaj';
      addBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        addDeviceToList(device);
      });
    }
    
    actionsElement.appendChild(connectBtn);
    actionsElement.appendChild(addBtn);
    
    deviceElement.appendChild(iconElement);
    deviceElement.appendChild(infoElement);
    deviceElement.appendChild(actionsElement);
    
    deviceElement.addEventListener('click', function() {
      if (!existingDevice) {
        addDeviceToList(device);
      } else {
        const existingName = existingDevice.name || 'Nieznane urządzenie';
        const truncatedExistingName = truncateDeviceName(existingName);
        showToast(`Urządzenie "${truncatedExistingName}" jest już na liście sparowanych urządzeń`, 'warning', 4000);
      }
    });
    
    return deviceElement;
  }
  
  /**
   * Connect to a device
   * @param {string} address - Device MAC address
   */
  function connectToDevice(address) {
    addToMainLog(`[POŁĄCZENIE] Próba połączenia z urządzeniem ${address}`);
    showToast(`Łączenie z urządzeniem ${address}...`, 'info', 3000);
    
    const deviceItems = document.querySelectorAll('.scan-device-item');
    let connectButton = null;
    
    deviceItems.forEach(item => {
      const deviceAddress = item.querySelector('.scan-device-address').textContent;
      if (deviceAddress === address) {
        connectButton = item.querySelector('.scan-device-connect-btn');
      }
    });
    
    if (connectButton) {
      const originalText = connectButton.textContent;
      connectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Łączenie...';
      connectButton.disabled = true;
    }
    
    fetch('/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `address=${encodeURIComponent(address)}`
    })
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    })
    .then(data => {
      setTimeout(() => {
        checkConnectionResult(address, connectButton);
      }, 2000);
    })
    .catch(error => {
      console.error('Błąd podczas łączenia:', error);
      addToMainLog(`[BŁĄD] Błąd podczas łączenia z ${address}: ${error.message}`);
      showToast(`Nie udało się połączyć z urządzeniem ${address}`, 'error', 5000);
      
      if (connectButton) {
        connectButton.textContent = 'Połącz';
        connectButton.disabled = false;
      }
    });
  }
  
  /**
   * Check connection result
   * @param {string} address - Device MAC address
   * @param {HTMLElement} connectButton - Connect button element
   */
  function checkConnectionResult(address, connectButton) {
    fetch('/connection_status')
      .then(response => response.json())
      .then(data => {
        const isConnected = data.connected;
        const connectedAddress = data.address || '';
        
        if (isConnected && connectedAddress === address) {
          addToMainLog(`[SUKCES] Pomyślnie połączono z urządzeniem ${address}`);
          showToast(`Pomyślnie połączono z urządzeniem ${address}`, 'success', 5000);
          
          window.dispatchEvent(new CustomEvent('deviceConnectionChanged', {
            detail: {
              address: address,
              connected: true
            }
          }));
          
          if (connectButton) {
            connectButton.textContent = 'Połączono';
            connectButton.disabled = true;
            connectButton.style.backgroundColor = '#2ecc71';
          }
          
          setTimeout(() => {
            if (scanResultsVisible) {
              fetchScanResults();
            }
          }, 1000);
          
        } else {
          addToMainLog(`[BŁĄD] Nie udało się połączyć z urządzeniem ${address}`);
          showToast(`Nie udało się połączyć z urządzeniem ${address}`, 'error', 5000);
          
          if (connectButton) {
            connectButton.textContent = 'Połącz';
            connectButton.disabled = false;
          }
        }
      })
      .catch(error => {
        console.error('Błąd podczas sprawdzania statusu połączenia:', error);
        addToMainLog(`[BŁĄD] Błąd podczas sprawdzania statusu połączenia`);
        showToast(`Błąd podczas sprawdzania połączenia z ${address}`, 'error', 5000);
        
        if (connectButton) {
          connectButton.textContent = 'Połącz';
          connectButton.disabled = false;
        }
      });
  }
  
  /**
   * Add device to the paired devices list
   * UPDATED: Added device name truncation for toast messages
   * FIXED: Dodano przekazywanie custom notes
   * @param {Object} device - Device data
   */
  function addDeviceToList(device) {
    const deviceName = device.name || 'Nieznane urządzenie';
    const truncatedDeviceName = truncateDeviceName(deviceName);
    
    const existingDevice = checkDeviceExists(device.address);
    if (existingDevice) {
      const existingName = existingDevice.name || 'Nieznane urządzenie';
      const truncatedExistingName = truncateDeviceName(existingName);
      showToast(`Urządzenie "${truncatedExistingName}" jest już na liście sparowanych urządzeń`, 'warning', 5000);
      addToMainLog(`[DUPLIKAT] Urządzenie ${deviceName} (${device.address}) już istnieje na liście`);
      return;
    }
    
    // NAPRAWKA: Dodano custom notes (puste dla urządzeń ze skanowania)
    window.dispatchEvent(new CustomEvent('deviceConnected', {
      detail: {
        device: {
          name: deviceName,
          address: device.address,
          connected: false,
          type: device.type || 'other',
          customNotes: '' // Puste dla urządzeń ze skanowania
        }
      }
    }));
    
    addToMainLog(`[DODANO] Urządzenie ${deviceName} dodane do listy`);
    showToast(`Urządzenie "${truncatedDeviceName}" zostało dodane do listy sparowanych`, 'success', 5000);
    
    setTimeout(() => {
      if (scanResultsVisible) {
        fetchScanResults();
      }
    }, 500);
  }
  
  /**
   * Check if device exists in paired devices
   * @param {string} address - Device MAC address
   * @returns {Object|boolean} - Device object if exists, false otherwise
   */
  function checkDeviceExists(address) {
    try {
      const pairedDevices = JSON.parse(localStorage.getItem('pairedDevices') || '[]');
      const existingDevice = pairedDevices.find(device => device.address === address);
      return existingDevice || false;
    } catch (error) {
      console.error('Błąd podczas sprawdzania istnienia urządzenia:', error);
      return false;
    }
  }
  
  /**
   * Filter scan results based on input
   */
  function filterScanResults() {
    const filterValue = scanResultsFilterInput.value.toLowerCase();
    const deviceItems = scanResultsContainer.querySelectorAll('.scan-device-item');
    
    let visibleCount = 0;
    
    deviceItems.forEach(device => {
      const deviceName = device.querySelector('.scan-device-name').textContent.toLowerCase();
      const deviceAddress = device.querySelector('.scan-device-address').textContent.toLowerCase();
      
      const shouldShow = deviceName.includes(filterValue) || deviceAddress.includes(filterValue);
      device.style.display = shouldShow ? 'flex' : 'none';
      
      if (shouldShow) visibleCount++;
    });
    
    if (visibleCount === 0 && deviceItems.length > 0) {
      if (!scanResultsContainer.querySelector('.no-filter-results')) {
        const noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-filter-results no-scan-results';
        noResultsMsg.innerHTML = `
          <i class="fas fa-filter"></i>
          <p>Brak urządzeń pasujących do filtra</p>
          <p>Spróbuj zmienić kryteria wyszukiwania</p>
        `;
        scanResultsContainer.appendChild(noResultsMsg);
      }
    } else {
      const noResultsMsg = scanResultsContainer.querySelector('.no-filter-results');
      if (noResultsMsg) {
        noResultsMsg.remove();
      }
    }
  }
  
  /**
   * Refresh scan results list
   */
  function refreshScanResultsList() {
    const refreshBtn = document.getElementById('refresh-scan-results');
    
    if (refreshBtn) {
      const originalContent = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Odświeżanie...';
      refreshBtn.disabled = true;
      
      setTimeout(() => {
        fetchScanResults();
        refreshBtn.innerHTML = originalContent;
        refreshBtn.disabled = false;
        showToast('Lista urządzeń została odświeżona', 'success', 3000);
      }, 1000);
    }
  }
  
  /**
   * Hide scan results
   */
  function hideScanResults() {
    if (scanResultsSection) {
      scanResultsSection.style.display = 'none';
      scanResultsVisible = false;
    }
    
    if (scanResultsFilterInput) {
      scanResultsFilterInput.value = '';
    }
    
    // Also clear header search input and sidebar filter when hiding scan results
    const headerSearch = document.getElementById('header-search');
    const sidebarFilter = document.getElementById('sidebar-filter-name');
    if (headerSearch) {
      headerSearch.value = '';
    }
    if (sidebarFilter) {
      sidebarFilter.value = '';
      sidebarFilter.dispatchEvent(new Event('input')); // Clear sidebar filtering
    }
    
    // Clear any filtering on devices grid as well
    const devicesGrid = document.getElementById('devicesGrid');
    if (devicesGrid) {
      const deviceCards = devicesGrid.querySelectorAll('.device-terminal-card');
      deviceCards.forEach(card => {
        card.style.display = 'block'; // Show all cards
      });
      
      // Remove any no results messages
      const noResultsMsg = devicesGrid.querySelector('.no-filter-results');
      if (noResultsMsg) {
        noResultsMsg.remove();
      }
    }
    
    updateScanButtonText();
  }
  
  /**
   * Update scan button text based on state
   */
  function updateScanButtonText() {
    const minecraftBtn = document.querySelector('.minecraft-play-button');
    if (minecraftBtn && !minecraftBtn.disabled) {
      if (scanResultsVisible) {
        minecraftBtn.textContent = 'SKANUJ PONOWNIE';
      } else {
        minecraftBtn.textContent = 'SKANUJ';
      }
    }
  }
  
  // ========================================
  // MANUAL DEVICE MODAL
  // ========================================
  
  /**
   * Setup manual device modal functionality
   * FIXED: Dodano obsługę custom notes
   */
  function setupManualDeviceModal() {
    // Obsługa linku do ręcznego dodawania urządzenia
    if (openManualDeviceModal) {
      openManualDeviceModal.addEventListener('click', function(e) {
        e.preventDefault();
        if (manualDeviceModal) {
          manualDeviceModal.style.display = 'flex';
          manualDeviceModal.classList.add('show');
        }
      });
    }
    
    // Modal ręcznego dodawania urządzenia
    if (addManualDeviceForm) {
      addManualDeviceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('manual-device-name').value;
        const address = document.getElementById('manual-device-address').value;
        const type = document.getElementById('manual-device-type').value;
        const customNotes = document.getElementById('manual-device-notes').value; // NAPRAWKA: Pobierz custom notes
        
        const macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/;
        if (!macRegex.test(address)) {
          showToast('Proszę podać poprawny adres MAC w formacie 00:11:22:33:44:55', 'error', 6000);
          return;
        }
        
        const existingDevice = checkDeviceExists(address);
        if (existingDevice) {
          const existingName = existingDevice.name || 'Nieznane urządzenie';
          const truncatedExistingName = truncateDeviceName(existingName);
          showToast(`Urządzenie "${truncatedExistingName}" jest już na liście sparowanych urządzeń`, 'warning', 5000);
          addToMainLog(`[DUPLIKAT] Próba ręcznego dodania istniejącego urządzenia: ${name} (${address})`);
          return;
        }
        
        // NAPRAWKA: Dodano custom notes do obiektu urządzenia
        const newDevice = {
          name: name,
          address: address,
          type: type,
          connected: false,
          customNotes: customNotes || '' // NAPRAWKA: Przekaż custom notes
        };
        
        console.log(`MAIN.JS: Adding device with custom notes: "${customNotes}"`);
        
        window.dispatchEvent(new CustomEvent('deviceConnected', {
          detail: {
            device: newDevice // NAPRAWKA: Przekaż cały obiekt z custom notes
          }
        }));
        
        const truncatedDeviceName = truncateDeviceName(name);
        addToMainLog(`[MANUAL] Dodano urządzenie ręcznie: ${name} (${address}) z notatkami: "${customNotes}"`);
        showToast(`Urządzenie "${truncatedDeviceName}" zostało dodane ręcznie do listy`, 'success', 5000);
        
        manualDeviceModal.style.display = 'none';
        manualDeviceModal.classList.remove('show');
        addManualDeviceForm.reset();
        
        setTimeout(() => {
          if (scanResultsVisible) {
            fetchScanResults();
          }
        }, 500);
      });
    }
    
    // Setup modal close handlers
    setupModalHandlers();
  }
  
  /**
   * Clear all fields in the ADD manual device modal
   */
  function clearAddDeviceModalFields() {
    const deviceNameInput = document.getElementById('manual-device-name');
    const deviceAddressInput = document.getElementById('manual-device-address');
    const deviceTypeSelect = document.getElementById('manual-device-type');
    const deviceNotesTextarea = document.getElementById('manual-device-notes');
    
    if (deviceNameInput) deviceNameInput.value = '';
    if (deviceAddressInput) deviceAddressInput.value = '';
    if (deviceTypeSelect) deviceTypeSelect.value = 'other'; // Reset to default
    if (deviceNotesTextarea) deviceNotesTextarea.value = '';
    
    console.log('Cleared ADD device modal fields');
  }

  /**
   * Setup modal close handlers
   */
  function setupModalHandlers() {
    const closeButtons = document.querySelectorAll('.close-modal');
    const modals = document.querySelectorAll('.modal');
    const cancelButtons = document.querySelectorAll('[id$="-cancel-button"], [id^="cancel-"]');
    
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const modal = button.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
          modal.classList.remove('show');
          
          // Clear ADD device modal fields if this is the ADD modal
          if (modal.id === 'add-manual-device-modal') {
            clearAddDeviceModalFields();
          }
        }
      });
    });
    
    window.addEventListener('click', function(e) {
      modals.forEach(modal => {
        if (e.target === modal) {
          modal.style.display = 'none';
          modal.classList.remove('show');
          
          // Clear ADD device modal fields if this is the ADD modal
          if (modal.id === 'add-manual-device-modal') {
            clearAddDeviceModalFields();
          }
        }
      });
    });
    
    cancelButtons.forEach(button => {
      button.addEventListener('click', function() {
        const modal = button.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
          modal.classList.remove('show');
          
          // Clear ADD device modal fields if this is the ADD modal
          if (modal.id === 'add-manual-device-modal') {
            clearAddDeviceModalFields();
          }
        }
      });
    });
  }
  
  // ========================================
  // TOAST NOTIFICATION SYSTEM
  // ========================================
  
  /**
   * Setup toast notification system
   */
  function setupToastSystem() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      const toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  
  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Toast type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  function showToast(message, type = 'success', duration = 4000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
      <i class="toast-icon ${icons[type] || icons.success}"></i>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Zamknij">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function() {
      hideToast(toast);
    });
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      hideToast(toast);
    }, duration);
    
    console.log(`Toast wyświetlony: ${message} (${type})`);
  }
  
  /**
   * Hide toast notification
   * @param {HTMLElement} toast - Toast element to hide
   */
  function hideToast(toast) {
    if (!toast || !toast.parentNode) return;
    
    toast.classList.add('hiding');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
  
  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  
  /**
   * Add entry to main log
   * @param {string} message - Log message
   */
  function addToMainLog(message) {
    const logContainer = document.querySelector('.log-container');
    if (logContainer) {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      logEntry.textContent = message;
      logContainer.insertBefore(logEntry, logContainer.firstChild);
    }
    console.log(message);
  }
  
  // ========================================
  // RESPONSIVE DEVICE NAME TRUNCATION
  // ========================================
  
  // Update device names when window is resized
  window.addEventListener('resize', function() {
    // Re-render scan results with new responsive lengths
    if (scanResultsVisible) {
      const deviceItems = scanResultsContainer.querySelectorAll('.scan-device-item');
      deviceItems.forEach(item => {
        const nameElement = item.querySelector('.scan-device-name');
        if (nameElement && nameElement.title) {
          // Re-truncate with new screen size
          const originalName = nameElement.title;
          const truncatedName = truncateDeviceNameResponsive(originalName);
          nameElement.textContent = truncatedName;
        }
      });
    }
  });
  
  // ========================================
  // EVENT LISTENERS
  // ========================================
  
  // Listen for device list updates
  window.addEventListener('deviceListUpdated', function(e) {
    console.log('Lista urządzeń została zaktualizowana:', e.detail);
    
    if (scanResultsVisible) {
      setTimeout(() => {
        fetchScanResults();
      }, 200);
    }
  });
  
  // ========================================
  // GLOBAL EXPORTS
  // ========================================
  
  // Make functions available globally
  window.mainAppFunctions = {
    showToast,
    addToMainLog,
    fetchScanResults,
    hideScanResults,
    updateScanButtonText,
    truncateDeviceName,
    truncateDeviceNameResponsive
  };
  
  // Export showToast globally for other modules
  window.showToast = showToast;
  
  // Export truncation functions globally
  window.truncateDeviceName = truncateDeviceName;
  window.truncateDeviceNameResponsive = truncateDeviceNameResponsive;
  
  console.log('Main application initialized successfully');
});