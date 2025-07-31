/**
 * Device Edit Modal Functionality
 * Handles device editing, modal display, and device management
 */

document.addEventListener('DOMContentLoaded', function() {
  // ========================================
  // DOM ELEMENTS
  // ========================================
  
  const editModal = document.getElementById('device-edit-modal');
  const editForm = document.getElementById('edit-device-form');
  const editDeviceName = document.getElementById('edit-device-name');
  const editDeviceType = document.getElementById('edit-device-type');
  const editDeviceAddressHidden = document.getElementById('edit-device-address-hidden');
  const editDeviceAddressDisplay = document.getElementById('edit-device-address-display');
  
  // ========================================
  // GLOBAL VARIABLES
  // ========================================
  
  let currentEditingDevice = null;
  
  // ========================================
  // INITIALIZATION
  // ========================================
  
  initializeEditModal();
  
  /**
   * Initialize edit modal functionality
   */
  function initializeEditModal() {
    console.log('Inicjalizacja edit modal...');
    
    setupEditModalHandlers();
    
    console.log('Edit modal zainicjalizowany pomyślnie');
  }
  
  /**
   * Setup edit modal event handlers
   */
  function setupEditModalHandlers() {
    if (editModal) {
      // Close button handlers
      const closeButtons = editModal.querySelectorAll('.close-modal');
      closeButtons.forEach(button => {
        button.addEventListener('click', closeEditModal);
      });
      
      // Click outside to close
      editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
          closeEditModal();
        }
      });
      
      // ESC key to close
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && editModal.style.display === 'block') {
          closeEditModal();
        }
      });
    }
    
    // Form submission handler
    if (editForm) {
      editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveEditedDevice();
      });
    }
  }
  
  // ========================================
  // MODAL FUNCTIONS
  // ========================================
  
  /**
   * Open Edit Modal
   * @param {Object} device - Device object to edit
   */
  function openEditModal(device) {
    if (!editModal || !device) {
      console.error('Edit modal or device not available');
      return;
    }
    
    currentEditingDevice = device;
    
    // Check if device is connected
    if (device.connected) {
      if (typeof window.showToast === 'function') {
        window.showToast('Nie można edytować połączonego urządzenia. Najpierw je rozłącz.', 'warning', 5000);
      }
      return;
    }
    
    // Populate form fields
    if (editDeviceName) editDeviceName.value = device.name || '';
    if (editDeviceType) editDeviceType.value = device.type || 'other';
    if (editDeviceAddressHidden) editDeviceAddressHidden.value = device.address || '';
    if (editDeviceAddressDisplay) editDeviceAddressDisplay.value = device.address || '';
    
    // Show modal
    editModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Focus on name field
    if (editDeviceName) {
      setTimeout(() => {
        editDeviceName.focus();
        editDeviceName.select();
      }, 100);
    }
    
    console.log(`Edit modal opened for device: ${device.name} (${device.address})`);
    
    if (typeof window.addToMainLog === 'function') {
      window.addToMainLog(`[EDIT] Otwarto modal edycji dla: ${device.name}`);
    }
  }
  
  /**
   * Close Edit Modal
   */
  function closeEditModal() {
    if (!editModal) return;
    
    editModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentEditingDevice = null;
    
    // Clear form
    if (editForm) {
      editForm.reset();
    }
    
    // Clear validation errors
    clearFormValidation();
    
    console.log('Edit modal closed');
    
    if (typeof window.addToMainLog === 'function') {
      window.addToMainLog('[EDIT] Modal edycji zamknięty');
    }
  }
  
  /**
   * Save Edited Device
   */
  function saveEditedDevice() {
    if (!currentEditingDevice) {
      console.error('No device currently being edited');
      return;
    }
    
    // Get form values
    const newName = editDeviceName ? editDeviceName.value.trim() : '';
    const newType = editDeviceType ? editDeviceType.value : 'other';
    const address = currentEditingDevice.address;
    
    // Validate form
    if (!validateEditForm(newName)) {
      return;
    }
    
    try {
      // Update device in localStorage
      const favoriteDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
      const discoveredDevices = JSON.parse(localStorage.getItem('discoveredDevices') || '[]');
      
      let deviceUpdated = false;
      
      // Update in favoriteDevices
      const favoriteIndex = favoriteDevices.findIndex(d => d.address === address);
      if (favoriteIndex !== -1) {
        favoriteDevices[favoriteIndex] = {
          ...favoriteDevices[favoriteIndex],
          name: newName,
          type: newType
        };
        localStorage.setItem('favoriteDevices', JSON.stringify(favoriteDevices));
        deviceUpdated = true;
        
        if (typeof window.addToMainLog === 'function') {
          window.addToMainLog(`[EDIT] Zaktualizowano urządzenie w ulubionych: ${newName}`);
        }
      }
      
      // Update in discoveredDevices
      const discoveredIndex = discoveredDevices.findIndex(d => d.address === address);
      if (discoveredIndex !== -1) {
        discoveredDevices[discoveredIndex] = {
          ...discoveredDevices[discoveredIndex],
          name: newName,
          type: newType
        };
        localStorage.setItem('discoveredDevices', JSON.stringify(discoveredDevices));
        deviceUpdated = true;
        
        if (typeof window.addToMainLog === 'function') {
          window.addToMainLog(`[EDIT] Zaktualizowano urządzenie w discovered: ${newName}`);
        }
      }
      
      if (deviceUpdated) {
        console.log(`Device updated: ${newName} (${address})`);
        
        closeEditModal();
        
        if (typeof window.showToast === 'function') {
          window.showToast(`Urządzenie "${newName}" zostało zaktualizowane`, 'success', 4000);
        }
        
        // Refresh device lists
        refreshDeviceListsAfterEdit();
        
        // Dispatch update event
        window.dispatchEvent(new CustomEvent('deviceUpdated', {
          detail: {
            address: address,
            name: newName,
            type: newType
          }
        }));
        
      } else {
        throw new Error('Device not found in storage');
      }
      
    } catch (error) {
      console.error('Error saving device:', error);
      
      if (typeof window.showToast === 'function') {
        window.showToast('Błąd podczas zapisywania urządzenia', 'error', 5000);
      }
      
      if (typeof window.addToMainLog === 'function') {
        window.addToMainLog(`[ERROR] Błąd podczas zapisywania urządzenia: ${error.message}`);
      }
    }
  }
  
  /**
   * Delete Current Device
   */
  function deleteCurrentDevice() {
    if (!currentEditingDevice) {
      console.error('No device currently being edited');
      return;
    }
    
    const deviceName = currentEditingDevice.name;
    const address = currentEditingDevice.address;
    
    // Confirm deletion
    if (!confirm(`Czy na pewno chcesz usunąć urządzenie "${deviceName}"?\n\nTa operacja jest nieodwracalna.`)) {
      return;
    }
    
    // Check if device is connected
    if (currentEditingDevice.connected) {
      if (typeof window.showToast === 'function') {
        window.showToast('Nie można usunąć połączonego urządzenia. Najpierw je rozłącz.', 'error', 5000);
      }
      return;
    }
    
    try {
      let deviceDeleted = false;
      
      // Remove from favoriteDevices
      const favoriteDevices = JSON.parse(localStorage.getItem('favoriteDevices') || '[]');
      const favoriteIndex = favoriteDevices.findIndex(d => d.address === address);
      if (favoriteIndex !== -1) {
        favoriteDevices.splice(favoriteIndex, 1);
        localStorage.setItem('favoriteDevices', JSON.stringify(favoriteDevices));
        deviceDeleted = true;
      }
      
      // Remove from discoveredDevices
      const discoveredDevices = JSON.parse(localStorage.getItem('discoveredDevices') || '[]');
      const discoveredIndex = discoveredDevices.findIndex(d => d.address === address);
      if (discoveredIndex !== -1) {
        discoveredDevices.splice(discoveredIndex, 1);
        localStorage.setItem('discoveredDevices', JSON.stringify(discoveredDevices));
        deviceDeleted = true;
      }
      
      if (deviceDeleted) {
        console.log(`Device deleted: ${deviceName} (${address})`);
        
        closeEditModal();
        
        if (typeof window.showToast === 'function') {
          window.showToast(`Urządzenie "${deviceName}" zostało usunięte`, 'info', 4000);
        }
        
        if (typeof window.addToMainLog === 'function') {
          window.addToMainLog(`[DELETE] Usunięto urządzenie: ${deviceName} (${address})`);
        }
        
        // Refresh device lists
        refreshDeviceListsAfterEdit();
        
        // Dispatch delete event
        window.dispatchEvent(new CustomEvent('deviceDeleted', {
          detail: {
            address: address,
            name: deviceName
          }
        }));
        
      } else {
        throw new Error('Device not found in storage');
      }
      
    } catch (error) {
      console.error('Error deleting device:', error);
      
      if (typeof window.showToast === 'function') {
        window.showToast('Błąd podczas usuwania urządzenia', 'error', 5000);
      }
      
      if (typeof window.addToMainLog === 'function') {
        window.addToMainLog(`[ERROR] Błąd podczas usuwania urządzenia: ${error.message}`);
      }
    }
  }
  
  // ========================================
  // VALIDATION FUNCTIONS
  // ========================================
  
  /**
   * Validate edit form
   * @param {string} name - Device name
   * @returns {boolean} - Validation result
   */
  function validateEditForm(name) {
    clearFormValidation();
    
    let isValid = true;
    
    // Validate name
    if (!name) {
      showFieldError(editDeviceName, 'Nazwa urządzenia nie może być pusta');
      isValid = false;
    } else if (name.length < 2) {
      showFieldError(editDeviceName, 'Nazwa musi mieć co najmniej 2 znaki');
      isValid = false;
    } else if (name.length > 50) {
      showFieldError(editDeviceName, 'Nazwa nie może być dłuższa niż 50 znaków');
      isValid = false;
    }
    
    if (!isValid && typeof window.showToast === 'function') {
      window.showToast('Proszę poprawić błędy w formularzu', 'error', 3000);
    }
    
    return isValid;
  }
  
  /**
   * Show field validation error
   * @param {HTMLElement} field - Form field element
   * @param {string} message - Error message
   */
  function showFieldError(field, message) {
    if (!field) return;
    
    const formGroup = field.closest('.form-group');
    if (formGroup) {
      formGroup.classList.add('error');
      
      // Remove existing error message
      const existingError = formGroup.querySelector('.field-error');
      if (existingError) {
        existingError.remove();
      }
      
      // Add new error message
      const errorElement = document.createElement('div');
      errorElement.className = 'field-error';
      errorElement.textContent = message;
      errorElement.style.cssText = `
        color: rgb(248, 113, 113);
        font-size: 0.75rem;
        margin-top: 4px;
        font-style: italic;
      `;
      
      formGroup.appendChild(errorElement);
    }
    
    // Focus on field with error
    field.focus();
  }
  
  /**
   * Clear form validation errors
   */
  function clearFormValidation() {
    if (!editForm) return;
    
    const errorGroups = editForm.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => {
      group.classList.remove('error');
    });
    
    const errorMessages = editForm.querySelectorAll('.field-error');
    errorMessages.forEach(message => {
      message.remove();
    });
  }
  
  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  
  /**
   * Refresh device lists after edit
   */
  function refreshDeviceListsAfterEdit() {
    // Refresh sidebar device lists
    if (typeof window.loadPairedDevices === 'function') {
      window.loadPairedDevices();
    }
    
    if (typeof window.displayPairedDevices === 'function') {
      window.displayPairedDevices();
    }
    
    if (typeof window.displayDiscoveredDevices === 'function') {
      window.displayDiscoveredDevices();
    }
    
    // Refresh scan results if visible
    if (typeof window.scanningFunctions?.fetchScanResults === 'function') {
      setTimeout(() => {
        window.scanningFunctions.fetchScanResults();
      }, 500);
    }
    
    // Dispatch device list update event
    window.dispatchEvent(new CustomEvent('deviceListUpdated', {
      detail: {
        source: 'edit-modal',
        timestamp: Date.now()
      }
    }));
  }
  
  /**
   * Get current editing device
   * @returns {Object|null} - Current device being edited
   */
  function getCurrentEditingDevice() {
    return currentEditingDevice;
  }
  
  /**
   * Check if modal is currently open
   * @returns {boolean} - Modal open state
   */
  function isEditModalOpen() {
    return editModal && editModal.style.display === 'block';
  }
  
  // ========================================
  // GLOBAL EXPORTS
  // ========================================
  
  // Make functions available globally
  window.editModalFunctions = {
    openEditModal,
    closeEditModal,
    saveEditedDevice,
    deleteCurrentDevice,
    getCurrentEditingDevice,
    isEditModalOpen
  };
  
  // Export main functions globally (for compatibility)
  window.openEditModal = openEditModal;
  window.closeEditModal = closeEditModal;
  window.saveEditedDevice = saveEditedDevice;
  window.deleteCurrentDevice = deleteCurrentDevice;
  
  console.log('Edit modal system initialized successfully');
});