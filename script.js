// === TELEGRAM WEB APP ===
const tg = window.Telegram?.WebApp;
if (tg) { 
    tg.ready(); 
    tg.expand(); 
    tg.setHeaderColor('#000000'); 
    tg.enableClosingConfirmation(); 
}

// === ПЕРЕМЕННЫЕ ===
let map, cityMap; // Разные переменные для двух карт
let userMarker;
let isGuest = false; // Флаг гостя
let currentLang = 'ru'; // Текущий язык

// Словарь переводов
const translations = {
    ru: {
        tab_city: "Город",
        tab_feed: "Лента",
        tab_wallet: "Кошелек",
        tab_driver: "Водитель",
        btn_go: "Поехали",
        auth_title: "Aitax ID",
        guest_link: "Продолжить как гость"
    },
    kz: {
        tab_city: "Қала",
        tab_feed: "Желі",
        tab_wallet: "Әмиян",
        tab_driver: "Жүргізуші",
        btn_go: "Кеттік",
        auth_title: "Aitax ID",
        guest_link: "Қонақ ретінде кіру"
    }
};

// === АВТОРИЗАЦИЯ (AUTH) ===

// Показываем экран входа при старте
document.addEventListener("DOMContentLoaded", () => {
    // По умолчанию показываем экран авторизации
    document.getElementById('auth-screen').style.display = 'flex';
});

// Логика отправки СМС
function sendSms() {
    const phone = document.getElementById('auth-phone').value;
    const name = document.getElementById('auth-name').value;
    
    if (phone.length < 10 || name.length < 2) {
        if(tg) tg.showAlert("Введите имя и номер!");
        else alert("Введите имя и номер!");
        return;
    }

    const btn = document.getElementById('btn-login-action');
    const smsBlock = document.getElementById('sms-block');

    if (smsBlock.style.display === 'none') {
        // Шаг 1: Показать поле СМС
        smsBlock.style.display = 'block';
        btn.innerText = "Войти";
        if(tg) tg.showAlert(`Код отправлен на ${phone}`);
    } else {
        // Шаг 2: Проверка кода (Имитация)
        completeLogin(name, phone);
    }
}

function completeLogin(name, phone) {
    document.getElementById('auth-screen').style.display = 'none';
    isGuest = false;
    
    // Обновляем данные в профиле
    document.getElementById('profile-name').innerText = name;
    document.getElementById('profile-phone').innerText = phone;
    
    switchTab('home'); // Пускаем в приложение
}

function continueAsGuest() {
    document.getElementById('auth-screen').style.display = 'none';
    isGuest = true;
    document.getElementById('profile-name').innerText = "Гость";
    
    // Гостям можно ТОЛЬКО в Ленту
    switchTab('feed');
    
    if(tg) tg.showAlert("Режим гостя: Доступна только Лента");
}

// === ГЛАВНАЯ НАВИГАЦИЯ ===
function switchTab(tabId) {
    // ПРОВЕРКА ГОСТЯ
    if (isGuest && tabId !== 'feed') {
        // Если гость пытается уйти с ленты -> просим авторизацию
        document.getElementById('auth-screen').style.display = 'flex';
        return;
    }

    // 1. Скрываем все экраны
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // 2. Убираем подсветку у кнопок
    document.querySelectorAll('.dock-item').forEach(item => {
        item.classList.remove('active');
    });
    // Снимаем подсветку с кнопки AI отдельно
    document.querySelector('.ai-button').classList.remove('active');

    // 3. Логика переключения
    const dockItems = document.querySelectorAll('.dock-item');
    // dockItems[0] = City, [1] = Feed, [2] = Wallet, [3] = Driver
    
    if (tabId === 'city') {
        document.getElementById('city-view').classList.add('active');
        dockItems[0].classList.add('active');
        // Инициализируем карту города, если открыта вкладка карты
        setTimeout(() => { if(cityMap) cityMap.invalidateSize(); }, 100);
    } 
    else if (tabId === 'feed') {
        document.getElementById('feed-view').classList.add('active');
        dockItems[1].classList.add('active');
    } 
    else if (tabId === 'home') {
        document.getElementById('home-view').classList.add('active');
        document.querySelector('.ai-button').classList.add('active');
        
        // Карта такси
        setTimeout(() => { 
            if(!map) initMap(); 
            else map.invalidateSize(); 
        }, 100);
    } 
    else if (tabId === 'wallet') {
        document.getElementById('wallet-view').classList.add('active');
        dockItems[2].classList.add('active');
    } 
    else if (tabId === 'driver') {
        document.getElementById('driver-view').classList.add('active');
        dockItems[3].classList.add('active');
    }

    if(tg) tg.HapticFeedback.selectionChanged();
}

// === РАЗДЕЛ ГОРОД (Вкладки) ===
function switchCityTab(subTab) {
    // Кнопки
    document.querySelectorAll('.c-tab').forEach(b => b.classList.remove('active'));
    // Контент
    document.querySelectorAll('.city-content').forEach(c => c.classList.remove('active'));

    if (subTab === 'billboard') {
        document.getElementById('tab-billboard').classList.add('active');
        document.querySelectorAll('.c-tab')[0].classList.add('active');
    } else {
        document.getElementById('tab-citymap').classList.add('active');
        document.querySelectorAll('.c-tab')[1].classList.add('active');
        // Инициализация карты города
        setTimeout(() => initCityMap(), 100);
    }
}

// === КАРТЫ (LEAFLET) ===
function initMap() { // Карта такси
    const mapDiv = document.getElementById('map-container');
    if(mapDiv && !map) {
        map = L.map('map-container', { zoomControl: false }).setView([49.80, 73.10], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '', maxZoom: 19
        }).addTo(map);
        centerMap();
    }
}

function initCityMap() { // Карта города (заведения)
    const mapDiv = document.getElementById('city-map-container');
    if(mapDiv && !cityMap) {
        cityMap = L.map('city-map-container', { zoomControl: false }).setView([49.80, 73.10], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { // Светлая для города
            attribution: '', maxZoom: 19
        }).addTo(cityMap);
        
        // Пример меток
        L.marker([49.805, 73.09]).addTo(cityMap).bindPopup("Кинотеатр Ленина");
        L.marker([49.81, 73.11]).addTo(cityMap).bindPopup("Сити Молл");
    }
}

function centerMap() {
    if(!map) { initMap(); return; }
    map.locate({setView: true, maxZoom: 14});
    map.on('locationfound', (e) => {
        if(userMarker) map.removeLayer(userMarker);
        userMarker = L.marker(e.latlng).addTo(map);
    });
}

// === ЧАТ И AI ===
// Обработка кнопки внутри инпута
const chatInp = document.getElementById('chatInput');
if(chatInp) {
    chatInp.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addMessageBubble(text, 'user');
    input.value = '';

    setTimeout(() => aiReply(text), 800);
}

function addMessageBubble(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg';

    if (sender === 'user') {
        msgDiv.style.justifyContent = 'flex-end';
        msgDiv.innerHTML = `<div class="msg-bubble" style="background:var(--accent); color:white;">${text}</div>`;
    } else {
        msgDiv.innerHTML = `<div class="ai-avatar">Ai</div><div class="msg-bubble">${text}</div>`;
    }

    let container = document.querySelector('.chat-container');
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    if(tg) tg.HapticFeedback.selectionChanged();
}

function aiReply(text) {
    let reply = "Ищу варианты...";
    const lower = text.toLowerCase();
    
    if(lower.includes("привет")) reply = "Салем! Куда поедем?";
    else if(lower.includes("розовое")) reply = "Включил тариф Lady. Женщина водитель скоро приедет.";
    else if(lower.includes("кафе")) reply = "Показываю лучшие кафе на карте города.";
    
    addMessageBubble(reply, 'ai');
}

// === КОШЕЛЕК И МОДАЛКИ ===
function openWalletModal(type) {
    const modal = document.getElementById('wallet-action-modal');
    const title = document.getElementById('wallet-modal-title');
    const qrView = document.getElementById('qr-view');
    const inputs = document.getElementById('wallet-inputs');
    
    openModal('wallet-action-modal');

    qrView.style.display = 'none';
    inputs.style.display = 'block';

    if (type === 'deposit') {
        title.innerText = "Пополнение";
    } else if (type === 'transfer') {
        title.innerText = "Перевод";
    } else if (type === 'qr') {
        title.innerText = "Сканировать QR";
        qrView.style.display = 'block';
        inputs.style.display = 'none';
    }
}

// === ЛЕНТА (THREADS) ===
function sharePost(id) {
    // Имитация шаринга -> открывает создание поста (как в ТЗ)
    if(tg) tg.HapticFeedback.impactOccurred('medium');
    // По ТЗ: "карточка для нового поста должна открывать по кнопке-панель Поделиться"
    // Но обычно Поделиться = Share, а Создать = Create.
    // Реализуем логику: кнопка Share открывает нативный выбор или ссылку
    
    // Но если задача "По кнопке поделиться... открывать панель", то вот:
    const composer = document.querySelector('.feed-composer textarea');
    composer.focus();
    composer.scrollIntoView({behavior: "smooth"});
}

function openComments(postId) {
    openModal('thread-view-modal');
}

// === ВОДИТЕЛЬ (ТОРГ) ===
function openOrderNegotiation(id) {
    openModal('order-negotiation-modal');
}

function offerMyPrice() {
    const price = prompt("Введите вашу цену:");
    if(price) {
        document.querySelector('.offer-price-display').innerText = price + " ₸";
        if(tg) tg.showAlert("Цена предложена клиенту");
    }
}

function acceptPrice() {
    closeModal('order-negotiation-modal');
    if(tg) tg.showAlert("Вы взяли заказ!");
}

// === НАСТРОЙКИ ===
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toggleLanguage() {
    currentLang = currentLang === 'ru' ? 'kz' : 'ru';
    document.getElementById('lang-label').innerText = `Язык: ${currentLang === 'ru' ? 'Русский' : 'Қазақша'}`;
    
    // Применяем переводы (Демо)
    // В реальном проекте тут нужно пройтись по всем data-i18n атрибутам
    if(tg) tg.showAlert(`Язык изменен на ${currentLang.toUpperCase()}`);
}

function toggleTheme() {
    // Демо смены темы
    const body = document.body;
    if (body.style.getPropertyValue('--bg-gradient').includes('1a1a1a')) {
         // Светлая/Цветная тема
         body.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #2b0042, #4c0045)');
    } else {
        // Дефолтная тема
        body.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)');
    }
}

// Загрузка аватарки
const avatarInput = document.getElementById('avatar-input');
if(avatarInput) {
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgUrl = e.target.result;
                // Обновляем аватарки в меню и в ленте
                document.getElementById('sidebar-avatar').innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            }
            reader.readAsDataURL(file);
        }
    });
}

// === ОБЩИЕ ФУНКЦИИ МОДАЛОК ===
function openModal(id) {
    const m = document.getElementById(id);
    if(m) { 
        m.classList.remove('hidden'); 
        setTimeout(() => m.classList.add('active'), 10); // Hack for transition
    }
}
function closeModal(id) {
    const m = document.getElementById(id);
    if(m) { 
        m.classList.remove('active'); 
        setTimeout(() => m.classList.add('hidden'), 300); 
    }
}
