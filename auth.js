// Highlight active page on click
document.querySelectorAll('.navbar-link').forEach(link => {
    link.addEventListener('click', function() {
        // Remove active class from all links
        document.querySelectorAll('.navbar-link').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked link
        this.classList.add('active');
        
        // Store in sessionStorage to persist on page reload
        sessionStorage.setItem('activeNavItem', this.getAttribute('href'));
    });
});

// Check and set active item on page load
document.addEventListener('DOMContentLoaded', function() {
    const activeItem = sessionStorage.getItem('activeNavItem');
    if (activeItem) {
        document.querySelectorAll('.navbar-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activeItem) {
                link.classList.add('active');
            }
        });
    }
});

// In your auth.js or main script
function setTimeBasedBackground() {
    const hour = new Date().getHours();
    const isDaytime = hour > 6 && hour < 20;
    
    document.body.style.backgroundImage = isDaytime
        ? "url('back/day-bg.jpg')"
        : "url('back/night-bg.jpg')";
}

// Call on page load
setTimeBasedBackground();

// auth.js - Mock Authentication System
const AUTH_KEY = 'weatherAuthToken';
const MOCK_USERS = [
    { email: "petmaish1@gmail.com", password: "peter" },
    { email: "admin@example.com", password: "admin123" }
];

// Check login status
function checkAuth() {
    const isLoggedIn = localStorage.getItem(AUTH_KEY) !== null;
    if (isLoggedIn) {
        document.getElementById('logout-item').style.display = 'block';
        document.getElementById('login-item').style.display = 'none';
        document.getElementById('signup-item').style.display = 'none';
        
        // Show welcome message if element exists
        const userEmail = JSON.parse(localStorage.getItem('userEmail'));
        if (document.getElementById('welcome-message') && userEmail) {
            document.getElementById('welcome-message').textContent = `Welcome, ${userEmail}`;
        }
    } else {
        document.getElementById('logout-item').style.display = 'none';
        document.getElementById('login-item').style.display = 'block';
        document.getElementById('signup-item').style.display = 'block';
    }
}

// Mock login validation
function validateUser(email, password) {
    return MOCK_USERS.find(user => 
        user.email === email && 
        user.password === password
    );
}

// Login function
function loginUser(email, password) {
    const user = validateUser(email, password);
    
    if (user) {
        // Create mock token (in real app, this would come from server)
        const mockToken = `mock-token-${Date.now()}`;
        
        // Store authentication data
        localStorage.setItem(AUTH_KEY, mockToken);
        localStorage.setItem('userEmail', JSON.stringify(email));
        
        checkAuth();
        return true;
    }
    return false;
}

// Logout function
function logoutUser() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('userEmail');
    checkAuth();
    window.location.href = 'home.html'; // Redirect to home after logout
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', checkAuth);

// Attach logout handler
document.getElementById('logout-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    logoutUser();
});

// For login form submission
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (loginUser(email, password)) {
            alert('Login successful!');
            window.location.href = 'home.html';
        } else {
            alert('Invalid email or password');
        }
    });
}

// For signup form (optional mock implementation)
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        // Check if user already exists
        if (MOCK_USERS.some(user => user.email === email)) {
            alert('Email already registered');
            return;
        }
        
        // Add new user to mock database
        MOCK_USERS.push({ email, password });
        alert('Registration successful! Please login.');
        window.location.href = 'login.html';
    });
}