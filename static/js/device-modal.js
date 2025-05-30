/**
 * Bluetooth Manager - device-modal.js
 * Handles device detail modals, button management, and command interactions
 * 
 * Główne funkcjonalności:
 * - Wyświetlanie szczegółów urządzenia w modalnym oknie
 * - Zarządzanie przyciskami sterującymi urządzeniem
 * - Dodawanie, edycja i usuwanie przycisków
 * - Wykonywanie sekwencji komend
 * - Filtrowanie logów urządzenia z logiką AND
 * - Połączenie, rozłączenie i rozparowanie urządzeń
 */

// Funkcja pomocnicza do formatowania dzisiejszej daty
function getTodaysDate() {
  return new Date().toISOString().slice(0, 10);
}

// Main functionality wrapped in DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
  
  // ========================================
  // DOM ELEMENTS - Wszystkie elementy interfejsu
  // ========================================
  
  // Modal elements
  let deviceDetailsModal = document.getElementById('device-details-modal');
  let closeDeviceDetails = document.getElementById('close-device-details');
  
  // Device info elements
  let modalDeviceName = document.getElementById('modal-device-name');
  let modalDeviceAddress = document.getElementById('modal-device-address');
  let modalDeviceType = document.getElementById('modal-device-type');
  let modalDeviceStatus = document.getElementById('modal-device-status');
  
  // Connection buttons
  let modalConnectBtn = document.getElementById('modal-connect-btn');
  let modalDisconnectBtn = document.getElementById('modal-disconnect-btn');
  let modalUnpairBtn = document.getElementById('modal-unpair-btn');
  
  // Button management elements
  let modalDeviceButtons = document.getElementById('modal-device-buttons');
  let addDeviceButton = document.getElementById('add-device-button');
  let modalButtonForm = document.getElementById('modal-button-form');
  let modalButtonName = document.getElementById('modal-button-name');
  let modalButtonFunction = document.getElementById('modal-button-function');
  let modalCommandsContainer = document.getElementById('modal-commands-container');
  let modalAddCommand = document.getElementById('modal-add-command');
  let modalSaveButton = document.getElementById('modal-save-button');
  let modalCancelButton = document.getElementById('modal-cancel-button');
  
  // Logs elements
  let deviceLogContent = document.getElementById('device-log-content');
  let clearDeviceLogs = document.getElementById('clear-device-logs');
  
  // Log filtering elements
  let logFilterDateFrom = document.getElementById('log-filter-date-from');
  let logFilterDateTo = document.getElementById('log-filter-date-to');
  let logFilterTimeFrom = document.getElementById('log-filter-time-from');
  let logFilterTimeTo = document.getElementById('log-filter-time-to');
  let logFilterText = document.getElementById('log-filter-text');
  let applyLogFilters = document.getElementById('apply-log-filters');
  let clearLogFilters = document.getElementById('clear-log-filters');
  
  // ========================================
  // GLOBAL VARIABLES - Zmienne globalne
  // ========================================
  
  let currentDevice = null; // Aktualnie wybrane urządzenie
  let activeContextMenu = null; // Aktywne menu kontekstowe dla przycisków

  // ========================================
  // INITIALIZATION - Inicjalizacja modułu
  // ========================================
  
  // Initialize modal functionality
  initDeviceModal();

  /**
   * Initialize the device modal functionality
   * Główna funkcja inicjalizująca wszystkie komponenty modalu
   */
  function initDeviceModal() {
    console.log('Inicjalizacja device modal...');
    
    // Initialize tabs
    initTabs();
    
    // Initialize click handlers for existing devices
    initDeviceClickHandlers();
    
    // Initialize observer for new devices
    initMutationObserver();
    
    // Event listeners for modal interaction
    setupModalEventListeners();
    
    // Initialize log filters
    initLogFilters();
    
    // Check for active command sequence
    checkAndContinueCommandSequence();
    
    console.log('Device modal zainicjalizowany');
  }

  // ========================================
  // TAB MANAGEMENT - Zarządzanie zakładkami
  // ========================================

  /**
   * Initialize tab switching in the modal
   * Inicjalizuje przełączanie między zakładkami (Sterowanie/Logi)
   */
  function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // Remove active class from all tabs and panels
        tabButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding panel
        this.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        console.log(`Przełączono na zakładkę: ${tabId}`);
      });
    });
  }

  // ========================================
  // LOG FILTERING - Filtrowanie logów z logiką AND
  // ========================================
  
  /**
   * Initialize log filters with AND logic
   * Inicjalizuje filtry logów z logiką AND - wszystkie warunki muszą być spełnione
   */
  function initLogFilters() {
    console.log('Inicjalizacja filtrów logów...');
    
    // Pobierz elementy ponownie w przypadku, gdyby się zmieniły
    applyLogFilters = document.getElementById('apply-log-filters');
    clearLogFilters = document.getElementById('clear-log-filters');
    logFilterText = document.getElementById('log-filter-text');
    logFilterDateFrom = document.getElementById('log-filter-date-from');
    logFilterDateTo = document.getElementById('log-filter-date-to');
    logFilterTimeFrom = document.getElementById('log-filter-time-from');
    logFilterTimeTo = document.getElementById('log-filter-time-to');
    
    console.log('Elementy filtrów:', {
      applyLogFilters,
      clearLogFilters,
      logFilterText,
      logFilterDateFrom,
      logFilterDateTo,
      logFilterTimeFrom,
      logFilterTimeTo
    });
    
    // Apply filters button
    if (applyLogFilters) {
      applyLogFilters.addEventListener('click', function() {
        console.log('Kliknięto Zastosuj filtry, currentDevice:', currentDevice);
        if (currentDevice && currentDevice.address) {
          loadDeviceLogs(currentDevice.address, true);
        } else {
          console.warn('Brak currentDevice lub adresu');
          alert('Błąd: Brak wybranego urządzenia');
        }
      });
      console.log('Dodano listener dla apply-log-filters');
    } else {
      console.error('Nie znaleziono elementu apply-log-filters');
    }
    
    // Clear filters button
    if (clearLogFilters) {
      clearLogFilters.addEventListener('click', function() {
        console.log('Kliknięto Wyczyść filtry');
        
        // Clear all filter fields
        const filterFields = [
          'log-filter-date-from',
          'log-filter-date-to', 
          'log-filter-time-from',
          'log-filter-time-to',
          'log-filter-text'
        ];
        
        filterFields.forEach(id => {
          const element = document.getElementById(id);
          if (element) {
            element.value = '';
            console.log(`Wyczyszczono ${id}`);
          }
        });
        
        // Reload logs without filters
        if (currentDevice && currentDevice.address) {
          loadDeviceLogs(currentDevice.address, false);
        } else {
          console.warn('Brak currentDevice lub adresu przy czyszczeniu filtrów');
        }
        
        // Hide filter summary
        const filterSummary = document.querySelector('.filter-summary');
        if (filterSummary) {
          filterSummary.style.display = 'none';
        }
      });
      console.log('Dodano listener dla clear-log-filters');
    } else {
      console.error('Nie znaleziono elementu clear-log-filters');
    }
    
    // Enter key support for text filter
    if (logFilterText) {
      logFilterText.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
          console.log('Enter w polu tekstowym filtra');
          if (currentDevice && currentDevice.address) {
            loadDeviceLogs(currentDevice.address, true);
          }
        }
      });
      console.log('Dodano listener Enter dla log-filter-text');
    }
    
    // Create filter summary element
    const filterSummary = document.createElement('div');
    filterSummary.className = 'filter-summary';
    filterSummary.style.display = 'none';
    filterSummary.innerHTML = '<span class="filter-label">Aktywne filtry:</span> <span class="filter-values"></span>';
    
    // Add summary after filter form
    const logsFilterForm = document.querySelector('.logs-filter-form');
    if (logsFilterForm) {
      logsFilterForm.after(filterSummary);
      console.log('Dodano podsumowanie filtrów');
    }
    
    // Auto-set date range - ZMIENIONE: ustawia dzisiejszą datę zamiast kopiować DateFrom
    if (logFilterDateFrom && logFilterDateTo) {
      logFilterDateFrom.addEventListener('change', function() {
        if (logFilterDateTo.value === '') {
          logFilterDateTo.value = getTodaysDate(); // Zmienione: ustawia dzisiejszą datę zamiast kopiować DateFrom
          console.log('Automatycznie ustawiono datę "do" na dzisiejszą datę');
        }
      });
    }
    
    // Auto-set time range
    if (logFilterTimeFrom && logFilterTimeTo) {
      logFilterTimeFrom.addEventListener('change', function() {
        if (logFilterTimeTo.value === '') {
          logFilterTimeTo.value = '23:59';
          console.log('Automatycznie ustawiono czas "do"');
        }
      });
    }
    
    // Update filter summary function
    function updateFilterSummary() {
      const filterSummary = document.querySelector('.filter-summary');
      const filterValues = document.querySelector('.filter-values');
      
      if (!filterSummary || !filterValues) return;
      
      // Collect active filters
      const dateFrom = logFilterDateFrom?.value;
      const dateTo = logFilterDateTo?.value;
      const timeFrom = logFilterTimeFrom?.value;
      const timeTo = logFilterTimeTo?.value;
      const text = logFilterText?.value;
      
      const activeFilters = [];
      
      // Date filters
      if (dateFrom && dateTo) {
        if (dateFrom === dateTo) {
          activeFilters.push(`Data: ${dateFrom}`);
        } else {
          activeFilters.push(`Data: ${dateFrom} — ${dateTo}`);
        }
      } else if (dateFrom) {
        activeFilters.push(`Data od: ${dateFrom}`);
      } else if (dateTo) {
        activeFilters.push(`Data do: ${dateTo}`);
      }
      
      // Time filters
      if (timeFrom && timeTo) {
        activeFilters.push(`Czas: ${timeFrom} — ${timeTo}`);
      } else if (timeFrom) {
        activeFilters.push(`Czas od: ${timeFrom}`);
      } else if (timeTo) {
        activeFilters.push(`Czas do: ${timeTo}`);
      }
      
      // Text filter
      if (text) {
        activeFilters.push(`Tekst: "${text}"`);
      }
      
      // Update summary display with AND logic indication
      if (activeFilters.length > 0) {
        filterValues.innerHTML = activeFilters.join(' <span style="color: #e74c3c;">AND</span> ');
        filterSummary.style.display = 'block';
        console.log('Zaktualizowano podsumowanie filtrów:', activeFilters);
      } else {
        filterSummary.style.display = 'none';
      }
    }
    
    // Update summary when filters are applied
    if (applyLogFilters) {
      applyLogFilters.addEventListener('click', updateFilterSummary);
    }
  }

  // ========================================
  // EVENT LISTENERS - Obsługa zdarzeń
  // ========================================

  /**
   * Setup modal event listeners
   * Konfiguruje wszystkie event listenery dla modalu
   */
  function setupModalEventListeners() {
    console.log('Konfiguracja event listenerów...');
    
    // Close modal
    if (closeDeviceDetails) {
      closeDeviceDetails.addEventListener('click', hideDeviceModal);
    }
    
    // Connect button
    if (modalConnectBtn) {
      modalConnectBtn.addEventListener('click', function() {
        if (currentDevice && currentDevice.address) {
          connectToDeviceFromModal(currentDevice.address);
        }
      });
    }
    
    // Disconnect button
    if (modalDisconnectBtn) {
      modalDisconnectBtn.addEventListener('click', disconnectDeviceFromModal);
    }
    
    // Unpair button
    if (modalUnpairBtn) {
      modalUnpairBtn.addEventListener('click', function() {
        if (currentDevice && currentDevice.address) {
          if (confirm('Czy na pewno chcesz rozparować to urządzenie?')) {
            unpairDeviceFromModal(currentDevice.address);
          }
        }
      });
    }
    
    // Add button
    if (addDeviceButton) {
      addDeviceButton.addEventListener('click', showButtonForm);
    }
    
    // Add command button
    if (modalAddCommand) {
      modalAddCommand.addEventListener('click', function() {
        addCommandField(modalCommandsContainer);
      });
    }
    
    // Save button
    if (modalSaveButton) {
      modalSaveButton.addEventListener('click', saveDeviceButton);
    }
    
    // Cancel button
    if (modalCancelButton) {
      modalCancelButton.addEventListener('click', hideButtonForm);
    }
    
    // Clear logs button
    if (clearDeviceLogs) {
      clearDeviceLogs.addEventListener('click', clearDeviceLogsFromModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
      if (e.target === deviceDetailsModal) {
        hideDeviceModal();
      }
    });
    
    console.log('Event listenery skonfigurowane');
  }

  // ========================================
  // DEVICE DETECTION - Wykrywanie urządzeń
  // ========================================

  /**
   * Initialize observer to detect new devices added to the DOM
   * Obserwuje zmiany w DOM i dodaje handlery do nowych urządzeń
   */
  function initMutationObserver() {
    console.log('Inicjalizacja MutationObserver...');
    
    // Elements to observe for changes
    const containers = [
      document.getElementById('paired-devices-list'),
      document.getElementById('favorite-devices-container'),
      document.getElementById('connected-device-container')
    ];
    
    // Observer configuration
    const config = { childList: true, subtree: true };
    
    // Callback for mutations
    const callback = function(mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check for new device items
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === 1 && node.classList.contains('device-item')) {
              // Add click handler to new device
              addDeviceClickHandler(node);
              console.log('Dodano handler do nowego urządzenia');
            }
          }
        }
      }
    };
    
    // Create and start observer
    const observer = new MutationObserver(callback);
    
    // Observe each container
    containers.forEach(container => {
      if (container) {
        observer.observe(container, config);
        console.log(`Obserwuję kontener: ${container.id}`);
      }
    });
  }
  
  /**
   * Initialize click handlers for existing devices
   * Dodaje handlery kliknięć do istniejących urządzeń
   */
  function initDeviceClickHandlers() {
    const deviceItems = document.querySelectorAll('.device-item');
    console.log(`Inicjalizacja handlerów dla ${deviceItems.length} urządzeń`);
    
    deviceItems.forEach(item => {
      addDeviceClickHandler(item);
    });
  }
  
  /**
   * Add click handler to device element
   * Dodaje handler kliknięcia do elementu urządzenia
   * @param {HTMLElement} deviceElement - DOM element representing the device
   */
  function addDeviceClickHandler(deviceElement) {
    deviceElement.addEventListener('click', function(e) {
      console.log('Kliknięto urządzenie');
      
      // Remove selected class from all devices
      document.querySelectorAll('.device-item').forEach(item => {
        item.classList.remove('selected');
      });
      
      // Add selected class to clicked device
      this.classList.add('selected');
      
      // Get device data from DOM attributes and content
      const deviceAddress = this.dataset.address;
      const deviceName = this.querySelector('.device-name').textContent;
      const deviceType = this.dataset.type || 'other';
      const isConnected = this.classList.contains('connected');
      
      // Store current device
      currentDevice = {
        name: deviceName,
        address: deviceAddress,
        type: deviceType,
        connected: isConnected
      };
      
      console.log('Wybrano urządzenie:', currentDevice);
      
      // Show device modal
      showDeviceModal(currentDevice);
    });
  }

  // ========================================
  // MODAL DISPLAY - Wyświetlanie modalu
  // ========================================
  
  /**
   * Shows the device modal with device data
   * Wyświetla modal z danymi urządzenia
   * @param {Object} device - Device data object
   */
  function showDeviceModal(device) {
    if (!deviceDetailsModal) {
      console.error('Brak elementu modal');
      return;
    }
    
    console.log('Wyświetlanie modalu dla urządzenia:', device);
    
    // Set device data in modal
    modalDeviceName.textContent = device.name;
    modalDeviceAddress.textContent = device.address;
    modalDeviceType.textContent = getDeviceTypeName(device.type);
    
    // Set connection status and buttons
    if (device.connected) {
      modalDeviceStatus.textContent = 'Połączone';
      modalDeviceStatus.classList.add('connected');
      modalConnectBtn.style.display = 'none';
      modalDisconnectBtn.style.display = 'block';
    } else {
      modalDeviceStatus.textContent = 'Niepołączone';
      modalDeviceStatus.classList.remove('connected');
      modalConnectBtn.style.display = 'block';
      modalDisconnectBtn.style.display = 'none';
    }
    
    // Always show unpair button
    if (modalUnpairBtn) {
      modalUnpairBtn.style.display = 'block';
    }
    
    // Update control section based on connection state
    updateControlSection(device.connected);
    
    // Load buttons and logs
    loadDeviceButtons(device.address);
    loadDeviceLogs(device.address);
    
    // Show modal and position it
    deviceDetailsModal.style.display = 'block';
    positionModal();
    
    // Clear any active context menu
    if (activeContextMenu) {
      activeContextMenu.style.display = 'none';
      activeContextMenu = null;
    }
    
    // Reinitialize filters after modal opens
    setTimeout(() => {
      initLogFilters();
    }, 100);
    
    console.log('Modal wyświetlony');
  }

  /**
   * Updates the control section based on the connection state
   * Aktualizuje sekcję sterowania w zależności od stanu połączenia
   * @param {boolean} isConnected - Whether the device is connected
   */
  function updateControlSection(isConnected) {
    const controlSection = document.querySelector('#control-tab .control-section');
    if (!controlSection) return;

    const deviceButtons = document.querySelector('#modal-device-buttons');
    const customButtons = deviceButtons ? deviceButtons.querySelectorAll('.device-custom-button') : [];
    
    if (!isConnected) {
      // Add disabled class to the buttons container
      if (deviceButtons) {
        deviceButtons.classList.add('disabled-section');
      }
      
      // Add disabled class to all buttons
      customButtons.forEach(button => {
        button.classList.add('disabled');
      });
      
      console.log('Przyciski wyłączone - urządzenie niepołączone');
    } else {
      // Remove disabled class from the buttons container
      if (deviceButtons) {
        deviceButtons.classList.remove('disabled-section');
      }
      
      // Remove disabled class from all buttons
      customButtons.forEach(button => {
        button.classList.remove('disabled');
      });
      
      console.log('Przyciski włączone - urządzenie połączone');
    }
  }
  
  /**
   * Positions the modal in the center of the screen
   * Pozycjonuje modal na środku ekranu
   */
  function positionModal() {
    if (!deviceDetailsModal) return;
    window.scrollTo(0, 0);
  }
  
  /**
   * Hides the device modal
   * Ukrywa modal urządzenia
   */
  function hideDeviceModal() {
    if (deviceDetailsModal) {
      deviceDetailsModal.style.display = 'none';
      console.log('Modal ukryty');
    }
    
    hideButtonForm();
    currentDevice = null;
  }

  // ========================================
  // DEVICE ACTIONS - Akcje urządzenia
  // ========================================
  
  /**
   * Connects to a device from the modal
   * Łączy z urządzeniem z poziomu modalu
   * @param {string} address - Device MAC address
   */
  function connectToDeviceFromModal(address) {
    console.log(`Łączenie z urządzeniem: ${address}`);
    addDeviceLog(address, 'Łączenie z urządzeniem...');
    
    // Create and submit form
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
   * Disconnects the current device
   * Rozłącza aktualne urządzenie
   */
  function disconnectDeviceFromModal() {
    if (!currentDevice) {
      console.warn('Brak currentDevice do rozłączenia');
      return;
    }
    
    console.log(`Rozłączanie urządzenia: ${currentDevice.address}`);
    addDeviceLog(currentDevice.address, 'Rozłączanie urządzenia...');
    
    // Create and submit form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/disconnect';
    
    document.body.appendChild(form);
    form.submit();
  }
  
  /**
   * Unpairs a device from the modal
   * Rozparowuje urządzenie z poziomu modalu
   * @param {string} address - Device MAC address
   */
  function unpairDeviceFromModal(address) {
    console.log(`Rozparowywanie urządzenia: ${address}`);
    addDeviceLog(address, 'Rozparowywanie urządzenia...');
    
    // If connected, disconnect first
    if (currentDevice && currentDevice.connected) {
      disconnectDeviceFromModal();
      
      // Delay unpair request
      setTimeout(() => {
        sendUnpairRequest(address);
      }, 500);
    } else {
      // If not connected, unpair immediately
      sendUnpairRequest(address);
    }
  }
  
  /**
   * Sends unpair request to the server
   * Wysyła żądanie rozparowania do serwera
   * @param {string} address - Device MAC address
   */
  function sendUnpairRequest(address) {
    console.log(`Wysyłanie żądania rozparowania: ${address}`);
    
    // Create and submit form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/unpair';
    
    const addressInput = document.createElement('input');
    addressInput.type = 'hidden';
    addressInput.name = 'address';
    addressInput.value = address;
    
    form.appendChild(addressInput);
    document.body.appendChild(form);
    form.submit();
  }

  // ========================================
  // UTILITY FUNCTIONS - Funkcje pomocnicze
  // ========================================
  
  /**
   * Gets the full device type name based on code
   * Zwraca pełną nazwę typu urządzenia na podstawie kodu
   * @param {string} typeCode - Device type code
   * @returns {string} - Full device type name
   */
  function getDeviceTypeName(typeCode) {
    const typeNames = {
      'headphones': 'Słuchawki',
      'speaker': 'Głośnik',
      'keyboard': 'Klawiatura',
      'mouse': 'Mysz',
      'gamepad': 'Kontroler',
      'other': 'Inne urządzenie'
    };
    
    return typeNames[typeCode] || 'Inne urządzenie';
  }

  // ========================================
  // BUTTON MANAGEMENT - Zarządzanie przyciskami
  // ========================================
  
  /**
   * Shows the button form for adding a new button
   * Pokazuje formularz dodawania nowego przycisku
   */
  function showButtonForm() {
    if (!modalButtonForm) {
      console.error('Brak formularza przycisku');
      return;
    }
    
    console.log('Pokazywanie formularza przycisku');
    
    // Mark form as NOT being in update mode
    modalButtonForm.dataset.isUpdateMode = 'false';
    
    // Clear form
    modalButtonName.value = '';
    if (modalButtonFunction) modalButtonFunction.value = '';
    
    // Remove all command fields except the first
    const commandFields = modalCommandsContainer.querySelectorAll('.command-field');
    for (let i = 1; i < commandFields.length; i++) {
      commandFields[i].remove();
    }
    
    // Clear first field if it exists
    if (commandFields.length > 0) {
      const commandInput = commandFields[0].querySelector('.command-input');
      const delayInput = commandFields[0].querySelector('.delay-input');
      if (commandInput) commandInput.value = '';
      if (delayInput) delayInput.value = '';
    } else {
      // Add first field if none exist
      addCommandField(modalCommandsContainer);
    }
    
    // Clear any existing event handlers from the save button
    if (modalSaveButton) {
      // Clone the button to remove all event listeners
      const newSaveButton = modalSaveButton.cloneNode(true);
      modalSaveButton.parentNode.replaceChild(newSaveButton, modalSaveButton);
      
      // Update our reference to the button
      modalSaveButton = newSaveButton;
      
      // Add a single clear event handler
      modalSaveButton.addEventListener('click', saveDeviceButton, false);
    }
    
    // Ensure save button has correct text
    if (modalSaveButton) {
      modalSaveButton.textContent = 'Zapisz przycisk';
    }
    
    // Show form
    modalButtonForm.style.display = 'block';
    
    // Scroll to form
    setTimeout(() => {
      modalButtonForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
  
  /**
   * Hides the button form
   * Ukrywa formularz przycisku
   */
  function hideButtonForm() {
    if (modalButtonForm) {
      modalButtonForm.style.display = 'none';
      
      // Always reset the form state when hiding
      modalButtonForm.dataset.isUpdateMode = 'false';
      
      // Reset the save button handler to the default save function
      modalSaveButton.onclick = function() {
        saveDeviceButton();
      };
      
      // Reset button text
      modalSaveButton.textContent = 'Zapisz przycisk';
      
      console.log('Formularz przycisku ukryty');
    }
  }
  
  /**
   * Adds a command field to the form
   * Dodaje pole komendy do formularza
   * @param {HTMLElement} container - Container element for command fields
   * @param {string} [commandValue] - Optional initial command value
   * @param {string|number} [delayValue] - Optional initial delay value
   */
  function addCommandField(container, commandValue = '', delayValue = '') {
    if (!container) {
      console.error('Brak kontenera dla pola komendy');
      return;
    }
    
    console.log('Dodawanie pola komendy');
    
    const commandField = document.createElement('div');
    commandField.className = 'command-field';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'command-input';
    input.placeholder = 'Dane w formacie HEX (np. 0x01020304)';
    input.value = commandValue;
    
    const delayInput = document.createElement('input');
    delayInput.type = 'number';
    delayInput.className = 'delay-input';
    delayInput.placeholder = 'Opóźnienie (ms)';
    delayInput.min = '0';
    delayInput.value = delayValue;
    
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-command btn-small btn-warning';
    removeButton.textContent = 'Usuń';
    removeButton.addEventListener('click', function() {
      // Don't remove if it's the only field
      if (container.querySelectorAll('.command-field').length > 1) {
        commandField.remove();
        console.log('Usunięto pole komendy');
      }
    });
    
    commandField.appendChild(input);
    commandField.appendChild(delayInput);
    commandField.appendChild(removeButton);
    
    container.appendChild(commandField);
  }
  
  /**
   * Saves a new button for the current device
   * Zapisuje nowy przycisk dla aktualnego urządzenia
   */
  function saveDeviceButton() {
    if (!currentDevice) {
      console.error('Brak currentDevice');
      return;
    }
    
    // Check if in update mode - if so, we shouldn't be here
    if (modalButtonForm.dataset.isUpdateMode === 'true') {
      console.warn("Save called while in update mode - this shouldn't happen");
      return;
    }
    
    console.log('Zapisywanie nowego przycisku');
    
    // Validation
    const buttonName = modalButtonName.value;
    
    if (!buttonName) {
      alert('Proszę wypełnić nazwę przycisku');
      return;
    }
    
    // Get button function
    const buttonFunction = modalButtonFunction ? 
      modalButtonFunction.value : '';
    
    // Collect commands and delays
    const commandFields = modalCommandsContainer.querySelectorAll('.command-field');
    const commands = [];
    
    let isValid = true;
    
    commandFields.forEach(field => {
      const commandInput = field.querySelector('.command-input');
      const delayInput = field.querySelector('.delay-input');
      
      if (!commandInput.value) {
        alert('Proszę wypełnić wszystkie pola komend');
        isValid = false;
        return;
      }
      
      // Validate HEX format
      if (!isValidHexFormat(commandInput.value)) {
        alert('Dane muszą być w poprawnym formacie HEX (np. 0x01020304)');
        isValid = false;
        return;
      }
      
      commands.push({
        data: commandInput.value,
        delay: parseInt(delayInput.value) || 0
      });
    });
    
    if (!isValid) return;
    
    console.log('Zapisywanie przycisku:', { buttonName, commands, buttonFunction });
    
    // Save button to localStorage
    saveDeviceButtonToStorage(currentDevice.address, buttonName, commands, buttonFunction);
    
    // Hide form
    hideButtonForm();
    
    // Reload buttons
    loadDeviceButtons(currentDevice.address);
    
    // Add log
    addDeviceLog(currentDevice.address, `Dodano nowy przycisk: ${buttonName}`);
  }
  
  /**
   * Checks if a string is a valid HEX format
   * Sprawdza, czy string jest w poprawnym formacie HEX
   * @param {string} hexString - String to check
   * @returns {boolean} - Whether the string is valid HEX
   */
  function isValidHexFormat(hexString) {
    // Accept 0x... format or plain hex
    if (hexString.startsWith('0x')) {
      hexString = hexString.substring(2);
    }
    
    // Check if string consists of only hex digits and has even length
    const isValid = /^[0-9A-Fa-f]+$/.test(hexString) && hexString.length % 2 === 0;
    console.log(`Walidacja HEX ${hexString}: ${isValid}`);
    return isValid;
  }

  // ========================================
  // BUTTON STORAGE - Przechowywanie przycisków
  // ========================================
  
  /**
   * Saves a button to localStorage for a device
   * Zapisuje przycisk w localStorage dla urządzenia
   * @param {string} address - Device MAC address
   * @param {string} buttonName - Button name
   * @param {Array} commands - Array of command objects
   * @param {string} [buttonFunction] - Optional button function
   */
  function saveDeviceButtonToStorage(address, buttonName, commands, buttonFunction = '') {
    console.log(`Zapisywanie przycisku do localStorage: ${buttonName} dla ${address}`);
    
    // Get stored device buttons
    const deviceButtonsJSON = localStorage.getItem('deviceButtons') || '{}';
    const deviceButtons = JSON.parse(deviceButtonsJSON);
    
    // Create array for device if it doesn't exist
    if (!deviceButtons[address]) {
      deviceButtons[address] = [];
    }
    
    // Add new button
    deviceButtons[address].push({
      name: buttonName,
      commands: commands,
      function: buttonFunction
    });
    
    // Save updated data
    localStorage.setItem('deviceButtons', JSON.stringify(deviceButtons));
    
    console.log(`Przycisk ${buttonName} zapisany pomyślnie`);
  }
  
  /**
   * Removes a button from localStorage
   * Usuwa przycisk z localStorage
   * @param {string} address - Device MAC address
   * @param {number} buttonIndex - Button index to remove
   * @returns {boolean} - Whether removal was successful
   */
  function removeDeviceButtonFromStorage(address, buttonIndex) {
    console.log(`Usuwanie przycisku ${buttonIndex} dla ${address}`);
    
    // Get stored device buttons
    const deviceButtonsJSON = localStorage.getItem('deviceButtons') || '{}';
    const deviceButtons = JSON.parse(deviceButtonsJSON);
    
    // Check if device and button exist
    if (deviceButtons[address] && deviceButtons[address].length > buttonIndex) {
      // Store name before removal
      const buttonName = deviceButtons[address][buttonIndex].name;
      
      // Remove button
      deviceButtons[address].splice(buttonIndex, 1);
      
      // Remove device entry if no buttons left
      if (deviceButtons[address].length === 0) {
        delete deviceButtons[address];
      }
      
      // Save updated data
      localStorage.setItem('deviceButtons', JSON.stringify(deviceButtons));
      
      // Add log
      addDeviceLog(address, `Usunięto przycisk: ${buttonName}`);
      
      console.log(`Przycisk ${buttonName} usunięty pomyślnie`);
      return true;
    }
    
    console.warn('Nie znaleziono przycisku do usunięcia');
    return false;
  }

  // ========================================
  // BUTTON CONTEXT MENU - Menu kontekstowe przycisków
  // ========================================
  
  /**
   * Creates a context menu for a button
   * Tworzy menu kontekstowe dla przycisku
   * @param {HTMLElement} button - Button element
   * @param {number} index - Button index
   * @param {string} address - Device MAC address
   */
  function createContextMenu(button, index, address) {
    console.log(`Tworzenie menu kontekstowego dla przycisku ${index}`);
    
    // Create options button (three dots)
    const optionsButton = document.createElement('div');
    optionsButton.className = 'button-options';
    optionsButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    optionsButton.title = 'Opcje przycisku';
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    
    // View option
    const viewOption = document.createElement('div');
    viewOption.className = 'context-menu-item view-option';
    viewOption.innerHTML = '<i class="fas fa-eye"></i> Podgląd komend';
    viewOption.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Get device buttons
      const deviceButtonsJSON = localStorage.getItem('deviceButtons') || '{}';
      const deviceButtons = JSON.parse(deviceButtonsJSON);
      
      if (deviceButtons[address] && deviceButtons[address][index]) {
        showCommandsPreview(deviceButtons[address][index], button.textContent);
      }
      
      // Close context menu
      contextMenu.style.display = 'none';
      activeContextMenu = null;
    });
    
    // Edit option
    const editOption = document.createElement('div');
    editOption.className = 'context-menu-item edit-option';
    editOption.innerHTML = '<i class="fas fa-edit"></i> Edytuj przycisk';
    editOption.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Get device buttons
      const deviceButtonsJSON = localStorage.getItem('deviceButtons') || '{}';
      const deviceButtons = JSON.parse(deviceButtonsJSON);
      
      if (deviceButtons[address] && deviceButtons[address][index]) {
        // Call editDeviceButton function
        editDeviceButton(deviceButtons[address][index], index, address);
      }
      
      // Close context menu
      contextMenu.style.display = 'none';
      activeContextMenu = null;
    });
    
    // Delete option
    const deleteOption = document.createElement('div');
    deleteOption.className = 'context-menu-item delete-option';
    deleteOption.innerHTML = '<i class="fas fa-trash"></i> Usuń przycisk';
    deleteOption.addEventListener('click', function(e) {
      e.stopPropagation();
      
      if (confirm('Czy na pewno chcesz usunąć ten przycisk?')) {
        if (removeDeviceButtonFromStorage(address, index)) {
          // Reload buttons
          loadDeviceButtons(address);
        }
      }
      
      // Close context menu
      contextMenu.style.display = 'none';
      activeContextMenu = null;
    });
    
    // Add options to menu
    contextMenu.appendChild(viewOption);
    contextMenu.appendChild(editOption);
    contextMenu.appendChild(deleteOption);
    
    // Handle click on options button
    optionsButton.addEventListener('click', function(e) {
      e.stopPropagation();
      
      // Close other open menu if exists
      if (activeContextMenu && activeContextMenu !== contextMenu) {
        activeContextMenu.style.display = 'none';
      }
      
      // Toggle menu visibility
      if (contextMenu.style.display === 'block') {
        contextMenu.style.display = 'none';
        activeContextMenu = null;
      } else {
        // Position menu
        contextMenu.style.display = 'block';
        
        // Store active menu
        activeContextMenu = contextMenu;
      }
    });
    
    // Add options button and menu to button
    button.appendChild(optionsButton);
    button.appendChild(contextMenu);
  }

  // ========================================
  // BUTTON LOADING - Ładowanie przycisków
  // ========================================
  
  /**
   * Loads buttons for a device from localStorage
   * Ładuje przyciski dla urządzenia z localStorage
   * @param {string} address - Device MAC address
   */
  function loadDeviceButtons(address) {
    if (!modalDeviceButtons || !address) {
      console.error('Brak elementu przycisków lub adresu');
      return;
    }
    
    console.log(`Ładowanie przycisków dla urządzenia: ${address}`);
    
    // Clear buttons container
    modalDeviceButtons.innerHTML = '';
    
    // Get stored device buttons
    const deviceButtonsJSON = localStorage.getItem('deviceButtons') || '{}';
    const deviceButtons = JSON.parse(deviceButtonsJSON);
    
    // Check if device has buttons
    if (deviceButtons[address] && deviceButtons[address].length > 0) {
      console.log(`Ładowanie ${deviceButtons[address].length} przycisków dla urządzenia ${address}`);
      
      // Add each button to container
      deviceButtons[address].forEach((button, index) => {
        const buttonElement = document.createElement('button');
        buttonElement.className = 'device-custom-button';
        buttonElement.textContent = button.name;
        
        // Add data-function attribute if defined
        if (button.function) {
          buttonElement.setAttribute('data-function', button.function);
        }
        // Check name for older buttons without function
        else {
          const lowerName = button.name.toLowerCase();
          if (lowerName.includes('power') || lowerName.includes('zasilanie')) {
            buttonElement.setAttribute('data-function', 'power');
          } else if (lowerName.includes('volume') || lowerName.includes('głośność')) {
            buttonElement.setAttribute('data-function', 'volume-up');
          } else if (lowerName.includes('light') || lowerName.includes('led') || lowerName.includes('światło')) {
            buttonElement.setAttribute('data-function', 'light');
          }
        }
        
        // Add disabled class if device not connected
        if (!currentDevice.connected) {
          buttonElement.classList.add('disabled');
        }
        
        // Add click handler (for connected devices only)
        buttonElement.addEventListener('click', function(e) {
          // Skip if clicked on options or context menu
          if (e.target.closest('.button-options') || e.target.closest('.context-menu')) {
            return;
          }
          
          if (currentDevice && currentDevice.connected) {
            console.log(`Wykonywanie przycisku: ${button.name}`);
            executeCommandSequence(button.commands, address);
          } else {
            console.log('Urządzenie niepołączone - przycisk nieaktywny');
          }
        });
        
        // Add context menu
        createContextMenu(buttonElement, index, address);
        
        modalDeviceButtons.appendChild(buttonElement);
      });
    } else {
      // Show message if no buttons
      modalDeviceButtons.innerHTML = '<div class="no-buttons-message">Brak zdefiniowanych przycisków dla tego urządzenia.</div>';
      console.log('Brak przycisków dla urządzenia');
    }
  }

  // ========================================
  // COMMAND EXECUTION - Wykonywanie komend
  // ========================================
  
  /**
   * Starts execution of a command sequence
   * Rozpoczyna wykonywanie sekwencji komend
   * @param {Array} commands - Array of command objects
   * @param {string} address - Device MAC address
   */
  function executeCommandSequence(commands, address) {
    if (!commands || commands.length === 0 || !address) {
      console.error('Brak komend lub adresu');
      return;
    }
    
    console.log(`Rozpoczynanie sekwencji ${commands.length} komend dla ${address}`);
    
    // Add log
    addDeviceLog(address, `Uruchamiam sekwencję ${commands.length} komend`);
    
    // Save sequence to localStorage
    const sequence = {
      commands: commands,
      currentIndex: 0,
      totalCommands: commands.length,
      deviceAddress: address
    };
    
    localStorage.setItem('activeCommandSequence', JSON.stringify(sequence));
    
    // Execute first command
    executeNextCommand();
  }
  
  /**
   * Executes the next command in the active sequence
   * Wykonuje następną komendę w aktywnej sekwencji
   */
  function executeNextCommand() {
    const sequenceJSON = localStorage.getItem('activeCommandSequence');
    if (!sequenceJSON) {
      console.log('Brak aktywnej sekwencji komend');
      return;
    }
    
    const sequence = JSON.parse(sequenceJSON);
    
    // Check if commands left
    if (sequence.currentIndex >= sequence.commands.length) {
      // Add log
      addDeviceLog(sequence.deviceAddress, 'Sekwencja komend zakończona');
      localStorage.removeItem('activeCommandSequence');
      console.log('Sekwencja komend zakończona');
      return;
    }
    
    // Get current command
    const currentCommand = sequence.commands[sequence.currentIndex];
    console.log(`Wykonywanie komendy ${sequence.currentIndex + 1}/${sequence.totalCommands}: ${currentCommand.data}`);
    addDeviceLog(sequence.deviceAddress, `Wykonuję komendę ${sequence.currentIndex + 1}/${sequence.totalCommands}: ${currentCommand.data}`);
    
    // Update index
    sequence.currentIndex++;
    localStorage.setItem('activeCommandSequence', JSON.stringify(sequence));
    
    // Send command
    sendCommand(currentCommand.data, currentCommand.delay, sequence.deviceAddress);
  }
  
  /**
   * Sends a command and sets timer for next command
   * Wysyła komendę i ustawia timer na następną
   * @param {string} data - Command data
   * @param {number} delay - Delay before next command
   * @param {string} address - Device MAC address
   */
  function sendCommand(data, delay, address) {
    console.log(`Wysyłanie komendy: ${data} z opóźnieniem ${delay}ms`);
    
    // Prepare form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/send';
    form.id = 'command-form';
    
    const dataInput = document.createElement('input');
    dataInput.type = 'hidden';
    dataInput.name = 'data';
    dataInput.value = data;
    
    const delayInput = document.createElement('input');
    delayInput.type = 'hidden';
    delayInput.name = 'continue_sequence';
    delayInput.value = 'true';
    
    form.appendChild(dataInput);
    form.appendChild(delayInput);
    document.body.appendChild(form);
    
    // Add flag for sequence continuation
    localStorage.setItem('commandWithTimer', 'true');
    localStorage.setItem('commandDelay', delay.toString());
    localStorage.setItem('commandDeviceAddress', address);
    
    // Short delay for logs to update
    setTimeout(() => {
      form.submit();
    }, 100);
  }
  
  /**
   * Checks and continues command sequence if active
   * Sprawdza i kontynuuje sekwencję komend jeśli jest aktywna
   */
  function checkAndContinueCommandSequence() {
    const commandWithTimer = localStorage.getItem('commandWithTimer');
    if (commandWithTimer) {
      console.log('Kontynuowanie sekwencji komend');
      
      // Get delay
      const delay = parseInt(localStorage.getItem('commandDelay') || '0');
      
      // Remove flags
      localStorage.removeItem('commandWithTimer');
      localStorage.removeItem('commandDelay');
      
      // Set timer for next command
      setTimeout(() => {
        executeNextCommand();
      }, delay);
    }
  }

  // ========================================
  // LOGGING - System logowania
  // ========================================
  
  /**
   * Adds a log entry for a device with date and time
   * Dodaje wpis do logu dla urządzenia z datą i godziną
   * @param {string} address - Device MAC address
   * @param {string} message - Message to add
   */
  function addDeviceLog(address, message) {
    console.log(`Dodawanie logu dla ${address}: ${message}`);
    
    // Get stored device logs
    const deviceLogsJSON = localStorage.getItem('deviceLogs') || '{}';
    const deviceLogs = JSON.parse(deviceLogsJSON);
    
    // Create array for device if it doesn't exist
    if (!deviceLogs[address]) {
      deviceLogs[address] = [];
    }
    
    // Add log with timestamp and date
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    const dateStr = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
    const logEntry = `[${dateStr}] [${timestamp}] ${message}`;
    deviceLogs[address].push(logEntry);
    
    // Limit to 100 logs per device
    if (deviceLogs[address].length > 100) {
      deviceLogs[address].shift(); // Remove oldest log
    }
    
    // Save updated logs
    localStorage.setItem('deviceLogs', JSON.stringify(deviceLogs));
    
    // Add to page logs
    const logContainer = document.querySelector('.log-container');
    if (logContainer) {
      const logEntryElement = document.createElement('div');
      logEntryElement.className = 'log-entry';
      logEntryElement.textContent = `[${address}] ${message}`;
      logContainer.insertBefore(logEntryElement, logContainer.firstChild);
    }
    
    // Refresh device logs if modal shows this device
    if (currentDevice && currentDevice.address === address) {
      loadDeviceLogs(address);
    }
  }
  
  /**
   * Loads logs for a device with optional filtering using AND logic
   * Ładuje logi dla urządzenia z opcjonalnym filtrowaniem używając logiki AND
   * @param {string} address - Device MAC address
   * @param {boolean} applyFilters - Whether to apply filters
   */
  function loadDeviceLogs(address, applyFilters = false) {
    console.log('Ładowanie logów dla urządzenia:', address, 'z filtrami:', applyFilters);
    
    if (!deviceLogContent || !address) {
      console.warn('Brak deviceLogContent lub address');
      return;
    }
    
    // Clear logs container
    deviceLogContent.innerHTML = '';
    
    // Get stored device logs
    const deviceLogsJSON = localStorage.getItem('deviceLogs') || '{}';
    const deviceLogs = JSON.parse(deviceLogsJSON);
    
    console.log('Logi urządzenia z localStorage:', deviceLogs[address]);
    
    // Check if device has logs
    if (deviceLogs[address] && deviceLogs[address].length > 0) {
      // Prepare filters if required
      let dateFromFilter = '';
      let dateToFilter = '';
      let timeFromFilter = '';
      let timeToFilter = '';
      let textFilter = '';
      
      if (applyFilters) {
        console.log('Stosowanie filtrów z logiką AND...');
        
        // Get filter values
        dateFromFilter = logFilterDateFrom?.value || '';
        dateToFilter = logFilterDateTo?.value || '';
        timeFromFilter = logFilterTimeFrom?.value || '';
        timeToFilter = logFilterTimeTo?.value || '';
        textFilter = logFilterText?.value?.toLowerCase() || '';
        
        console.log('Wartości filtrów:', {
          dateFromFilter,
          dateToFilter,
          timeFromFilter,
          timeToFilter,
          textFilter
        });
        
        // Auto-set date range - ZMIENIONE: ustawia dzisiejszą datę zamiast kopiować DateFrom
        if (dateFromFilter && !dateToFilter) {
          dateToFilter = getTodaysDate();
          console.log('Automatycznie ustawiono datę "do" na dzisiejszą datę podczas filtrowania');
        }
        
        // Auto-set time range
        if (timeFromFilter && !timeToFilter) {
          timeToFilter = '23:59';
        }
        
        if (!timeFromFilter && timeToFilter) {
          timeFromFilter = '00:00';
        }
      }
      
      // Filter logs with AND logic
      let filteredLogs = deviceLogs[address].slice();
      let foundMatches = false;
      
      if (applyFilters && (dateFromFilter || dateToFilter || timeFromFilter || timeToFilter || textFilter)) {
        console.log('Filtrowanie logów z warunkami AND...');
        console.log('Aktywne filtry:', { dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, textFilter });
        
        filteredLogs = deviceLogs[address].filter(log => {
          console.log('Sprawdzanie logu:', log);
          
          // Extract timestamp and date from log
          const dateMatch = log.match(/\[(\d{4}-\d{2}-\d{2})\]/);
          const timestampMatch = log.match(/\[([\d:]+)\]/);
          
          const logDate = dateMatch ? dateMatch[1] : null;
          const logTime = timestampMatch ? timestampMatch[1] : null;
          const logText = log.toLowerCase();
          
          console.log('Wyciągnięte dane:', { logDate, logTime, logText: logText.substring(0, 50) + '...' });
          
          // AND CONDITION #1: Date "from" filter
          if (dateFromFilter) {
            if (!logDate || logDate < dateFromFilter) {
              console.log(`Odrzucono - data ${logDate} jest wcześniejsza niż ${dateFromFilter}`);
              return false;
            }
            console.log(`Data "od" OK: ${logDate} >= ${dateFromFilter}`);
          }
          
          // AND CONDITION #2: Date "to" filter
          if (dateToFilter) {
            if (!logDate || logDate > dateToFilter) {
              console.log(`Odrzucono - data ${logDate} jest późniejsza niż ${dateToFilter}`);
              return false;
            }
            console.log(`Data "do" OK: ${logDate} <= ${dateToFilter}`);
          }
          
          // AND CONDITION #3 & #4: Time filters
          if (timeFromFilter || timeToFilter) {
            if (!logTime) {
              console.log('Odrzucono - brak czasu w logu, ale filtr czasu jest aktywny');
              return false;
            }
            
            const logTimeParts = logTime.split(':');
            if (logTimeParts.length < 2) {
              console.log('Odrzucono - niepoprawny format czasu w logu');
              return false;
            }
            
            const logHours = parseInt(logTimeParts[0]);
            const logMinutes = parseInt(logTimeParts[1]);
            const logTimeMinutes = logHours * 60 + logMinutes;
            
            // AND CONDITION #3: Time "from"
            if (timeFromFilter) {
              const fromTimeParts = timeFromFilter.split(':');
              const fromHours = parseInt(fromTimeParts[0]);
              const fromMinutes = parseInt(fromTimeParts[1]);
              const fromTimeMinutes = fromHours * 60 + fromMinutes;
              
              if (logTimeMinutes < fromTimeMinutes) {
                console.log(`Odrzucono - czas ${logTime} jest wcześniejszy niż ${timeFromFilter}`);
                return false;
              }
              console.log(`Czas "od" OK: ${logTime} >= ${timeFromFilter}`);
            }
            
            // AND CONDITION #4: Time "to"
            if (timeToFilter) {
              const toTimeParts = timeToFilter.split(':');
              const toHours = parseInt(toTimeParts[0]);
              const toMinutes = parseInt(toTimeParts[1]);
              const toTimeMinutes = toHours * 60 + toMinutes;
              
              if (logTimeMinutes > toTimeMinutes) {
                console.log(`Odrzucono - czas ${logTime} jest późniejszy niż ${timeToFilter}`);
                return false;
              }
              console.log(`Czas "do" OK: ${logTime} <= ${timeToFilter}`);
            }
          }
          
          // AND CONDITION #5: Text filter
          if (textFilter) {
            if (!logText.includes(textFilter)) {
              console.log(`Odrzucono - tekst nie zawiera "${textFilter}"`);
              return false;
            }
            console.log(`Tekst OK: zawiera "${textFilter}"`);
          }
          
          // All AND conditions met
          console.log('Log przeszedł przez wszystkie filtry AND');
          return true;
        });

        foundMatches = filteredLogs.length > 0;
        console.log(`Po filtrowaniu AND zostało ${filteredLogs.length} logów z ${deviceLogs[address].length}`);
        
        // Add information about filtered logs count to summary
        const filterSummary = document.querySelector('.filter-summary');
        if (filterSummary && filteredLogs.length < deviceLogs[address].length) {
          const filterInfo = document.createElement('div');
          filterInfo.className = 'filter-results-info';
          filterInfo.style.cssText = 'margin-top: 5px; font-size: 11px; color: #3498db; font-weight: bold;';
          filterInfo.textContent = `Pokazano ${filteredLogs.length} z ${deviceLogs[address].length} logów`;
          
          // Remove previous info if exists
          const existingInfo = filterSummary.querySelector('.filter-results-info');
          if (existingInfo) {
            existingInfo.remove();
          }
          
          filterSummary.appendChild(filterInfo);
        }
      }
      
      // Add each log to container (from newest)
      if (filteredLogs.length > 0) {
        filteredLogs.slice().reverse().forEach(log => {
          const logElement = document.createElement('div');
          logElement.className = 'log-entry';
          
          // If filtering and have text filter, highlight matches
          if (applyFilters && textFilter && log.toLowerCase().includes(textFilter)) {
            logElement.classList.add('highlight');
            
            // Highlight matched text
            const regex = new RegExp('(' + textFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'gi');
            const highlightedText = log.replace(regex, '<span class="highlight-text">$1</span>');
            logElement.innerHTML = highlightedText;
          } else {
            logElement.textContent = log;
          }
          
          deviceLogContent.appendChild(logElement);
        });
      } else {
        // Show message if no logs or no matches found
        const noLogsMsg = document.createElement('div');
        noLogsMsg.className = 'no-logs-message';
        
        if (applyFilters && !foundMatches) {
          noLogsMsg.textContent = 'Brak logów pasujących do filtrów.';
        } else {
          noLogsMsg.textContent = 'Brak logów dla tego urządzenia.';
        }
        
        deviceLogContent.appendChild(noLogsMsg);
      }
    } else {
      // Show message if no logs
      deviceLogContent.innerHTML = '<div class="no-logs-message">Brak logów dla tego urządzenia.</div>';
    }
  }
  
  /**
   * Clears logs for the current device
   * Czyści logi dla aktualnego urządzenia
   */
  function clearDeviceLogsFromModal() {
    if (!currentDevice || !currentDevice.address) {
      console.warn('Brak currentDevice do wyczyszczenia logów');
      return;
    }
    
    console.log(`Czyszczenie logów dla ${currentDevice.address}`);
    
    // Get stored device logs
    const deviceLogsJSON = localStorage.getItem('deviceLogs') || '{}';
    const deviceLogs = JSON.parse(deviceLogsJSON);
    
    // Clear logs for device
    if (deviceLogs[currentDevice.address]) {
      deviceLogs[currentDevice.address] = [];
      
      // Save updated logs
      localStorage.setItem('deviceLogs', JSON.stringify(deviceLogs));
      
      // Refresh logs view
      loadDeviceLogs(currentDevice.address);
      
      console.log('Logi wyczyszczone');
    }
  }

  // ========================================
  // BUTTON PREVIEW & EDITING - Podgląd i edycja przycisków
  // ========================================

  /**
   * Displays a preview of commands for a button
   * Wyświetla podgląd komend dla przycisku
   * @param {Object} buttonData - Button data
   * @param {string} buttonName - Button name
   */
  function showCommandsPreview(buttonData, buttonName) {
    console.log(`Pokazywanie podglądu komend dla przycisku: ${buttonName}`);
    
    // Check if preview modal exists
    let previewModal = document.getElementById('commands-preview-modal');
    
    // Create modal if it doesn't exist
    if (!previewModal) {
      previewModal = document.createElement('div');
      previewModal.id = 'commands-preview-modal';
      previewModal.className = 'modal commands-preview-modal';
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content preview-modal-content';
      
      // Close button
      const closeButton = document.createElement('span');
      closeButton.className = 'close-modal';
      closeButton.innerHTML = '&times;';
      closeButton.addEventListener('click', function() {
        previewModal.style.display = 'none';
      });
      
      modalContent.appendChild(closeButton);
      previewModal.appendChild(modalContent);
      document.body.appendChild(previewModal);
      
      // Close when clicking outside
      window.addEventListener('click', function(e) {
        if (e.target === previewModal) {
          previewModal.style.display = 'none';
        }
      });
    }
    
    // Update modal content
    const modalContent = previewModal.querySelector('.modal-content');
    
    // Header
    let content = `<h2>Podgląd komend przycisku "${buttonName}"</h2>`;
    
    // Commands list
    content += '<div class="commands-list">';
    
    if (buttonData.commands && buttonData.commands.length > 0) {
      buttonData.commands.forEach((cmd, index) => {
        content += `
          <div class="command-preview">
            <div class="command-number">${index + 1}</div>
            <div class="command-details">
              <div class="command-data">${cmd.data}</div>
              <div class="command-delay">Opóźnienie: ${cmd.delay} ms</div>
            </div>
          </div>
        `;
      });
    } else {
      content += '<p>Brak komend przypisanych do tego przycisku.</p>';
    }
    
    content += '</div>';
    
    // Function info
    if (buttonData.function) {
      const functionNames = {
        'power': 'Zasilanie',
        'volume-up': 'Głośność',
        'light': 'Światło/LED'
      };
      
      const functionName = functionNames[buttonData.function] || buttonData.function;
      content += `<div class="button-function">Funkcja przycisku: ${functionName}</div>`;
    }
    
    // Close button
    content += '<div class="modal-footer"><button class="btn" onclick="document.getElementById(\'commands-preview-modal\').style.display=\'none\'">Zamknij</button></div>';
    
    modalContent.innerHTML = `
      <span class="close-modal">&times;</span>
      ${content}
    `;
    
    // Add handler for close button
    const closeBtn = modalContent.querySelector('.close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        previewModal.style.display = 'none';
      });
    }
    
    // Show modal
    previewModal.style.display = 'block';
  }

  /**
   * Opens the form to edit an existing button
   * Otwiera formularz edycji istniejącego przycisku
   * @param {Object} buttonData - Button data
   * @param {number} buttonIndex - Button index
   * @param {string} deviceAddress - Device MAC address
   */
  function editDeviceButton(buttonData, buttonIndex, deviceAddress) {
    if (!modalButtonForm) {
      console.error('Brak formularza przycisku');
      return;
    }
    
    console.log("Edycja przycisku:", buttonData, buttonIndex, deviceAddress);
    
    // Mark form as being in update mode
    modalButtonForm.dataset.isUpdateMode = 'true';
    
    // Fill form with button data
    modalButtonName.value = buttonData.name || '';
    
    if (modalButtonFunction) {
      modalButtonFunction.value = buttonData.function || '';
    }
    
    // Remove all command fields
    while (modalCommandsContainer.firstChild) {
      modalCommandsContainer.removeChild(modalCommandsContainer.firstChild);
    }
    
    // Add command fields with data
    if (buttonData.commands && buttonData.commands.length > 0) {
      buttonData.commands.forEach(cmd => {
        addCommandField(modalCommandsContainer, cmd.data, cmd.delay);
      });
    } else {
      // Add empty field if no commands
      addCommandField(modalCommandsContainer);
    }
    
    // Store buttonIndex and deviceAddress for later use
    modalButtonForm.dataset.buttonIndex = buttonIndex;
    modalButtonForm.dataset.deviceAddress = deviceAddress;
    
    // Clear any existing event handlers from the save button
    if (modalSaveButton) {
      // Clone the button to remove all event listeners
      const newSaveButton = modalSaveButton.cloneNode(true);
      modalSaveButton.parentNode.replaceChild(newSaveButton, modalSaveButton);
      
      // Update our reference to the button
      modalSaveButton = newSaveButton;
      
      // Add a single clear event handler that uses the stored index and address
      modalSaveButton.addEventListener('click', function(e) {
        e.preventDefault();
        const idx = parseInt(modalButtonForm.dataset.buttonIndex);
        const addr = modalButtonForm.dataset.deviceAddress;
        updateExistingButton(idx, addr);
        return false;
      }, false);
    }
    
    // Change button text
    if (modalSaveButton) {
      modalSaveButton.textContent = 'Aktualizuj przycisk';
    }
    
    // Change cancel handler
    if (modalCancelButton) {
      // Clone the button to remove all event listeners
      const newCancelButton = modalCancelButton.cloneNode(true);
      modalCancelButton.parentNode.replaceChild(newCancelButton, modalCancelButton);
      
      // Update our reference to the button
      modalCancelButton = newCancelButton;
      
      // Add new handler
      modalCancelButton.addEventListener('click', hideButtonForm, false);
    }
    
    // Show form
    modalButtonForm.style.display = 'block';
    
    // Scroll to form
    setTimeout(() => {
      modalButtonForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  /**
   * Updates an existing button in localStorage
   * Aktualizuje istniejący przycisk w localStorage
   * @param {number} buttonIndex - Button index
   * @param {string} deviceAddress - Device MAC address
   */
  function updateExistingButton(buttonIndex, deviceAddress) {
    if (!currentDevice) {
      console.error('Brak currentDevice');
      return;
    }
    
    console.log(`Aktualizacja przycisku ${buttonIndex} dla ${deviceAddress}`);
    
    // Validation
    const buttonName = modalButtonName.value;
    
    if (!buttonName) {
      alert('Proszę wypełnić nazwę przycisku');
      return;
    }
    
    // Get button function
    const buttonFunction = modalButtonFunction ? 
      modalButtonFunction.value : '';
    
    // Collect commands and delays
    const commandFields = modalCommandsContainer.querySelectorAll('.command-field');
    const commands = [];
    
    let isValid = true;
    
    commandFields.forEach(field => {
      const commandInput = field.querySelector('.command-input');
      const delayInput = field.querySelector('.delay-input');
      
      if (!commandInput.value) {
        alert('Proszę wypełnić wszystkie pola komend');
        isValid = false;
        return;
      }
      
      // Validate HEX format
      if (!isValidHexFormat(commandInput.value)) {
        alert('Dane muszą być w poprawnym formacie HEX (np. 0x01020304)');
        isValid = false;
        return;
      }
      
      commands.push({
        data: commandInput.value,
        delay: parseInt(delayInput.value) || 0
      });
    });
    
    if (!isValid) return;
    
    // Get stored device buttons
    const deviceButtonsJSON = localStorage.getItem('deviceButtons') || '{}';
    const deviceButtons = JSON.parse(deviceButtonsJSON);
    
    // Check if device and button exist
    if (deviceButtons[deviceAddress] && deviceButtons[deviceAddress].length > buttonIndex) {
      // Update button
      deviceButtons[deviceAddress][buttonIndex] = {
        name: buttonName,
        commands: commands,
        function: buttonFunction
      };
      
      // Save updated data
      localStorage.setItem('deviceButtons', JSON.stringify(deviceButtons));
      
      // Hide form
      hideButtonForm();
      
      // Reset the update state first to prevent double saves
      modalButtonForm.dataset.isUpdateMode = 'false';
      
      // Restore original save handler
      modalSaveButton.onclick = function() {
        saveDeviceButton();
      };
      
      // Restore button text
      modalSaveButton.textContent = 'Zapisz przycisk';
      
      // Reload buttons
      loadDeviceButtons(deviceAddress);
      
      // Add log
      addDeviceLog(deviceAddress, `Zaktualizowano przycisk: ${buttonName}`);
      
      console.log(`Przycisk ${buttonName} zaktualizowany pomyślnie`);
    } else {
      alert('Błąd: Nie znaleziono przycisku do aktualizacji');
    }
  }

  // ========================================
  // GLOBAL EXPORTS - Eksport funkcji globalnych
  // ========================================

  // Make functions available globally for easy access from other components
  window.addDeviceLog = addDeviceLog;
  window.editDeviceButton = editDeviceButton;
  window.showCommandsPreview = showCommandsPreview;
  window.loadDeviceLogs = loadDeviceLogs;
  window.loadDeviceButtons = loadDeviceButtons;
  
  // ========================================
  // ADDITIONAL EVENT LISTENERS - Dodatkowe event listenery
  // ========================================
  
  // Additional event listener for edit button fix
  document.addEventListener('click', function(e) {
    // Check if clicking an edit option in context menu
    if (e.target && (e.target.closest('.edit-option') || 
        (e.target.tagName === 'I' && e.target.parentNode.classList.contains('edit-option')))) {
      
      const menuItem = e.target.closest('.edit-option') || e.target.parentNode;
      const contextMenu = menuItem.closest('.context-menu');
      const button = contextMenu ? contextMenu.closest('.device-custom-button') : null;
      
      if (!button) return;
      
      // Find button index
      const deviceButtonsContainer = button.closest('.device-buttons');
      const allButtons = Array.from(deviceButtonsContainer.querySelectorAll('.device-custom-button'));
      const buttonIndex = allButtons.indexOf(button);
      
      // Get device address from modal
      const deviceAddress = modalDeviceAddress ? modalDeviceAddress.textContent : '';
      
      if (deviceAddress && buttonIndex >= 0) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get button data
        const deviceButtonsJSON = localStorage.getItem('deviceButtons') || '{}';
        const deviceButtons = JSON.parse(deviceButtonsJSON);
        
        if (deviceButtons[deviceAddress] && deviceButtons[deviceAddress][buttonIndex]) {
          // Edit button
          editDeviceButton(deviceButtons[deviceAddress][buttonIndex], buttonIndex, deviceAddress);
          
          // Close menu
          contextMenu.style.display = 'none';
          activeContextMenu = null;
        }
      }
    }
  }, true);  // Use capture phase to ensure handling before other listeners
  
  console.log('device-modal.js w pełni zainicjalizowany');
});