document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const loginBtn = document.getElementById('login-btn');
    const passInput = document.getElementById('admin-password');

    // Simple security - change this PIN!
    const ADMIN_PIN = '1234'; 

    loginBtn.addEventListener('click', () => {
        if (passInput.value === ADMIN_PIN) {
            loginScreen.classList.add('hidden');
            dashboard.classList.remove('hidden');
            loadData();
        } else {
            alert('Incorrect PIN');
        }
    });

    // Supabase Configuration
    const SUPABASE_URL = 'https://qvkajjigbcxzxsprvfys.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2a2FqamlnYmN4enhzcHJ2ZnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjYxNjgsImV4cCI6MjA5NDYwMjE2OH0.qQFw8l9SXmyzpIipmq2fRFvmzZ_JTlvFoL79pO1fPhw';
    
    let supabase = null;
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn('Invalid Supabase configuration');
        }
    }

    let entriesData = [];

    async function loadData() {
        const tableBody = document.getElementById('entries-table-body');
        
        if (!supabase) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: #ff007f;">Supabase not configured. Showing demo data.</td></tr>';
            
            // Demo data
            entriesData = [
                { created_at: new Date().toISOString(), raffle_number: 'JB-26-4021', full_name: 'Jane Smith', email: 'jane@example.com', phone: '555-0192', is_business_owner: true, business_type: 'Landscaping', service_interest: 'Web Design', newsletter_interest: null },
                { created_at: new Date(Date.now() - 86400000).toISOString(), raffle_number: 'JB-26-8911', full_name: 'Bob Jones', email: 'bob@example.com', phone: '', is_business_owner: false, business_type: null, service_interest: null, newsletter_interest: 'Exclusive Discounts' }
            ];
            renderTable();
            updateStats();
            return;
        }

        try {
            const { data, error } = await supabase
                .from('raffle_entries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            entriesData = data;
            renderTable();
            updateStats();
        } catch (error) {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red;">Error loading data: ${error.message}</td></tr>`;
        }
    }

    function renderTable() {
        const tableBody = document.getElementById('entries-table-body');
        tableBody.innerHTML = '';

        if (entriesData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No entries yet.</td></tr>';
            return;
        }

        entriesData.forEach(entry => {
            const tr = document.createElement('tr');
            const date = new Date(entry.created_at).toLocaleDateString();
            
            let typeBadge = entry.is_business_owner ? '<span class="badge">BUSINESS</span>' : 'Community';
            let interestText = entry.is_business_owner ? 
                `<strong>${entry.business_type || 'N/A'}</strong><br><small>${entry.service_interest || ''}</small>` : 
                `<small>${entry.newsletter_interest || 'General'}</small>`;

            tr.innerHTML = `
                <td>${date}</td>
                <td><strong>${entry.raffle_number}</strong></td>
                <td>${entry.full_name}</td>
                <td><a href="mailto:${entry.email}" style="color:var(--text-light)">${entry.email}</a></td>
                <td>${entry.phone || '-'}</td>
                <td>${typeBadge}</td>
                <td>${interestText}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function updateStats() {
        document.getElementById('total-entries').textContent = entriesData.length;
        const bizCount = entriesData.filter(e => e.is_business_owner).length;
        document.getElementById('business-entries').textContent = bizCount;
        
        // Mock conversion rate based on hypothetical 1000 mailers sent
        const mockMailersSent = 1000;
        const rate = entriesData.length > 0 ? ((entriesData.length / mockMailersSent) * 100).toFixed(1) : 0;
        document.getElementById('conversion-rate').textContent = `${rate}%`;
    }

    // Export CSV
    document.getElementById('export-csv').addEventListener('click', () => {
        if (entriesData.length === 0) return alert('No data to export');
        
        const headers = ['Date', 'Ticket Number', 'Name', 'Email', 'Phone', 'Is Business', 'Business Type', 'Service Interest', 'Newsletter Interest'];
        const csvRows = [headers.join(',')];
        
        entriesData.forEach(e => {
            const values = [
                new Date(e.created_at).toLocaleDateString(),
                e.raffle_number,
                `"${e.full_name}"`,
                e.email,
                e.phone || '',
                e.is_business_owner,
                `"${e.business_type || ''}"`,
                `"${e.service_interest || ''}"`,
                `"${e.newsletter_interest || ''}"`
            ];
            csvRows.push(values.join(','));
        });
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Giveaway_Entries_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Pick Winner Logic
    document.getElementById('pick-winner').addEventListener('click', () => {
        if (entriesData.length === 0) return alert('No entries to pick from!');
        
        const winnerIndex = Math.floor(Math.random() * entriesData.length);
        const winner = entriesData[winnerIndex];
        
        const modal = document.getElementById('winner-modal');
        document.getElementById('winner-ticket-display').textContent = winner.raffle_number;
        document.getElementById('winner-details').textContent = `${winner.full_name} (${winner.email})`;
        
        modal.classList.remove('hidden');
        fireConfetti();
    });

    function fireConfetti() {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 3000 };

        function randomInRange(min, max) { return Math.random() * (max - min) + min; }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
});
