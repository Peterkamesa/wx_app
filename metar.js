// Generate METAR Report
function generateMetarReport() {
    const fields = [
        document.getElementById('typeofmessage').value,
        document.getElementById('stationIndicator').value,
        `${document.getElementById('obsTime').value}Z`,
        `${document.getElementById('wind').value}KT`,
        document.getElementById('visibility').value,
        document.getElementById('rvr').value,
        document.getElementById('weather').value,
    ];

    const cloudFields = [
        document.getElementById('lowCloud').value ? `${document.getElementById('lowCloud').value}${document.getElementById('lowCloudHeight').value}` : "",
        document.getElementById('mediumCloud').value ? `${document.getElementById('mediumCloud').value}${document.getElementById('mediumCloudHeight').value}` : "",
        document.getElementById('highCloud').value ? `${document.getElementById('highCloud').value}${document.getElementById('highCloudHeight').value}` : "",
        document.getElementById('additionalCloud').value ? `${document.getElementById('additionalCloud').value}${document.getElementById('additionalCloudHeight').value}` : "",
    ].filter(value => value.trim() !== "");

    const fullFields = fields.concat(cloudFields, [
        document.getElementById('tempDew').value,
        `Q${document.getElementById('qnh').value}`,
        document.getElementById('recentWeather').value
    ]);

    const metarReport = fullFields.filter(value => value.trim() !== "").join(" ") + "=";
    const header = document.getElementById('header').value;
    document.getElementById('metarOutput').innerText = `${header}\n${metarReport}`;
}

// Save Report
function saveReport() {
    const fullReport = document.getElementById('metarOutput').innerText;
    if (!fullReport) {
        alert("No report to save!");
        return;
    }

    const savedReports = JSON.parse(localStorage.getItem('savedMetarReports')) || [];
    savedReports.unshift({
        id: Date.now(),
        content: fullReport,
        timestamp: new Date().toLocaleString()
    });
    localStorage.setItem('savedMetarReports', JSON.stringify(savedReports));
    displaySavedReports();
}

// Display Saved Reports
function displaySavedReports() {
    const savedReports = JSON.parse(localStorage.getItem('savedMetarReports')) || [];
    const reportsList = document.getElementById('savedReports');
    reportsList.innerHTML = "";

    if (savedReports.length === 0) {
        reportsList.innerHTML = '<li class="list-group-item text-muted">No saved reports yet</li>';
        return;
    }

    savedReports.forEach((report, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';
        
        const reportContent = document.createElement('div');
        reportContent.className = 'd-flex justify-content-between align-items-center';
        
        const reportText = document.createElement('div');
        reportText.innerHTML = `<strong>Report #${savedReports.length - index}</strong><br>
                              <small class="text-muted">${report.timestamp}</small>
                              <pre class="mt-2 mb-0">${report.content}</pre>`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.onclick = () => deleteReport(report.id);
        
        reportContent.appendChild(reportText);
        reportContent.appendChild(deleteBtn);
        listItem.appendChild(reportContent);
        reportsList.appendChild(listItem);
    });
}

// Delete single report
function deleteReport(id) {
    if (confirm("Are you sure you want to delete this report?")) {
        let savedReports = JSON.parse(localStorage.getItem('savedMetarReports')) || [];
        savedReports = savedReports.filter(report => report.id !== id);
        localStorage.setItem('savedMetarReports', JSON.stringify(savedReports));
        displaySavedReports();
    }
}

// Clear Saved Reports
function clearSavedReports() {
    if (confirm("Are you sure you want to clear all saved reports?")) {
        localStorage.removeItem('savedMetarReports');
        displaySavedReports();
    }
}

// Send Report via Email
async function sendReport() {
    const recipientEmail = document.getElementById('recipientEmail').value;
    const reportContent = document.getElementById('metarOutput').innerText;

    if (!recipientEmail || !reportContent) {
        alert("Please enter a recipient email and generate a report first.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                to: recipientEmail, 
                subject: 'METAR Weather Report', 
                text: reportContent 
            }),
        });

        if (response.ok) {
            alert('Report sent successfully!');
        } else {
            alert('Failed to send report.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while sending the report.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    displaySavedReports();
    
    // Redirect if not logged in
    if (!localStorage.getItem('weatherAuthToken')) {
        window.location.href = 'login.html';
    }
});