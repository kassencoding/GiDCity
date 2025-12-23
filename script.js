// === TELEGRAM WEB APP ===
const tg = window.Telegram?.WebApp;
if (tg) { 
    tg.ready(); 
    tg.expand(); 
    tg.setHeaderColor('#000000'); 
    tg.enableClosingConfirmation(); 
}

// КЛЮЧИ (Оставляем, могут пригодиться позже, но пока используем быструю логику)
const p1 = "sk-proj-w4jNYPdTaKUhGOhWPB1oWq84k8h7IEb3xlV5EOaVo0cEn_zj7";
const p2 = "8mRQWc90HSrGMRyDTr3fzq6QzT3BlbkFJ6fXocb-odi8HMXcAAoZLx_kb42jOnYYMqzTJkPNzXsIOzGWQx5l7fupzHhTUEUWJT2IvKji9kA";
const OPENAI_API_KEY = p1 + p2;

let map, userMarker, routeLayer;
let selectedImage = null;

// === НАВИГАЦИЯ ===
function goTab(id, btn) {
    // 1. Переключение экранов
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id === 'home' ? 'home-view' : 'screen-' + id)?.classList.add('active');
    
    // Если id='home', это может быть home-view в HTML (проверка на всякий случай)
    if(id === 'home') document.getElementById('home-view').classList.add('active');

    // 2. Переключение кнопок меню
    document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    // 3. Инициализация карты, если перешли на нее
    if (id === 'map') {
        if (!map) initMap();
        setTimeout(() => map.invalidateSize(), 200); 
    }
    
    if(tg) tg.HapticFeedback.selectionChanged();
}

// Функция переключения из кнопок меню (для HTML onclick="switchTab(...)")
function switchTab(tabId) {
    // Совместимость с твоим HTML
    const btnMap = {
        'home': document.querySelector('.dock-item:nth-child(1)'),
        'feed': document.querySelector('.dock-item:nth-child(2)'),
        'wallet': document.querySelector('.dock-item:nth-child(4)'),
        'driver': document.querySelector('.dock-item:nth-child(5)')
    };
    
    // Скрываем все view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Показываем нужный (учитываем ID из твоего HTML)
    if(tabId === 'home') document.getElementById('home-view').classList.add('active');
    else if(tabId === 'feed') document.getElementById('feed-view').classList.add('active');
    else if(tabId === 'wallet') document.getElementById('wallet-view').classList.add('active');
    else if(tabId === 'driver') document.getElementById('driver-view').classList.add('active');
    
    // Подсветка кнопок
    document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
    if(btnMap[tabId]) btnMap[tabId].classList.add('active');
}

// === ЛОГИКА AI КНОПКИ (ИСПРАВЛЕННАЯ) ===
function activateAI() {
    // 1. Переходим на главный экран
    switchTab('home');

    // 2. Находим поле ввода
    const inputField = document.getElementById('chatInput');
    
    // 3. Фокусируемся (открывает клавиатуру)
    if (inputField) {
        inputField.focus();
        // Эффект нажатия
        if(tg) tg.HapticFeedback.impactOccurred('light');
    }
}

// === ЧАТ (ОТПРАВКА И ОТВЕТЫ) ===
// Слушаем Enter в поле ввода
const chatInput = document.getElementById('chatInput');
if(chatInput) {
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendMessage();
    });
}

// Слушаем клик по микрофону (пока как отправка)
const micBtn = document.querySelector('.mic-button');
if(micBtn) micBtn.addEventListener('click', sendMessage);

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (text === "") return;

    // 1. Показываем сообщение пользователя
    addMessageBubble(text, 'user');
    input.value = ''; // Очистить поле

    // 2. Имитация ответа ИИ (задержка для реализма)
    setTimeout(() => {
        aiReply(text);
    }, 800);
}

function addMessageBubble(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg';
    
    if (sender === 'user') {
        msgDiv.style.justifyContent = 'flex-end'; // Сообщение справа
        msgDiv.innerHTML = `<div class="msg-bubble" style="background:var(--accent); color:white; border-radius:18px 18px 4px 18px;">${text}</div>`;
    } else {
        msgDiv.innerHTML = `<div class="ai-avatar">Ai</div><div class="msg-bubble">${text}</div>`;
    }

    // Вставляем в контейнер чата
    let container = document.querySelector('.chat-container');
    if(!container) {
        // Если контейнера нет, создаем его динамически перед панелью
        container = document.createElement('div');
        container.className = 'chat-container';
        const homeView = document.getElementById('home-view');
        const panel = document.querySelector('.order-panel');
        homeView.insertBefore(container, panel);
    }
    
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight; // Прокрутка вниз
    
    if(tg) tg.HapticFeedback.selectionChanged();
}

// Умные ответы (Локальная логика для скорости)
function aiReply(userText) {
    let reply = "Я уточняю детали...";
    const lower = userText.toLowerCase();

    if (lower.includes("привет") || lower.includes("салам")) {
        reply = "Привет! Куда планируете ехать?";
    } else if (lower.includes("цена") || lower.includes("сколько")) {
        reply = "Цену вы можете предложить сами. Просто введите сумму в панели снизу.";
    } else if (lower.includes("поехали")) {
        reply = "Отлично! Заполните адрес и нажмите кнопку 'Поехали'.";
    } else if (lower.includes("адрес") || lower.includes("куда")) {
        reply = "Я вижу ваше местоположение. Введите точку назначения.";
    } else {
        reply = "Понял. Ищем водителя рядом с вами...";
    }

    addMessageBubble(reply, 'ai');
}


// === ЗАКАЗ ===
function startOrder() {
    // Просто пример функции кнопки "Поехали"
    const btn = document.querySelector('.btn-go');
    btn.innerHTML = "Поиск водителей...";
    btn.style.background = "#333";
    
    setTimeout(() => {
        alert("Заказ создан! (Демо)");
        btn.innerHTML = "Поехали";
        btn.style.background = "var(--accent)";
    }, 2000);
}


// === КАРТА (Leaflet) ===
function initMap() {
    map = L.map('map-container', { zoomControl: false }).setView([49.8028, 73.1021], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
    }).addTo(map);
    locateUser();
}

function centerMap() {
    if(!map) initMap();
    locateUser();
}

function locateUser() {
    if(!map) return;
    map.locate({setView: true, maxZoom: 14});
    map.on('locationfound', (e) => {
        if(userMarker) map.removeLayer(userMarker);
        userMarker = L.marker(e.latlng).addTo(map);
        // Создаем кружок точности
        L.circle(e.latlng, e.accuracy/2, { color: '#0a84ff', opacity:0.1 }).addTo(map);
    });
}

// === ЛЕНТА (FEED) ===
// (Оставляем твой код добавления постов без изменений)
const fileInput = document.getElementById('file-input'); // Если есть input type=file
// ... остальной код ленты, если он нужен ...

// === МОДАЛКИ И САЙДБАР ===
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function openModal(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('active');
    }
}
function closeModal(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}
