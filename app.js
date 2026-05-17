document.addEventListener('DOMContentLoaded', () => {
    const businessToggle = document.getElementById('business-toggle');
    const businessFields = document.getElementById('business-fields');
    const communityFields = document.getElementById('community-fields');
    const serviceInterest = document.getElementById('service-interest');
    const businessType = document.getElementById('business-type');
    
    const form = document.getElementById('raffle-form');
    const submitBtn = document.getElementById('submit-btn');
    const formContainer = document.getElementById('form-container');
    const successScreen = document.getElementById('success-screen');
    const displayTicketNumber = document.getElementById('display-ticket-number');

    // Supabase Configuration
    const SUPABASE_URL = 'https://qvkajjigbcxzxsprvfys.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2a2FqamlnYmN4enhzcHJ2ZnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMjYxNjgsImV4cCI6MjA5NDYwMjE2OH0.qQFw8l9SXmyzpIipmq2fRFvmzZ_JTlvFoL79pO1fPhw';
    
    // Initialize Supabase client ONLY if real URL is provided
    let supabase = null;
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn('Invalid Supabase configuration');
        }
    }

    // Toggle Business Fields
    businessToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            businessFields.classList.remove('hidden');
            communityFields.classList.add('hidden');
            businessType.required = true;
        } else {
            businessFields.classList.add('hidden');
            communityFields.classList.remove('hidden');
            businessType.required = false;
            businessType.value = '';
            serviceInterest.value = '';
        }
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Prevent double submission
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>PROCESSING...</span>';

        const formData = new FormData(form);
        const isBusinessOwner = formData.get('is_business_owner') === 'on';
        
        const payload = {
            full_name: formData.get('full_name'),
            email: formData.get('email'),
            phone: formData.get('phone') || null,
            is_business_owner: isBusinessOwner,
            business_type: isBusinessOwner ? formData.get('business_type') : null,
            service_interest: isBusinessOwner ? formData.get('service_interest') : null,
            newsletter_interest: !isBusinessOwner ? formData.get('newsletter_interest') : null
        };

        try {
            // Generate a random ticket number for the demo if Supabase isn't hooked up yet
            // In production, we can either generate this client-side or rely on Supabase UUID/sequence
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const ticketNumber = `JB-26-${randomNum}`;
            payload.raffle_number = ticketNumber;

            if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
                // Insert into Supabase
                const { data, error } = await supabase
                    .from('raffle_entries')
                    .insert([payload])
                    .select();

                if (error) throw error;
            } else {
                console.warn('Supabase not configured. Running in demo mode.');
                // Simulate network request
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Show Success Screen
            showSuccess(ticketNumber);

        } catch (error) {
            console.error('Error submitting form:', error);
            alert(error.message || 'There was an error submitting your entry. Have you already entered with this email?');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>GET MY RAFFLE TICKET</span>';
        }
    });

    function showSuccess(ticketNumber) {
        formContainer.classList.add('hidden');
        successScreen.classList.remove('hidden');
        displayTicketNumber.textContent = ticketNumber;

        // Trigger Confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            }));
            confetti(Object.assign({}, defaults, { particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            }));
        }, 250);
    }
});
