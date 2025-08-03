/**
 * Device Modal Management - ROZSZERZONA WERSJA Z ZAKŁADKAMI
 * Obsługuje modal edycji urządzenia z dwoma zakładkami:
 * 1. Podstawowe informacje
 * 2. Kontrola urządzenia (przyciski i komendy)
 */

document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // DOM ELEMENTS
    // ========================================
    
    const deviceEditModal = document.getElementById('device-edit-modal');
    const editDeviceForm = document.getElementById('edit-device-form');
    const deviceTabButtons = document.querySelectorAll('.device-tab-btn');
    const deviceTabPanels = document.querySelectorAll('.device-tab-panel');
    
    // Tab elements
    const basicInfoTab = document.getElementById('basic-info-tab');
    const deviceControlTab = document.getElementById('device-control-tab');
    
    // Form elements (podstawowe informacje)
    const deviceNameInput = document.getElementById('edit-device-name');
    const deviceTypeSelect = document.getElementById('edit-device-type');
    const deviceAddressDisplay = document.getElementById('edit-device-address-display');
    const deviceAddressHidden = document.getElementById('edit-device-address-hidden');
    
    // Control elements (kontrola urządzenia)
    const deviceButtonsList = document.getElementById('device-buttons-list');
    const buttonForm = document.getElementById('button-form');
    const buttonNameInput = document.getElementById('button-name');
    const buttonFunctionSelect = document.getElementById('button-function');
    const commandsContainer = document.getElementById('commands-container');
    const addCommandBtn = document.getElementById('add-command-btn');
    const saveButtonBtn = document.getElementById('save-button-btn');
    const cancelButtonBtn = document.getElementById('cancel-button-btn');
    
    // Action buttons
    const cancelEditBtn = document.getElementById('cancel-edit-device');
    const deleteDeviceBtn = document.getElementById('delete-device-btn');
    const unpairDeviceBtn = document.getElementById('unpair-device-btn');
    const resetButtonsBtn = document.getElementById('reset-buttons-btn');
    
    // ========================================
    // GLOBAL VARIABLES
    // ========================================
    
    let currentDevice = null;
    let deviceButtons = [];
    let currentEditingButton = null;
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    initializeDeviceModal();
    
    function initializeDeviceModal() {
        console.log('Inicjalizacja device modal z zakładkami...');
        
        setupTabNavigation();
        setupBasicInfoForm();
        setupDeviceControlForm();
        setupModalCloseHandlers();
        
        console.log('Device modal zainicjalizowany pomyślnie');
    }
    
    // ========================================
    // TAB NAVIGATION
    // ========================================
    
    /**
     * Konfiguruje nawigację między zakładkami
     */
    function setupTabNavigation() {
        deviceTabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.dataset.tab;
                switchToTab(targetTab);
            });
        });
    }
    
    /**
     * Przełącza na wybraną zakładkę
     * @param {string} tabId - ID zakładki do aktywacji
     */
    function switchToTab(tabId) {
        // Aktualizuj przyciski zakładek
        deviceTabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });
        
        // Aktualizuj panele zakładek
        deviceTabPanels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.id === tabId) {
                panel.classList.add('active');
            }
        });
        
        // Specjalne akcje dla różnych zakładek
        if (tabId === 'device-control-tab') {
            loadDeviceButtons();
        }
        
        console.log(`Przełączono na zakładkę: ${tabId}`);
    }
    
    // ========================================
    // BASIC INFO FORM (Zakładka 1)
    // ========================================
    
    /**
     * Konfiguruje formularz podstawowych informacji
     */
    function setupBasicInfoForm() {
        if (editDeviceForm) {
            editDeviceForm.addEventListener('submit', handleBasicInfoSubmit);
        }
        
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', closeDeviceEditModal);
        }
        
        if (deleteDeviceBtn) {
            deleteDeviceBtn.addEventListener('click', handleDeleteDevice);
        }
    }
    
    /**
     * Obsługuje zapisywanie podstawowych informacji o urządzeniu
     * @param {Event} e - Event formularza
     */
    function handleBasicInfoSubmit(e) {
        e.preventDefault();
        
        if (!currentDevice) return;
        
        const newName = deviceNameInput.value.trim();
        const newType = deviceTypeSelect.value;
        const address = deviceAddressHidden.value;
        
        // Walidacja
        if (!newName || !newType) {
            showToast('Proszę wypełnić wszystkie wymagane pola', 'error');
            return;
        }
        
        if (newName.length < 1 || newName.length > 50) {
            showToast('Nazwa urządzenia musi mieć od 1 do 50 znaków', 'error');
            return;
        }
        
        // Sprawdź czy urządzenie jest połączone
        if (currentDevice.connected) {
            showToast('Nie można edytować połączonego urządzenia', 'warning');
            return;
        }
        
        // Zapisz zmiany
        const success = saveDeviceChanges(address, newName, newType);
        
        if (success) {
            showToast('Podstawowe informacje zostały zaktualizowane', 'success');
            // Zaktualizuj bieżące dane urządzenia
            currentDevice.name = newName;
            currentDevice.type = newType;
        }
    }
    
    /**
     * Obsługuje usuwanie urządzenia
     */
    function handleDeleteDevice() {
        if (!currentDevice) return;
        
        // Sprawdź czy urządzenie jest połączone
        if (currentDevice.connected) {
            showToast('Nie można usunąć połączonego urządzenia', 'error');
            return;
        }
        
        const deviceName = currentDevice.name || 'Nieznane urządzenie';
        
        if (confirm(`Czy na pewno chcesz usunąć urządzenie "${deviceName}"?\n\nTa akcja jest nieodwracalna i usunie również wszystkie przyciski i komendy.`)) {
            const success = deleteDevice(currentDevice.address, deviceName);
            
            if (success) {
                closeDeviceEditModal();
                showToast(`Urządzenie "${deviceName}" zostało usunięte`, 'info');
            }
        }
    }
    
    // ========================================
    // DEVICE CONTROL FORM (Zakładka 2)
    // ========================================
    
    /**
     * Konfiguruje formularz kontroli urządzenia
     */
    function setupDeviceControlForm() {
        if (addCommandBtn) {
            addCommandBtn.addEventListener('click', addCommandField);
        }
        
        if (saveButtonBtn) {
            saveButtonBtn.addEventListener('click', saveDeviceButton);
        }
        
        if (cancelButtonBtn) {
            cancelButtonBtn.addEventListener('click', cancelButtonEditing);
        }
        
        if (unpairDeviceBtn) {
            unpairDeviceBtn.addEventListener('click', handleUnpairDevice);
        }
        
        if (resetButtonsBtn) {
            resetButtonsBtn.addEventListener('click', handleResetButtons);
        }
        
        // Event delegation dla dynamicznych elementów
        if (deviceButtonsList) {
            deviceButtonsList.addEventListener('click', handleDeviceButtonsClick);
        }
        
        if (commandsContainer) {
            commandsContainer.addEventListener('click', handleCommandsClick);
        }
    }
    
    /**
     * Ładuje przyciski urządzenia
     */
    function loadDeviceButtons() {
        if (!currentDevice) return;
        
        // Załaduj przyciski z localStorage lub API
        const savedButtons = getDeviceButtons(currentDevice.address);
        deviceButtons = savedButtons || [];
        
        displayDeviceButtons();
    }
    
    /**
     * Wyświetla listę przycisków urządzenia
     */
    function displayDeviceButtons() {
        if (!deviceButtonsList) return;
        
        if (deviceButtons.length === 0) {
            deviceButtonsList.innerHTML = `
                <div class="no-buttons-message">
                    <div class="empty-icon">
                        <i class="fas fa-hand-pointer"></i>
                    </div>
                    <p>Brak zdefiniowanych przycisków</p>
                    <small>Dodaj pierwszy przycisk poniżej</small>
                </div>
            `;
            return;
        }
        
        deviceButtonsList.innerHTML = deviceButtons.map((button, index) => `
            <div class="device-button-item" data-button-index="${index}">
                <div class="button-info">
                    <div class="button-name">
                        ${getFunctionIcon(button.function)}
                        <span>${button.name}</span>
                    </div>
                    <div class="button-details">
                        <span class="button-function">${getFunctionLabel(button.function)}</span>
                        <span class="button-commands">${button.commands.length} ${button.commands.length === 1 ? 'komenda' : 'komend'}</span>
                    </div>
                </div>
                <div class="button-actions">
                    <button class="btn btn-small btn-outline edit-button-btn" data-button-index="${index}">
                        <i class="fas fa-edit"></i>
                        Edytuj
                    </button>
                    <button class="btn btn-small btn-primary test-button-btn" data-button-index="${index}">
                        <i class="fas fa-play"></i>
                        Test
                    </button>
                    <button class="btn btn-small btn-danger delete-button-btn" data-button-index="${index}">
                        <i class="fas fa-trash"></i>
                        Usuń
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Obsługuje kliknięcia w listę przycisków urządzenia
     * @param {Event} e - Event kliknięcia
     */
    function handleDeviceButtonsClick(e) {
        const buttonIndex = e.target.closest('[data-button-index]')?.dataset.buttonIndex;
        if (buttonIndex === undefined) return;
        
        const index = parseInt(buttonIndex);
        const button = deviceButtons[index];
        
        if (e.target.closest('.edit-button-btn')) {
            editDeviceButton(index);
        } else if (e.target.closest('.test-button-btn')) {
            testDeviceButton(button);
        } else if (e.target.closest('.delete-button-btn')) {
            deleteDeviceButton(index);
        }
    }
    
    /**
     * Dodaje nowe pole komendy
     */
    function addCommandField() {
        const commandField = document.createElement('div');
        commandField.className = 'command-field';
        commandField.innerHTML = `
            <div class="form-group">
                <label>Komenda HEX:</label>
                <input type="text" class="command-input" placeholder="np. 0x01020304">
            </div>
            <div class="form-group">
                <label>Opóźnienie (ms):</label>
                <input type="number" class="delay-input" placeholder="0" min="0" max="10000">
            </div>
            <button type="button" class="remove-command-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        commandsContainer.appendChild(commandField);
    }
    
    /**
     * Obsługuje kliknięcia w kontenerze komend
     * @param {Event} e - Event kliknięcia
     */
    function handleCommandsClick(e) {
        if (e.target.closest('.remove-command-btn')) {
            const commandField = e.target.closest('.command-field');
            if (commandsContainer.children.length > 1) {
                commandField.remove();
            } else {
                showToast('Przycisk musi mieć co najmniej jedną komendę', 'warning');
            }
        }
    }
    
    /**
     * Zapisuje nowy lub edytowany przycisk urządzenia
     */
    function saveDeviceButton() {
        const name = buttonNameInput.value.trim();
        const functionType = buttonFunctionSelect.value;
        
        if (!name) {
            showToast('Nazwa przycisku jest wymagana', 'error');
            return;
        }
        
        // Zbierz komendy
        const commandFields = commandsContainer.querySelectorAll('.command-field');
        const commands = [];
        
        for (const field of commandFields) {
            const commandInput = field.querySelector('.command-input').value.trim();
            const delayInput = field.querySelector('.delay-input').value;
            
            if (commandInput) {
                // Walidacja formatu HEX
                if (!isValidHexCommand(commandInput)) {
                    showToast('Nieprawidłowy format komendy HEX', 'error');
                    return;
                }
                
                commands.push({
                    command: commandInput,
                    delay: parseInt(delayInput) || 0
                });
            }
        }
        
        if (commands.length === 0) {
            showToast('Przycisk musi mieć co najmniej jedną komendę', 'error');
            return;
        }
        
        const buttonData = {
            name: name,
            function: functionType,
            commands: commands,
            created: new Date().toISOString()
        };
        
        if (currentEditingButton !== null) {
            // Edycja istniejącego przycisku
            deviceButtons[currentEditingButton] = buttonData;
            showToast('Przycisk został zaktualizowany', 'success');
        } else {
            // Dodawanie nowego przycisku
            deviceButtons.push(buttonData);
            showToast('Nowy przycisk został dodany', 'success');
        }
        
        // Zapisz do localStorage
        saveDeviceButtons(currentDevice.address, deviceButtons);
        
        // Odśwież wyświetlanie
        displayDeviceButtons();
        
        // Reset formularza
        resetButtonForm();
    }
    
    /**
     * Anuluje edycję przycisku
     */
    function cancelButtonEditing() {
        resetButtonForm();
        showToast('Anulowano edycję przycisku', 'info');
    }
    
    /**
     * Resetuje formularz przycisku
     */
    function resetButtonForm() {
        buttonNameInput.value = '';
        buttonFunctionSelect.value = '';
        currentEditingButton = null;
        
        // Reset komend - zostaw tylko jedno pole
        commandsContainer.innerHTML = `
            <div class="command-field">
                <div class="form-group">
                    <label>Komenda HEX:</label>
                    <input type="text" class="command-input" placeholder="np. 0x01020304">
                </div>
                <div class="form-group">
                    <label>Opóźnienie (ms):</label>
                    <input type="number" class="delay-input" placeholder="0" min="0" max="10000">
                </div>
                <button type="button" class="remove-command-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    /**
     * Edytuje istniejący przycisk urządzenia
     * @param {number} index - Indeks przycisku do edycji
     */
    function editDeviceButton(index) {
        const button = deviceButtons[index];
        if (!button) return;
        
        currentEditingButton = index;
        
        // Wypełnij formularz danymi przycisku
        buttonNameInput.value = button.name;
        buttonFunctionSelect.value = button.function || '';
        
        // Wyczyść i wypełnij komendy
        commandsContainer.innerHTML = '';
        
        button.commands.forEach(cmd => {
            const commandField = document.createElement('div');
            commandField.className = 'command-field';
            commandField.innerHTML = `
                <div class="form-group">
                    <label>Komenda HEX:</label>
                    <input type="text" class="command-input" placeholder="np. 0x01020304" value="${cmd.command}">
                </div>
                <div class="form-group">
                    <label>Opóźnienie (ms):</label>
                    <input type="number" class="delay-input" placeholder="0" min="0" max="10000" value="${cmd.delay || 0}">
                </div>
                <button type="button" class="remove-command-btn">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            commandsContainer.appendChild(commandField);
        });
        
        // Przewiń do formularza
        buttonForm.scrollIntoView({ behavior: 'smooth' });
        
        showToast(`Edytujesz przycisk: ${button.name}`, 'info');
    }
    
    /**
     * Testuje przycisk urządzenia
     * @param {Object} button - Dane przycisku
     */
    function testDeviceButton(button) {
        if (!currentDevice.connected) {
            showToast('Urządzenie musi być połączone aby testować przyciski', 'warning');
            return;
        }
        
        showToast(`Testowanie przycisku: ${button.name}`, 'info');
        
        // Wykonaj komendy przycisku
        executeButtonCommands(button.commands);
    }
    
    /**
     * Usuwa przycisk urządzenia
     * @param {number} index - Indeks przycisku do usunięcia
     */
    function deleteDeviceButton(index) {
        const button = deviceButtons[index];
        if (!button) return;
        
        if (confirm(`Czy na pewno chcesz usunąć przycisk "${button.name}"?`)) {
            deviceButtons.splice(index, 1);
            saveDeviceButtons(currentDevice.address, deviceButtons);
            displayDeviceButtons();
            
            showToast(`Przycisk "${button.name}" został usunięty`, 'info');
        }
    }
    
    /**
     * Obsługuje rozparowywanie urządzenia
     */
    function handleUnpairDevice() {
        if (!currentDevice) return;
        
        if (currentDevice.connected) {
            showToast('Nie można rozparować połączonego urządzenia', 'error');
            return;
        }
        
        const deviceName = currentDevice.name || 'Nieznane urządzenie';
        
        if (confirm(`Czy na pewno chcesz rozparować urządzenie "${deviceName}"?\n\nTo usunie urządzenie z listy sparowanych urządzeń, ale zachowa jego konfigurację przycisków.`)) {
            // Implementuj logikę rozparowywania
            const success = unpairDevice(currentDevice.address);
            
            if (success) {
                closeDeviceEditModal();
                showToast(`Urządzenie "${deviceName}" zostało rozparowane`, 'info');
            }
        }
    }
    
    /**
     * Obsługuje resetowanie wszystkich przycisków
     */
    function handleResetButtons() {
        if (deviceButtons.length === 0) {
            showToast('Brak przycisków do zresetowania', 'info');
            return;
        }
        
        if (confirm(`Czy na pewno chcesz usunąć wszystkie przyciski (${deviceButtons.length})?\n\nTa akcja jest nieodwracalna.`)) {
            deviceButtons = [];
            saveDeviceButtons(currentDevice.address, deviceButtons);
            displayDeviceButtons();
            resetButtonForm();
            
            showToast('Wszystkie przyciski zostały usunięte', 'info');
        }
    }
    
    // ========================================
    // MODAL MANAGEMENT
    // ========================================
    
    /**
     * Otwiera modal edycji urządzenia
     * @param {Object} device - Dane urządzenia
     */
    function openDeviceEditModal(device) {
        if (!device) return;
        
        currentDevice = device;
        
        // Wypełnij podstawowe informacje
        deviceNameInput.value = device.name || '';
        deviceTypeSelect.value = device.type || 'other';
        deviceAddressDisplay.value = device.address || '';
        deviceAddressHidden.value = device.address || '';
        
        // Sprawdź status połączenia i zaktualizuj UI
        updateModalForConnectionStatus(device.connected);
        
        // Załaduj przyciski urządzenia
        loadDeviceButtons();
        
        // Pokaż modal na pierwszej zakładce
        switchToTab('basic-info-tab');
        deviceEditModal.style.display = 'block';
        
        // Auto-focus na nazwie urządzenia jeśli nie jest połączone
        if (!device.connected) {
            setTimeout(() => {
                deviceNameInput.focus();
                deviceNameInput.select();
            }, 100);
        }
        
        console.log(`Opened edit modal for device: ${device.name} (${device.address})`);
    }
    
    /**
     * Zamyka modal edycji urządzenia
     */
    function closeDeviceEditModal() {
        if (deviceEditModal) {
            deviceEditModal.style.display = 'none';
            
            // Reset stanu
            currentDevice = null;
            deviceButtons = [];
            currentEditingButton = null;
            
            // Reset formularzy
            if (editDeviceForm) {
                editDeviceForm.reset();
            }
            resetButtonForm();
            
            console.log('Device edit modal closed');
        }
    }
    
    /**
     * Aktualizuje modal w zależności od statusu połączenia
     * @param {boolean} isConnected - Czy urządzenie jest połączone
     */
    function updateModalForConnectionStatus(isConnected) {
        const warning = deviceEditModal.querySelector('.modal-warning');
        const formElements = deviceEditModal.querySelectorAll('input:not([type="hidden"]), select, button');
        
        if (isConnected) {
            // Pokaż ostrzeżenie
            if (warning) warning.style.display = 'flex';
            
            // Wyłącz elementy formularza podstawowych informacji
            deviceNameInput.disabled = true;
            deviceTypeSelect.disabled = true;
            if (deleteDeviceBtn) deleteDeviceBtn.disabled = true;
            
            // Wyłącz niektóre akcje w kontroli urządzenia
            if (unpairDeviceBtn) unpairDeviceBtn.disabled = true;
        } else {
            // Ukryj ostrzeżenie
            if (warning) warning.style.display = 'none';
            
            // Włącz elementy formularza
            deviceNameInput.disabled = false;
            deviceTypeSelect.disabled = false;
            if (deleteDeviceBtn) deleteDeviceBtn.disabled = false;
            if (unpairDeviceBtn) unpairDeviceBtn.disabled = false;
        }
    }
    
    /**
     * Konfiguruje obsługę zamykania modala
     */
    function setupModalCloseHandlers() {
        // Przycisk X
        const closeBtn = deviceEditModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeDeviceEditModal);
        }
        
        // Kliknięcie w tło
        deviceEditModal.addEventListener('click', (e) => {
            if (e.target === deviceEditModal) {
                closeDeviceEditModal();
            }
        });
        
        // Klawisz ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && deviceEditModal.style.display === 'block') {
                closeDeviceEditModal();
            }
        });
    }
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    /**
     * Zwraca ikonę dla funkcji przycisku
     * @param {string} functionType - Typ funkcji
     * @returns {string} - HTML ikony
     */
    function getFunctionIcon(functionType) {
        const icons = {
            power: '<i class="fas fa-power-off"></i>',
            'volume-up': '<i class="fas fa-volume-up"></i>',
            'volume-down': '<i class="fas fa-volume-down"></i>',
            'play-pause': '<i class="fas fa-play"></i>',
            next: '<i class="fas fa-step-forward"></i>',
            previous: '<i class="fas fa-step-backward"></i>',
            light: '<i class="fas fa-lightbulb"></i>',
            custom: '<i class="fas fa-cog"></i>'
        };
        
        return icons[functionType] || '<i class="fas fa-hand-pointer"></i>';
    }
    
    /**
     * Zwraca etykietę dla funkcji przycisku
     * @param {string} functionType - Typ funkcji
     * @returns {string} - Etykieta funkcji
     */
    function getFunctionLabel(functionType) {
        const labels = {
            power: 'Zasilanie',
            'volume-up': 'Głośność +',
            'volume-down': 'Głośność -',
            'play-pause': 'Play/Pause',
            next: 'Następny',
            previous: 'Poprzedni',
            light: 'Światło/LED',
            custom: 'Niestandardowa'
        };
        
        return labels[functionType] || 'Standardowy';
    }
    
    /**
     * Waliduje format komendy HEX
     * @param {string} command - Komenda do walidacji
     * @returns {boolean} - Czy komenda jest poprawna
     */
    function isValidHexCommand(command) {
        // Sprawdź format 0x... lub hex values
        const hexPattern = /^(0x)?[0-9A-Fa-f\s]+$/;
        return hexPattern.test(command.trim());
    }
    
    /**
     * Wykonuje komendy przycisku
     * @param {Array} commands - Lista komend do wykonania
     */
    function executeButtonCommands(commands) {
        if (!commands || commands.length === 0) return;
        
        console.log('Executing button commands:', commands);
        
        // Tutaj można zaimplementować wysyłanie komend do urządzenia
        // Przykład: API call do backendu
        commands.forEach((cmd, index) => {
            setTimeout(() => {
                console.log(`Executing command ${index + 1}: ${cmd.command}`);
                // Wywołaj API do wysłania komendy
                // sendCommandToDevice(currentDevice.address, cmd.command);
            }, cmd.delay || 0);
        });
    }
    
    /**
     * Pobiera przyciski urządzenia z localStorage
     * @param {string} deviceAddress - Adres MAC urządzenia
     * @returns {Array} - Lista przycisków
     */
    function getDeviceButtons(deviceAddress) {
        try {
            const key = `device_buttons_${deviceAddress}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading device buttons:', error);
            return [];
        }
    }
    
    /**
     * Zapisuje przyciski urządzenia do localStorage
     * @param {string} deviceAddress - Adres MAC urządzenia
     * @param {Array} buttons - Lista przycisków
     */
    function saveDeviceButtons(deviceAddress, buttons) {
        try {
            const key = `device_buttons_${deviceAddress}`;
            localStorage.setItem(key, JSON.stringify(buttons));
            console.log(`Saved ${buttons.length} buttons for device ${deviceAddress}`);
        } catch (error) {
            console.error('Error saving device buttons:', error);
        }
    }
    
    /**
     * Pokazuje toast notification
     * @param {string} message - Wiadomość
     * @param {string} type - Typ toast (success, error, warning, info)
     */
    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    // ========================================
    // INTEGRATION WITH OTHER MODULES
    // ========================================
    
    /**
     * Zapisuje zmiany urządzenia (integracja z sidebar.js)
     * @param {string} address - Adres MAC
     * @param {string} newName - Nowa nazwa
     * @param {string} newType - Nowy typ
     * @returns {boolean} - Czy operacja się powiodła
     */
    function saveDeviceChanges(address, newName, newType) {
        if (typeof window.saveDeviceChanges === 'function') {
            return window.saveDeviceChanges(address, newName, newType);
        }
        
        console.error('saveDeviceChanges function not available');
        return false;
    }
    
    /**
     * Usuwa urządzenie (integracja z sidebar.js)
     * @param {string} address - Adres MAC
     * @param {string} deviceName - Nazwa urządzenia
     * @returns {boolean} - Czy operacja się powiodła
     */
    function deleteDevice(address, deviceName) {
        if (typeof window.deleteDevice === 'function') {
            return window.deleteDevice(address, deviceName);
        }
        
        console.error('deleteDevice function not available');
        return false;
    }
    
    /**
     * Rozparowuje urządzenie
     * @param {string} address - Adres MAC
     * @returns {boolean} - Czy operacja się powiodła
     */
    function unpairDevice(address) {
        // Implementuj logikę rozparowywania
        console.log(`Unpairing device: ${address}`);
        
        // Tutaj można wywołać API do rozparowania urządzenia
        // lub usunąć z localStorage
        
        return true; // Mock success
    }
    
    // ========================================
    // GLOBAL EXPORTS
    // ========================================
    
    // Udostępnij funkcje globalnie
    window.deviceModalFunctions = {
        openDeviceEditModal,
        closeDeviceEditModal,
        switchToTab,
        getDeviceButtons,
        saveDeviceButtons
    };
    
    // Dla zgodności z sidebar.js
    window.openEditDeviceModal = openDeviceEditModal;
    window.closeEditDeviceModal = closeDeviceEditModal;
    
    console.log('Device modal with tabs initialized successfully');
});