// public/js/c_sheet.js
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication
  if (!localStorage.getItem('weatherAuthToken')) {
    window.location.href = 'login.html';
    return;
  }

  // Get user data from token
  const token = localStorage.getItem('weatherAuthToken');
  const user = JSON.parse(atob(token.split('.')[1]));
  
  // Initialize UI
  const stationSelect = document.getElementById('stationSelect');
  const loadSheetBtn = document.getElementById('loadSheetBtn');
  const saveSheetBtn = document.getElementById('saveSheetBtn');
  const sheetFrame = document.getElementById('sheetFrame');

  // Set default station if user is station-specific
  if (user.role === 'station') {
    stationSelect.value = user.stationName;
    stationSelect.disabled = true;
  }

  // Load sheet when button clicked
  loadSheetBtn.addEventListener('click', async function() {
    const station = stationSelect.value;
    await loadStationSheet(station);
  });

  // Auto-load sheet for station users
  if (user.role === 'station') {
    loadStationSheet(user.stationName);
  }

  // Save button functionality (will implement later)
  saveSheetBtn.addEventListener('click', saveSheetChanges);
});

async function loadStationSheet(station) {
  try {
    const token = localStorage.getItem('weatherAuthToken');
    const response = await fetch(`https://wxbackend-production.up.railway.app/api/sheets/csheet?station=${station}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to load sheet');
    
    const data = await response.json();
    
    if (!data.sheetUrl) {
      throw new Error('No sheet URL available for this station');
    }
    
    // Load the sheet in iframe
    document.getElementById('sheetFrame').src = data.sheetUrl;
    document.getElementById('saveSheetBtn').disabled = false;
    
    // Show success message
    showAlert(`Loaded ${station}'s C/SHEET successfully`, 'success');
    
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
    const response = await fetch('https://wxbackend-production.up.railway.app/api/sheets/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        station,
        sheetType: 'CSHEET',
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