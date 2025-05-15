// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Elementy DOM
    const customButtonsContainer = document.getElementById('custom-buttons');
    const addButtonElement = document.getElementById('add-button');
    const buttonNameInput = document.getElementById('button-name');
    const deviceFilterInput = document.getElementById('device-filter');
    const addCommandButton = document.getElementById('add-command');
    const commandsContainer = document.getElementById('commands-container');
    const scanForm = document.getElementById('scan-form');
    const scanningIndicator = document.getElementById('scanning-indicator');
    
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
    
    // Event listener dla formularza skanowania
    if (scanForm) {
        scanForm.addEventListener('submit', function() {
            // Pokaż wskaźnik ładowania
            if (scanningIndicator) {
                scanningIndicator.style.display = 'flex';
            }
        });
    }
    
    // Sprawdź czy strona została załadowana po przekierowaniu z /scan
    if (document.referrer.includes('/scan')) {
        // Ukryj wskaźnik ładowania jeśli był widoczny
        if (scanningIndicator) {
            scanningIndicator.style.display = 'none';
        }
    }
    
    // Inicjalizacja pierwszego pola komend
    addCommandField();
    
    // Sprawdź czy mamy aktywną sekwencję komend do kontynuowania
    checkActiveSequence();
    
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
        delayInput.value = '';
        
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
        const formCommandFields = commandsContainer.querySelectorAll('.command-field');
        const commands = [];
        
        let isValid = true;
        
        formCommandFields.forEach(field => {
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
            console.log(`Kliknięto przycisk "${buttonName}", komendy:`, commands);
            
            // Dodaj informację do logów strony
            addToLog(`Uruchamiam sekwencję ${commands.length} komend z przycisku "${buttonName}"`);
            
            // Uruchom sekwencję wykonania komend
            executeCommandSequence(commands);
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
        const allCommandFields = commandsContainer.querySelectorAll('.command-field');
        for (let i = 1; i < allCommandFields.length; i++) {
            allCommandFields[i].remove();
        }
        
        // Czyścimy pierwsze pole
        const firstCommandInput = allCommandFields[0].querySelector('.command-input');
        const firstDelayInput = allCommandFields[0].querySelector('.delay-input');
        if (firstCommandInput) firstCommandInput.value = '';
        if (firstDelayInput) firstDelayInput.value = '';
        
        // Zapisujemy przyciski do localStorage
        saveButtons();
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
            logEntry.textContent = `[JAVASCRIPT] ${message}`;
            logContainer.insertBefore(logEntry, logContainer.firstChild);
        }
        console.log(message);
    }
    
    /**
     * Rozpoczyna wykonanie sekwencji komend
     * @param {Array} commands - Tablica obiektów komend z polami data i delay
     */
    function executeCommandSequence(commands) {
        if (!commands || commands.length === 0) return;
        
        // Zapisz całą sekwencję do localStorage
        const sequence = {
            commands: commands,
            currentIndex: 0,
            totalCommands: commands.length
        };
        
        // Zapisz sekwencję do localStorage
        localStorage.setItem('activeCommandSequence', JSON.stringify(sequence));
        
        // Wyślij pierwszą komendę
        executeNextCommand();
    }
    
    /**
     * Wykonuje następną komendę z aktywnej sekwencji
     */
    function executeNextCommand() {
        const sequenceJSON = localStorage.getItem('activeCommandSequence');
        if (!sequenceJSON) return;
        
        const sequence = JSON.parse(sequenceJSON);
        
        // Sprawdź czy mamy jeszcze komendy do wykonania
        if (sequence.currentIndex >= sequence.commands.length) {
            addToLog('Sekwencja komend zakończona');
            localStorage.removeItem('activeCommandSequence');
            return;
        }
        
        // Pobierz aktualną komendę
        const currentCommand = sequence.commands[sequence.currentIndex];
        addToLog(`Wykonuję komendę ${sequence.currentIndex + 1}/${sequence.totalCommands}: ${currentCommand.data}`);
        
        // Zaktualizuj index w sekwencji
        sequence.currentIndex++;
        localStorage.setItem('activeCommandSequence', JSON.stringify(sequence));
        
        // Wyślij aktualną komendę
        sendCommand(currentCommand.data, currentCommand.delay);
    }
    
    /**
     * Wysyła komendę i ustawia timer na następną (jeśli jest)
     * @param {string} data - Dane do wysłania
     * @param {number} delay - Opóźnienie przed następną komendą
     */
    function sendCommand(data, delay) {
        // Przygotuj formularz do wysłania danych
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
        
        // Dodaj flagę, że jest to część sekwencji i ustawiliśmy już timer
        localStorage.setItem('commandWithTimer', 'true');
        localStorage.setItem('commandDelay', delay.toString());
        
        setTimeout(() => {
            form.submit();
        }, 100); // Krótkie opóźnienie aby logi mogły się zaktualizować
    }
    
    /**
     * Sprawdza czy jest aktywna sekwencja komend i czy powinniśmy kontynuować
     */
    function checkActiveSequence() {
        const shouldContinue = localStorage.getItem('commandWithTimer');
        
        if (shouldContinue) {
            // Pobierz opóźnienie do następnej komendy
            const delay = parseInt(localStorage.getItem('commandDelay') || '0');
            
            // Usuń flagi
            localStorage.removeItem('commandWithTimer');
            localStorage.removeItem('commandDelay');
            
            // Ustawienie timera na wykonanie następnej komendy
            setTimeout(() => {
                executeNextCommand();
            }, delay);
        }
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
                        console.log(`Kliknięto przycisk "${buttonInfo.name}", komendy:`, commands);
                        
                        // Dodaj informację do logów strony
                        addToLog(`Uruchamiam sekwencję ${commands.length} komend z przycisku "${buttonInfo.name}"`);
                        
                        // Uruchom sekwencję wykonania komend
                        executeCommandSequence(commands);
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
        // Akceptuje format 0x... lub sam hex bez prefiksu
        if (hexString.startsWith('0x')) {
            hexString = hexString.substring(2);
        }
        
        // Sprawdź, czy pozostały string składa się tylko z cyfr szesnastkowych
        // i ma parzystą liczbę znaków (pełne bajty)
        return /^[0-9A-Fa-f]+$/.test(hexString) && hexString.length % 2 === 0;
    }
});