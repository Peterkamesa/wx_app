// Constants
const AUTH_KEY = 'weatherAuthToken';
const API_BASE_URL = 'https://wxbackend-production.up.railway.app/api';

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
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
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