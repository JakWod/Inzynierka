// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Elementy DOM
    const customButtonsContainer = document.getElementById('custom-buttons');
    const addButtonElement = document.getElementById('add-button');
    const buttonNameInput = document.getElementById('button-name');
    const buttonDataInput = document.getElementById('button-data');
    const deviceFilterInput = document.getElementById('device-filter');
    const addCommandButton = document.getElementById('add-command');
    const commandsContainer = document.getElementById('commands-container');
    
    // Ładowanie zapisanych przycisków
    loadButtons();
    
    // Event listeners
    if (addButtonElement) {
        addButtonElement.addEventListener('click', createCustomButton);
    }
    
    if (addCommandButton) {
        addCommandButton.addEventListener('click', addCommandField);
    }
    
    if (deviceFilterInput) {
        deviceFilterInput.addEventListener('input', filterDevices);
    }
    
    // Inicjalizacja pierwszego pola komend
    addCommandField();
    
    /**
     * Dodaje nowe pole do wprowadzania komend
     */
    function addCommandField() {
        const commandField = document.createElement('div');
        commandField.className = 'command-field';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'command-input';
        input.placeholder = 'Dane w formacie HEX (np. 0x01020304)';
        
        const delayInput = document.createElement('input');
        delayInput.type = 'number';
        delayInput.className = 'delay-input';
        delayInput.placeholder = 'Opóźnienie (ms)';
        delayInput.min = '0';
        delayInput.value = '0';
        
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-command';
        removeButton.textContent = 'Usuń';
        removeButton.addEventListener('click', function() {
            // Nie usuwaj, jeśli to jedyne pole komend
            if (commandsContainer.querySelectorAll('.command-field').length > 1) {
                commandField.remove();
            }
        });
        
        commandField.appendChild(input);
        commandField.appendChild(delayInput);
        commandField.appendChild(removeButton);
        
        // Dodaj pole do kontenera
        commandsContainer.appendChild(commandField);
    }
    
    /**
     * Filtruje listę urządzeń na podstawie wpisanego tekstu
     */
    function filterDevices() {
        const filterText = deviceFilterInput.value.toLowerCase();
        const devices = document.querySelectorAll('table tbody tr');
        
        devices.forEach(device => {
            const deviceName = device.querySelector('td:first-child').textContent.toLowerCase();
            const deviceAddress = device.querySelector('td:nth-child(2)').textContent.toLowerCase();
            
            if (deviceName.includes(filterText) || deviceAddress.includes(filterText)) {
                device.style.display = '';
            } else {
                device.style.display = 'none';
            }
        });
    }
    
    /**
     * Tworzy nowy przycisk na podstawie danych z formularza
     */
    function createCustomButton() {
        // Walidacja
        if (!buttonNameInput || !commandsContainer) return;
        
        const buttonName = buttonNameInput.value;
        
        if (!buttonName) {
            alert('Proszę wypełnić nazwę przycisku');
            return;
        }
        
        // Zbierz wszystkie komendy i opóźnienia
        const commandFields = commandsContainer.querySelectorAll('.command-field');
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
            
            // Walidacja formatu HEX
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
        
        // Tworzymy nowy przycisk
        const button = document.createElement('button');
        button.classList.add('custom-button');
        button.textContent = buttonName;
        button.dataset.commands = JSON.stringify(commands);
        
        // Dodajemy obsługę kliknięcia
        button.addEventListener('click', function() {
            sendSequentialCommands(commands);
        });
        
        // Dodajemy przycisk do usunięcia
        const deleteButton = document.createElement('span');
        deleteButton.innerHTML = '&times;';
        deleteButton.className = 'delete-button';
        deleteButton.title = 'Usuń przycisk';
        deleteButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Zatrzymaj propagację, aby nie wysłać komendy
            if (confirm('Czy na pewno chcesz usunąć ten przycisk?')) {
                button.remove();
                saveButtons();
            }
        });
        
        button.appendChild(deleteButton);
        
        // Dodajemy do kontenera
        if (customButtonsContainer) {
            customButtonsContainer.appendChild(button);
        }
        
        // Czyszczenie formularza
        buttonNameInput.value = '';
        // Czyścimy wszystkie pola komend oprócz pierwszego
        for (let i = 1; i < commandFields.length; i++) {
            commandFields[i].remove();
        }
        // Czyścimy pierwsze pole
        const firstCommandInput = commandFields[0].querySelector('.command-input');
        const firstDelayInput = commandFields[0].querySelector('.delay-input');
        if (firstCommandInput) firstCommandInput.value = '';
        if (firstDelayInput) firstDelayInput.value = '0';
        
        // Zapisujemy przyciski do localStorage
        saveButtons();
    }
    
    /**
     * Wysyła sekwencję komend z odpowiednimi opóźnieniami
     * @param {Array} commands - Tablica obiektów komend z polami data i delay
     */
    function sendSequentialCommands(commands) {
        if (commands.length === 0) return;
        
        // Wysyłamy pierwszą komendę
        sendCustomCommand(commands[0].data);
        
        // Jeśli jest więcej komend, musimy ustawić przekierowanie strony
        if (commands.length > 1) {
            // Zapisujemy pozostałe komendy do wysłania
            localStorage.setItem('pendingCommands', JSON.stringify(commands.slice(1)));
            
            // Dodajemy parametr do URL, który zasygnalizuje, że należy kontynuować sekwencję
            setTimeout(function() {
                window.location.href = window.location.pathname + '?continueSequence=true';
            }, commands[0].delay);
        }
    }
    
    /**
     * Sprawdza czy są oczekujące komendy do wysłania
     */
    function checkPendingCommands() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('continueSequence')) {
            const pendingCommandsJSON = localStorage.getItem('pendingCommands');
            if (pendingCommandsJSON) {
                try {
                    const pendingCommands = JSON.parse(pendingCommandsJSON);
                    if (pendingCommands.length > 0) {
                        // Usuwamy oczekujące komendy z localStorage
                        localStorage.removeItem('pendingCommands');
                        
                        // Wysyłamy następną komendę
                        setTimeout(function() {
                            sendSequentialCommands(pendingCommands);
                        }, 300); // Krótkie opóźnienie, aby strona zdążyła się załadować
                    }
                } catch (e) {
                    console.error('Błąd podczas przetwarzania oczekujących komend:', e);
                    localStorage.removeItem('pendingCommands');
                }
            }
            
            // Usuwamy parametr URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    // Sprawdź czy są oczekujące komendy przy ładowaniu strony
    checkPendingCommands();
    
    /**
     * Wysyła dane z przycisku
     * @param {string} data - Dane do wysłania w formacie HEX
     */
    function sendCustomCommand(data) {
        // Tworzymy ukryty formularz do wysłania danych
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/send';
        
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = data;
        
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
    }
    
    /**
     * Zapisuje przyciski do localStorage
     */
    function saveButtons() {
        if (!customButtonsContainer) return;
        
        const buttons = customButtonsContainer.querySelectorAll('.custom-button');
        const savedButtons = [];
        
        buttons.forEach(button => {
            savedButtons.push({
                name: button.textContent.replace('×', '').trim(), // Usuń znak 'x' z nazwy przycisku
                commands: JSON.parse(button.dataset.commands || '[]')
            });
        });
        
        localStorage.setItem('customButtons', JSON.stringify(savedButtons));
    }
    
    /**
     * Ładuje przyciski z localStorage
     */
    function loadButtons() {
        if (!customButtonsContainer) return;
        
        const savedButtonsJSON = localStorage.getItem('customButtons');
        if (savedButtonsJSON) {
            try {
                const savedButtons = JSON.parse(savedButtonsJSON);
                
                savedButtons.forEach(buttonInfo => {
                    const button = document.createElement('button');
                    button.classList.add('custom-button');
                    button.textContent = buttonInfo.name;
                    button.dataset.commands = JSON.stringify(buttonInfo.commands || [{data: buttonInfo.data, delay: 0}]);
                    
                    // Dodajemy obsługę kliknięcia
                    button.addEventListener('click', function() {
                        // Obsługa kompatybilności wstecznej
                        const commands = buttonInfo.commands || [{data: buttonInfo.data, delay: 0}];
                        sendSequentialCommands(commands);
                    });
                    
                    // Dodajemy przycisk do usunięcia
                    const deleteButton = document.createElement('span');
                    deleteButton.innerHTML = '&times;';
                    deleteButton.className = 'delete-button';
                    deleteButton.title = 'Usuń przycisk';
                    deleteButton.addEventListener('click', function(e) {
                        e.stopPropagation(); // Zatrzymaj propagację, aby nie wysłać komendy
                        if (confirm('Czy na pewno chcesz usunąć ten przycisk?')) {
                            button.remove();
                            saveButtons();
                        }
                    });
                    
                    button.appendChild(deleteButton);
                    customButtonsContainer.appendChild(button);
                });
            } catch (e) {
                console.error('Błąd podczas wczytywania przycisków:', e);
                // Jeśli wystąpił błąd, wyczyść uszkodzone dane
                localStorage.removeItem('customButtons');
            }
        }
    }
    
    /**
     * Sprawdza, czy podany string jest poprawnym formatem HEX
     * @param {string} hexString - String do sprawdzenia
     * @returns {boolean} - Czy string jest poprawnym HEX
     */
    function isValidHexFormat(hexString) {
        // Akceptujemy format 0x... lub sam hex bez prefiksu
        if (hexString.startsWith('0x')) {
            hexString = hexString.substring(2);
        }
        
        // Sprawdź, czy pozostały string składa się tylko z cyfr szesnastkowych
        // i ma parzystą liczbę znaków (pełne bajty)
        return /^[0-9A-Fa-f]+$/.test(hexString) && hexString.length % 2 === 0;
    }
});