/**
 * Bluetooth Device Connection Management
 * Handles device connections, disconnections, and connection status monitoring
 */

document.addEventListener('DOMContentLoaded', function() {
  // ========================================
  // GLOBAL VARIABLES
  // ========================================
  
  let connectionTimeouts = new Map(); // Track connection timeouts
  
  // ========================================
  // INITIALIZATION
  // ========================================
  
  initializeConnectionSystem();
  
  /**
   * Initialize the connection system
   */
  function initializeConnectionSystem() {
    console.log('Inicjalizacja systemu połączeń...');
    
    setupConnectionListeners();
    
    console.log('System połączeń zainicjalizowany pomyślnie');
  }
  
  /**
   * Setup connection event listeners
   */
  function setupConnectionListeners() {
    // Listen for connection status changes
    window.addEventListener('deviceConnectionChanged', function(e) {
      console.log('Connection status changed:', e.detail);
      handleConnectionStatusChange(e.detail);
    });
  }
  
  // ========================================
  // CONNECTION MANAGEMENT
  // ========================================
  
  /**
   * Set Button Loading State with proper timeout handling
   * @param {HTMLElement} button - Button element
   * @param {boolean} isLoading - Loading state
   * @param {string} originalText - Original button text
   */
  function setButtonLoadingState(button, isLoading, originalText = 'CONNECT') {
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
  
  /**
   * Connect to device with proper timeout
   * @param {string} address - Device MAC address
   */
  async function connectToDevice(address) {
    const deviceCard = document.querySelector(`[data-address="${address}"]`);
    const connectButton = deviceCard ? deviceCard.querySelector('.connect-btn, .scan-device-connect-btn') : null;
    
    let timeoutId = null;
    
    try {
      if (connectButton) {
        const originalText = connectButton.dataset.originalText || connectButton.textContent;
        setButtonLoadingState(connectButton, true, originalText);
      }
      
      console.log(`Attempting to connect to ${address}...`);
      addToConnectionLog(`[POŁĄCZENIE] Próba połączenia z urządzeniem ${address}`);
      
      if (typeof window.showToast === 'function') {
        window.showToast(`Łączenie z urządzeniem ${address}...`, 'info', 3000);
      }
      
      // Set timeout for 15 seconds
      timeoutId = setTimeout(() => {
        console.log(`Connection timeout for ${address}`);
        if (connectButton) {
          const originalText = connectButton.dataset.originalText || 'CONNECT';
          setButtonLoadingState(connectButton, false, originalText);
        }
        if (typeof window.showToast === 'function') {
          window.showToast('Connection timeout - try again', 'warning');
        }
        connectionTimeouts.delete(address);
      }, 15000);
      
      // Store timeout ID
      connectionTimeouts.set(address, timeoutId);
      
      const formData = new FormData();
      formData.append('address', address);
      
      const response = await fetch('/connect', {
        method: 'POST',
        body: formData
      });
      
      // Clear timeout since we got a response
      if (timeoutId) {
        clearTimeout(timeoutId);
        connectionTimeouts.delete(address);
      }
      
      if (response.ok) {
        console.log(`Connection request sent for ${address}`);
        addToConnectionLog(`[POŁĄCZENIE] Żądanie połączenia wysłane dla ${address}`);
        
        // Check connection status after 2 seconds
        setTimeout(async () => {
          await checkConnectionResult(address, connectButton);
        }, 2000);
        
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        connectionTimeouts.delete(address);
      }
      
      console.error(`Failed to connect to ${address}: ${error.message}`);
      addToConnectionLog(`[BŁĄD] Błąd podczas łączenia z ${address}: ${error.message}`);
      
      if (connectButton) {
        const originalText = connectButton.dataset.originalText || 'CONNECT';
        setButtonLoadingState(connectButton, false, originalText);
      }
      
      if (typeof window.showToast === 'function') {
        window.showToast('Failed to connect to device', 'error');
      }
    }
  }
  
  /**
   * Check connection result
   * @param {string} address - Device MAC address
   * @param {HTMLElement} connectButton - Connect button element
   */
  async function checkConnectionResult(address, connectButton) {
    try {
      const response = await fetch('/connection_status');
      const data = await response.json();
      
      const isConnected = data.connected;
      const connectedAddress = data.address || '';
      
      if (isConnected && connectedAddress === address) {
        handleSuccessfulConnection(address, connectButton);
      } else {
        handleFailedConnection(address, connectButton);
      }
    } catch (error) {
      console.error('Błąd podczas sprawdzania statusu połączenia:', error);
      addToConnectionLog(`[BŁĄD] Błąd podczas sprawdzania statusu połączenia`);
      
      if (typeof window.showToast === 'function') {
        window.showToast(`Błąd podczas sprawdzania połączenia z ${address}`, 'error', 5000);
      }
      
      if (connectButton) {
        const originalText = connectButton.dataset.originalText || 'CONNECT';
        setButtonLoadingState(connectButton, false, originalText);
      }
    }
  }
  
  /**
   * Handle successful connection
   * @param {string} address - Device MAC address
   * @param {HTMLElement} connectButton - Connect button element
   */
  function handleSuccessfulConnection(address, connectButton) {
    addToConnectionLog(`[SUKCES] Pomyślnie połączono z urządzeniem ${address}`);
    
    if (typeof window.showToast === 'function') {
      window.showToast(`Pomyślnie połączono z urządzeniem ${address}`, 'success', 5000);
    }
    
    // Dispatch connection event
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
    
    // Refresh device lists
    setTimeout(() => {
      refreshDeviceLists();
    }, 1000);
  }
  
  /**
   * Handle failed connection
   * @param {string} address - Device MAC address
   * @param {HTMLElement} connectButton - Connect button element
   */
  function handleFailedConnection(address, connectButton) {
    addToConnectionLog(`[BŁĄD] Nie udało się połączyć z urządzeniem ${address}`);
    
    if (typeof window.showToast === 'function') {
      window.showToast(`Nie udało się połączyć z urządzeniem ${address}`, 'error', 5000);
    }
    
    if (connectButton) {
      const originalText = connectButton.dataset.originalText || 'CONNECT';
      setButtonLoadingState(connectButton, false, originalText);
    }
  }
  
  /**
   * Disconnect from device
   * @param {string} address - Device MAC address (optional)
   */
  async function disconnectFromDevice(address = null) {
    try {
      addToConnectionLog('Rozłączanie urządzenia...', 'DISCONNECT');
      
      const response = await fetch('/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        handleSuccessfulDisconnection(address);
      } else {
        throw new Error('Disconnection failed');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      addToConnectionLog(`[BŁĄD] Nie udało się rozłączyć: ${error.message}`);
      
      if (typeof window.showToast === 'function') {
        window.showToast('Nie udało się rozłączyć urządzenia', 'error');
      }
    }
  }
  
  /**
   * Handle successful disconnection
   * @param {string} address - Device MAC address (optional)
   */
  function handleSuccessfulDisconnection(address) {
    addToConnectionLog('Urządzenie rozłączone pomyślnie');
    
    if (typeof window.showToast === 'function') {
      window.showToast('Urządzenie rozłączone', 'info');
    }
    
    // Dispatch disconnection event
    window.dispatchEvent(new CustomEvent('deviceConnectionChanged', {
      detail: {
        address: address,
        connected: false
      }
    }));
    
    // Refresh device lists
    refreshDeviceLists();
  }
  
  /**
   * Handle connection status change
   * @param {Object} detail - Connection change details
   */
  function handleConnectionStatusChange(detail) {
    const { address, connected } = detail;
    
    // Update all relevant UI elements
    updateDeviceConnectionStatus(address, connected);
    
    // Refresh sidebars and device lists if functions exist
    if (typeof window.checkConnectionStatus === 'function') {
      window.checkConnectionStatus();
    }
    
    if (typeof window.displayPairedDevices === 'function') {
      window.displayPairedDevices();
    }
    
    if (typeof window.displayDiscoveredDevices === 'function') {
      window.displayDiscoveredDevices();
    }
  }
  
  /**
   * Update device connection status in UI
   * @param {string} address - Device MAC address
   * @param {boolean} connected - Connection status
   */
  function updateDeviceConnectionStatus(address, connected) {
    // Find all elements with this device address
    const deviceElements = document.querySelectorAll(`[data-address="${address}"]`);
    
    deviceElements.forEach(element => {
      const connectButton = element.querySelector('.connect-btn, .scan-device-connect-btn');
      const connectionIndicator = element.querySelector('.connection-indicator');
      
      if (connected) {
        // Device is now connected
        if (connectButton) {
          connectButton.textContent = 'Połączono';
          connectButton.disabled = true;
          connectButton.classList.add('connected');
        }
        
        // Add connection indicator if it doesn't exist
        if (!connectionIndicator) {
          const indicator = document.createElement('div');
          indicator.className = 'connection-indicator';
          const deviceName = element.querySelector('.device-name, .scan-device-name');
          if (deviceName) {
            deviceName.appendChild(indicator);
          }
        }
        
        element.classList.add('device-connected');
      } else {
        // Device is now disconnected
        if (connectButton) {
          const originalText = connectButton.dataset.originalText || 'CONNECT';
          connectButton.textContent = originalText;
          connectButton.disabled = false;
          connectButton.classList.remove('connected');
          connectButton.style.backgroundColor = '';
        }
        
        // Remove connection indicator
        if (connectionIndicator) {
          connectionIndicator.remove();
        }
        
        element.classList.remove('device-connected');
      }
    });
  }
  
  /**
   * Check current connection status
   */
  async function checkCurrentConnectionStatus() {
    try {
      const response = await fetch('/connection_status');
      const data = await response.json();
      
      return {
        connected: data.connected,
        address: data.address || null
      };
    } catch (error) {
      console.error('Error checking connection status:', error);
      return {
        connected: false,
        address: null
      };
    }
  }
  
  /**
   * Refresh device lists
   */
  function refreshDeviceLists() {
    // Refresh scan results if visible
    if (typeof window.scanningFunctions?.fetchScanResults === 'function') {
      window.scanningFunctions.fetchScanResults();
    }
    
    // Refresh sidebar device lists
    if (typeof window.loadPairedDevices === 'function') {
      window.loadPairedDevices();
    }
    
    // Dispatch device list update event
    window.dispatchEvent(new CustomEvent('deviceListUpdated', {
      detail: {
        timestamp: Date.now()
      }
    }));
  }
  
  /**
   * Cancel connection attempt
   * @param {string} address - Device MAC address
   */
  function cancelConnectionAttempt(address) {
    const timeoutId = connectionTimeouts.get(address);
    if (timeoutId) {
      clearTimeout(timeoutId);
      connectionTimeouts.delete(address);
      
      // Reset button state
      const deviceCard = document.querySelector(`[data-address="${address}"]`);
      const connectButton = deviceCard ? deviceCard.querySelector('.connect-btn, .scan-device-connect-btn') : null;
      
      if (connectButton) {
        const originalText = connectButton.dataset.originalText || 'CONNECT';
        setButtonLoadingState(connectButton, false, originalText);
      }
      
      addToConnectionLog(`[ANULOWANO] Anulowano próbę połączenia z ${address}`);
      
      if (typeof window.showToast === 'function') {
        window.showToast('Próba połączenia została anulowana', 'info');
      }
    }
  }
  
  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  
  /**
   * Add entry to connection log
   * @param {string} message - Log message
   * @param {string} level - Log level
   */
  function addToConnectionLog(message, level = 'INFO') {
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
   * Get device info by address
   * @param {string} address - Device MAC address
   * @returns {Object|null} - Device info or null
   */
  function getDeviceInfo(address) {
    try {
      const favoriteDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
      const discoveredDevices = JSON.parse(localStorage.getItem('discoveredDevices') || '[]');
      
      return [...favoriteDevices, ...discoveredDevices].find(device => device.address === address) || null;
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }
  
  // ========================================
  // GLOBAL EXPORTS
  // ========================================
  
  // Make functions available globally
  window.connectionFunctions = {
    connectToDevice,
    disconnectFromDevice,
    setButtonLoadingState,
    checkCurrentConnectionStatus,
    cancelConnectionAttempt,
    refreshDeviceLists,
    updateDeviceConnectionStatus
  };
  
  // Export main connection function globally
  window.connectToDevice = connectToDevice;
  window.disconnectFromDevice = disconnectFromDevice;
  window.setButtonLoadingState = setButtonLoadingState;
  
  console.log('Connection system initialized successfully');
});