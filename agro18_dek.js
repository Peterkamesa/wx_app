// public/js/c_sheet.js
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!localStorage.getItem('weatherAuthToken')) {
    window.location.href = 'login.html';
    return;
  }

  // Get user data from token with proper parsing
  const token = localStorage.getItem('weatherAuthToken');
  const user = parseJwt(token);
  
  if (!user) {
    // parseJwt already handles redirect on failure
    return;
  }
  
  // Initialize UI
  const stationSelect = document.getElementById('stationSelect');
  const loadSheetBtn = document.getElementById('loadSheetBtn');
  const saveSheetBtn = document.getElementById('saveSheetBtn');
  const sheetFrame = document.getElementById('sheetFrame');

  // Set default station if user is station-specific
  if (user.role === 'station') {
    stationSelect.value = user.stationName;
    stationSelect.disabled = false;
  }

  // Load sheet when button clicked
  loadSheetBtn.addEventListener('click', async function() {
    const station = stationSelect.value;
    await loadStationSheet(station);
  });

  // Auto-load sheet for station users
  /*if (user.role === 'station') {
    loadStationSheet(user.stationName);
  }*/

  // Save button functionality
  saveSheetBtn.addEventListener('click', saveSheetChanges);
});

// Proper JWT parsing function
function parseJwt(token) {
  try {
    // Validate token format
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Base64Url decode the payload part
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    // Handle invalid token by redirecting to login
    localStorage.removeItem('weatherAuthToken');
    window.location.href = 'login.html';
    return null;
  }
}

async function loadStationSheet(station) {
  try {
    console.log('Loading sheet for:', station);
    
    const response = await fetch(`https://wx-backend-cf4d.onrender.com/api/sheets/agro18_dek?station=${station}`);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      throw new Error(`Failed to load sheet: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!data.sheetUrl) {
      throw new Error('No sheet URL available for this station');
    }
    
    // Load the sheet in iframe
    document.getElementById('sheetFrame').src = data.sheetUrl;
    document.getElementById('saveSheetBtn').disabled = false;
    
    // Show success message
    showAlert(`Loaded ${station}'s AGRO18 DEKAD successfully`, 'success');
    
  } catch (error) {
    console.error('Error loading sheet:', error);
    showAlert(`Error: ${error.message}`, 'danger');
    document.getElementById('saveSheetBtn').disabled = true;
  }
}

function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  const container = document.querySelector('.container.mt-3');
  container.appendChild(alertDiv);
  
  setTimeout(() => alertDiv.remove(), 5000);
}

async function saveSheetChanges() {
  try {
    const station = document.getElementById('stationSelect').value;
    const token = localStorage.getItem('weatherAuthToken');
    
    // Get the current iframe URL
    const iframe = document.getElementById('sheetFrame');
    const sheetUrl = iframe.src;
    const sheetId = sheetUrl.match(/\/d\/([^\/]+)/)[1];
    
    // Send save request to backend
    const response = await fetch('https://wx-backend-cf4d.onrender.com/api/sheets/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        station,
        sheetType: 'AGRO18_DEK',
        sheetId
      })
    });
    
    if (!response.ok) throw new Error('Save failed');
    
    showAlert('Sheet changes saved successfully!', 'success');
    
  } catch (error) {
    console.error('Error saving sheet:', error);
    showAlert(`Error saving: ${error.message}`, 'danger');
  }
}