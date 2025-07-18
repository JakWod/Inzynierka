/**
 * Header Functionality for Bluetooth Manager
 * Handles header interactions, authentication modals, and user management
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
  
  // Auth elements
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
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
  loadUserState();
  
  /**
   * Initialize header functionality
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
        const scanForm = document.getElementById('scan-form');
        if (scanForm) {
          scanForm.dispatchEvent(new Event('submit'));
        }
      });
    }
    
    // Header add device button
    if (headerAddDeviceBtn) {
      headerAddDeviceBtn.addEventListener('click', function() {
        const manualDeviceModal = document.getElementById('add-manual-device-modal');
        if (manualDeviceModal) {
          manualDeviceModal.style.display = 'block';
        }
      });
    }
    
    // Settings button
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function() {
        openSettingsModal();
      });
    }
    
    // Theme toggle
    if (themeToggle) {
      // Check for saved theme preference or default to dark
      const currentTheme = localStorage.getItem('theme') || 'dark';
      applyTheme(currentTheme);
      
      themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        
        showToast(`Przełączono na motyw ${newTheme === 'dark' ? 'ciemny' : 'jasny'}`, 'info', 2000);
      });
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
  }
  
  /**
   * Initialize authentication system
   */
  function initAuthSystem() {
    console.log('Inicjalizacja systemu autoryzacji...');
    
    // Login button click
    if (loginBtn) {
      loginBtn.addEventListener('click', function() {
        if (isLoggedIn) {
          // If logged in, show user menu or logout
          showUserMenu();
        } else {
          // If not logged in, show login modal
          showModal(loginModal);
        }
      });
    }
    
    // Register button click
    if (registerBtn) {
      registerBtn.addEventListener('click', function() {
        if (isLoggedIn) {
          // Hide register button when logged in
          return;
        } else {
          // Show register modal
          showModal(registerModal);
        }
      });
    }
    
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
  // THEME MANAGEMENT
  // ========================================
  
  /**
   * Apply theme to the application
   * @param {string} theme - Theme name (dark/light)
   */
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const themeIcon = themeToggle?.querySelector('i');
    
    if (themeIcon) {
      if (theme === 'light') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
      } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
      }
    }
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
          
          .settings-section h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #3498db;
            font-size: 16px;
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
          
          .setting-item select:focus,
          .setting-item input[type="number"]:focus {
            border-color: #3498db;
            outline: none;
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
   * Handle successful login
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
  }
  
  /**
   * Handle logout
   */
  function handleLogout() {
    currentUser = null;
    isLoggedIn = false;
    
    // Clear storage
    localStorage.removeItem('btm_current_user');
    localStorage.removeItem('btm_remember_me');
    sessionStorage.removeItem('btm_current_user');
    
    updateAuthUI();
    showToast('Wylogowano pomyślnie', 'info', 2000);
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
   * Update authentication UI based on login state
   */
  function updateAuthUI() {
    if (isLoggedIn && currentUser) {
      // Update login button to show user info
      if (loginBtn) {
        loginBtn.innerHTML = `
          <i class="fas fa-user"></i>
          <span>${currentUser.name}</span>
        `;
        loginBtn.title = 'Kliknij aby otworzyć menu użytkownika';
      }
      
      // Hide register button or change to logout
      if (registerBtn) {
        registerBtn.innerHTML = `
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        `;
        registerBtn.title = 'Wyloguj się';
        registerBtn.removeEventListener('click', registerBtn._originalHandler);
        registerBtn.addEventListener('click', handleLogout);
      }
    } else {
      // Reset to original state
      if (loginBtn) {
        loginBtn.innerHTML = `
          <i class="fas fa-sign-in-alt"></i>
          <span>Login</span>
        `;
        loginBtn.title = 'Zaloguj się';
      }
      
      if (registerBtn) {
        registerBtn.innerHTML = `
          <i class="fas fa-user-plus"></i>
          <span>Register</span>
        `;
        registerBtn.title = 'Zarejestruj się';
      }
    }
  }
  
  /**
   * Show user menu when logged in
   */
  function showUserMenu() {
    // Create user menu dropdown
    const existingMenu = document.getElementById('user-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    const userMenu = document.createElement('div');
    userMenu.id = 'user-menu';
    userMenu.className = 'dropdown-content show';
    userMenu.style.cssText = `
      position: absolute;
      top: 100%;
      right: 0;
      background-color: #2c2c2c;
      border: 1px solid #444;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      min-width: 200px;
      z-index: 1000;
      margin-top: 4px;
    `;
    
    userMenu.innerHTML = `
      <div class="dropdown-item" style="border-bottom: 1px solid #444; padding: 12px;">
        <strong>${currentUser.name}</strong><br>
        <small style="color: #999;">${currentUser.email}</small>
      </div>
      <div class="dropdown-item user-menu-item" data-action="profile">
        <i class="fas fa-user"></i> Profil
      </div>
      <div class="dropdown-item user-menu-item" data-action="settings">
        <i class="fas fa-cog"></i> Ustawienia
      </div>
      <div class="dropdown-item user-menu-item" data-action="logout" style="border-top: 1px solid #444; color: #e74c3c;">
        <i class="fas fa-sign-out-alt"></i> Wyloguj się
      </div>
    `;
    
    // Position menu relative to login button
    loginBtn.style.position = 'relative';
    loginBtn.appendChild(userMenu);
    
    // Handle menu clicks
    userMenu.addEventListener('click', function(e) {
      const action = e.target.closest('.user-menu-item')?.dataset.action;
      
      switch (action) {
        case 'profile':
          showToast('Funkcja profilu w przygotowaniu', 'info', 2000);
          break;
        case 'settings':
          openSettingsModal();
          break;
        case 'logout':
          handleLogout();
          break;
      }
      
      userMenu.remove();
    });
    
    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeUserMenu(e) {
        if (!loginBtn.contains(e.target)) {
          userMenu.remove();
          document.removeEventListener('click', closeUserMenu);
        }
      });
    }, 100);
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
    // Use existing toast function if available
    if (typeof window.showToast === 'function') {
      window.showToast(message, type, duration);
      return;
    }
    
    // Fallback toast implementation
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
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
    
    toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => hideToast(toast));
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => hideToast(toast), duration);
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
      document.body.appendChild(container);
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
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
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
    logout: handleLogout
  };
  
  console.log('Header functionality initialized successfully');
});