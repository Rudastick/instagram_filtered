// public/script.js
// Frontend JS to interact with REST API

// Replace this with your API key (should match API_KEY environment variable on server)
const API_KEY = 'changeme';

const form = document.getElementById('record-form');
const recordIdInput = document.getElementById('record-id');
const usernameInput = document.getElementById('username');
const scrapedAtInput = document.getElementById('scraped_at');
const statusInput = document.getElementById('status');
const notesInput = document.getElementById('notes');
const submitBtn = document.getElementById('submit-btn');

const searchUsername = document.getElementById('search-username');
const searchStatus = document.getElementById('search-status');
const searchBtn = document.getElementById('search-btn');
const recordsTableBody = document.querySelector('#records-table tbody');
const viewLogsBtn = document.getElementById('view-logs-btn');
const logsDisplay = document.getElementById('logs-display');

// Elements for claiming accounts
const claimCountInput = document.getElementById('claim-count');
const claimBtn = document.getElementById('claim-btn');

// Fetch records and populate table
async function fetchRecords() {
  const usernameFilter = searchUsername.value.trim();
  const statusFilter = searchStatus.value;
  const params = new URLSearchParams();
  if (usernameFilter) params.append('username', usernameFilter);
  if (statusFilter) params.append('status', statusFilter);

  try {
    const response = await fetch(`/api/records?${params.toString()}`, {
      headers: { 'x-api-key': API_KEY },
    });
    if (!response.ok) throw new Error('Failed to fetch records');
    const data = await response.json();
    populateTable(data);
  } catch (err) {
    alert(err.message);
  }
}

// Populate table with records
function populateTable(records) {
  recordsTableBody.innerHTML = '';
  records.forEach((record) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${record.username}</td>
      <td>${new Date(record.scraped_at).toLocaleString()}</td>
      <td>${record.status}</td>
      <td>${record.notes || ''}</td>
      <td>
        <button data-action="edit" data-id="${record._id}">Edit</button>
        <button data-action="delete" data-id="${record._id}">Delete</button>
      </td>
    `;
    recordsTableBody.appendChild(tr);
  });
}

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = recordIdInput.value;
  const payload = {
    username: usernameInput.value.trim(),
    scraped_at: scrapedAtInput.value ? new Date(scrapedAtInput.value).toISOString() : undefined,
    status: statusInput.value,
    notes: notesInput.value.trim(),
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  try {
    let response;
    if (id) {
      // Update existing
      response = await fetch(`/api/records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify(payload),
      });
    } else {
      // Create new
      response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify(payload),
      });
    }
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Request failed');
    }
    recordIdInput.value = '';
    submitBtn.textContent = 'Add Record';
    form.reset();
    fetchRecords();
  } catch (err) {
    alert(err.message);
  }
});

// Handle table button clicks (edit/delete)
recordsTableBody.addEventListener('click', async (e) => {
  const action = e.target.getAttribute('data-action');
  const id = e.target.getAttribute('data-id');
  if (!action || !id) return;
  if (action === 'edit') {
    try {
      const response = await fetch(`/api/records/${id}`, {
        headers: { 'x-api-key': API_KEY },
      });
      if (!response.ok) throw new Error('Failed to fetch record');
      const record = await response.json();
      recordIdInput.value = record._id;
      usernameInput.value = record.username;
      scrapedAtInput.value = record.scraped_at ? new Date(record.scraped_at).toISOString().slice(0, 16) : '';
      statusInput.value = record.status;
      notesInput.value = record.notes;
      submitBtn.textContent = 'Update Record';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err.message);
    }
  } else if (action === 'delete') {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
        headers: { 'x-api-key': API_KEY },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Delete failed');
      }
      fetchRecords();
    } catch (err) {
      alert(err.message);
    }
  }
});

// Search button
searchBtn.addEventListener('click', () => {
  fetchRecords();
});

// View logs
viewLogsBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('/logs', {
      headers: { 'x-api-key': API_KEY },
    });
    if (!response.ok) throw new Error('Failed to fetch logs');
    const text = await response.text();
    logsDisplay.textContent = text;
  } catch (err) {
    alert(err.message);
  }
});

// Claim unused accounts
claimBtn.addEventListener('click', async () => {
  const count = parseInt(claimCountInput.value, 10);
  if (!count || count <= 0) {
    alert('Please enter a valid number of accounts to retrieve.');
    return;
  }
  try {
    const response = await fetch('/api/records/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ count }),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Request failed');
    }
    const text = await response.text();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounts.txt';
    a.click();
    URL.revokeObjectURL(url);
    fetchRecords(); // refresh table
  } catch (err) {
    alert(err.message);
  }
});

// Initial load
fetchRecords();
