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
    
    // Toggle login button visibility (if element exists)
    const loginLink = document.querySelector('.nav-link[href="login.html"]');
    if (loginLink && loginLink.parentElement) {
        loginLink.parentElement.style.display = isLoggedIn ? 'none' : 'block';
    }
    
    // Update user greeting if exists
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting && isLoggedIn) {
        try {
            const decoded = jwt_decode(token); // Requires jwt-decode
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

// Highlight active nav link
function setupNavbarLinkHighlighting() {
    const navLinks = document.querySelectorAll('.nav-link'); // ✅ Matches login.html
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
            if (link.getAttribute('href') === activeItem) {
                link.classList.add('active');
            }
        });
    }
}

// Initialize submenus
function setupSubmenus() {
    document.querySelectorAll('.dropdown-submenu a.dropdown-toggle').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const submenu = e.target.nextElementSibling;
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Close submenus when clicking elsewhere
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-submenu .dropdown-menu').forEach(el => {
            el.style.display = 'none';
        });
    });
}

// Login form handler
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://wxbackend-production.up.railway.app/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    station: document.getElementById('loginStation').value,
                    password: document.getElementById('loginPassword').value
                })
            });

            if (!response.ok) throw new Error('Login failed');
            const data = await response.json();
            
            localStorage.setItem(AUTH_KEY, data.token);
            checkAuthStatus();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check your station and password.');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

// Initialize everything on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeBasedBackground();
    checkAuthStatus();
    setupNavbarLinkHighlighting();
    setupSubmenus();
    setupLoginForm();

    // Logout handler
    document.getElementById('logout-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        logoutUser();
    });
});