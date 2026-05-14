import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://srtpssnpeweunscltvbr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNydHBzc25wZXdldW5zY2x0dmJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODA5NDksImV4cCI6MjA5MzY1Njk0OX0.hJ20d9fhD5ixmAGciV8YLbVd3VvZBLTN3gkzdQvqS-w';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function initTracker() {
  console.log('[System] Initializing Supabase Realtime Tracking...');

  const userAgent = navigator.userAgent;
  let os = 'Unknown OS';
  if (userAgent.includes('iPhone')) os = 'iPhone (iOS)';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('Windows')) os = 'Windows PC';
  else if (userAgent.includes('Mac OS')) os = 'Macbook (macOS)';

  let browser = 'Unknown Browser';
  if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';

  let ip = 'Hidden';
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    ip = data.ip;
  } catch (error) {
    console.warn('IP lookup failed:', error);
  }

  await recordVisit(ip, os, browser);

  if (document.getElementById('live-visitors-table')) {
    loadActiveTargets();
    listenForNewTargets();
  }
}

async function recordVisit(ip, os, browser) {
  if (sessionStorage.getItem('target_recorded')) return;

  const { error } = await supabase
    .from('live_targets')
    .insert([{ ip, os, browser, status: 'online' }]);

  if (!error) sessionStorage.setItem('target_recorded', 'true');
  else console.error('Error recording visit:', error);
}

async function loadActiveTargets() {
  const { data } = await supabase
    .from('live_targets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const tableBody = document.getElementById('live-visitors-table');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  (data || []).forEach((target) => {
    tableBody.innerHTML += createRow(target);
  });
}

function listenForNewTargets() {
  supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_targets' }, (payload) => {
      const tableBody = document.getElementById('live-visitors-table');
      if (!tableBody) return;
      tableBody.innerHTML = createRow(payload.new) + tableBody.innerHTML;
    })
    .subscribe();
}

function createRow(target) {
  const time = target.created_at
    ? new Date(target.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return `
    <tr class="table-row">
      <td>${target.ip || '-'}</td>
      <td>${target.os || '-'}</td>
      <td>${target.browser || '-'}</td>
      <td>Since ${time}</td>
      <td><span class="status-pill">${target.status || 'online'}</span></td>
    </tr>
  `;
}
