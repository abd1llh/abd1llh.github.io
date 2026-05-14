import {
  getCommandResponse,
  getHelpText,
  getTerminalIntro,
  getTerminalPlaceholder,
  getTerminalPrompt,
  isKnownCommand,
  normalizeCommand
} from '../data/commands.js';
import { getCurrentLanguage } from './language.js';

let terminalState = {
  opened: false,
  initialized: false,
  booted: false,
  history: [],
  historyIndex: -1,
};

export function initTerminal() {
  if (terminalState.initialized) return;
  terminalState.initialized = true;

  const terminal = document.getElementById('terminal');
  const termHint = document.getElementById('term-hint');
  const closeBtn = document.getElementById('close-term');
  const minBtn = document.getElementById('min-term');
  const maxBtn = document.getElementById('max-term');
  const input = document.getElementById('term-input');

  if (!terminal || !termHint || !closeBtn || !minBtn || !maxBtn || !input) return;

  closeBtn.addEventListener('click', closeTerminal);
  minBtn.addEventListener('click', toggleMinimize);
  maxBtn.addEventListener('click', toggleMaximize);
  termHint.addEventListener('click', openTerminal);

  // Input: Enter key to run command (replaced form submit)
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runCommand();
    }
    handleHistoryNavigation(event);
  });

  input.addEventListener('focus', () => {
    if (!terminalState.opened) openTerminal();
    requestAnimationFrame(() => {
      terminal.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
  });

  window.addEventListener('languagechange', updateTerminalLocale);
  updateTerminalLocale();

  // Keyboard shortcut: backtick or tilde toggles terminal
  document.addEventListener('keydown', (event) => {
    const active = document.activeElement;
    if ((event.key === '`' || event.key === '~') && active !== input) {
      if (terminal.classList.contains('is-open')) closeTerminal();
      else openTerminal();
    }
  });

  document.addEventListener('focusin', () => {
    if (window.visualViewport) {
      requestAnimationFrame(syncViewportVars);
    }
  });

  setTimeout(syncViewportVars, 0);
}

function updateTerminalLocale() {
  const input = document.getElementById('term-input');
  const prompt = document.querySelector('.terminal-prompt');
  const title = document.querySelector('.terminal-window-title');

  if (input) input.placeholder = getTerminalPlaceholder(getCurrentLanguage());
  if (prompt) prompt.textContent = getTerminalPrompt();
  if (title) title.textContent = document.documentElement.lang === 'ar'
    ? 'abd1llh ~ الطرفية'
    : 'abd1llh ~ terminal';
}

function syncViewportVars() {
  const vv = window.visualViewport;
  const height = vv ? vv.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`);
  document.documentElement.style.setProperty('--keyboard-offset', vv ? `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px` : '0px');
}

function ensureOpenState() {
  const terminal = document.getElementById('terminal');
  const hint = document.getElementById('term-hint');
  if (!terminal || !hint) return;
  terminal.classList.add('is-open');
  terminal.classList.remove('term-minimized');
  terminal.classList.remove('term-maximized');
  hint.classList.add('hidden');
  hint.setAttribute('aria-expanded', 'true');
  terminalState.opened = true;
}

function openTerminal() {
  const input = document.getElementById('term-input');
  const terminal = document.getElementById('terminal');

  ensureOpenState();
  if (!terminalState.booted) {
    printLine(getTerminalIntro(getCurrentLanguage()));
    terminalState.booted = true;
  }

  if (input) {
    input.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      terminal?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
  }
}

function closeTerminal() {
  const terminal = document.getElementById('terminal');
  const hint = document.getElementById('term-hint');
  if (!terminal || !hint) return;
  terminal.classList.remove('is-open', 'term-maximized', 'term-minimized');
  hint.classList.remove('hidden');
  hint.setAttribute('aria-expanded', 'false');
  terminalState.opened = false;
}

function toggleMinimize() {
  const terminal = document.getElementById('terminal');
  if (!terminal) return;
  terminal.classList.remove('term-maximized');
  terminal.classList.toggle('term-minimized');
}

function toggleMaximize() {
  const terminal = document.getElementById('terminal');
  const input = document.getElementById('term-input');
  if (!terminal) return;
  terminal.classList.remove('term-minimized');
  terminal.classList.toggle('term-maximized');
  if (terminal.classList.contains('term-maximized') && input) {
    input.focus({ preventScroll: true });
  }
}

function getOutputEl() {
  return document.getElementById('term-output');
}

function printLine(text) {
  const out = getOutputEl();
  if (!out) return;
  const div = document.createElement('div');
  div.className = 'terminal-line';
  div.innerHTML = text;
  out.appendChild(div);
  out.scrollTop = out.scrollHeight;
}

async function runCommand() {
  const input = document.getElementById('term-input');
  if (!input) return;

  const raw = input.value.trim();
  if (!raw) return;

  const lang = getCurrentLanguage();
  const cmd = normalizeCommand(raw, lang);

  terminalState.history.push(raw);
  terminalState.historyIndex = terminalState.history.length;

  printLine(`<span class="terminal-prompt">${getTerminalPrompt()}</span> <span class="terminal-command">${escapeHtml(raw)}</span>`);

  if (cmd === 'wget cv.pdf') {
    printLine(getCommandResponse(cmd, lang));
    setTimeout(() => printLine('Connecting... connected.'), 400);
    setTimeout(() => printLine('HTTP request sent, awaiting response... <span class="terminal-green terminal-strong">200 OK</span>'), 800);
    setTimeout(() => {
      printLine('<span class="terminal-green terminal-strong">Download saved. Demo mode: CV file not bundled.</span>');
    }, 1500);
  } else if (cmd === 'clear') {
    const out = getOutputEl();
    if (out) out.innerHTML = '';
  } else if (cmd === 'help') {
    printLine(getHelpText(lang).replace(/\n/g, '<br>'));
  } else if (isKnownCommand(raw, lang)) {
    const response = getCommandResponse(raw, lang);
    if (typeof response === 'string') {
      printLine(response.replace(/\n/g, '<br>'));
    }
  } else {
    printLine(`<span class="terminal-red">bash: ${escapeHtml(raw)}: command not found</span>`);
  }

  input.value = '';
}

function handleHistoryNavigation(event) {
  const input = event.currentTarget;
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (terminalState.historyIndex > 0) {
      terminalState.historyIndex--;
      input.value = terminalState.history[terminalState.historyIndex] || '';
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (terminalState.historyIndex < terminalState.history.length - 1) {
      terminalState.historyIndex++;
      input.value = terminalState.history[terminalState.historyIndex] || '';
    } else {
      terminalState.historyIndex = terminalState.history.length;
      input.value = '';
    }
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
