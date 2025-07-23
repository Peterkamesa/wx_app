// Constants
const AUTH_KEY = 'weatherAuthToken';

// Set time-based background image
function setTimeBasedBackground() {
    const hour = new Date().getHours();
    const isDaytime = hour > 6 && hour < 20;

    document.body.style.backgroundImage = isDaytime
        ? "url('back/day-bg.jpg')"
        : "url('back/night-bg.jpg')";
}

// Auth status check function
function checkAuthStatus() {
    const token = localStorage.getItem(AUTH_KEY);
    const isLoggedIn = token !== null;
    
    // Toggle logout button visibility
    const logoutBtn = document.getElementById('logout-item');
    if (logoutBtn) {
        logoutBtn.style.display = isLoggedIn ? 'block' : 'none';
    }
    
    // Toggle login button visibility
    const loginBtn = document.getElementById('login-item');
    if (loginBtn) {
        loginBtn.style.display = isLoggedIn ? 'none' : 'block';
    }
    
    // Update user greeting if exists
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting && isLoggedIn) {
        try {
            const decoded = jwt.decode(token);
            userGreeting.style.display = 'block';
            document.getElementById('username').textContent = decoded.station;
        } catch (e) {
            console.error('Error decoding token:', e);
        }
    }
}

// Logout handler
function logoutUser() {
    localStorage.removeItem(AUTH_KEY);
    checkAuthStatus();
    window.location.href = 'index.html';
}

// Set active nav link and persist in sessionStorage
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
            link.classList.remove('active');
            if (link.getAttribute('href') === activeItem) {
                link.classList.add('active');
            }
        });
    }
}

// Initialize submenu functionality
function setupSubmenus() {
    document.querySelectorAll('.dropdown-submenu a.dropdown-toggle').forEach(function(element) {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const submenu = this.nextElementSibling;
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Close submenus when clicking elsewhere
    document.addEventListener('click', function() {
        document.querySelectorAll('.dropdown-submenu .dropdown-menu').forEach(function(element) {
            element.style.display = 'none';
        });
    });
}

// Setup login form handler
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const station = document.getElementById('loginStation').value;
        const password = document.getElementById('loginPassword').value;
        
        // Basic validation
        if (!station || !password) {
            alert('Please select your station and enter password');
            return;
        }

        // API Implementation
        fetch('https://wxbackend-production.up.railway.app/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                station: station,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Login failed');
            return response.json();
        })
        .then(data => {
            localStorage.setItem(AUTH_KEY, data.token);
            checkAuthStatus();
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Login error:', error);
            alert('Login failed. Please check your station and password.');
        });
    });
}

// Event handlers on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeBasedBackground();
    checkAuthStatus();
    setupNavbarLinkHighlighting();
    setupSubmenus();
    setupLoginForm();

    // Logout click handler
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logoutUser();
        });
    }
});