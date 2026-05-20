import { apiFetch } from '../services/api.js';
import { getCurrentLanguage, t } from './language.js';

export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = document.getElementById('contact-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    if (status) {
      status.textContent = t('contact_sending', 'Sending...');
      status.className = 'contact-status contact-status--pending';
    }

    const payload = {
      name: form.name?.value,
      email: form.email?.value,
      message: form.message?.value,
      locale: getCurrentLanguage(),
    };

    try {
      await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      form.reset();
      if (status) {
        status.textContent = t('contact_success', 'Message sent. I will get back to you soon.');
        status.className = 'contact-status contact-status--success';
      }
    } catch (error) {
      if (status) {
        status.textContent = t('contact_error', 'Could not send message. Try email instead.');
        status.className = 'contact-status contact-status--error';
      }
      console.error('[contact]', error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
