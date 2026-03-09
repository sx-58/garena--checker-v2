const PASSCODE = "731058";
let inputPass = "";
let accounts = [];
let hits = [];
let userHasScrolledUp = false;

const lockScreen = document.getElementById('lock-screen');
const dots = document.querySelectorAll('.dot');
const dotsContainer = document.getElementById('dots-container');
const fileInput = document.getElementById('fileInput');
const startBtn = document.getElementById('startBtn');
const logDisplay = document.getElementById('log-display');

// --- AUTENTICAÇÃO ---
function addDigit(n) {
    if (inputPass.length < 6) {
        inputPass += n;
        updateDots();
        if (inputPass.length === 6) setTimeout(validatePass, 200);
    }
}

function clearPasscode() { inputPass = ""; updateDots(); }

function updateDots() { 
    dots.forEach((dot, i) => i < inputPass.length ? dot.classList.add('active') : dot.classList.remove('active')); 
}

function validatePass() {
    if (inputPass === PASSCODE) {
        lockScreen.style.opacity = "0"; 
        lockScreen.style.pointerEvents = "none";
        setTimeout(() => lockScreen.remove(), 600);
    } else {
        dotsContainer.classList.add('shake'); 
        inputPass = "";
        setTimeout(() => { 
            dotsContainer.classList.remove('shake'); 
            updateDots(); 
        }, 400);
    }
}

// --- FUNÇÕES DE SAÍDA ---
async function copyHits() {
    if (hits.length === 0) return;
    const textToCopy = hits.join('\n');

    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            showCopyFeedback();
            return;
        } catch (err) { console.warn("Erro no Clipboard API"); }
    }

    // Fallback para mobile/HTTP
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showCopyFeedback();
}

function showCopyFeedback() {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[SISTEMA]</span><span class="log-msg success">>>> DADOS COPIADOS!</span>`;
    logDisplay.appendChild(entry);
    logDisplay.scrollTop = logDisplay.scrollHeight;
}

function exportHits() {
    if (hits.length === 0) return;
    const blob = new Blob([hits.join('\n')], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `HITS_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
}

// --- ENGINE DO CHECKER ---
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('filename-preview').innerText = file.name.toUpperCase();
        const reader = new FileReader();
        reader.onload = (res) => {
            accounts = res.target.result.split('\n').map(l => l.trim()).filter(l => l.includes(':'));
            document.getElementById('stat-total').innerText = accounts.length;
            startBtn.disabled = accounts.length === 0;
        };
        reader.readAsText(file);
    }
});

startBtn.addEventListener('click', () => {
    document.getElementById('setup-view').classList.add('hidden');
    document.getElementById('console-view').classList.remove('hidden');
    runChecker();
});

async function runChecker() {
    let h = 0, f = 0; 
    const start = Date.now();
    document.getElementById('online-text').innerText = 'SCANNING...';

    for (let i = 0; i < accounts.length; i++) {
        const isHit = Math.random() < 0.03; // Chance simulada de 3%
        const [user, pass] = accounts[i].split(':');
        const time = new Date().toLocaleTimeString([], { hour12: false });
        
        document.getElementById('stat-speed').innerText = `${((i + 1) / ((Date.now() - start) / 1000 || 0.1)).toFixed(2)}/s`;

        await new Promise(r => setTimeout(r, 80 + Math.random() * 150));

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        if (isHit) {
            h++; hits.push(accounts[i]);
            document.getElementById('stat-hits').innerText = h;
            entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-msg success">HIT: ${user}:${pass}</span>`;
        } else {
            f++; document.getElementById('stat-failed').innerText = f;
            entry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-msg error">FAIL: ${user}:${pass}</span>`;
        }
        logDisplay.appendChild(entry);
        if (logDisplay.childNodes.length > 80) logDisplay.removeChild(logDisplay.firstChild);
        if (!userHasScrolledUp) logDisplay.scrollTop = logDisplay.scrollHeight;
    }
    document.getElementById('finish-footer').style.display = 'flex';
    document.getElementById('online-text').innerText = 'CONCLUÍDO';
}

logDisplay.addEventListener('scroll', () => {
    userHasScrolledUp = (logDisplay.scrollHeight - (logDisplay.scrollTop + logDisplay.clientHeight) > 100);
});
