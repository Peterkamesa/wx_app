// Constants
const AUTH_KEY = 'weatherAuthToken';
const MOCK_USERS = [
    { email: "petmaish1@gmail.com", password: "peter" },
    { email: "admin@example.com", password: "admin123" }
];

// Set time-based background image
function setTimeBasedBackground() {
    const hour = new Date().getHours();
    const isDaytime = hour > 6 && hour < 20;

    document.body.style.backgroundImage = isDaytime
        ? "url('back/day-bg.jpg')"
        : "url('back/night-bg.jpg')";
}

// Check authentication status
function checkAuth() {
    const isLoggedIn = localStorage.getItem(AUTH_KEY) !== null;
    const userEmail = JSON.parse(localStorage.getItem('userEmail'));

    const logoutItem = document.getElementById('logout-item');
    const loginItem = document.getElementById('login-item');
    const signupItem = document.getElementById('signup-item');
    const welcomeMessage = document.getElementById('welcome-message');

    if (isLoggedIn) {
        logoutItem?.style?.setProperty('display', 'block');
        loginItem?.style?.setProperty('display', 'none');
        signupItem?.style?.setProperty('display', 'none');
        if (welcomeMessage && userEmail) {
            welcomeMessage.textContent = `Welcome, ${userEmail}`;
        }
    } else {
        logoutItem?.style?.setProperty('display', 'none');
        loginItem?.style?.setProperty('display', 'block');
        signupItem?.style?.setProperty('display', 'block');
    }
}

// Validate mock credentials
function validateUser(email, password) {
    return MOCK_USERS.find(user => user.email === email && user.password === password);
}

// Login handler
function loginUser(email, password) {
    const user = validateUser(email, password);
    if (user) {
        const mockToken = `mock-token-${Date.now()}`;
        localStorage.setItem(AUTH_KEY, mockToken);
        localStorage.setItem('userEmail', JSON.stringify(email));
        checkAuth();
        return true;
    }
    return false;
}

// Logout handler
function logoutUser() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('userEmail');
    checkAuth();
    window.location.href = 'index.html';
}

// Set active nav link and persist in sessionStorage
function setupNavbarLinkHighlighting() {
    const navLinks = document.querySelectorAll('.navbar-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
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

// Event handlers on page load
document.addEventListener('DOMContentLoaded', function () {
    setTimeBasedBackground();
    checkAuth();
    setupNavbarLinkHighlighting();

    // Logout click
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function (e) {
            e.preventDefault();
            logoutUser();
        });
    }

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (loginUser(email, password)) {
                alert('Login successful!');
                window.location.href = 'index.html';
            } else {
                alert('Invalid email or password');
            }
        });
    }

    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            if (MOCK_USERS.some(user => user.email === email)) {
                alert('Email already registered');
                return;
            }

            MOCK_USERS.push({ email, password });
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        });
    }
});
