// Constants
const AUTH_KEY = 'weatherAuthToken';
const API_BASE_URL = 'https://wx-backend-cf4d.onrender.com/api';

// Simple JWT decoder (handles the payload part)
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Auth Helpers
function getAuthToken() {
    return localStorage.getItem(AUTH_KEY);
}

function getUser() {
    const token = getAuthToken();
    return token ? parseJwt(token) : null;
}

function isLoggedIn() {
    return getAuthToken() !== null;
}

function getRole() {
    const user = getUser();
    return user ? user.role : null;
}

// Set time-based background image
function setTimeBasedBackground() {
    const hour = new Date().getHours();
    const isDaytime = hour > 6 && hour < 20;
    // You can add more complex background logic here if needed
}

// Auth status check function
function checkAuthStatus() {
    const token = getAuthToken();
    const user = getUser();
    const loggedIn = !!user;
    
    const logoutBtn = document.getElementById('logout-item');
    if (logoutBtn) logoutBtn.style.display = loggedIn ? 'block' : 'none';
    
    const loginBtn = document.getElementById('login-item');
    if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : 'block';
    
    const userGreeting = document.getElementById('user-greeting');
    const usernameSpan = document.getElementById('username');
    
    if (userGreeting && usernameSpan && loggedIn) {
        userGreeting.style.display = 'block';
        usernameSpan.textContent = user.name || user.station;
    } else if (userGreeting) {
        userGreeting.style.display = 'none';
    }

    // Role-specific visibility
    document.querySelectorAll('[data-role]').forEach(el => {
        const allowedRoles = el.getAttribute('data-role').split(',');
        el.style.display = (loggedIn && allowedRoles.includes(user.role)) ? 'block' : 'none';
    });
}

// Dynamic Role-Based Navbar Builder
function buildRoleNavbar() {
    const navContainer = document.getElementById('dynamic-nav');
    if (!navContainer) return; // Page doesn't use dynamic nav

    const user = getUser();
    const loggedIn = !!user;
    const role = loggedIn ? user.role : null;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Helper to mark active link
    function isActive(page) {
        if (Array.isArray(page)) return page.includes(currentPage) ? 'active' : '';
        return currentPage === page ? 'active' : '';
    }

    let navHTML = '';

    if (loggedIn) {
        // --- HOME link (role-specific landing) ---
        let homePage = 'index.html';
        if (role === 'station') homePage = 'station-dashboard.html';
        else if (role === 'pilot') homePage = 'pilot-dashboard.html';
        else if (role === 'admin') homePage = 'admin-dashboard.html';

        navHTML += `<li class="nav-item">
            <a href="${homePage}" class="nav-link ${isActive(homePage)}">
                <i class="fas fa-home me-1"></i>Home
            </a>
        </li>`;

        // --- DASHBOARD dropdown ---
        const dashPages = ['station-dashboard.html', 'pilot-dashboard.html', 'admin-dashboard.html'];
        navHTML += `<li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle ${isActive(dashPages)}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-tachometer-alt me-1"></i>Dashboard
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item ${isActive('station-dashboard.html')}" href="station-dashboard.html">
                    <i class="fas fa-broadcast-tower me-2"></i>Station Dashboard
                </a></li>
                <li><a class="dropdown-item ${isActive('pilot-dashboard.html')}" href="pilot-dashboard.html">
                    <i class="fas fa-plane me-2"></i>Pilot/ATC Dashboard
                </a></li>
                ${role === 'admin' ? `<li><hr class="dropdown-divider" style="border-color: rgba(255,255,255,0.15);"></li>
                <li><a class="dropdown-item ${isActive('admin-dashboard.html')}" href="admin-dashboard.html">
                    <i class="fas fa-user-shield me-2"></i>Admin Panel
                </a></li>` : ''}
            </ul>
        </li>`;

        // --- RESOURCES dropdown ---
        const resourcePages = ['learn_metar.html', 'learn_synop.html', 'ref.html', 'learn_taf.html'];
        navHTML += `<li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle ${isActive(resourcePages)}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Resources
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item ${isActive('learn_metar.html')}" href="learn_metar.html">Metar Notes</a></li>
                <li><a class="dropdown-item ${isActive('learn_synop.html')}" href="learn_synop.html">Synop Notes</a></li>
                <li><a class="dropdown-item ${isActive('ref.html')}" href="ref.html">Ref Tables</a></li>
                <li><a class="dropdown-item ${isActive('learn_taf.html')}" href="learn_taf.html">TAF Notes</a></li>
            </ul>
        </li>`;

        // --- FORECASTS dropdown ---
        const forecastPages = ['daily_wx.html', 's_e.html', 'coast.html', 'central.html', 'western.html', 'n_w.html', 'n_e.html'];
        navHTML += `<li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle ${isActive(forecastPages)}" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Forecasts
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item ${isActive('daily_wx.html')}" href="daily_wx.html">Daily WX</a></li>
                <li><a class="dropdown-item ${isActive('s_e.html')}" href="s_e.html">S.E</a></li>
                <li><a class="dropdown-item ${isActive('coast.html')}" href="coast.html">COAST</a></li>
                <li><a class="dropdown-item ${isActive('central.html')}" href="central.html">CENTRAL</a></li>
                <li><a class="dropdown-item ${isActive('western.html')}" href="western.html">WESTERN</a></li>
                <li><a class="dropdown-item ${isActive('n_w.html')}" href="n_w.html">N.W</a></li>
                <li><a class="dropdown-item ${isActive('n_e.html')}" href="n_e.html">N.E</a></li>
            </ul>
        </li>`;

        // --- ABOUT ---
        navHTML += `<li class="nav-item">
            <a href="about.html" class="nav-link ${isActive('about.html')}">About</a>
        </li>`;

        // --- CONTACT ---
        navHTML += `<li class="nav-item">
            <a href="contact.html" class="nav-link ${isActive('contact.html')}">Contact</a>
        </li>`;

        // --- USER GREETING ---
        navHTML += `<li class="nav-item">
            <span class="nav-link" style="color: var(--accent-color, #06f07b) !important; cursor: default;">
                <i class="fas fa-user-circle me-1"></i>${user.name || user.station}
            </span>
        </li>`;

        // --- LOGOUT ---
        navHTML += `<li class="nav-item">
            <a href="#" class="nav-link" id="logout-link" onclick="event.preventDefault(); logoutUser();">
                <i class="fas fa-sign-out-alt me-1"></i>Logout
            </a>
        </li>`;

    } else {
        // --- NOT LOGGED IN: show public nav ---
        navHTML += `<li class="nav-item">
            <a href="index.html" class="nav-link ${isActive('index.html')}">Home</a>
        </li>`;

        navHTML += `<li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Resources
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="learn_metar.html">Metar Notes</a></li>
                <li><a class="dropdown-item" href="learn_synop.html">Synop Notes</a></li>
                <li><a class="dropdown-item" href="ref.html">Ref Tables</a></li>
                <li><a class="dropdown-item" href="learn_taf.html">TAF Notes</a></li>
            </ul>
        </li>`;

        navHTML += `<li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Forecasts
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="daily_wx.html">Daily WX</a></li>
                <li><a class="dropdown-item" href="s_e.html">S.E</a></li>
                <li><a class="dropdown-item" href="coast.html">COAST</a></li>
                <li><a class="dropdown-item" href="central.html">CENTRAL</a></li>
                <li><a class="dropdown-item" href="western.html">WESTERN</a></li>
                <li><a class="dropdown-item" href="n_w.html">N.W</a></li>
                <li><a class="dropdown-item" href="n_e.html">N.E</a></li>
            </ul>
        </li>`;

        navHTML += `<li class="nav-item">
            <a href="about.html" class="nav-link ${isActive('about.html')}">About</a>
        </li>`;

        navHTML += `<li class="nav-item">
            <a href="contact.html" class="nav-link ${isActive('contact.html')}">Contact</a>
        </li>`;

        navHTML += `<li class="nav-item">
            <a href="login.html" class="nav-link ${isActive('login.html')}">Login</a>
        </li>`;
    }

    navContainer.innerHTML = navHTML;
}

// Logout handler
function logoutUser() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'index.html';
}

// Authenticated Fetch Wrapper
async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem(AUTH_KEY);
        window.location.href = 'login.html';
        return;
    }
    
    // Globally handle non-JSON error responses (like 429 Too Many Requests or 502 Bad Gateway)
    // to prevent SyntaxError when callers try to use response.json()
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textError = await response.text();
            throw new Error(`Server Error (${response.status}): ${textError || response.statusText}`);
        }
    }
    
    return response;
}

// Setup login form handler
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const station = document.getElementById('loginStation').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!station || !password) {
            alert('Please select your station and enter password');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ station, password })
            });

            if (!response.ok) {
                let errorMsg = 'Login failed';
                try {
                    const error = await response.json();
                    errorMsg = error.message || errorMsg;
                } catch (e) {
                    // Fallback to text if the server returns non-JSON (like a 429 Too Many Requests text)
                    const textError = await response.text();
                    errorMsg = textError || `HTTP Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            localStorage.setItem(AUTH_KEY, data.token);
            
            // Redirect based on role
            const user = parseJwt(data.token);
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (user.role === 'pilot') {
                window.location.href = 'pilot-dashboard.html';
            } else {
                window.location.href = 'station-dashboard.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Login failed. Please check your credentials.');
        }
    });
}

// Navbar and UI Logic
function setupNavbarLinkHighlighting() {
    const navLinks = document.querySelectorAll('.navbar-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            sessionStorage.setItem('activeNavItem', this.getAttribute('href'));
        });
    });

    const activeItem = sessionStorage.getItem('activeNavItem');
    if (activeItem) {
        navLinks.forEach(link => {
            if (link.getAttribute('href') === activeItem) link.classList.add('active');
        });
    }
}

function setupSubmenus() {
    document.querySelectorAll('.dropdown-submenu a.dropdown-toggle').forEach(function(element) {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const submenu = this.nextElementSibling;
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        });
    });

    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-submenu .dropdown-menu').forEach(function(element) {
            element.style.display = 'none';
        });
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    buildRoleNavbar();
    checkAuthStatus();
    setupNavbarLinkHighlighting();
    setupSubmenus();
    setupLoginForm();

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
});