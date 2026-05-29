// ============================================================
// She Can Foundation — Admin Panel Logic
// ============================================================

const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://she-can-foundation-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    let token = localStorage.getItem('shecan_token');

    // Check if already logged in
    if (token) {
        showDashboard();
    }

    // ---- Login ----
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        loginError.classList.remove('show');

        try {
            const res = await fetch(`${API_BASE}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: document.getElementById('username').value,
                    password: document.getElementById('password').value
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                token = data.token;
                localStorage.setItem('shecan_token', token);
                showDashboard();
            } else {
                loginError.textContent = data.error || 'Invalid credentials';
                loginError.classList.add('show');
            }
        } catch (err) {
            loginError.textContent = 'Connection error. Is the server running?';
            loginError.classList.add('show');
        } finally {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });

    // ---- Logout ----
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('shecan_token');
        token = null;
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        loginForm.reset();
    });

    // ---- Show Dashboard ----
    function showDashboard() {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loadStats();
        loadSubmissions();
    }

    // ---- Load Stats ----
    async function loadStats() {
        try {
            const res = await fetch(`${API_BASE}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) { handleExpired(); return; }

            const data = await res.json();
            if (data.success) {
                document.getElementById('totalStat').textContent = data.stats.total;
                document.getElementById('todayStat').textContent = data.stats.todayCount;
                document.getElementById('unreadStat').textContent = data.stats.unread;
            }
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }

    // ---- Load Submissions ----
    async function loadSubmissions() {
        const tbody = document.getElementById('submissionsBody');
        try {
            const res = await fetch(`${API_BASE}/api/admin/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) { handleExpired(); return; }

            const data = await res.json();

            if (data.success && data.submissions.length > 0) {
                tbody.innerHTML = data.submissions.map(sub => `
                    <tr class="${sub.read ? '' : 'unread'}">
                        <td><strong>${escapeHtml(sub.name)}</strong></td>
                        <td>${escapeHtml(sub.email)}</td>
                        <td>${escapeHtml(sub.subject)}</td>
                        <td>${formatDate(sub.createdAt)}</td>
                        <td><span class="status-badge ${sub.read ? 'read' : 'unread'}">${sub.read ? 'Read' : 'New'}</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="btn btn-sm btn-outline" onclick="viewSubmission('${sub._id}')">View</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteSubmission('${sub._id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No submissions yet. Forms submitted from the main page will appear here.</td></tr>';
            }
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error loading submissions.</td></tr>';
        }
    }

    // ---- View Submission ----
    window.viewSubmission = async function(id) {
        try {
            // Mark as read
            await fetch(`${API_BASE}/api/admin/submissions/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const res = await fetch(`${API_BASE}/api/admin/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const sub = data.submissions.find(s => s._id === id);

            if (sub) {
                document.getElementById('viewDetails').innerHTML = `
                    <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(sub.name)}</span></div>
                    <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(sub.email)}</span></div>
                    <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${sub.phone || 'Not provided'}</span></div>
                    <div class="detail-row"><span class="detail-label">Subject</span><span class="detail-value">${escapeHtml(sub.subject)}</span></div>
                    <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatDate(sub.createdAt)}</span></div>
                    <div class="message-box"><strong>Message:</strong><br><br>${escapeHtml(sub.message)}</div>
                `;
                document.getElementById('viewModal').classList.add('active');
                loadStats();
                loadSubmissions();
            }
        } catch (err) {
            console.error('Error viewing submission:', err);
        }
    };

    // ---- Delete Submission ----
    window.deleteSubmission = async function(id) {
        if (!confirm('Are you sure you want to delete this submission?')) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/submissions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                loadStats();
                loadSubmissions();
            }
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    // ---- Close View Modal ----
    document.getElementById('closeViewModal').addEventListener('click', () => {
        document.getElementById('viewModal').classList.remove('active');
    });

    document.getElementById('viewModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('viewModal').classList.remove('active');
        }
    });

    // ---- Refresh ----
    refreshBtn.addEventListener('click', () => {
        loadStats();
        loadSubmissions();
    });

    // ---- Helpers ----
    function handleExpired() {
        localStorage.removeItem('shecan_token');
        token = null;
        alert('Session expired. Please login again.');
        location.reload();
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
});
