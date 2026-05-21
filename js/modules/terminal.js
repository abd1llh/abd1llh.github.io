import {
    getCommandResponse,
    getHelpText,
    getTerminalIntro,
    getTerminalPlaceholder,
    getTerminalPrompt,
    isKnownCommand,
    normalizeCommand,
    getAllCommands
} from '../data/commands.js';
import { getCurrentLanguage } from './language.js';
let currentPath = '~';
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
        handleAutocomplete(event);
    });

    input.addEventListener('focus', () => {
        if (!terminalState.opened) openTerminal();
        /*
          Bug 1 Fix: When terminal input is focused on mobile,
          force an immediate viewport sync so --keyboard-offset
          updates BEFORE the keyboard finishes animating up.
          We fire syncViewportVars once immediately, then once more
          after a short delay (keyboard animation ~300ms).
        */
        syncViewportVars();
        setTimeout(syncViewportVars, 350);
        requestAnimationFrame(() => {
            terminal.scrollIntoView({ block: 'end', behavior: 'smooth' });
        });
    });

    window.addEventListener('languagechange', updateTerminalLocale);
    updateTerminalLocale();

    /*
      Bug 4 Fix: When screen is resized (e.g. device rotation),
      re-evaluate whether to show short or long prompt.
      app.js dispatches 'promptresize' on window.resize.
    */
    window.addEventListener('promptresize', updateTerminalLocale);


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
    const prompts = document.querySelectorAll('.terminal-prompt');

    /*
      Bug 4 Fix: On narrow screens (≤420px), use a short prompt '$' to prevent
      the prompt from crowding the input field. On wider screens, use the full prompt.
    */
    const promptText = getPromptText();
    prompts.forEach((prompt) => {
        prompt.textContent = promptText;
    });

    if (input) {
        input.placeholder = getTerminalPlaceholder(getCurrentLanguage());
    }
}

/* Bug 4: Returns short prompt on narrow screens, full prompt otherwise */
function getPromptText() {
    const isNarrow = window.innerWidth <= 420;
    if (isNarrow) return '$';
    return `visitor@abd1llh:${currentPath}$`;
}

function syncViewportVars() {
    const vv = window.visualViewport;
    const height = vv ? vv.height : window.innerHeight;
    const keyboardOffset = vv
        ? Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0))
        : 0;

    document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`);
    document.documentElement.style.setProperty('--keyboard-offset', `${Math.round(keyboardOffset)}px`);
    document.documentElement.style.setProperty('--safe-top', `${Math.round(vv?.offsetTop ?? 0)}px`);
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
            if (terminal) {
                terminal.scrollIntoView({
                    block: 'end',
                    behavior: 'smooth'
                });
            }
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
    /*
      Bug 5 Fix: Use scrollTo with smooth behavior instead of directly
      setting scrollTop. This gives a fluid animation as output appears.
      We also use requestAnimationFrame to ensure DOM has painted first.
    */
    requestAnimationFrame(() => {
        out.scrollTo({ top: out.scrollHeight, behavior: 'smooth' });
    });
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

    if (cmd === 'pwd') {

        printLine(currentPath);

    } else if (
        cmd.startsWith('cd ')
    ) {

        const target =
            cmd.replace('cd ', '')
            .trim();

        if (target === '..') {

            currentPath = '~';

        } else if (
            target === 'projects'
        ) {

            currentPath =
                '~/projects';

        } else if (
            target === 'writeups'
        ) {

            currentPath =
                '~/writeups';

        } else {

            printLine(`
       <span class="terminal-red">
        cd: no such directory:
       ${escapeHtml(target)}
        </span>
        `);

            input.value = '';

            return;
        }

        updateTerminalLocale();

    } else if (cmd === 'wget cv.pdf') {
        printLine(getCommandResponse(cmd, lang));
        setTimeout(() => printLine('Connecting... connected.'), 400);
        setTimeout(() => printLine('HTTP request sent, awaiting response... <span class="terminal-green terminal-strong">200 OK</span>'), 800);
        setTimeout(() => {
            printLine('<span class="terminal-green terminal-strong">Download saved. Demo mode: CV file not bundled.</span>');
        }, 1500);
    } else if (
        cmd === 'exit'
    ) {

        closeTerminal();


    } else if (cmd === 'clear') {
        const out = getOutputEl();
        if (out) out.innerHTML = '';
    } else if (cmd === 'help') {
        printLine(getHelpText(lang).replace(/\n/g, '<br>'));


    } else if (
        cmd.startsWith('cat ')
    ) {

        const filename =
            cmd.replace('cat ', '')
            .trim();

        const files =
            FILESYSTEM[currentPath];

        if (
            files &&
            files[filename]
        ) {

            printLine(
                files[filename]
                .replace(/\n/g, '<br>')
            );

        } else {

            printLine(`
<span class="terminal-red">
cat: ${escapeHtml(filename)}:
No such file
</span>
    `);

        }
    } else if (cmd === 'ls') {

        if (currentPath === '~') {

            printLine(`
<span class="terminal-dir">
projects/
</span>

<span class="terminal-dir">
writeups/
</span>

skills.txt
contact.txt
    `);

        } else if (
            currentPath === '~/projects'
        ) {

            printLine(`
<span class="terminal-dir">
web-vuln-lab/
</span>

<span class="terminal-dir">
portfolio-v2/
</span>

<span class="terminal-dir">
api-tester/
</span>
    `);

        } else if (
            currentPath === '~/writeups'
        ) {

            printLine(`
xss-report.md
sqli-lab.md
api-pentest.md
    `);

        }





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

function handleAutocomplete(event) {

    if (event.key !== 'Tab') return;

    event.preventDefault();

    const input = event.currentTarget;

    const lang =
        getCurrentLanguage();

    const commands =
        getAllCommands(lang);

    const value =
        input.value
        .trim()
        .toLowerCase();

    if (!value) return;

    const matches =
        commands.filter(cmd =>
            cmd.toLowerCase()
            .startsWith(value)
        );

    if (!matches.length) return;

    // Match واحد → كمل كامل
    if (matches.length === 1) {

        input.value =
            matches[0];

        return;
    }

    // إيجاد الجزء المشترك
    let common =
        matches[0];

    for (let i = 1; i < matches.length; i++) {

        while (!matches[i]
            .startsWith(common)
        ) {

            common =
                common.slice(0, -1);

            if (!common) break;
        }
    }

    // إذا فيه جزء إضافي → كمله
    if (
        common.length >
        value.length
    ) {

        input.value =
            common;

        return;
    }

    // إذا ما فيه → اطبع suggestions
    printLine(`
<span class="terminal-accent">
${matches.join('    ')}
</span>
  `);
}
const FILESYSTEM = {

    '~': {
        'skills.txt': `Python
OSINT
API Security
Linux
Networking`,

        'contact.txt': `GitHub: github.com/abd1llh
Telegram: @abd1llh`
    },

    '~/writeups': {

        'xss-report.md': `# Reflected XSS

Discovered reflected XSS
in search parameter.

Impact:
- session theft
- phishing

Status:
patched.`,

        'sqli-lab.md': `# SQL Injection Lab

Boolean-based SQLi
identified in login form.`,

        'api-pentest.md': `# API Pentest

Tested JWT validation
and rate limiting.`
    }

};

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}