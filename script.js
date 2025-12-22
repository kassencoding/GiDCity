const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#000000');
    tg.enableClosingConfirmation();
}

// === УПРАВЛЕНИЕ ВКЛАДКАМИ ===
function goTab(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('screen-' + id);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    // Логика кнопки AI
    const aiBtn = document.getElementById('ai-main-btn');
    if (id === 'home') {
        aiBtn.classList.add('active-mode');
    } else {
        aiBtn.classList.remove('active-mode');
    }

    // Убираем сетку на карте для четкости
    const bg = document.getElementById('background-layer');
    if (bg) bg.style.opacity = (id === 'map') ? '0' : '1';

    if(tg) tg.HapticFeedback.selectionChanged();
}

// === КНОПКА AI (ГОЛОС) ===
const aiBtn = document.getElementById('ai-main-btn');
let pressTimer;
let isLongPress = false;

aiBtn.addEventListener('touchstart', (e) => {
    isLongPress = false;
    // Анимация нажатия
    aiBtn.style.transform = "scale(0.9) translateY(-10px)"; 
    
    pressTimer = setTimeout(() => {
        isLongPress = true;
        if(tg) tg.HapticFeedback.impactOccurred('heavy');
        aiBtn.classList.add('listening'); 
    }, 600);
});

aiBtn.addEventListener('touchend', (e) => {
    clearTimeout(pressTimer);
    aiBtn.style.transform = ""; 
    aiBtn.classList.remove('listening');

    if (isLongPress) {
        handleVoiceCommand();
    } else {
        goTab('home', null);
    }
});

function handleVoiceCommand() {
    if (!document.getElementById('screen-home').classList.contains('active')) {
        goTab('home', null);
    }
    const chat = document.querySelector('.chat-container');
    setTimeout(() => {
        chat.innerHTML += `
            <div class="ai-msg">
                <div class="ai-avatar">Ai</div>
                <div class="msg-bubble">Маршрут построен: City Mall. Погода сложная, ищу опытных водителей.</div>
            </div>`;
        chat.scrollTop = chat.scrollHeight;
        document.getElementById('inp-dest').value = "City Mall";
        if(tg) tg.HapticFeedback.notificationOccurred('success');
    }, 500);
}

// === ТАРИФЫ ===
function setTariff(el) {
    document.querySelectorAll('.tariff').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
    if(tg) tg.HapticFeedback.selectionChanged();
}

// === МОДАЛКИ ===
function openModal(id) {
    document.querySelectorAll('.modal-card').forEach(c => c.classList.remove('active'));
    document.getElementById('modal-overlay').classList.remove('hidden');
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    if(tg) tg.HapticFeedback.impactOccurred('medium');
}

// Закрытие модалок
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-m') || e.target.id === 'modal-overlay') {
        document.getElementById('modal-overlay').classList.add('hidden');
    }
});

// === САЙДБАР ===
function openSidebar() { document.getElementById('sidebar-settings').classList.add('open'); }
function closeSidebar() { document.getElementById('sidebar-settings').classList.remove('open'); }

// Старт
document.addEventListener('DOMContentLoaded', () => {
    const ai = document.getElementById('ai-main-btn');
    if(ai) ai.classList.add('active-mode');
});
