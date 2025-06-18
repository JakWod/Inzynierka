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
 * - System media controls: play/pause, volume up, volume down, previous, next, stop, mute
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
  
  let currentDevice = null; // Aktualnie wybrane
  let activeContextMenu = null; // Aktywne menu kontekstowe dla przycisków
  
  // System Audio Context for media controls
  let audioContext = null;
  let gainNode = null;
  const DEFAULT_VOLUME = 0.5;
  let currentVolume = DEFAULT_VOLUME;
  let isPlaying = false;
  
  // ========================================
  // INITIALIZATION - Inicjalizacja modułu
  // ========================================
  
  // Initialize modal functionality
  initDeviceModal();
  
  // Initialize system audio for media controls
  initSystemAudio();

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
    
    // Update the button function dropdown with system control options
    updateButtonFunctionOptions();
    
    console.log('Device modal zainicjalizowany');
  }
  
  /**
   * Initialize system audio for media controls
   * Inicjalizuje system audio dla przycisków sterowania mediami
   */
  function initSystemAudio() {
    try {
      // Create audio context if not already created
      if (!audioContext) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // Create a gain node for volume control
        gainNode = audioContext.createGain();
        gainNode.gain.value = currentVolume;
        gainNode.connect(audioContext.destination);
        
        // Create a test audio element for audio playing
        if (!window.testAudioElement) {
          window.testAudioElement = new Audio();
          window.testAudioElement.volume = currentVolume;
          window.testAudioElement.src = "data:audio/wav;base64,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";
        }
        
        console.log('System Audio initialized successfully');
      }
    } catch (e) {
      console.error('Failed to initialize System Audio:', e);
      addToLog('Błąd inicjalizacji System Audio: ' + e.message);
    }
  }
  
  /**
   * Updates the button function dropdown with system control options
   * Aktualizuje listę funkcji przycisków o opcje sterowania systemem
   */
  function updateButtonFunctionOptions() {
    // Get the button function dropdown
    if (modalButtonFunction) {
      // Check if system media control options already exist
      if (!modalButtonFunction.querySelector('option[value="system-play"]')) {
        // Add system media control options
        const systemPlayOption = document.createElement('option');
        systemPlayOption.value = 'system-play';
        systemPlayOption.textContent = 'Odtwarzanie (systemowe)';
        
        const systemVolumeUpOption = document.createElement('option');
        systemVolumeUpOption.value = 'system-volume-up';
        systemVolumeUpOption.textContent = 'Głośność + (systemowa)';
        
        const systemVolumeDownOption = document.createElement('option');
        systemVolumeDownOption.value = 'system-volume-down';
        systemVolumeDownOption.textContent = 'Głośność - (systemowa)';
        
        // ✅ NOWE OPCJE - DODANE:
        const systemPreviousOption = document.createElement('option');
        systemPreviousOption.value = 'system-previous';
        systemPreviousOption.textContent = 'Poprzedni utwór (systemowy)';
        
        const systemNextOption = document.createElement('option');
        systemNextOption.value = 'system-next';
        systemNextOption.textContent = 'Następny utwór (systemowy)';
        
        const systemStopOption = document.createElement('option');
        systemStopOption.value = 'system-stop';
        systemStopOption.textContent = 'Stop (systemowy)';
        
        const systemMuteOption = document.createElement('option');
        systemMuteOption.value = 'system-mute';
        systemMuteOption.textContent = 'Wycisz (systemowe)';
        
        // Add a separator
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '──────────────';
        
        // Add options to the dropdown
        modalButtonFunction.appendChild(separator);
        modalButtonFunction.appendChild(systemPlayOption);
        modalButtonFunction.appendChild(systemVolumeUpOption);
        modalButtonFunction.appendChild(systemVolumeDownOption);
        modalButtonFunction.appendChild(systemPreviousOption);  // ✅ NOWE
        modalButtonFunction.appendChild(systemNextOption);     // ✅ NOWE
        modalButtonFunction.appendChild(systemStopOption);     // ✅ NOWE
        modalButtonFunction.appendChild(systemMuteOption);     // ✅ NOWE
        
        console.log('System control options added to button function dropdown');
      }
    }
    
    // Add CSS for system media control buttons
    if (!document.getElementById('system-media-controls-style')) {
      const style = document.createElement('style');
      style.id = 'system-media-controls-style';
      style.textContent = `
        .device-custom-button[data-function^="system-"] {
          background: linear-gradient(to bottom, #9b59b6, #8e44ad);
        }
        
        .device-custom-button[data-function^="system-"]:hover {
          background: linear-gradient(to bottom, #8e44ad, #6c3483);
        }
        
        .device-custom-button[data-function="system-play"]::before {
          content: "\\f04b"; /* play icon */
        }
        
        .device-custom-button[data-function="system-volume-up"]::before {
          content: "\\f028"; /* volume up icon */
        }
        
        .device-custom-button[data-function="system-volume-down"]::before {
          content: "\\f027"; /* volume down icon */
        }
        
        .device-custom-button[data-function="system-previous"]::before {
          content: "\\f048"; /* step-backward icon */
        }
        
        .device-custom-button[data-function="system-next"]::before {
          content: "\\f051"; /* step-forward icon */
        }
        
        .device-custom-button[data-function="system-stop"]::before {
          content: "\\f04d"; /* stop icon */
        }
        
        .device-custom-button[data-function="system-mute"]::before {
          content: "\\f6a9"; /* volume-mute icon */
        }
        
        .active-control {
          transform: scale(0.95) !important;
          box-shadow: 0 2px 3px rgba(0, 0, 0, 0.3) !important;
          transition: all 0.1s !important;
        }
      `;
      document.head.appendChild(style);
      console.log('Added CSS styles for system media control buttons');
    }
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
          if (confirm('Czy na pewno chcesz rozparować to?')) {
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
    
    // Button function change handler
    if (modalButtonFunction) {
      modalButtonFunction.addEventListener('change', function() {
        handleButtonFunctionChange();
      });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
      if (e.target === deviceDetailsModal) {
        hideDeviceModal();
      }
    });
    
    console.log('Event listenery skonfigurowane');
  }
  
  /**
   * Handle button function changes, show/hide command fields based on function type
   * Obsługuje zmianę funkcji przycisku, pokazuje/ukrywa pola komend w zależności od typu funkcji
   */
  function handleButtonFunctionChange() {
    const functionValue = modalButtonFunction.value;
    const isSystemControl = functionValue.startsWith('system-');
    
    // Show/hide commands container based on whether it's a system control
    if (modalCommandsContainer) {
      if (isSystemControl) {
        // Hide commands for system controls
        modalCommandsContainer.style.display = 'none';
        if (modalAddCommand) modalAddCommand.style.display = 'none';
        
        // Add info text
        const infoText = document.createElement('div');
        infoText.className = 'system-control-info';
        infoText.style.cssText = 'padding: 10px; margin: 10px 0; background-color: #1e1e1e; color: #e0e0e0; border-radius: 4px; border-left: 3px solid #3498db;';
        
        let infoMessage = '';
        if (functionValue === 'system-play') {
          infoMessage = 'Ten przycisk będzie sterował odtwarzaniem dźwięku przez system komputera, a nie przez Bluetooth.';
        } else if (functionValue === 'system-volume-up') {
          infoMessage = 'Ten przycisk będzie zwiększał głośność systemową komputera, a nie urządzenia Bluetooth.';
        } else if (functionValue === 'system-volume-down') {
          infoMessage = 'Ten przycisk będzie zmniejszał głośność systemową komputera, a nie urządzenia Bluetooth.';
        } 
        // ✅ NOWE KOMUNIKATY - DODANE:
        else if (functionValue === 'system-previous') {
          infoMessage = 'Ten przycisk będzie przełączał na poprzedni utwór w systemie komputera.';
        } else if (functionValue === 'system-next') {
          infoMessage = 'Ten przycisk będzie przełączał na następny utwór w systemie komputera.';
        } else if (functionValue === 'system-stop') {
          infoMessage = 'Ten przycisk będzie zatrzymywał odtwarzanie mediów w systemie komputera.';
        } else if (functionValue === 'system-mute') {
          infoMessage = 'Ten przycisk będzie wyciszał/przywracał dźwięk systemowy komputera.';
        }
        
        infoText.textContent = infoMessage;
        
        // Remove existing info
        const existingInfo = modalButtonForm.querySelector('.system-control-info');
        if (existingInfo) existingInfo.remove();
        
        // Add info after function selection
        if (modalButtonFunction.parentNode) {
          modalButtonFunction.parentNode.after(infoText);
        }
      } else {
        // Show commands for regular functions
        modalCommandsContainer.style.display = 'block';
        if (modalAddCommand) modalAddCommand.style.display = 'block';
        
        // Remove system control info if exists
        const existingInfo = modalButtonForm.querySelector('.system-control-info');
        if (existingInfo) existingInfo.remove();
      }
    }
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
      console.log('Kliknięto');
      
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
      
      console.log('Wybrano:', currentDevice);
      
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
      
      console.log('Przyciski wyłączone - niepołączone');
    } else {
      // Remove disabled class from the buttons container
      if (deviceButtons) {
        deviceButtons.classList.remove('disabled-section');
      }
      
      // Remove disabled class from all buttons
      customButtons.forEach(button => {
        button.classList.remove('disabled');
      });
      
      console.log('Przyciski włączone - połączone');
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
   * Rozłącza aktualne
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
   * Rozparowuje z poziomu modalu
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
      'other': 'Inne'
    };
    
    return typeNames[typeCode] || 'Inne';
  }
  
  /**
   * Add to main log
   * Dodaje wpis do głównego logu aplikacji
   * @param {string} message - Message to log
   */
  function addToLog(message) {
    const logContainer = document.querySelector('.log-container');
    if (logContainer) {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      logEntry.textContent = `[DEVICE] ${message}`;
      logContainer.insertBefore(logEntry, logContainer.firstChild);
    }
    console.log(`[DEVICE] ${message}`);
  }

  // ========================================
  // SYSTEM MEDIA CONTROLS - Sterowanie mediami systemowymi
  // ========================================
  
  /**
   * Handle system media controls
   * Obsługuje systemowe przyciski sterowania mediami
   * @param {string} action - Action to perform (play, volume-up, volume-down, previous, next, stop, mute)
   */
  function handleSystemMediaControl(action) {
    // Make sure audio context is initialized
    if (!audioContext) initSystemAudio();
    
    // Check if AudioContext was suspended (browsers require user interaction)
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(e => console.log('Failed to resume audio context:', e));
    }
    
    // If we need to fix audio initialization on Windows, try to play a silent sound
    if (window.testAudioElement && !window.audioInitialized) {
      window.testAudioElement.play().then(() => {
        window.testAudioElement.pause();
        window.audioInitialized = true;
        console.log('Audio initialized successfully');
      }).catch(e => {
        console.log('Audio initialization error (expected on first click):', e);
      });
    }
    
    // Use a setTimeout to ensure the audio context has time to initialize
    setTimeout(() => {
      switch (action) {
        case 'play':
          togglePlayPause();
          break;
        case 'volume-up':
          increaseVolume();
          break;
        case 'volume-down':
          decreaseVolume();
          break;
        // ✅ NOWE PRZYPADKI - DODANE:
        case 'previous':
          previousTrack();
          break;
        case 'next':
          nextTrack();
          break;
        case 'stop':
          stopMedia();
          break;
        case 'mute':
          muteVolume();
          break;
        default:
          console.warn(`Nieznana akcja systemowa: ${action}`);
      }
    }, 100);
  }
  
  /**
   * Toggle play/pause state
   * Przełącza stan odtwarzania/pauzy
   */
  function togglePlayPause() {
    try {
      isPlaying = !isPlaying;
      
      // Call our Python backend API to control Windows Media
      fetch('/api/media/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('Play/Pause response:', data);
        
        if (data.success) {
          addToLog('System: Media Play/Pause wykonane pomyślnie');
          addDeviceLog(currentDevice?.address || 'unknown', 'System: Media Play/Pause wykonane pomyślnie');
        } else {
          addToLog(`System: Błąd - ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error sending play/pause command:', error);
        addToLog('System: Błąd podczas wysyłania komendy Play/Pause');
      });
      
      // Visual button feedback
      const playButton = modalDeviceButtons.querySelector('[data-function="system-play"]');
      if (playButton) {
        playButton.classList.add('active-control');
        setTimeout(() => {
          playButton.classList.remove('active-control');
        }, 200);
      }
      
    } catch (e) {
      console.error('Error in togglePlayPause:', e);
      addToLog(`System: Błąd - ${e.message}`);
    }
  }
  
  /**
   * Increase system volume
   * Zwiększa głośność systemową
   */
  function increaseVolume() {
    try {
      // Call our Python backend API to control Windows Volume
      fetch('/api/media/volume_up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('Volume Up response:', data);
        
        if (data.success) {
          addToLog('System: Głośność zwiększona');
          addDeviceLog(currentDevice?.address || 'unknown', 'System: Głośność zwiększona');
        } else {
          addToLog(`System: Błąd - ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error sending volume up command:', error);
        addToLog('System: Błąd podczas zwiększania głośności');
      });
      
      // Visual button feedback
      const volumeUpButton = modalDeviceButtons.querySelector('[data-function="system-volume-up"]');
      if (volumeUpButton) {
        volumeUpButton.classList.add('active-control');
        setTimeout(() => {
          volumeUpButton.classList.remove('active-control');
        }, 200);
      }
      
    } catch (e) {
      console.error('Error in increaseVolume:', e);
      addToLog(`System: Błąd - ${e.message}`);
    }
  }
  
  /**
   * Decrease system volume
   * Zmniejsza głośność systemową
   */
  function decreaseVolume() {
    try {
      // Call our Python backend API to control Windows Volume
      fetch('/api/media/volume_down', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('Volume Down response:', data);
        
        if (data.success) {
          addToLog('System: Głośność zmniejszona');
          addDeviceLog(currentDevice?.address || 'unknown', 'System: Głośność zmniejszona');
        } else {
          addToLog(`System: Błąd - ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error sending volume down command:', error);
        addToLog('System: Błąd podczas zmniejszania głośności');
      });
      
      // Visual button feedback
      const volumeDownButton = modalDeviceButtons.querySelector('[data-function="system-volume-down"]');
      if (volumeDownButton) {
        volumeDownButton.classList.add('active-control');
        setTimeout(() => {
          volumeDownButton.classList.remove('active-control');
        }, 200);
      }
      
    } catch (e) {
      console.error('Error in decreaseVolume:', e);
      addToLog(`System: Błąd - ${e.message}`);
    }
  }
  
  /**
   * Previous track
   * Poprzedni utwór
   */
  function previousTrack() {
    try {
      // Call our Python backend API to control Windows Media
      fetch('/api/media/previous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('Previous Track response:', data);
        
        if (data.success) {
          addToLog('System: Poprzedni utwór');
          addDeviceLog(currentDevice?.address || 'unknown', 'System: Poprzedni utwór');
        } else {
          addToLog(`System: Błąd - ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error sending previous track command:', error);
        addToLog('System: Błąd podczas przełączania na poprzedni utwór');
      });
      
      // Visual button feedback
      const prevButton = modalDeviceButtons.querySelector('[data-function="system-previous"]');
      if (prevButton) {
        prevButton.classList.add('active-control');
        setTimeout(() => {
          prevButton.classList.remove('active-control');
        }, 200);
      }
      
    } catch (e) {
      console.error('Error in previousTrack:', e);
      addToLog(`System: Błąd - ${e.message}`);
    }
  }

  /**
   * Next track
   * Następny utwór
   */
  function nextTrack() {
    try {
      // Call our Python backend API to control Windows Media
      fetch('/api/media/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('Next Track response:', data);
        
        if (data.success) {
          addToLog('System: Następny utwór');
          addDeviceLog(currentDevice?.address || 'unknown', 'System: Następny utwór');
        } else {
          addToLog(`System: Błąd - ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error sending next track command:', error);
        addToLog('System: Błąd podczas przełączania na następny utwór');
      });
      
      // Visual button feedback
      const nextButton = modalDeviceButtons.querySelector('[data-function="system-next"]');
      if (nextButton) {
        nextButton.classList.add('active-control');
        setTimeout(() => {
          nextButton.classList.remove('active-control');
        }, 200);
      }
      
    } catch (e) {
      console.error('Error in nextTrack:', e);
      addToLog(`System: Błąd - ${e.message}`);
    }
  }

  /**
   * Stop media
   * Zatrzymaj media
   */
  function stopMedia() {
    try {
      // Call our Python backend API to control Windows Media
      fetch('/api/media/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('Stop Media response:', data);
        
        if (data.success) {
          addToLog('System: Media zatrzymane');
          addDeviceLog(currentDevice?.address || 'unknown', 'System: Media zatrzymane');
        } else {
          addToLog(`System: Błąd - ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error sending stop command:', error);
        addToLog('System: Błąd podczas zatrzymywania mediów');
      });
      
      // Visual button feedback
      const stopButton = modalDeviceButtons.querySelector('[data-function="system-stop"]');
      if (stopButton) {
        stopButton.classList.add('active-control');
        setTimeout(() => {
          stopButton.classList.remove('active-control');
        }, 200);
      }
      
    } catch (e) {
      console.error('Error in stopMedia:', e);
      addToLog(`System: Błąd - ${e.message}`);
    }
  }

  /**
   * Mute volume
   * Wycisz dźwięk
   */
  function muteVolume() {
    try {
      // Call our Python backend API to control Windows Media
      fetch('/api/media/mute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('Mute response:', data);
        
        if (data.success) {
          addToLog('System: Dźwięk wyciszony/przywrócony');
          addDeviceLog(currentDevice?.address || 'unknown', 'System: Dźwięk wyciszony/przywrócony');
        } else {
          addToLog(`System: Błąd - ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Error sending mute command:', error);
        addToLog('System: Błąd podczas wyciszania/przywracania dźwięku');
      });
      
      // Visual button feedback
      const muteButton = modalDeviceButtons.querySelector('[data-function="system-mute"]');
      if (muteButton) {
        muteButton.classList.add('active-control');
        setTimeout(() => {
          muteButton.classList.remove('active-control');
        }, 200);
      }
      
    } catch (e) {
      console.error('Error in muteVolume:', e);
      addToLog(`System: Błąd - ${e.message}`);
    }
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
    
    // Make sure command container is visible (in case it was hidden)
    if (modalCommandsContainer) modalCommandsContainer.style.display = 'block';
    if (modalAddCommand) modalAddCommand.style.display = 'block';
    
    // Remove system control info if exists
    const existingInfo = modalButtonForm.querySelector('.system-control-info');
    if (existingInfo) existingInfo.remove();
    
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
      
    // Check if this is a system control button
    const isSystemControl = buttonFunction.startsWith('system-');
    
    // Collect commands and delays (if needed)
    let commands = [];
    
    if (!isSystemControl) {
      // Only validate and collect commands for non-system buttons
      const commandFields = modalCommandsContainer.querySelectorAll('.command-field');
      
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
    } else {
      // For system controls, just create a placeholder command
      commands = [{
        data: buttonFunction,
        delay: 0
      }];
    }
    
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
        
        // Add click handler
        buttonElement.addEventListener('click', function(e) {
          // Skip if clicked on options or context menu
          if (e.target.closest('.button-options') || e.target.closest('.context-menu')) {
            return;
          }
          
          // For system controls, always allow (even when device not connected)
          const isSystemControl = button.function?.startsWith('system-');
          
          if (isSystemControl) {
            // Extract the system action from the function (e.g., 'system-play' -> 'play')
            // ✅ POPRAWKA - zmienione split na replace:
            const systemAction = button.function.replace('system-', '');
            console.log(`Wykonywanie systemowej akcji: ${systemAction}`);
            handleSystemMediaControl(systemAction);
          } else if (currentDevice && currentDevice.connected) {
            // For normal buttons, only execute if device is connected
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
    if (deviceLogs[address].length > 500) {
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
    let content = `<h2>Podgląd komend przycisku</h2>`;
    
    // Check if it's a system control button
    const isSystemControl = buttonData.function?.startsWith('system-');
    
    if (isSystemControl) {
      // System control button info
      content += `<div class="system-control-info" style="padding: 15px; margin: 15px 0; background-color: #1e1e1e; color: #e0e0e0; border-radius: 4px; border-left: 3px solid #3498db;">`;
      
      if (buttonData.function === 'system-play') {
        content += `<p>Ten przycisk steruje odtwarzaniem dźwięku przez system komputera.</p>
                    <p>Akcja: Przełączanie odtwarzania/pauzy</p>`;
      } else if (buttonData.function === 'system-volume-up') {
        content += `<p>Ten przycisk zwiększa głośność systemową komputera.</p>
                    <p>Akcja: Zwiększenie głośności o 10%</p>`;
      } else if (buttonData.function === 'system-volume-down') {
        content += `<p>Ten przycisk zmniejsza głośność systemową komputera.</p>
                    <p>Akcja: Zmniejszenie głośności o 10%</p>`;
      } 
      // ✅ NOWE SEKCJE - DODANE:
      else if (buttonData.function === 'system-previous') {
        content += `<p>Ten przycisk przełącza na poprzedni utwór w systemie komputera.</p>
                    <p>Akcja: Poprzedni utwór w odtwarzaczu</p>`;
      } else if (buttonData.function === 'system-next') {
        content += `<p>Ten przycisk przełącza na następny utwór w systemie komputera.</p>
                    <p>Akcja: Następny utwór w odtwarzaczu</p>`;
      } else if (buttonData.function === 'system-stop') {
        content += `<p>Ten przycisk zatrzymuje odtwarzanie mediów w systemie komputera.</p>
                    <p>Akcja: Zatrzymanie odtwarzania</p>`;
      } else if (buttonData.function === 'system-mute') {
        content += `<p>Ten przycisk wycisza/przywraca dźwięk systemowy komputera.</p>
                    <p>Akcja: Przełączanie wyciszenia</p>`;
      }
      
      content += `</div>`;
    } else {
      // Regular button with commands
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
    }
    
    // Function info
    if (buttonData.function && !isSystemControl) {
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
      
      // Handle button function change to show/hide commands container
      handleButtonFunctionChange();
    }
    
    // Remove all command fields
    while (modalCommandsContainer.firstChild) {
      modalCommandsContainer.removeChild(modalCommandsContainer.firstChild);
    }
    
    // Check if this is a system control button
    const isSystemControl = buttonData.function?.startsWith('system-');
    
    // Add command fields with data if not system control
    if (!isSystemControl && buttonData.commands && buttonData.commands.length > 0) {
      buttonData.commands.forEach(cmd => {
        addCommandField(modalCommandsContainer, cmd.data, cmd.delay);
      });
    } else if (!isSystemControl) {
      // Add empty field if no commands and not system control
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
      
    // Check if this is a system control button
    const isSystemControl = buttonFunction.startsWith('system-');
    
    // Collect commands and delays (if needed)
    let commands = [];
    
    if (!isSystemControl) {
      // Only validate and collect commands for non-system buttons
      const commandFields = modalCommandsContainer.querySelectorAll('.command-field');
      
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
    } else {
      // For system controls, just create a placeholder command
      commands = [{
        data: buttonFunction,
        delay: 0
      }];
    }
    
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
  window.handleSystemMediaControl = handleSystemMediaControl;
  
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
  
  console.log('device-modal.js w pełni zainicjalizowany z obsługą sterowania mediami systemowymi (7 przycisków)');
});