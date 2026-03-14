/* ============================================
   OAKK WOOD SCHOOL - JAVASCRIPT
   Pure vanilla JS, no frameworks
============================================ */

// ---- NAVBAR SCROLL ----
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMobile = document.getElementById('navMobile');

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Back to top button
  const btn = document.getElementById('backToTop');
  if (window.scrollY > 400) {
    btn.classList.add('visible');
  } else {
    btn.classList.remove('visible');
  }
});

// ---- MOBILE NAV TOGGLE ----
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navMobile.classList.toggle('open');
});

// Close mobile nav on link click
document.querySelectorAll('#navMobile a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navMobile.classList.remove('open');
  });
});

// ---- SCROLL ANIMATIONS ----
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger children if they have delay attributes
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('in-view');
      }, Number(delay));
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '-50px 0px'
});

document.querySelectorAll('[data-animate]').forEach((el, i) => {
  observer.observe(el);
});

// ---- BACK TO TOP ----
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- SMOOTH SCROLL HELPERS ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ---- COUNTER ANIMATION ----
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 2000;
  const start = performance.now();
  const suffix = el.dataset.suffix || '';

  function update(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(el => {
  counterObserver.observe(el);
});

// ---- FORM VALIDATION ----
const form = document.getElementById('admissionForm');
const successState = document.getElementById('successState');
const formState = document.getElementById('formState');

const validators = {
  studentName: { required: true, minLength: 2, message: 'Student name must be at least 2 characters' },
  dateOfBirth: { required: true, message: 'Date of birth is required' },
  gender: { required: true, message: 'Please select a gender' },
  classApplied: { required: true, message: 'Please select a class' },
  parentName: { required: true, minLength: 2, message: 'Parent name must be at least 2 characters' },
  parentPhone: { required: true, pattern: /^\d{10,}$/, message: 'Enter a valid phone number (at least 10 digits)' },
  parentEmail: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
  address: { required: true, minLength: 10, message: 'Please enter your full address (at least 10 characters)' },
};

function getField(name) {
  return form.querySelector(`[name="${name}"]`);
}

function getError(name) {
  return form.querySelector(`[data-error="${name}"]`);
}

function validateField(name, value) {
  const rule = validators[name];
  if (!rule) return true;

  if (rule.required && !value.trim()) {
    return rule.message || `${name} is required`;
  }

  if (rule.minLength && value.trim().length < rule.minLength) {
    return rule.message;
  }

  if (rule.pattern && !rule.pattern.test(value.trim())) {
    return rule.message;
  }

  return true;
}

function showError(name, message) {
  const field = getField(name);
  const error = getError(name);
  if (field) {
    field.style.borderColor = 'var(--error)';
    field.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.1)';
  }
  if (error) {
    error.textContent = message;
    error.style.display = 'flex';
  }
}

function clearError(name) {
  const field = getField(name);
  const error = getError(name);
  if (field) {
    field.style.borderColor = '';
    field.style.boxShadow = '';
  }
  if (error) {
    error.textContent = '';
    error.style.display = 'none';
  }
}

// Real-time validation on blur
Object.keys(validators).forEach(name => {
  const field = getField(name);
  if (!field) return;

  field.addEventListener('blur', () => {
    const result = validateField(name, field.value);
    if (result !== true) {
      showError(name, result);
    } else {
      clearError(name);
    }
  });

  field.addEventListener('input', () => {
    if (field.style.borderColor === 'var(--error)' || field.style.borderColor === 'rgb(220, 38, 38)') {
      const result = validateField(name, field.value);
      if (result === true) {
        clearError(name);
      }
    }
  });
});

// ---- FORM SUBMIT ----
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Clear all errors
  Object.keys(validators).forEach(name => clearError(name));

  // Validate all fields
  let hasErrors = false;
  Object.keys(validators).forEach(name => {
    const field = getField(name);
    if (!field) return;
    const result = validateField(name, field.value);
    if (result !== true) {
      showError(name, result);
      hasErrors = true;
    }
  });

  if (hasErrors) {
    // Scroll to first error
    const firstError = form.querySelector('[data-error]:not([style*="none"])');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  // Submit
  const submitBtn = form.querySelector('.form-submit');
  const submitText = submitBtn.querySelector('.submit-text');
  const submitSpinner = submitBtn.querySelector('.spinner');

  submitBtn.disabled = true;
  submitText.style.display = 'none';
  submitSpinner.style.display = 'block';

  // Collect form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    // Submit to API
    const response = await fetch('https://server-zt4j.onrender.com/admissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showSuccess(result.applicationId);
      launchConfetti();
    } else {
      const msg = result.message || 'Failed to submit application. Please try again.';
      showFormError(msg);
    }

  } catch (err) {
    showFormError('Unable to connect to the server. Please check your connection and try again.');
  } finally {
    submitBtn.disabled = false;
    submitText.style.display = '';
    submitSpinner.style.display = 'none';
  }
});

function generateId() {
  return 'OWS-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function showFormError(msg) {
  let banner = document.getElementById('formErrorBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'formErrorBanner';
    banner.style.cssText = `
      background: #fef2f2;
      border: 1.5px solid #fecaca;
      color: #dc2626;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.625rem;
    `;
    const form = document.getElementById('admissionForm');
    form.insertBefore(banner, form.firstChild);
  }
  banner.innerHTML = `<span>⚠</span> ${msg}`;
  banner.style.display = 'flex';
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { banner.style.display = 'none'; }, 8000);
}

function showSuccess(appId) {
  document.getElementById('applicationId').textContent = 'Application ID: ' + appId;
  formState.style.display = 'none';
  successState.style.display = 'block';
  successState.classList.add('visible');
  successState.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
  form.reset();
  Object.keys(validators).forEach(name => clearError(name));
  formState.style.display = 'block';
  successState.style.display = 'none';
  successState.classList.remove('visible');
}

// ---- CONFETTI ----
function launchConfetti() {
  const colors = ['#175E33', '#FFC107', '#ffffff', '#22c55e', '#3b82f6'];
  const container = document.body;
  const count = 120;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (Math.random() * 8 + 6) + 'px';
    piece.style.height = (Math.random() * 8 + 6) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
    piece.style.animationDelay = (Math.random() * 1.5) + 's';
    piece.style.opacity = Math.random() * 0.5 + 0.5;
    container.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Hide all error elements initially
  document.querySelectorAll('[data-error]').forEach(el => {
    el.style.display = 'none';
  });

  // Hide spinner
  document.querySelectorAll('.spinner').forEach(el => {
    el.style.display = 'none';
  });

  // Set current year in footer
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
