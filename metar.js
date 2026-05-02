// Generate METAR/SPECI Report
function generateMetarReport() {
    const typeOfMessage = document.getElementById('typeofmessage').value;
    const stationIndicator = document.getElementById('stationIndicator').value;
    
    const fields = [
        typeOfMessage,
        stationIndicator,
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

// Save Report to Backend
async function saveReport() {
    const fullReport = document.getElementById('metarOutput').innerText;
    if (!fullReport) {
        alert("No report to generate first!");
        return;
    }

    const user = getUser();
    const type = document.getElementById('typeofmessage').value;

    const reportData = {
        content: fullReport,
        type: type,
        station: user.name,
        icaoCode: user.icaoCode,
        createdAt: new Date()
    };

    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/reports`, {
            method: 'POST',
            body: JSON.stringify(reportData)
        });

        if (response.ok) {
            alert('Report saved successfully to database!');
            displaySavedReports(); // Refresh list if on same page
        } else {
            const error = await response.json();
            alert(`Failed to save: ${error.message}`);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('An error occurred while saving to the database.');
    }
}

// Fetch and Display Saved Reports (From Backend)
async function displaySavedReports() {
    const user = getUser();
    const reportsList = document.getElementById('savedReports');
    if (!reportsList || !user) return;

    try {
        const type = document.getElementById('typeofmessage').value;
        const response = await authenticatedFetch(`${API_BASE_URL}/station/${user.name}/reports/${type}`);
        const reports = await response.json();

        reportsList.innerHTML = "";

        if (reports.length === 0) {
            reportsList.innerHTML = '<li class="list-group-item text-muted">No saved reports found for this station.</li>';
            return;
        }

        reports.forEach((report, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            
            const reportContent = document.createElement('div');
            reportContent.className = 'd-flex justify-content-between align-items-center';
            
            const reportText = document.createElement('div');
            reportText.innerHTML = `<strong>${report.type} #${reports.length - index}</strong><br>
                                  <small class="text-muted">${new Date(report.createdAt).toLocaleString()}</small>
                                  <pre class="mt-2 mb-0">${report.content}</pre>`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.onclick = () => deleteBackendReport(report._id);
            
            reportContent.appendChild(reportText);
            reportContent.appendChild(deleteBtn);
            listItem.appendChild(reportContent);
            reportsList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
    }
}

// Delete backend report
async function deleteBackendReport(id) {
    if (!confirm("Are you sure you want to delete this report?")) return;
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/reports/clear/METAR/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            displaySavedReports();
        } else {
            alert('Failed to delete report');
        }
    } catch (error) {
        console.error('Delete error:', error);
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
        const response = await authenticatedFetch(`${API_BASE_URL}/send-report`, {
            method: 'POST',
            body: JSON.stringify({ 
                to: recipientEmail, 
                subject: 'Weather Report', 
                content: reportContent 
            }),
        });

        if (response.ok) {
            alert('Report sent successfully!');
        } else {
            alert('Failed to send report.');
        }
    } catch (error) {
        console.error('Email error:', error);
        alert('An error occurred while sending the email.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const user = getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Auto-populate station info
    const stationIndicator = document.getElementById('stationIndicator');
    if (stationIndicator && user.icaoCode) {
        stationIndicator.value = user.icaoCode;
    }

    const stationNumber = document.getElementById('stationNumber');
    if (stationNumber && user.stationId) {
        stationNumber.value = user.stationId;
    }

    displaySavedReports();
});