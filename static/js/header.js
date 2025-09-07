/**
 * Header Functionality for Bluetooth Manager
 * Handles header interactions, authentication modals, and user management
 * UPDATED: Enhanced ADD button functionality and improved user menu with dropdown
 * FIXED: Better error handling and debugging for ADD button
 */

document.addEventListener('DOMContentLoaded', function() {
  // ========================================
  // DOM ELEMENTS
  // ========================================
  
  // Header elements
  const headerSearch = document.getElementById('header-search');
  const typeFilterBtn = document.getElementById('type-filter-btn');
  const typeFilterDropdown = document.getElementById('type-filter-dropdown');
  const headerScanBtn = document.getElementById('header-scan-btn');
  const headerAddDeviceBtn = document.getElementById('header-add-device-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const gridView = document.getElementById('grid-view');
  const listView = document.getElementById('list-view');
  
  // User menu elements - UPDATED
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('userDropdown');
  const profileBtn = document.getElementById('profile-btn');
  const loginDropdownBtn = document.getElementById('login-dropdown-btn');
  const registerDropdownBtn = document.getElementById('register-dropdown-btn');
  const logoutDropdownBtn = document.getElementById('logout-dropdown-btn');
  
  // Auth elements
  const loginModal = document.getElementById('login-modal');
  const registerModal = document.getElementById('register-modal');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  // Modal switches
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');
  const forgotPassword = document.getElementById('forgot-password');
  
  // ========================================
  // GLOBAL VARIABLES
  // ========================================
  
  let currentUser = null;
  let isLoggedIn = false;
  
  // ========================================
  // INITIALIZATION
  // ========================================
  
  initHeaderFunctionality();
  initAuthSystem();
  initUserMenu();
  loadUserState();
  
  /**
   * Initialize header functionality - ENHANCED WITH BETTER ADD BUTTON HANDLING
   */
  function initHeaderFunctionality() {
    console.log('Inicjalizacja funkcjonalności headera...');
    
    // Search functionality
    if (headerSearch) {
      headerSearch.addEventListener('input', function() {
        const searchValue = this.value;
        const sidebarFilter = document.getElementById('sidebar-filter-name');
        if (sidebarFilter) {
          sidebarFilter.value = searchValue;
          sidebarFilter.dispatchEvent(new Event('input'));
        }
        
        // Also filter scan results if they are visible
        const devicesGrid = document.getElementById('devicesGrid');
        const scanResultsContainer = document.getElementById('scan-results-container');
        
        // Check if either devices grid or scan results container has devices
        const devicesGridHasDevices = devicesGrid && devicesGrid.querySelectorAll('.device-terminal-card').length > 0;
        const scanResultsVisible = scanResultsContainer && scanResultsContainer.closest('#scan-results-section') && 
                                  scanResultsContainer.closest('#scan-results-section').style.display !== 'none';
        
        if (devicesGridHasDevices || scanResultsVisible) {
          filterScanResultsFromHeader(searchValue);
        }
      });
    }
    
    // Type filter dropdown
    if (typeFilterBtn && typeFilterDropdown) {
      typeFilterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        typeFilterDropdown.classList.toggle('show');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function() {
        typeFilterDropdown.classList.remove('show');
      });
      
      // Handle dropdown item clicks
      typeFilterDropdown.addEventListener('click', function(e) {
        if (e.target.classList.contains('dropdown-item')) {
          const selectedType = e.target.dataset.type;
          const selectedText = e.target.textContent;
          
          // Update button text
          const buttonText = typeFilterBtn.querySelector('span');
          if (buttonText) {
            buttonText.textContent = selectedText;
          }
          
          // Update sidebar filter
          const sidebarTypeFilter = document.getElementById('sidebar-filter-type');
          if (sidebarTypeFilter) {
            sidebarTypeFilter.value = selectedType;
            sidebarTypeFilter.dispatchEvent(new Event('change'));
          }
          
          // Close dropdown
          typeFilterDropdown.classList.remove('show');
        }
      });
    }
    
    // Header scan button
    if (headerScanBtn) {
      headerScanBtn.addEventListener('click', function() {
        // Don't do anything if already scanning
        if (headerScanBtn.disabled || headerScanBtn.querySelector('.fa-spinner')) {
          return;
        }
        
        // Add spinning animation
        const originalContent = headerScanBtn.innerHTML;
        headerScanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Scanning...</span>';
        headerScanBtn.disabled = true;
        headerScanBtn.style.opacity = "0.7";
        headerScanBtn.classList.add('scanning');
        
        // Store original content for main.js to restore
        headerScanBtn.dataset.originalContent = originalContent;
        
        const scanForm = document.getElementById('scan-form');
        if (scanForm) {
          scanForm.dispatchEvent(new Event('submit'));
        } else {
          // Reset immediately if no scan form found
          setTimeout(() => {
            headerScanBtn.innerHTML = originalContent;
            headerScanBtn.disabled = false;
            headerScanBtn.style.opacity = "1";
            headerScanBtn.classList.remove('scanning');
            delete headerScanBtn.dataset.originalContent;
          }, 1000);
        }
      });
    }
    
    // Header add device button - COMPLETELY REWRITTEN WITH BETTER ERROR HANDLING
    if (headerAddDeviceBtn) {
      console.log('ADD button found, attaching event listener...');
      
      headerAddDeviceBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('ADD button clicked - starting process...');
        
        // Check if modal exists first
        const manualDeviceModal = document.getElementById('add-manual-device-modal');
        if (!manualDeviceModal) {
          console.error('Manual device modal not found in DOM!');
          showToast('Błąd: Formularz dodawania urządzenia nie został znaleziony', 'error', 5000);
          return;
        }
        
        console.log('Manual device modal found:', manualDeviceModal);
        
        // Prevent double clicks
        if (headerAddDeviceBtn.disabled) {
          console.log('Button already disabled, ignoring click');
          return;
        }
        
        // Add visual feedback
        const originalContent = headerAddDeviceBtn.innerHTML;
        headerAddDeviceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading...</span>';
        headerAddDeviceBtn.disabled = true;
        headerAddDeviceBtn.style.opacity = "0.7";
        
        console.log('Button state changed, opening modal...');
        
        // Open the modal immediately - no delay needed
        try {
          // Make sure modal is not already visible
          if (manualDeviceModal.classList.contains('show')) {
            console.log('Modal is already open');
          } else {
            manualDeviceModal.style.display = 'flex';
            manualDeviceModal.classList.add('show');
            console.log('Manual device modal opened successfully');
            showToast('Otwarto formularz ręcznego dodawania urządzenia', 'success', 3000);
            
            // Focus on first input field
            const firstInput = manualDeviceModal.querySelector('input[type="text"]');
            if (firstInput) {
              setTimeout(() => firstInput.focus(), 100);
            }
          }
          
          // Restore button after short delay
          setTimeout(() => {
            headerAddDeviceBtn.innerHTML = originalContent;
            headerAddDeviceBtn.disabled = false;
            headerAddDeviceBtn.style.opacity = "1";
            console.log('Button state restored');
          }, 500);
          
        } catch (error) {
          console.error('Error opening manual device modal:', error);
          showToast('Błąd podczas otwierania formularza: ' + error.message, 'error', 5000);
          
          // Restore button in case of error
          headerAddDeviceBtn.innerHTML = originalContent;
          headerAddDeviceBtn.disabled = false;
          headerAddDeviceBtn.style.opacity = "1";
        }
      });
      
      console.log('ADD button event listener attached successfully');
    } else {
      console.error('Header ADD device button not found! ID: header-add-device-btn');
      
      // Debug: List all buttons in header
      const allButtons = document.querySelectorAll('.header button');
      console.log('All buttons in header:', allButtons);
      allButtons.forEach((btn, index) => {
        console.log(`Button ${index}:`, btn.id, btn.className, btn.textContent);
      });
    }
    
    // Settings button
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() {
        openSettingsModal();
      });
    }
    
    // Theme toggle - ULEPSZONA WERSJA Z OBSŁUGĄ SIDEBARA
    if (themeToggle) {
      // Check for saved theme preference or default to dark
      const currentTheme = localStorage.getItem('theme') || 'dark';
      console.log(`Loading saved theme: ${currentTheme}`);
      applyTheme(currentTheme);
      
      themeToggle.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Theme toggle clicked');
        
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log(`Switching theme from ${currentTheme} to ${newTheme}`);
        
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Sprawdź czy ikona została zmieniona
        const icon = themeToggle.querySelector('i');
        console.log(`Icon classes after toggle: ${icon ? icon.className : 'no icon found'}`);
        
        if (typeof showToast === 'function') {
          showToast(`Przełączono na motyw ${newTheme === 'dark' ? 'ciemny' : 'jasny'}`, 'info', 2000);
        }
      });
      
      // POPRAWKA: Dodatkowa inicjalizacja theme toggle z debug informacjami
      // Sprawdź aktualny motyw i zastosuj go ponownie aby upewnić się że ikona jest prawidłowa
      setTimeout(() => {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        console.log(`Re-applying theme during init: ${currentTheme}`);
        applyTheme(currentTheme);
        console.log(`Theme re-applied: ${currentTheme}`);
      }, 100);
    }
    
    // View toggle
    if (gridView && listView) {
      gridView.addEventListener('click', function() {
        gridView.classList.add('active');
        listView.classList.remove('active');
        // Implement grid view logic here
      });
      
      listView.addEventListener('click', function() {
        listView.classList.add('active');
        gridView.classList.remove('active');
        // Implement list view logic here
      });
    }
    
    // Debug: Check if manual device modal exists after DOM load
    setTimeout(() => {
      const modal = document.getElementById('add-manual-device-modal');
      console.log('Manual device modal check after DOM load:', modal ? 'Found' : 'NOT FOUND');
      if (modal) {
        console.log('Modal display style:', modal.style.display);
        console.log('Modal visibility:', window.getComputedStyle(modal).visibility);
        console.log('Modal z-index:', window.getComputedStyle(modal).zIndex);
      }
    }, 1000);
    
    // Udostępnij funkcję globalnie
    window.applyTheme = applyTheme;
  }
  
  /**
   * Initialize user menu functionality - IMPROVED WITH BETTER DEBUGGING
   */
  function initUserMenu() {
    console.log('Inicjalizacja menu użytkownika...');
    
    // Debug: Check if all user menu elements exist
    console.log('User menu elements check:');
    console.log('- userMenuBtn:', userMenuBtn ? 'Found' : 'NOT FOUND');
    console.log('- userDropdown:', userDropdown ? 'Found' : 'NOT FOUND');
    console.log('- profileBtn:', profileBtn ? 'Found' : 'NOT FOUND');
    console.log('- loginDropdownBtn:', loginDropdownBtn ? 'Found' : 'NOT FOUND');
    console.log('- registerDropdownBtn:', registerDropdownBtn ? 'Found' : 'NOT FOUND');
    console.log('- logoutDropdownBtn:', logoutDropdownBtn ? 'Found' : 'NOT FOUND');
    
    // User menu button click - always show dropdown
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('User menu button clicked');
        
        // Toggle dropdown visibility
        const isVisible = userDropdown.classList.contains('show');
        console.log('Dropdown currently visible:', isVisible);
        
        // Hide all other dropdowns first
        document.querySelectorAll('.user-dropdown.show').forEach(dropdown => {
          if (dropdown !== userDropdown) {
            dropdown.classList.remove('show');
          }
        });
        
        // Toggle current dropdown
        if (isVisible) {
          userDropdown.classList.remove('show');
          console.log('Dropdown hidden');
        } else {
          userDropdown.classList.add('show');
          updateUserMenuItems();
          console.log('Dropdown shown');
          
          // Debug: Check dropdown styles after showing
          setTimeout(() => {
            const styles = window.getComputedStyle(userDropdown);
            console.log('Dropdown styles after show:');
            console.log('- display:', styles.display);
            console.log('- opacity:', styles.opacity);
            console.log('- transform:', styles.transform);
            console.log('- z-index:', styles.zIndex);
            console.log('- position:', styles.position);
            console.log('- top:', styles.top);
            console.log('- right:', styles.right);
          }, 100);
        }
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          if (userDropdown.classList.contains('show')) {
            userDropdown.classList.remove('show');
            console.log('User dropdown closed by outside click');
          }
        }
      });
      
      // Profile button
      if (profileBtn) {
        profileBtn.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('Profile button clicked');
          userDropdown.classList.remove('show');
          showProfile();
        });
      }
      
      // Login dropdown button
      if (loginDropdownBtn) {
        loginDropdownBtn.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('Login dropdown button clicked');
          userDropdown.classList.remove('show');
          if (isLoggedIn) {
            showToast('Jesteś już zalogowany', 'info', 3000);
          } else {
            showModal(loginModal);
          }
        });
      }
      
      // Register dropdown button
      if (registerDropdownBtn) {
        registerDropdownBtn.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('Register dropdown button clicked');
          userDropdown.classList.remove('show');
          if (isLoggedIn) {
            showToast('Jesteś już zalogowany', 'info', 3000);
          } else {
            showModal(registerModal);
          }
        });
      }
      
      // Logout dropdown button
      if (logoutDropdownBtn) {
        logoutDropdownBtn.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('Logout dropdown button clicked');
          userDropdown.classList.remove('show');
          if (isLoggedIn) {
            handleLogout();
          } else {
            showToast('Nie jesteś zalogowany', 'warning', 3000);
          }
        });
      }
      
      console.log('User menu initialized successfully');
    } else {
      console.error('User menu elements not found!');
      console.error('userMenuBtn:', userMenuBtn);
      console.error('userDropdown:', userDropdown);
    }
  }
  
  /**
   * Update user menu items based on login state - IMPROVED WITH DEBUGGING
   */
  function updateUserMenuItems() {
    console.log('Updating user menu items, isLoggedIn:', isLoggedIn);
    
    if (!profileBtn || !loginDropdownBtn || !registerDropdownBtn || !logoutDropdownBtn) {
      console.error('Some user menu items not found for update');
      return;
    }
    
    if (isLoggedIn) {
      // User is logged in
      profileBtn.style.display = 'block';
      profileBtn.style.opacity = '1';
      
      loginDropdownBtn.style.display = 'none';
      registerDropdownBtn.style.display = 'none';
      
      logoutDropdownBtn.style.display = 'block';
      logoutDropdownBtn.style.opacity = '1';
      
      // Update profile button text with user name
      if (currentUser && currentUser.name) {
        const profileSpan = profileBtn.querySelector('span');
        if (profileSpan) {
          profileSpan.textContent = `> ${currentUser.name}.profile`;
        }
      }
      
      console.log('User menu updated for logged in user:', currentUser?.name);
    } else {
      // User is not logged in
      profileBtn.style.display = 'none';
      
      loginDropdownBtn.style.display = 'block';
      loginDropdownBtn.style.opacity = '1';
      
      registerDropdownBtn.style.display = 'block';
      registerDropdownBtn.style.opacity = '1';
      
      logoutDropdownBtn.style.display = 'none';
      
      console.log('User menu updated for logged out state');
    }
    
    console.log(`User menu updated for ${isLoggedIn ? 'logged in' : 'logged out'} state`);
  }
  
  /**
   * Show profile information - NEW
   */
  function showProfile() {
    if (!isLoggedIn || !currentUser) {
      showToast('Musisz być zalogowany, aby zobaczyć profil', 'warning', 3000);
      return;
    }
    
    // Create a simple profile modal or use toast for now
    const profileInfo = `
      <strong>Profil użytkownika:</strong><br>
      Nazwa: ${currentUser.name}<br>
      Email: ${currentUser.email}<br>
      ID: ${currentUser.id}
    `;
    
    // For now, show as toast - later can be replaced with proper modal
    showToast('Funkcja profilu w przygotowaniu. ' + profileInfo.replace(/<[^>]*>/g, ' '), 'info', 6000);
    console.log('Profile requested:', currentUser);
  }
  
  /**
   * Initialize authentication system
   */
  function initAuthSystem() {
    console.log('Inicjalizacja systemu autoryzacji...');
    
    // Modal switches
    if (switchToRegister) {
      switchToRegister.addEventListener('click', function(e) {
        e.preventDefault();
        hideModal(loginModal);
        setTimeout(() => showModal(registerModal), 200);
      });
    }
    
    if (switchToLogin) {
      switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        hideModal(registerModal);
        setTimeout(() => showModal(loginModal), 200);
      });
    }
    
    // Forgot password
    if (forgotPassword) {
      forgotPassword.addEventListener('click', function(e) {
        e.preventDefault();
        handleForgotPassword();
      });
    }
    
    // Form submissions
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }
    
    // Close modals when clicking outside or on close button
    setupModalCloseHandlers();
  }
  
  // ========================================
  // THEME MANAGEMENT - ULEPSZONA WERSJA Z OBSŁUGĄ SIDEBARA
  // ========================================
  
  /**
   * Apply theme to the application - ULEPSZONA WERSJA Z OBSŁUGĄ SIDEBARA
   * @param {string} theme - Theme name (dark/light)
   */
  function applyTheme(theme) {
    console.log(`Applying theme: ${theme}`);
    
    // Set theme attribute on body - to automatically applies to ALL elements including sidebar
    document.body.setAttribute('data-theme', theme);
    
    // Log theme application to sidebar specifically
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      console.log(`Theme ${theme} applied to sidebar - checking sidebar styles...`);
      
      // Log computed styles for verification
      setTimeout(() => {
        const sidebarStyles = window.getComputedStyle(sidebar);
        const backgroundColor = sidebarStyles.backgroundColor;
        const borderColor = sidebarStyles.borderRightColor;
        console.log(`Sidebar background: ${backgroundColor}, border: ${borderColor}`);
      }, 100);
    } else {
      console.warn('Sidebar element not found - theme may not apply to sidebar');
    }
    
    // Get theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
      console.log(`Current button HTML before change: ${themeToggle.innerHTML}`);
      
      // NOWE PODEJŚCIE: Bezpośrednie ustawienie innerHTML
      if (theme === 'dark') {
        // W dark mode pokazuj ikonę słońca (żeby przełączyć na light)
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        themeToggle.title = 'Switch to Light Mode';
        console.log('Dark theme: Set sun icon via innerHTML');
      } else {
        // W light mode pokazuj ikonę księżyca (żeby przełączyć na dark)
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.title = 'Switch to Dark Mode';
        console.log('Light theme: Set moon icon via innerHTML');
      }
      
      console.log(`Button HTML after change: ${themeToggle.innerHTML}`);
    } else {
      console.error('Theme toggle button not found');
    }
    
    // Update any other theme-dependent elements
    updateThemeDependentElements(theme);
    
    // Dispatch custom event for other components that might need to know about theme change
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: theme }
    }));
    
    console.log(`Theme ${theme} applied successfully to entire application`);
  }

  /**
   * Update other elements that depend on theme - ROZSZERZONA WERSJA
   * @param {string} theme - Current theme
   */
  function updateThemeDependentElements(theme) {
    // Update CSS custom properties if needed
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.style.setProperty('--theme-bg', '#1e1e1e');
      root.style.setProperty('--theme-text', '#e0e0e0');
      root.style.setProperty('--theme-border', '#444');
      root.style.setProperty('--theme-sidebar-bg', '#000000');
      root.style.setProperty('--theme-sidebar-text', '#4ade80');
    } else {
      root.style.setProperty('--theme-bg', '#ffffff');
      root.style.setProperty('--theme-text', '#212529');
      root.style.setProperty('--theme-border', '#dee2e6');
      root.style.setProperty('--theme-sidebar-bg', '#ffffff');
      root.style.setProperty('--theme-sidebar-text', '#059669');
    }
    
    // Update any special elements that might need manual theme updates
    const specialElements = document.querySelectorAll('.needs-theme-update');
    specialElements.forEach(element => {
      element.classList.remove('theme-dark', 'theme-light');
      element.classList.add(`theme-${theme}`);
    });
    
    console.log(`Theme-dependent elements updated for ${theme} mode`);
  }
  
  // ========================================
  // SETTINGS MODAL
  // ========================================
  
  /**
   * Open settings modal
   */
  function openSettingsModal() {
    // Create settings modal if it doesn't exist
    let settingsModal = document.getElementById('settings-modal');
    
    if (!settingsModal) {
      settingsModal = document.createElement('div');
      settingsModal.id = 'settings-modal';
      settingsModal.className = 'modal';
      settingsModal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
          <span class="close-modal">&times;</span>
          <h2><i class="fas fa-cog"></i> Ustawienia</h2>
          
          <div class="settings-section">
            <h3>Wygląd</h3>
            <div class="setting-item">
              <label>Motyw:</label>
              <select id="theme-selector">
                <option value="dark">Ciemny</option>
                <option value="light">Jasny</option>
              </select>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Bluetooth</h3>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="auto-connect" checked>
                Automatyczne łączenie z ostatnim urządzeniem
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="show-notifications" checked>
                Pokazuj powiadomienia o połączeniach
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Zaawansowane</h3>
            <div class="setting-item">
              <label>Timeout skanowania (sekundy):</label>
              <input type="number" id="scan-timeout" value="20" min="5" max="60">
            </div>
            <div class="setting-item">
              <label>
                <input type="checkbox" id="debug-mode">
                Tryb debugowania
              </label>
            </div>
          </div>
          
          <div class="form-actions" style="margin-top: 20px;">
            <button type="button" class="btn btn-primary" id="save-settings">Zapisz ustawienia</button>
            <button type="button" class="btn btn-outline" id="reset-settings">Przywróć domyślne</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(settingsModal);
      
      // Add styles for settings modal
      if (!document.getElementById('settings-modal-styles')) {
        const settingsStyle = document.createElement('style');
        settingsStyle.id = 'settings-modal-styles';
        settingsStyle.textContent = `
          .settings-section {
            margin-bottom: 25px;
            padding: 15px;
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          [data-theme="light"] .settings-section {
            background-color: rgba(0, 0, 0, 0.03);
            border-color: rgba(0, 0, 0, 0.1);
          }
          
          .settings-section h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #3498db;
            font-size: 16px;
          }
          
          [data-theme="light"] .settings-section h3 {
            color: #1d4ed8;
          }
          
          .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding: 8px 0;
          }
          
          .setting-item:last-child {
            margin-bottom: 0;
          }
          
          .setting-item label {
            color: #e0e0e0;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          [data-theme="light"] .setting-item label {
            color: #374151;
          }
          
          .setting-item input[type="checkbox"] {
            margin: 0;
          }
          
          .setting-item select,
          .setting-item input[type="number"] {
            background-color: #2c2c2c;
            border: 1px solid #444;
            color: #e0e0e0;
            padding: 6px 10px;
            border-radius: 4px;
            min-width: 120px;
          }
          
          [data-theme="light"] .setting-item select,
          [data-theme="light"] .setting-item input[type="number"] {
            background-color: #f9fafb;
            border-color: #d1d5db;
            color: #374151;
          }
          
          .setting-item select:focus,
          .setting-item input[type="number"]:focus {
            border-color: #3498db;
            outline: none;
          }
          
          [data-theme="light"] .setting-item select:focus,
          [data-theme="light"] .setting-item input[type="number"]:focus {
            border-color: #1d4ed8;
          }
        `;
        document.head.appendChild(settingsStyle);
      }
      
      // Setup modal handlers
      const closeBtn = settingsModal.querySelector('.close-modal');
      closeBtn.addEventListener('click', () => settingsModal.style.display = 'none');
      
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
      });
      
      // Load current settings
      const themeSelector = settingsModal.querySelector('#theme-selector');
      themeSelector.value = localStorage.getItem('theme') || 'dark';
      
      // Theme selector change handler
      themeSelector.addEventListener('change', function() {
        const newTheme = this.value;
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        console.log(`Theme changed via settings to: ${newTheme}`);
      });
      
      // Save settings handler
      const saveBtn = settingsModal.querySelector('#save-settings');
      saveBtn.addEventListener('click', () => {
        const selectedTheme = themeSelector.value;
        const autoConnect = settingsModal.querySelector('#auto-connect').checked;
        const showNotifications = settingsModal.querySelector('#show-notifications').checked;
        const scanTimeout = settingsModal.querySelector('#scan-timeout').value;
        const debugMode = settingsModal.querySelector('#debug-mode').checked;
        
        // Save to localStorage
        localStorage.setItem('theme', selectedTheme);
        localStorage.setItem('autoConnect', autoConnect);
        localStorage.setItem('showNotifications', showNotifications);
        localStorage.setItem('scanTimeout', scanTimeout);
        localStorage.setItem('debugMode', debugMode);
        
        // Apply theme
        applyTheme(selectedTheme);
        
        showToast('Ustawienia zostały zapisane', 'success', 3000);
        settingsModal.style.display = 'none';
      });
      
      // Reset settings handler
      const resetBtn = settingsModal.querySelector('#reset-settings');
      resetBtn.addEventListener('click', () => {
        if (confirm('Czy na pewno chcesz przywrócić domyślne ustawienia?')) {
          localStorage.removeItem('theme');
          localStorage.removeItem('autoConnect');
          localStorage.removeItem('showNotifications');
          localStorage.removeItem('scanTimeout');
          localStorage.removeItem('debugMode');
          
          // Reset form
          themeSelector.value = 'dark';
          settingsModal.querySelector('#auto-connect').checked = true;
          settingsModal.querySelector('#show-notifications').checked = true;
          settingsModal.querySelector('#scan-timeout').value = '20';
          settingsModal.querySelector('#debug-mode').checked = false;
          
          applyTheme('dark');
          showToast('Przywrócono domyślne ustawienia', 'info', 3000);
        }
      });
    }
    
    settingsModal.style.display = 'block';
  }
  
  // ========================================
  // AUTHENTICATION FUNCTIONS
  // ========================================
  
  /**
   * Handle login form submission
   * @param {Event} e - Form submit event
   */
  function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Validation
    if (!email || !password) {
      showToast('Proszę wypełnić wszystkie pola', 'error', 3000);
      return;
    }
    
    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock authentication
      const mockUser = {
        id: 1,
        name: 'Jan Kowalski',
        email: email,
        avatar: null
      };
      
      if (authenticateUser(email, password)) {
        loginSuccess(mockUser, rememberMe);
        hideModal(loginModal);
        showToast('Pomyślnie zalogowano!', 'success', 3000);
      } else {
        showToast('Nieprawidłowy email lub hasło', 'error', 3000);
      }
      
      setButtonLoading(submitBtn, false);
    }, 1500);
  }
  
  /**
   * Handle register form submission
   * @param {Event} e - Form submit event
   */
  function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const acceptTerms = document.getElementById('accept-terms').checked;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showToast('Proszę wypełnić wszystkie pola', 'error', 3000);
      return;
    }
    
    if (password !== confirmPassword) {
      showToast('Hasła nie są identyczne', 'error', 3000);
      return;
    }
    
    if (password.length < 6) {
      showToast('Hasło musi mieć co najmniej 6 znaków', 'error', 3000);
      return;
    }
    
    if (!acceptTerms) {
      showToast('Musisz zaakceptować regulamin', 'error', 3000);
      return;
    }
    
    // Show loading state
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock registration
      const mockUser = {
        id: Date.now(),
        name: name,
        email: email,
        avatar: null
      };
      
      // Save user to localStorage (mock database)
      saveUserToStorage(mockUser, password);
      
      // Auto login after registration
      loginSuccess(mockUser, false);
      hideModal(registerModal);
      showToast('Konto zostało utworzone pomyślnie!', 'success', 3000);
      
      setButtonLoading(submitBtn, false);
    }, 2000);
  }
  
  /**
   * Mock authentication function
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {boolean} - Authentication result
   */
  function authenticateUser(email, password) {
    // Mock authentication logic
    const users = JSON.parse(localStorage.getItem('btm_users') || '[]');
    const user = users.find(u => u.email === email);
    
    if (user) {
      // In real app, you'd hash and compare passwords
      return user.password === password;
    }
    
    // Default test account
    return email === 'admin@example.com' && password === 'admin123';
  }
  
  /**
   * Handle successful login - UPDATED
   * @param {Object} user - User object
   * @param {boolean} rememberMe - Whether to remember the user
   */
  function loginSuccess(user, rememberMe) {
    currentUser = user;
    isLoggedIn = true;
    
    // Save to storage
    if (rememberMe) {
      localStorage.setItem('btm_current_user', JSON.stringify(user));
      localStorage.setItem('btm_remember_me', 'true');
    } else {
      sessionStorage.setItem('btm_current_user', JSON.stringify(user));
    }
    
    updateAuthUI();
    resetAuthForms();
    
    console.log('User logged in successfully:', user);
  }
  
  /**
   * Handle logout - UPDATED
   */
  function handleLogout() {
    const userName = currentUser ? currentUser.name : 'Użytkownik';
    
    currentUser = null;
    isLoggedIn = false;
    
    // Clear storage
    localStorage.removeItem('btm_current_user');
    localStorage.removeItem('btm_remember_me');
    sessionStorage.removeItem('btm_current_user');
    
    updateAuthUI();
    showToast(`${userName} został wylogowany`, 'info', 2000);
    
    console.log('User logged out successfully');
  }
  
  /**
   * Load user state from storage
   */
  function loadUserState() {
    // Check localStorage first (remember me)
    let userData = localStorage.getItem('btm_current_user');
    if (!userData) {
      // Check sessionStorage
      userData = sessionStorage.getItem('btm_current_user');
    }
    
    if (userData) {
      try {
        currentUser = JSON.parse(userData);
        isLoggedIn = true;
        updateAuthUI();
        console.log('User state loaded:', currentUser);
      } catch (e) {
        console.error('Error loading user state:', e);
      }
    }
  }
  
  /**
   * Save user to storage (mock database)
   * @param {Object} user - User object
   * @param {string} password - User password
   */
  function saveUserToStorage(user, password) {
    const users = JSON.parse(localStorage.getItem('btm_users') || '[]');
    users.push({
      ...user,
      password: password, // In real app, this would be hashed
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('btm_users', JSON.stringify(users));
  }
  
  /**
   * Update authentication UI based on login state - UPDATED
   */
  function updateAuthUI() {
    // Update user menu items
    updateUserMenuItems();
    
    // Update user menu button appearance
    if (userMenuBtn) {
      if (isLoggedIn && currentUser) {
        userMenuBtn.title = `Zalogowany jako: ${currentUser.name}`;
        userMenuBtn.style.color = 'var(--cyberpunk-green)';
      } else {
        userMenuBtn.title = 'Menu użytkownika';
        userMenuBtn.style.color = '';
      }
    }
    
    console.log(`Auth UI updated for ${isLoggedIn ? 'logged in' : 'logged out'} state`);
  }
  
  /**
   * Handle forgot password
   */
  function handleForgotPassword() {
    const email = prompt('Wprowadź adres email, na który wyślemy link do resetowania hasła:');
    
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Proszę wprowadzić prawidłowy adres email', 'error', 3000);
        return;
      }
      
      // Mock sending reset email
      showToast('Link do resetowania hasła został wysłany na adres ' + email, 'success', 5000);
      hideModal(loginModal);
    }
  }
  
  // ========================================
  // MODAL MANAGEMENT
  // ========================================
  
  /**
   * Show modal with animation
   * @param {HTMLElement} modal - Modal element to show
   */
  function showModal(modal) {
    if (modal) {
      modal.style.display = 'block';
      // Trigger animation
      setTimeout(() => {
        modal.classList.add('show');
      }, 10);
    }
  }
  
  /**
   * Hide modal with animation
   * @param {HTMLElement} modal - Modal element to hide
   */
  function hideModal(modal) {
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
  }
  
  /**
   * Setup modal close handlers
   */
  function setupModalCloseHandlers() {
    const modals = [loginModal, registerModal];
    
    modals.forEach(modal => {
      if (modal) {
        // Close button
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => hideModal(modal));
        }
        
        // Click outside modal
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            hideModal(modal);
          }
        });
        
        // ESC key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.style.display === 'block') {
            hideModal(modal);
          }
        });
      }
    });
  }
  
  /**
   * Reset authentication forms
   */
  function resetAuthForms() {
    if (loginForm) {
      loginForm.reset();
    }
    if (registerForm) {
      registerForm.reset();
    }
  }
  
  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  
  /**
   * Set button loading state
   * @param {HTMLElement} button - Button element
   * @param {boolean} loading - Loading state
   */
  function setButtonLoading(button, loading) {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
      button.dataset.originalText = button.textContent;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  }
  
  /**
   * Show toast notification
   * @param {string} message - Message to show
   * @param {string} type - Toast type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  function showToast(message, type = 'success', duration = 4000) {
    console.log(`Showing toast: ${message} (${type})`);
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = createToastContainer();
    }
    
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
    
    // Add to container at the top (newest first)
    toastContainer.insertBefore(toast, toastContainer.firstChild);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => hideToast(toast));
    
    // Show with animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // Auto-hide after duration
    setTimeout(() => hideToast(toast), duration);
    
    console.log(`Toast displayed successfully`);
  }
  
  /**
   * Create toast container if it doesn't exist
   * @returns {HTMLElement} - Toast container element
   */
  function createToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      
      // Insert at the end of body to ensure proper stacking
      document.body.appendChild(container);
      
      console.log('Created toast container');
    }
    return container;
  }
  
  /**
   * Hide toast notification
   * @param {HTMLElement} toast - Toast element to hide
   */
  function hideToast(toast) {
    if (!toast || !toast.parentNode) return;
    
    toast.classList.add('hiding');
    toast.classList.remove('show');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
  
  // ========================================
  // THEME EVENT LISTENERS
  // ========================================
  
  // Listen for theme changes from other parts of the application
  window.addEventListener('themeChanged', function(e) {
    const theme = e.detail.theme;
    console.log(`Theme change event received: ${theme}`);
    
    // Update theme toggle button if needed
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      if (theme === 'dark') {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        themeToggle.title = 'Switch to Light Mode';
      } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.title = 'Switch to Dark Mode';
      }
    }
  });
  
  // ========================================
  // GLOBAL FUNCTIONS FOR TESTING
  // ========================================
  
  // Make manual device modal opening available globally for testing
  window.testOpenManualDeviceModal = function() {
    const modal = document.getElementById('add-manual-device-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
      console.log('Manual device modal opened via test function');
      return true;
    } else {
      console.error('Manual device modal not found via test function');
      return false;
    }
  };
  
  // Make user dropdown testing available globally
  window.testUserDropdown = function() {
    if (userDropdown) {
      userDropdown.classList.toggle('show');
      updateUserMenuItems();
      console.log('User dropdown toggled via test function');
      return true;
    } else {
      console.error('User dropdown not found via test function');
      return false;
    }
  };
  
  // ========================================
  // SCAN RESULTS FILTERING
  // ========================================
  
  /**
   * Filter scan results from header search
   * @param {string} searchValue - Search query from header input
   */
  function filterScanResultsFromHeader(searchValue) {
    // Try both possible containers for device results
    const devicesGrid = document.getElementById('devicesGrid');
    const scanResultsContainer = document.getElementById('scan-results-container');
    
    const filterValue = searchValue.toLowerCase();
    let visibleCount = 0;
    let totalCount = 0;
    let containerUsed = null;
    
    // Check devicesGrid first (terminal interface)
    if (devicesGrid) {
      const deviceCards = devicesGrid.querySelectorAll('.device-terminal-card');
      totalCount = deviceCards.length;
      
      if (totalCount > 0) {
        containerUsed = devicesGrid;
        
        deviceCards.forEach(device => {
        // Extract device name and address from the onclick attribute or data attributes
        const onclickAttr = device.getAttribute('onclick');
        let deviceName = '';
        let deviceAddress = '';
        
        if (onclickAttr) {
          // Extract from onclick="showDeviceModal('address', 'name')"
          const matches = onclickAttr.match(/showDeviceModal\('([^']+)',\s*'([^']+)'\)/);
          if (matches) {
            deviceAddress = matches[1].toLowerCase();
            deviceName = matches[2].toLowerCase();
          }
        }
        
        // Also try to get name and address from the card content
        const nameElement = device.querySelector('.device-terminal-info h3');
        const addressElement = device.querySelector('.device-address');
        
        if (nameElement && !deviceName) {
          deviceName = nameElement.textContent.toLowerCase();
        }
        
        if (addressElement && !deviceAddress) {
          deviceAddress = addressElement.textContent.toLowerCase();
        }
        
        const shouldShow = deviceName.includes(filterValue) || deviceAddress.includes(filterValue);
        device.style.display = shouldShow ? 'block' : 'none';
        
        if (shouldShow) visibleCount++;
        });
        
        // Handle no results message for devicesGrid
        handleNoResultsMessage(devicesGrid, visibleCount, totalCount);
      }
    } 
    // Fallback to scan-results-container (if it exists)
    else if (scanResultsContainer && scanResultsContainer.style.display !== 'none') {
      const deviceItems = scanResultsContainer.querySelectorAll('.scan-device-item');
      totalCount = deviceItems.length;
      containerUsed = scanResultsContainer;
      
      deviceItems.forEach(device => {
        const deviceNameEl = device.querySelector('.scan-device-name');
        const deviceAddressEl = device.querySelector('.scan-device-address');
        
        if (deviceNameEl && deviceAddressEl) {
          const deviceName = deviceNameEl.textContent.toLowerCase();
          const deviceAddress = deviceAddressEl.textContent.toLowerCase();
          
          const shouldShow = deviceName.includes(filterValue) || deviceAddress.includes(filterValue);
          device.style.display = shouldShow ? 'flex' : 'none';
          
          if (shouldShow) visibleCount++;
        }
      });
      
      // Handle no results message for scanResultsContainer
      handleNoResultsMessage(scanResultsContainer, visibleCount, totalCount);
    }
    
    console.log(`Header search filtered ${containerUsed ? containerUsed.id : 'no container'}: ${visibleCount} visible out of ${totalCount} total`);
  }
  
  /**
   * Handle no results message for device containers
   * @param {HTMLElement} container - Container element
   * @param {number} visibleCount - Number of visible items
   * @param {number} totalCount - Total number of items
   */
  function handleNoResultsMessage(container, visibleCount, totalCount) {
    const existingNoResultsMsg = container.querySelector('.no-filter-results');
    
    if (visibleCount === 0 && totalCount > 0) {
      if (!existingNoResultsMsg) {
        const noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'no-filter-results empty-terminal-state';
        noResultsMsg.innerHTML = `
          <div class="empty-terminal-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <h3>NO_DEVICES_MATCH_FILTER</h3>
          <p>ADJUST_SEARCH_PARAMETERS</p>
        `;
        container.appendChild(noResultsMsg);
      }
    } else {
      if (existingNoResultsMsg) {
        existingNoResultsMsg.remove();
      }
    }
  }
  
  // ========================================
  // GLOBAL EXPORTS
  // ========================================
  
  // Make functions available globally
  window.headerFunctions = {
    showToast,
    showModal,
    hideModal,
    getCurrentUser: () => currentUser,
    isUserLoggedIn: () => isLoggedIn,
    logout: handleLogout,
    applyTheme: applyTheme,
    updateUserMenuItems,
    testOpenManualDeviceModal: window.testOpenManualDeviceModal,
    testUserDropdown: window.testUserDropdown,
    filterScanResultsFromHeader,
    handleNoResultsMessage
  };
  
  console.log('Header functionality initialized successfully');
});