// Funkcjonalność modalnego okna debugowania

// Funkcja pomocnicza do formatowania dzisiejszej daty
function getTodaysDateDebug() {
  return new Date().toISOString().slice(0, 10);
}

document.addEventListener('DOMContentLoaded', function() {
  // Elementy DOM
  const debugModal = document.getElementById('debug-modal');
  const closeDebugModal = document.getElementById('close-debug-modal');
  const debugTrigger = document.getElementById('debug-trigger');
  const logViewer = document.getElementById('debug-log-viewer');
  const clearLogsBtn = document.getElementById('clear-debug-logs');
  const simulateConnectionBtn = document.getElementById('simulate-connection-debug');
  const addTestDeviceBtn = document.getElementById('add-test-device-debug');
  
  // Form elements
  const testDeviceName = document.getElementById('debug-device-name');
  const testDeviceAddress = document.getElementById('debug-device-address');
  const testDeviceType = document.getElementById('debug-device-type');
  
  // Elementy filtrowania logów debug
  let debugLogFilterDateFrom = document.getElementById('debug-log-filter-date-from');
  let debugLogFilterDateTo = document.getElementById('debug-log-filter-date-to');
  let debugLogFilterTimeFrom = document.getElementById('debug-log-filter-time-from');
  let debugLogFilterTimeTo = document.getElementById('debug-log-filter-time-to');
  let debugLogFilterText = document.getElementById('debug-log-filter-text');
  let applyDebugLogFilters = document.getElementById('apply-debug-log-filters');
  let clearDebugLogFilters = document.getElementById('clear-debug-log-filters');
  let refreshDebugLogs = document.getElementById('refresh-debug-logs');
  
  // Auto-inicjalizacja komponentów interfejsu
  initDebugToolsUI();
  
  // Inicjalizacja UI narzędzi debugowania
  function initDebugToolsUI() {
    console.log('Inicjalizacja debug tools UI...');
    
    // Elementy mogły nie być załadowane jeszcze, sprawdźmy
    if (typeof debugTrigger !== 'undefined' && debugTrigger) {
      // Główny przycisk debug (prawy dolny róg ekranu)
      debugTrigger.addEventListener('click', openDebugModal);
    }
    
    if (typeof closeDebugModal !== 'undefined' && closeDebugModal) {
      // Zamknięcie modalu debug
      closeDebugModal.addEventListener('click', closeModal);
    }
    
    // Zamknięcie modalu po kliknięciu poza nim
    if (typeof debugModal !== 'undefined' && debugModal) {
      window.addEventListener('click', function(e) {
        if (e.target === debugModal) {
          closeModal();
        }
      });
    }
    
    // Obsługa przycisku czyszczenia logów
    if (typeof clearLogsBtn !== 'undefined' && clearLogsBtn) {
      clearLogsBtn.addEventListener('click', clearDebugLogs);
    }
    
    // Obsługa przycisku odświeżania logów
    if (typeof refreshDebugLogs !== 'undefined' && refreshDebugLogs) {
      refreshDebugLogs.addEventListener('click', function() {
        refreshDebugLogsContent();
      });
    }
    
    // Obsługa przycisku symulacji połączenia
    if (typeof simulateConnectionBtn !== 'undefined' && simulateConnectionBtn) {
      simulateConnectionBtn.addEventListener('click', simulateConnection);
    }
    
    // Obsługa przycisku dodawania testowego urządzenia
    if (typeof addTestDeviceBtn !== 'undefined' && addTestDeviceBtn) {
      addTestDeviceBtn.addEventListener('click', addTestDevice);
    }
    
    // Inicjalizuj filtry logów debug
    initDebugLogFilters();
    
    // Załaduj logi do podglądu debugowania
    refreshDebugLogsContent();
  }
  
  /**
   * Inicjalizacja filtrów logów debug
   */
  function initDebugLogFilters() {
    console.log('Inicjalizacja filtrów logów debug...');
    
    // Pobierz elementy ponownie w przypadku, gdyby się zmieniły
    debugLogFilterDateFrom = document.getElementById('debug-log-filter-date-from');
    debugLogFilterDateTo = document.getElementById('debug-log-filter-date-to');
    debugLogFilterTimeFrom = document.getElementById('debug-log-filter-time-from');
    debugLogFilterTimeTo = document.getElementById('debug-log-filter-time-to');
    debugLogFilterText = document.getElementById('debug-log-filter-text');
    applyDebugLogFilters = document.getElementById('apply-debug-log-filters');
    clearDebugLogFilters = document.getElementById('clear-debug-log-filters');
    
    console.log('Elementy filtrów debug:', {
      debugLogFilterDateFrom,
      debugLogFilterDateTo,
      debugLogFilterTimeFrom,
      debugLogFilterTimeTo,
      debugLogFilterText,
      applyDebugLogFilters,
      clearDebugLogFilters
    });
    
    // Jeśli elementy istnieją, dodaj nasłuchiwanie zdarzeń
    if (applyDebugLogFilters) {
      applyDebugLogFilters.addEventListener('click', function() {
        console.log('Kliknięto Zastosuj filtry debug');
        refreshDebugLogsContent(true);
      });
      console.log('Dodano listener dla apply-debug-log-filters');
    } else {
      console.error('Nie znaleziono elementu apply-debug-log-filters');
    }
    
    if (clearDebugLogFilters) {
      clearDebugLogFilters.addEventListener('click', function() {
        console.log('Kliknięto Wyczyść filtry debug');
        // Wyczyść filtry
        const filterFields = [
          'debug-log-filter-date-from',
          'debug-log-filter-date-to', 
          'debug-log-filter-time-from',
          'debug-log-filter-time-to',
          'debug-log-filter-text'
        ];
        
        filterFields.forEach(id => {
          const element = document.getElementById(id);
          if (element) {
            element.value = '';
            console.log(`Wyczyszczono ${id}`);
          }
        });
        
        // Przeładuj logi bez filtrów
        refreshDebugLogsContent(false);
        
        // Ukryj podsumowanie filtrów
        const filterSummary = document.querySelector('.debug-filter-summary');
        if (filterSummary) {
          filterSummary.style.display = 'none';
        }
      });
      console.log('Dodano listener dla clear-debug-log-filters');
    } else {
      console.error('Nie znaleziono elementu clear-debug-log-filters');
    }
    
    // Dodaj obsługę klawisza Enter dla pola tekstowego
    if (debugLogFilterText) {
      debugLogFilterText.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
          console.log('Enter w polu tekstowym filtra debug');
          refreshDebugLogsContent(true);
        }
      });
      console.log('Dodano listener Enter dla debug-log-filter-text');
    }
    
    // Dodaj dynamiczne etykiety informujące o aktywnych filtrach
    const filterSummary = document.createElement('div');
    filterSummary.className = 'debug-filter-summary';
    filterSummary.style.display = 'none';
    filterSummary.innerHTML = '<span class="filter-label">Aktywne filtry:</span> <span class="filter-values"></span>';
    
    // Dodaj etykietę po nagłówku formularza filtrowania
    const debugLogsFilterForm = document.querySelector('.debug-logs-filter-form');
    if (debugLogsFilterForm) {
      debugLogsFilterForm.after(filterSummary);
      console.log('Dodano podsumowanie filtrów debug');
    }
    
    // Automatycznie ustaw "Do daty" na dzisiejszą datę zamiast kopiować "Od daty"
    if (debugLogFilterDateFrom && debugLogFilterDateTo) {
      debugLogFilterDateFrom.addEventListener('change', function() {
        if (debugLogFilterDateTo.value === '') {
          debugLogFilterDateTo.value = getTodaysDateDebug(); // Zmienione: ustawia dzisiejszą datę
          console.log('Automatycznie ustawiono datę "do" debug na dzisiejszą datę');
        }
      });
    }
    
    // Podobnie dla godzin
    if (debugLogFilterTimeFrom && debugLogFilterTimeTo) {
      debugLogFilterTimeFrom.addEventListener('change', function() {
        if (debugLogFilterTimeTo.value === '') {
          // Ustaw domyślnie do końca dnia (23:59)
          debugLogFilterTimeTo.value = '23:59';
          console.log('Automatycznie ustawiono czas "do" debug');
        }
      });
    }
    
    // Wyświetl podsumowanie zastosowanych filtrów
    function updateDebugFilterSummary() {
      const filterSummary = document.querySelector('.debug-filter-summary');
      const filterValues = document.querySelector('.debug-filter-summary .filter-values');
      
      if (!filterSummary || !filterValues) return;
      
      // Zbierz zastosowane filtry
      const dateFrom = debugLogFilterDateFrom?.value;
      const dateTo = debugLogFilterDateTo?.value;
      const timeFrom = debugLogFilterTimeFrom?.value;
      const timeTo = debugLogFilterTimeTo?.value;
      const text = debugLogFilterText?.value;
      
      const activeFilters = [];
      
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
      
      if (timeFrom && timeTo) {
        activeFilters.push(`Czas: ${timeFrom} — ${timeTo}`);
      } else if (timeFrom) {
        activeFilters.push(`Czas od: ${timeFrom}`);
      } else if (timeTo) {
        activeFilters.push(`Czas do: ${timeTo}`);
      }
      
      if (text) {
        activeFilters.push(`Tekst: "${text}"`);
      }
      
      // Aktualizuj widok podsumowania
      if (activeFilters.length > 0) {
        // Dodaj informację o logice AND
        filterValues.innerHTML = activeFilters.join(' <span style="color: #e74c3c;">AND</span> ');
        filterSummary.style.display = 'block';
        console.log('Zaktualizowano podsumowanie filtrów debug:', activeFilters);
      } else {
        filterSummary.style.display = 'none';
      }
    }
    
    // Aktualizuj podsumowanie po zastosowaniu filtrów
    if (applyDebugLogFilters) {
      applyDebugLogFilters.addEventListener('click', updateDebugFilterSummary);
    }
  }
  
  /**
   * Otwiera modal debugowania
   */
  function openDebugModal() {
    if (typeof debugModal !== 'undefined' && debugModal) {
      debugModal.style.display = 'block';
      refreshDebugLogsContent();
      
      // Ponownie zainicjalizuj filtry po otwarciu modalu
      setTimeout(() => {
        initDebugLogFilters();
      }, 100);
    }
  }
  
  /**
   * Zamyka modal debugowania
   */
  function closeModal() {
    if (typeof debugModal !== 'undefined' && debugModal) {
      debugModal.style.display = 'none';
    }
  }
  
  /**
   * Odświeża logi w modalnym oknie debugowania z opcjonalnym filtrowaniem
   * @param {boolean} applyFilters - Czy zastosować filtry
   */
  function refreshDebugLogsContent(applyFilters = false) {
    console.log('Odświeżanie logów debug, z filtrami:', applyFilters);
    
    if (typeof logViewer === 'undefined' || !logViewer) {
      console.warn('Brak logViewer');
      return;
    }
    
    // Pobierz logi z oryginalnego kontenera .log-container
    const originalLogContainer = document.querySelector('.log-container');
    if (!originalLogContainer) {
      console.warn('Brak originalLogContainer');
      return;
    }
    
    const logEntries = originalLogContainer.querySelectorAll('.log-entry');
    
    if (logEntries.length === 0) {
      logViewer.innerHTML = '<div class="log-entry">Brak logów do wyświetlenia.</div>';
      return;
    }
    
    console.log(`Znaleziono ${logEntries.length} logów do przetworzenia`);
    
    // Konwertuj logi na tablicę z tekstem
    let logsArray = Array.from(logEntries).map(entry => entry.textContent);
    
    // Przygotuj filtry jeśli są wymagane
    let dateFromFilter = '';
    let dateToFilter = '';
    let timeFromFilter = '';
    let timeToFilter = '';
    let textFilter = '';
    
    if (applyFilters) {
      console.log('Stosowanie filtrów debug...');
      
      // Pobierz wartości filtrów
      dateFromFilter = debugLogFilterDateFrom?.value || '';
      dateToFilter = debugLogFilterDateTo?.value || '';
      timeFromFilter = debugLogFilterTimeFrom?.value || '';
      timeToFilter = debugLogFilterTimeTo?.value || '';
      textFilter = debugLogFilterText?.value?.toLowerCase() || '';
      
      console.log('Wartości filtrów debug:', {
        dateFromFilter,
        dateToFilter,
        timeFromFilter,
        timeToFilter,
        textFilter
      });
      
      // Automatycznie ustaw "Do daty" na dzisiejszą datę zamiast kopiować "Od daty"
      if (dateFromFilter && !dateToFilter) {
        dateToFilter = getTodaysDateDebug();
        console.log('Automatycznie ustawiono datę "do" debug na dzisiejszą datę podczas filtrowania');
      }
      
      // Domyślnie ustaw zakres godzin na cały dzień jeśli tylko jedna wartość jest ustawiona
      if (timeFromFilter && !timeToFilter) {
        timeToFilter = '23:59';
      }
      
      if (!timeFromFilter && timeToFilter) {
        timeFromFilter = '00:00';
      }
    }
    
    // Filtrowanie logów
    let filteredLogs = logsArray.slice();
    let foundMatches = false;
    
    if (applyFilters && (dateFromFilter || dateToFilter || timeFromFilter || timeToFilter || textFilter)) {
      console.log('Filtrowanie logów debug z warunkami AND...');
      console.log('Aktywne filtry debug:', { dateFromFilter, dateToFilter, timeFromFilter, timeToFilter, textFilter });
      
      filteredLogs = logsArray.filter(log => {
        console.log('Sprawdzanie logu debug:', log);
        
        // Logi mogą mieć różne formaty, spróbuj wyciągnąć datę i czas
        // Format może być np. [YYYY-MM-DD] [HH:MM:SS] lub inne
        const dateMatch = log.match(/\[(\d{4}-\d{2}-\d{2})\]/) || log.match(/(\d{4}-\d{2}-\d{2})/);
        const timestampMatch = log.match(/\[([\d:]+)\]/) || log.match(/([\d:]+)/);
        
        const logDate = dateMatch ? dateMatch[1] : null;
        const logTime = timestampMatch ? timestampMatch[1] : null;
        const logText = log.toLowerCase();
        
        console.log('Wyciągnięte dane debug:', { logDate, logTime, logText: logText.substring(0, 50) + '...' });
        
        // WARUNEK AND #1: Filtrowanie po dacie "od"
        if (dateFromFilter) {
          if (!logDate || logDate < dateFromFilter) {
            console.log(`Debug odrzucono - data ${logDate} jest wcześniejsza niż ${dateFromFilter}`);
            return false;
          }
          console.log(`Debug data "od" OK: ${logDate} >= ${dateFromFilter}`);
        }
        
        // WARUNEK AND #2: Filtrowanie po dacie "do"
        if (dateToFilter) {
          if (!logDate || logDate > dateToFilter) {
            console.log(`Debug odrzucono - data ${logDate} jest późniejsza niż ${dateToFilter}`);
            return false;
          }
          console.log(`Debug data "do" OK: ${logDate} <= ${dateToFilter}`);
        }
        
        // WARUNEK AND #3 & #4: Filtrowanie po czasie
        if (timeFromFilter || timeToFilter) {
          if (!logTime) {
            // Jeśli nie ma czasu w logu, ale filtry czasu są aktywne, odrzuć tylko jeśli oba filtry są ustawione
            if (timeFromFilter && timeToFilter) {
              console.log('Debug odrzucono - brak czasu w logu, ale oba filtry czasu są aktywne');
              return false;
            }
            // Jeśli tylko jeden filtr czasu jest aktywny, pozwól przejść logom bez czasu
            console.log('Debug - brak czasu w logu, ale tylko jeden filtr czasu aktywny - pozwalamy przejść');
          } else {
            const logTimeParts = logTime.split(':');
            if (logTimeParts.length >= 2) {
              const logHours = parseInt(logTimeParts[0]);
              const logMinutes = parseInt(logTimeParts[1]);
              const logTimeMinutes = logHours * 60 + logMinutes;
              
              // WARUNEK AND #3: Czas "od"
              if (timeFromFilter) {
                const fromTimeParts = timeFromFilter.split(':');
                if (fromTimeParts.length >= 2) {
                  const fromHours = parseInt(fromTimeParts[0]);
                  const fromMinutes = parseInt(fromTimeParts[1]);
                  const fromTimeMinutes = fromHours * 60 + fromMinutes;
                  
                  if (logTimeMinutes < fromTimeMinutes) {
                    console.log(`Debug odrzucono - czas ${logTime} jest wcześniejszy niż ${timeFromFilter}`);
                    return false;
                  }
                  console.log(`Debug czas "od" OK: ${logTime} >= ${timeFromFilter}`);
                }
              }
              
              // WARUNEK AND #4: Czas "do"
              if (timeToFilter) {
                const toTimeParts = timeToFilter.split(':');
                if (toTimeParts.length >= 2) {
                  const toHours = parseInt(toTimeParts[0]);
                  const toMinutes = parseInt(toTimeParts[1]);
                  const toTimeMinutes = toHours * 60 + toMinutes;
                  
                  if (logTimeMinutes > toTimeMinutes) {
                    console.log(`Debug odrzucono - czas ${logTime} jest późniejszy niż ${timeToFilter}`);
                    return false;
                  }
                  console.log(`Debug czas "do" OK: ${logTime} <= ${timeToFilter}`);
                }
              }
            }
          }
        }
        
        // WARUNEK AND #5: Filtrowanie po tekście
        if (textFilter) {
          if (!logText.includes(textFilter)) {
            console.log(`Debug odrzucono - tekst nie zawiera "${textFilter}"`);
            return false;
          }
          console.log(`Debug tekst OK: zawiera "${textFilter}"`);
        }
        
        // Wszystkie warunki AND zostały spełnione
        console.log('Debug log przeszedł przez wszystkie filtry AND');
        return true;
      });
      
      foundMatches = filteredLogs.length > 0;
      console.log(`Po filtrowaniu AND debug zostało ${filteredLogs.length} logów z ${logsArray.length}`);
      
      // Dodaj informację o liczbie przefiltrowanych logów do podsumowania
      const filterSummary = document.querySelector('.debug-filter-summary');
      if (filterSummary && filteredLogs.length < logsArray.length) {
        const filterInfo = document.createElement('div');
        filterInfo.className = 'filter-results-info';
        filterInfo.style.cssText = 'margin-top: 5px; font-size: 11px; color: #3498db; font-weight: bold;';
        filterInfo.textContent = `Debug: Pokazano ${filteredLogs.length} z ${logsArray.length} logów`;
        
        // Usuń poprzednią informację jeśli istnieje
        const existingInfo = filterSummary.querySelector('.filter-results-info');
        if (existingInfo) {
          existingInfo.remove();
        }
        
        filterSummary.appendChild(filterInfo);
      }
    }
    
    // Wyczyść podgląd logów
    logViewer.innerHTML = '';
    
    // Dodaj każdy log do podglądu (od najnowszego)
    if (filteredLogs.length > 0) {
      filteredLogs.forEach(logText => {
        const logElement = document.createElement('div');
        logElement.className = 'log-entry';
        
        // Pokoloruj logi w zależności od typu
        const logContent = logText.toLowerCase();
        if (logContent.includes('error') || logContent.includes('błąd')) {
          logElement.classList.add('error');
        } else if (logContent.includes('warning') || logContent.includes('ostrzeżenie')) {
          logElement.classList.add('warning');
        } else if (logContent.includes('success') || logContent.includes('sukces')) {
          logElement.classList.add('success');
        } else {
          logElement.classList.add('info');
        }
        
        // Jeśli filtrujemy i mamy tekst filtrowania, podświetl dopasowania
        if (applyFilters && textFilter && logText.toLowerCase().includes(textFilter)) {
          logElement.classList.add('highlight');
          
          // Podświetl dopasowany tekst
          const regex = new RegExp('(' + textFilter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'gi');
          const highlightedText = logText.replace(regex, '<span class="highlight-text">$1</span>');
          logElement.innerHTML = highlightedText;
        } else {
          logElement.textContent = logText;
        }
        
        logViewer.appendChild(logElement);
      });
    } else {
      // Pokaż komunikat jeśli nie ma logów lub nie znaleziono dopasowań
      const noLogsMsg = document.createElement('div');
      noLogsMsg.className = 'log-entry no-logs-message';
      
      if (applyFilters && !foundMatches) {
        noLogsMsg.textContent = 'Brak logów pasujących do filtrów.';
      } else {
        noLogsMsg.textContent = 'Brak logów do wyświetlenia.';
      }
      
      logViewer.appendChild(noLogsMsg);
    }
  }
  
  /**
   * Czyści logi z podglądu debugowania i głównego kontenera logów
   */
  function clearDebugLogs() {
    if (typeof logViewer === 'undefined' || !logViewer) return;
    
    // Pobierz formularz czyszczenia logów i wyślij go
    const clearLogsForm = document.querySelector('#hidden-clear-logs-form') || document.querySelector('form[action="/clear_logs"]');
    if (clearLogsForm) {
      clearLogsForm.submit();
      
      // Dodaj opóźnienie, aby formularz miał czas na zadziałanie
      setTimeout(() => {
        refreshDebugLogsContent();
      }, 500);
    } else {
      // Jeśli formularza nie ma, spróbuj wyczyścić bezpośrednio
      const originalLogContainer = document.querySelector('.log-container');
      if (originalLogContainer) {
        originalLogContainer.innerHTML = '<p>Brak logów.</p>';
        refreshDebugLogsContent();
      }
    }
  }
  
  /**
   * Symuluje połączenie z urządzeniem
   */
  function simulateConnection() {
    // Pobierz formularz symulujący połączenie i wyślij go
    const simulateForm = document.querySelector('#hidden-simulate-form') || document.querySelector('form[action="/simulate_connection"]');
    if (simulateForm) {
      simulateForm.submit();
      closeModal();
      return;
    }
    
    // Jeśli nie ma formularza, wyświetl komunikat
    addDebugLog('Błąd: Nie znaleziono formularza symulacji połączenia.');
  }
  
  /**
   * Dodaje testowe urządzenie do listy
   */
  function addTestDevice() {
    if (!testDeviceName || !testDeviceAddress || !testDeviceType) {
      addDebugLog('Błąd: Brak elementów formularza!');
      return;
    }
    
    // Get form data
    const deviceName = testDeviceName.value || 'Testowe Urządzenie';
    const deviceAddress = testDeviceAddress.value || '00:11:22:33:44:55';
    const deviceType = testDeviceType.value || 'other';
    const isConnected = false; // Zawsze false dla testowych urządzeń
    
    // Create device object
    const testDevice = {
      name: deviceName,
      address: deviceAddress,
      type: deviceType,
      connected: isConnected
    };
    
    // Trigger device connected event
    window.dispatchEvent(new CustomEvent('deviceConnected', {
      detail: {
        device: testDevice
      }
    }));
    
    // Add log
    addDebugLog(`[DEBUG] Dodano testowe urządzenie: ${deviceName} (${deviceAddress})`);
    
    // Zamknij modal po dodaniu urządzenia
    closeModal();
  }
  
  /**
   * Dodaje log debugowania
   * @param {string} message - Wiadomość debugowania
   */
  function addDebugLog(message) {
    // Dodaj log do głównego kontenera logów
    const logContainer = document.querySelector('.log-container');
    if (logContainer) {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      logEntry.textContent = message;
      logContainer.insertBefore(logEntry, logContainer.firstChild);
      
      // Odśwież widok logów w modalu debug
      refreshDebugLogsContent();
    } else {
      console.log('Debug log:', message);
    }
  }
});