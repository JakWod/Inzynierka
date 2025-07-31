/**
 * Bluetooth Device Scanning Functionality
 * Handles device discovery, scan results display, and device filtering
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
  const scanResultsFilterInput = document.getElementById('scan-results-filter-input');
  
  // ========================================
  // GLOBAL VARIABLES
  // ========================================
  
  let scanResultsVisible = false;
  
  // ========================================
  // INITIALIZATION
  // ========================================
  
  initializeScanningSystem();
  
  /**
   * Initialize the scanning system
   */
  function initializeScanningSystem() {
    console.log('Inicjalizacja systemu skanowania...');
    
    setupScanningFunctionality();
    updateScanButtonText();
    
    console.log('System skanowania zainicjalizowany pomyślnie');
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
      addToScanLog(`[BŁĄD] Błąd podczas skanowania: ${error}`);
      if (typeof window.showToast === 'function') {
        window.showToast('Błąd podczas skanowania urządzeń', 'error', 5000);
      }
      
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
          addToScanLog(`[SKANOWANIE] Znaleziono ${data.devices.length} urządzeń`);
          
          if (data.devices.length === 0) {
            if (typeof window.showToast === 'function') {
              window.showToast('Nie znaleziono żadnych urządzeń Bluetooth', 'warning', 4000);
            }
          } else {
            const deviceText = data.devices.length === 1 ? 'urządzenie' : 
                             data.devices.length < 5 ? 'urządzenia' : 'urządzeń';
            if (typeof window.showToast === 'function') {
              window.showToast(`Znaleziono ${data.devices.length} ${deviceText} Bluetooth`, 'success', 4000);
            }
          }
        } else {
          console.error('Błąd pobierania wyników:', data.message);
          addToScanLog(`[BŁĄD] Nie udało się pobrać wyników skanowania`);
          if (typeof window.showToast === 'function') {
            window.showToast('Nie udało się pobrać wyników skanowania', 'error', 5000);
          }
        }
      })
      .catch(error => {
        console.error('Błąd podczas pobierania wyników:', error);
        addToScanLog(`[BŁĄD] Błąd podczas pobierania wyników skanowania`);
        if (typeof window.showToast === 'function') {
          window.showToast('Błąd podczas pobierania wyników skanowania', 'error', 5000);
        }
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
    nameElement.textContent = device.name || 'Nieznane urządzenie';
    
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
      if (typeof window.connectToDevice === 'function') {
        window.connectToDevice(device.address);
      }
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
        if (typeof window.showToast === 'function') {
          window.showToast(`Urządzenie "${existingName}" jest już na liście sparowanych urządzeń`, 'warning', 4000);
        }
      }
    });
    
    return deviceElement;
  }
  
  /**
   * Add device to the paired devices list
   * @param {Object} device - Device data
   */
  function addDeviceToList(device) {
    const deviceName = device.name || 'Nieznane urządzenie';
    
    const existingDevice = checkDeviceExists(device.address);
    if (existingDevice) {
      const existingName = existingDevice.name || 'Nieznane urządzenie';
      if (typeof window.showToast === 'function') {
        window.showToast(`Urządzenie "${existingName}" jest już na liście sparowanych urządzeń`, 'warning', 5000);
      }
      addToScanLog(`[DUPLIKAT] Urządzenie ${deviceName} (${device.address}) już istnieje na liście`);
      return;
    }
    
    window.dispatchEvent(new CustomEvent('deviceConnected', {
      detail: {
        device: {
          name: deviceName,
          address: device.address,
          connected: false,
          type: device.type || 'other'
        }
      }
    }));
    
    addToScanLog(`[DODANO] Urządzenie ${deviceName} dodane do listy`);
    if (typeof window.showToast === 'function') {
      window.showToast(`Urządzenie "${deviceName}" zostało dodane do listy sparowanych`, 'success', 5000);
    }
    
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
    if (!scanResultsFilterInput || !scanResultsContainer) return;
    
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
        if (typeof window.showToast === 'function') {
          window.showToast('Lista urządzeń została odświeżona', 'success', 3000);
        }
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
  // UTILITY FUNCTIONS
  // ========================================
  
  /**
   * Add entry to scan log
   * @param {string} message - Log message
   */
  function addToScanLog(message) {
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
  window.scanningFunctions = {
    startScanning,
    fetchScanResults,
    hideScanResults,
    updateScanButtonText,
    displayScanResults,
    checkDeviceExists,
    addDeviceToList
  };
  
  console.log('Scanning system initialized successfully');
});