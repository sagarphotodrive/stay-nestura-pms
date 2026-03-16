// Homestay Management System JavaScript

// Sample data
let guests = JSON.parse(localStorage.getItem('guests')) || [];
let bookings = JSON.parse(localStorage.getItem('bookings')) || [
    { property: 'Solapur Homestay 1', date: '2025-12-20', guest: 'John Doe' },
    { property: 'Shivneri Homestay', date: '2025-12-25', guest: 'Jane Smith' }
];

// Properties
const properties = ['Solapur Homestay 1', 'Solapur Homestay 2', 'Shivneri Homestay', 'Torna Homestay'];

// Update dashboard
function updateDashboard() {
    document.getElementById('total-guests').textContent = guests.length;
    const occupied = guests.filter(g => g.status === 'Confirmed').length;
    document.getElementById('occupancy-rate').textContent = `${Math.round((occupied / 4) * 100)}%`;
    // Add more metrics
}

// Display guests
function displayGuests() {
    const tbody = document.querySelector('#guest-table tbody');
    tbody.innerHTML = '';
    guests.forEach((guest, index) => {
        const row = `<tr>
            <td>${guest.name}</td>
            <td>${guest.email}</td>
            <td>${guest.phone}</td>
            <td>${guest.property}</td>
            <td>${guest.status}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editGuest(${index})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteGuest(${index})">Delete</button>
            </td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Add guest
document.getElementById('guest-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const guest = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        property: formData.get('property'),
        status: 'Pending'
    };
    guests.push(guest);
    localStorage.setItem('guests', JSON.stringify(guests));
    displayGuests();
    updateDashboard();
    bootstrap.Modal.getInstance(document.getElementById('guestModal')).hide();
    e.target.reset();
});

// Delete guest
function deleteGuest(index) {
    guests.splice(index, 1);
    localStorage.setItem('guests', JSON.stringify(guests));
    displayGuests();
    updateDashboard();
}

// Export guests to CSV
function exportGuests() {
    let csv = 'Name,Email,Phone,Property,Status\n';
    guests.forEach(g => {
        csv += `${g.name},${g.email},${g.phone},${g.property},${g.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guests.csv';
    a.click();
}

// Occupancy
function displayOccupancy() {
    const list = document.getElementById('occupancy-list');
    list.innerHTML = '';
    properties.forEach(prop => {
        const propGuests = guests.filter(g => g.property === prop && g.status === 'Confirmed');
        const status = propGuests.length > 0 ? 'Occupied' : 'Available';
        list.innerHTML += `<div class="card mb-2">
            <div class="card-body">
                <h5>${prop}</h5>
                <p>Status: ${status}</p>
                <p>Guests: ${propGuests.length}</p>
            </div>
        </div>`;
    });
}

// Analytics Chart
function loadAnalytics() {
    const ctx = document.getElementById('occupancyChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Occupancy',
                data: [20, 30, 40, 50, 60, 70],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
            }]
        }
    });
}

// Availability Calendar
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    const property = document.getElementById('property-select').value;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    let html = '<table class="table table-bordered"><thead><tr>';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => html += `<th>${day}</th>`);
    html += '</tr></thead><tbody><tr>';

    for (let i = 0; i < firstDay; i++) {
        html += '<td></td>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const booked = bookings.some(b => b.property === property && new Date(b.date).getDate() === day && new Date(b.date).getMonth() === month);
        const className = booked ? 'bg-danger text-white' : 'bg-success text-white';
        html += `<td class="${className}">${day}</td>`;
        if ((firstDay + day) % 7 === 0) html += '</tr><tr>';
    }

    html += '</tr></tbody></table>';
    calendar.innerHTML = html;
}

document.getElementById('property-select').addEventListener('change', generateCalendar);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    displayGuests();
    displayOccupancy();
    loadAnalytics();
    generateCalendar();
});