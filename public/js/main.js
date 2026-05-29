// ============================================================
// She Can Foundation — Form Handling & Validation
// ============================================================

// API base URL — empty string for same-origin, or Render URL for Vercel deploy
const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://she-can-foundation-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // ---- Mobile Menu ----
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // ---- Navbar scroll effect ----
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ---- Scroll Reveal (IntersectionObserver) ----
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('[data-animate]').forEach(el => revealObserver.observe(el));

    // ---- Form Validation ----
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const fields = {
        name: { el: document.getElementById('name'), error: document.getElementById('nameError') },
        email: { el: document.getElementById('email'), error: document.getElementById('emailError') },
        phone: { el: document.getElementById('phone'), error: document.getElementById('phoneError') },
        subject: { el: document.getElementById('subject'), error: document.getElementById('subjectError') },
        message: { el: document.getElementById('message'), error: document.getElementById('messageError') }
    };

    const validators = {
        name: (val) => {
            if (!val.trim()) return 'Name is required';
            if (val.trim().length < 2) return 'Name must be at least 2 characters';
            if (!/^[a-zA-Z\s.'-]+$/.test(val.trim())) return 'Name can only contain letters';
            return '';
        },
        email: (val) => {
            if (!val.trim()) return 'Email is required';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email';
            return '';
        },
        phone: (val) => {
            if (!val.trim()) return '';
            if (!/^[0-9]{10}$/.test(val.trim())) return 'Phone must be a 10-digit number';
            return '';
        },
        subject: (val) => {
            if (!val) return 'Please select a subject';
            return '';
        },
        message: (val) => {
            if (!val.trim()) return 'Message is required';
            if (val.trim().length < 10) return 'Message must be at least 10 characters';
            return '';
        }
    };

    function validateField(name) {
        const field = fields[name];
        const error = validators[name](field.el.value);
        if (error) {
            field.el.classList.remove('valid');
            field.el.classList.add('invalid');
            field.error.textContent = error;
            field.error.classList.add('show');
            return false;
        } else {
            field.el.classList.remove('invalid');
            if (field.el.value.trim()) field.el.classList.add('valid');
            field.error.classList.remove('show');
            return true;
        }
    }

    Object.keys(fields).forEach(name => {
        const event = name === 'subject' ? 'change' : 'input';
        fields[name].el.addEventListener(event, () => validateField(name));
        fields[name].el.addEventListener('blur', () => validateField(name));
    });

    // ---- Form Submission ----
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;
        Object.keys(fields).forEach(name => {
            if (!validateField(name)) isValid = false;
        });
        if (!isValid) return;

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: fields.name.el.value.trim(),
                    email: fields.email.el.value.trim(),
                    phone: fields.phone.el.value.trim(),
                    subject: fields.subject.el.value,
                    message: fields.message.el.value.trim()
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                document.getElementById('successModal').classList.add('active');
                form.reset();
                Object.keys(fields).forEach(name => {
                    fields[name].el.classList.remove('valid', 'invalid');
                    fields[name].error.classList.remove('show');
                });
            } else {
                const errorMsg = data.errors ? data.errors[0].msg : (data.error || 'Something went wrong');
                alert(errorMsg);
            }
        } catch (err) {
            console.error('Submission error:', err);
            alert('Network error. Please check your connection and try again.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    // ---- Success Modal ----
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('successModal').classList.remove('active');
    });

    document.getElementById('successModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('successModal').classList.remove('active');
        }
    });
});

