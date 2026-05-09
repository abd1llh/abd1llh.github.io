const COMMAND_DATA = {
  en: {
    whoami: `Abdallah Mobaid
Cybersecurity Student @ City University Malaysia
Age: 19 | Syrian 🇸🇾 | Based in Cyberjaya, Malaysia`,

    ls: `<span class="terminal-dir">projects/</span>
<span class="terminal-dir">writeups/</span>
skills.txt
contact.txt`,

    'cat skills.txt': `Python | OSINT | Cryptography
SQL Injection | Web Security | API Security
Linux | Networking | Burp Suite
Home Lab (Proxmox + Home Assistant)`,

    'cat contact.txt': `GitHub:   github.com/abd1llh
Website:  abd1llh.online
Telegram: @abd1llh`,

    'cat projects/web-vuln-lab': `Web Vulnerability Lab
Demonstrates SQL Injection attack & defense
Stack: Python + Flask + SQLite
Link: github.com/abd1llh/web-vuln-lab`,

    neofetch: `       _         _ _ _ _     
  __ _| |__   __| / | | | |__  
 / _\` | '_ \\ / _\` | | | | '_ \\ 
| (_| | |_) | (_| | | | | | | |
 \\__,_|_.__/ \\__,_|_|_|_|_| |_|

OS:       Kali Linux (Red Team)
Host:     Cyberjaya Server
Uptime:   19 years
Packages: 1337 (dpkg)
Shell:    zsh 5.9
Goal:     Offensive Security`,

    'nmap abd1llh.online': `Starting Nmap 7.93 ( https://nmap.org )
Scan report for abd1llh.online (104.21.75.120)
Host is up (0.013s latency).

PORT     STATE SERVICE
<span class="terminal-green">22/tcp   open  ssh</span>
<span class="terminal-green">80/tcp   open  http</span>
<span class="terminal-green">443/tcp  open  https</span>
<span class="terminal-red">1337/tcp open  elite-hacker-backdoor</span>

Nmap done: 1 IP address scanned in 1.42 seconds`,

    sudo: `visitor is not in the sudoers file. <span class="terminal-red terminal-strong">This incident will be reported.</span>`,
    'sudo su': `visitor is not in the sudoers file. <span class="terminal-red terminal-strong">This incident will be reported.</span>`,

    date: () => new Date().toLocaleString('en-GB'),

    history: `Use <span class="terminal-green">↑ / ↓</span> arrow keys to navigate command history.`,

    help: `Available commands:
  whoami       — who am I?
  ls           — list files
  cat [file]   — read file
  neofetch     — system info
  nmap abd1llh.online
  wget cv.pdf  — download CV
  date         — current time
  clear        — clear screen
  help         — this message`,

    clear: '__clear__',

    'wget cv.pdf': `--2026-- https://abd1llh.online/cv.pdf`,

    __intro: `Welcome. Type <span class="terminal-accent">help</span> to see available commands.`,
  },

  ar: {
    whoami: `عبدالله مبيض
طالب أمن سيبراني @ City University Malaysia
العمر: 19 | سوري 🇸🇾 | مقيم في سايبرجايا، ماليزيا`,

    ls: `<span class="terminal-dir">المشاريع/</span>
<span class="terminal-dir">التقارير/</span>
المهارات.txt
التواصل.txt`,

    'cat المهارات.txt': `Python | OSINT | تشفير
SQL Injection | أمن الويب | أمن الـ API
Linux | شبكات | Burp Suite
معمل منزلي (Proxmox + Home Assistant)`,

    'cat التواصل.txt': `GitHub:   github.com/abd1llh
الموقع:   abd1llh.online
تيليجرام: @abd1llh`,

    neofetch: `       _         _ _ _ _     
  __ _| |__   __| / | | | |__  
 / _\` | '_ \\ / _\` | | | | '_ \\ 
| (_| | |_) | (_| | | | | | | |
 \\__,_|_.__/ \\__,_|_|_|_|_| |_|

النظام:  Kali Linux (Red Team)
المضيف:  سيرفر سايبرجايا
المدة:   19 سنة
الحزم:   1337 (dpkg)
الصدفة:  zsh 5.9
الهدف:   الأمن الهجومي`,

    'nmap abd1llh.online': `بدء Nmap 7.93 ( https://nmap.org )
تقرير الفحص لـ abd1llh.online (104.21.75.120)
المضيف يعمل (زمن تأخير 0.013 ثانية).

PORT     STATE SERVICE
<span class="terminal-green">22/tcp   open  ssh</span>
<span class="terminal-green">80/tcp   open  http</span>
<span class="terminal-green">443/tcp  open  https</span>
<span class="terminal-red">1337/tcp open  elite-hacker-backdoor</span>

انتهى الفحص: تم فحص عنوان IP واحد في 1.42 ثانية`,

    sudo: `visitor ليس ضمن ملف sudoers. <span class="terminal-red terminal-strong">سيتم الإبلاغ عن هذه الحادثة.</span>`,
    'sudo su': `visitor ليس ضمن ملف sudoers. <span class="terminal-red terminal-strong">سيتم الإبلاغ عن هذه الحادثة.</span>`,

    date: () => new Date().toLocaleString('ar-SA'),

    history: `استخدم <span class="terminal-green">↑ / ↓</span> للتنقل بين الأوامر السابقة.`,

    help: `الأوامر المتاحة:
  whoami       — من أنا؟
  ls           — عرض الملفات
  cat [ملف]   — قراءة ملف
  neofetch     — معلومات النظام
  nmap abd1llh.online
  wget cv.pdf  — تحميل السيرة الذاتية
  date         — الوقت الحالي
  clear        — مسح الشاشة
  help         — هذه القائمة`,

    clear: '__clear__',

    'wget cv.pdf': `--2026-- https://abd1llh.online/cv.pdf`,

    __intro: `مرحباً. اكتب <span class="terminal-accent">help</span> لعرض الأوامر المتاحة.`,
  }
};

const ALIASES = {
  en: {
    'who am i': 'whoami',
    'list': 'ls',
    'clear': 'clear',
    'help': 'help',
  },
  ar: {
    'من انا': 'whoami',
    'من أنا': 'whoami',
    'عرض': 'ls',
    'مساعدة': 'help',
    'تنظيف': 'clear',
    'مسح': 'clear',
    'تاريخ': 'date',
    'محتويات': 'ls',
  }
};

function getLangBucket(lang) {
  return COMMAND_DATA[lang] ? lang : 'en';
}

export function normalizeCommand(command, lang = 'en') {
  const cleaned = command.trim().replace(/\s+/g, ' ');
  const lower = cleaned.toLowerCase();
  const bucket = getLangBucket(lang);
  return ALIASES[bucket]?.[cleaned] || ALIASES[bucket]?.[lower] || cleaned;
}

export function getTerminalIntro(lang = 'en') {
  return COMMAND_DATA[getLangBucket(lang)].__intro;
}

export function getTerminalPrompt() {
  return 'visitor@abd1llh:~$';
}

export function getTerminalPlaceholder(lang = 'en') {
  return lang === 'ar' ? 'اكتب أمراً...' : 'type a command...';
}

export function getHelpText(lang = 'en') {
  return COMMAND_DATA[getLangBucket(lang)].help;
}

export function getCommandResponse(command, lang = 'en') {
  const bucket = COMMAND_DATA[getLangBucket(lang)];
  const normalized = normalizeCommand(command, lang);
  if (normalized === 'date') {
    return typeof bucket.date === 'function' ? bucket.date() : bucket.date;
  }
  return bucket[normalized];
}

export function isKnownCommand(command, lang = 'en') {
  return Boolean(getCommandResponse(command, lang));
}
