const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#000000');
}

// === УПРАВЛЕНИЕ ВКЛАДКАМИ ===
function goTab(id, btn) {
    // 1. Скрываем все экраны
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    // 2. Показываем нужный
    document.getElementById('screen-' + id).classList.add('active');
    
    // 3. Подсветка кнопок
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    // 4. Снимаем подсветку с центральной, если ушли с главной
    const aiBtn = document.getElementById('ai-main-btn');
    if (id === 'home') {
        aiBtn.classList.add('active-mode');
    } else {
        aiBtn.classList.remove('active-mode');
    }

    // 5. Убираем фон для Карты, чтобы она была яркой
    const bg = document.getElementById('background-layer');
    bg.style.display = (id === 'map') ? 'none' : 'block';

    // Haptic
    if(tg) tg.HapticFeedback.selectionChanged();
}

// === ЦЕНТРАЛЬНАЯ КНОПКА (AI) ===
const aiBtn = document.getElementById('ai-main-btn');
let pressTimer;
let isLongPress = false;

// Начало нажатия
aiBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Чтобы не было зума
    isLongPress = false;
    
    // Анимация нажатия
    aiBtn.style.transform = "scale(0.9)";
    aiBtn.style.borderColor = "#0a84ff"; 
    
    // Таймер на удержание (500мс)
    pressTimer = setTimeout(() => {
        isLongPress = true;
        if(tg) tg.HapticFeedback.impactOccurred('heavy');
        // Визуальный эффект "Слушаю"
        aiBtn.style.boxShadow = "0 0 30px #0a84ff";
        aiBtn.style.borderColor = "#0a84ff";
    }, 500);
});

// Конец нажатия
aiBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    clearTimeout(pressTimer);
    
    // Сброс стиля
    aiBtn.style.transform = "scale(1)";
    aiBtn.style.borderColor = "rgba(255,255,255,0.1)";
    aiBtn.style.boxShadow = "0 8px 25px rgba(0,0,0,0.5)";

    if (isLongPress) {
        // --- БЫЛО УДЕРЖАНИЕ (ГОЛОСОВОЙ ВВОД) ---
        handleVoiceCommand();
    } else {
        // --- БЫЛ ПРОСТОЙ КЛИК (ПЕРЕХОД НА ГЛАВНУЮ) ---
        goTab('home', null);
    }
});

// Имитация ответа ИИ
function handleVoiceCommand() {
    // Если мы не на экране Home, переходим туда
    const homeScreen = document.getElementById('screen-home');
    if (!homeScreen.classList.contains('active')) {
        goTab('home', null);
    }

    const chat = document.querySelector('.chat-container');
    
    // Добавляем сообщение
    chat.innerHTML += `
        <div class="ai-msg">
            <div class="ai-avatar">Ai</div>
            <div class="msg-bubble">Принято: ЖД Вокзал. Бюджет 1000₸.</div>
        </div>`;
    chat.scrollTop = chat.scrollHeight; // Автоскролл вниз

    // Заполняем поля
    document.getElementById('inp-dest').value = "ЖД Вокзал";
    document.getElementById('inp-price').value = "1000";
    
    if(tg) tg.HapticFeedback.notificationOccurred('success');
}

// === ОСТАЛЬНОЕ ===

// Выбор тарифа
function setTariff(el) {
    document.querySelectorAll('.tariff').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
    if(tg) tg.HapticFeedback.selectionChanged();
}

// Модальные окна
const overlay = document.getElementById('modal-overlay');
function openModal(id) {
    // Скрываем все открытые карточки
    document.querySelectorAll('.modal-card').forEach(c => c.classList.remove('active'));
    // Показываем оверлей
    overlay.classList.remove('hidden');
    // Показываем конкретную карточку
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    if(tg) tg.HapticFeedback.impactOccurred('light');
}

// Закрытие
document.querySelectorAll('.close-m').forEach(b => {
    b.addEventListener('click', () => overlay.classList.add('hidden'));
});
overlay.addEventListener('click', (e) => {
    if(e.target === overlay) overlay.classList.add('hidden');
});

// Сайдбар настроек
const sidebar = document.getElementById('sidebar-settings');
document.getElementById('btn-settings').addEventListener('click', () => sidebar.classList.add('open'));
function closeSidebar() { sidebar.classList.remove('open'); }

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Центральная кнопка активна по умолчанию
    aiBtn.classList.add('active-mode');
});
