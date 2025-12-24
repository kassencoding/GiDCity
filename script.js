// === ИНИЦИАЛИЗАЦИЯ ===
const tg = window.Telegram?.WebApp;
if(tg) { tg.ready(); tg.expand(); }

// Переменные карт
let map, cityMap;
let isPanelCollapsed = false;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Показываем Авторизацию
    document.getElementById('auth-screen').style.display = 'flex';
    
    // 2. Инициализируем обработчики для панели
    initPanelLogic();
});

// === ЛОГИКА АВТОРИЗАЦИИ ===
function sendSms() {
    const codeBlock = document.getElementById('sms-block');
    const btn = document.getElementById('btn-login-action');
    
    if(codeBlock.style.display === 'none') {
        // Шаг 1: Показать поле кода
        codeBlock.style.display = 'block';
        btn.innerText = "Войти";
        document.getElementById('auth-code').focus(); // Автофокус
    } else {
        // Шаг 2: Вход
        document.getElementById('auth-screen').style.display = 'none';
        switchTab('home'); // Сразу домой
    }
}
function continueAsGuest() {
    document.getElementById('auth-screen').style.display = 'none';
    switchTab('feed'); // Гости только в ленту
}

// === ЛОГИКА ГЛАВНОГО ЭКРАНА (ПАНЕЛЬ И КАРТА) ===
function initPanelLogic() {
    // Клик по карте (или фону) сворачивает/разворачивает панель
    const mapContainer = document.getElementById('map-container');
    const panel = document.getElementById('main-panel');
    
    // При клике на фон (карту)
    mapContainer.addEventListener('click', () => {
        isPanelCollapsed = !isPanelCollapsed;
        if(isPanelCollapsed) {
            panel.classList.add('collapsed');
        } else {
            panel.classList.remove('collapsed');
        }
    });
}
function togglePanelState() {
    const panel = document.getElementById('main-panel');
    panel.classList.toggle('collapsed');
    isPanelCollapsed = panel.classList.contains('collapsed');
}

// Выбор тарифа
function selectTariff(el) {
    document.querySelectorAll('.tariff-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

// === КАРТЫ ===
function initMap() {
    if(!map) {
        map = L.map('map-container', { zoomControl: false, attributionControl: false }).setView([49.80, 73.10], 13);
        // ТЕМНАЯ КАРТА ПО УМОЛЧАНИЮ
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);
        
        // Обработчик клика по карте для сворачивания панели
        map.on('click', () => {
            togglePanelState();
        });
    }
    setTimeout(() => map.invalidateSize(), 200);
}

function initCityMap() {
    if(!cityMap) {
        cityMap = L.map('city-map-container', { zoomControl: false, attributionControl: false }).setView([49.80, 73.10], 13);
        // Тоже темная карта для города
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(cityMap);
    }
    setTimeout(() => cityMap.invalidateSize(), 200);
}

function centerMap() {
    // Имитация геолокации
    if(map) map.flyTo([49.80, 73.10], 14);
}

// === НАВИГАЦИЯ (TABS) ===
function switchTab(id) {
    // Скрываем все view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
    
    // Активируем нужный
    const target = document.getElementById(id + '-view');
    if(target) target.classList.add('active');
    
    // Обновляем иконки
    if(id === 'home') setTimeout(initMap, 100);
    if(id === 'city') {
        document.querySelector('[onclick="switchTab(\'city\')"]').classList.add('active');
        // По умолчанию открываем Афишу, но карта уже готова
    }
    if(id === 'feed') document.querySelector('[onclick="switchTab(\'feed\')"]').classList.add('active');
    if(id === 'wallet') document.querySelector('[onclick="switchTab(\'wallet\')"]').classList.add('active');
}

// === ЛОГИКА ГОРОДА (АФИША / КАРТА) ===
function switchCityTab(tab) {
    // Кнопки
    document.querySelectorAll('.c-tab').forEach(b => b.classList.remove('active'));
    
    // Контент
    document.getElementById('tab-billboard').style.display = 'none';
    document.getElementById('tab-citymap').style.display = 'none'; // Скрываем через display, чтобы не конфликтовали
    
    if(tab === 'billboard') {
        document.querySelectorAll('.c-tab')[0].classList.add('active');
        document.getElementById('tab-billboard').style.display = 'block';
    } else {
        document.querySelectorAll('.c-tab')[1].classList.add('active');
        document.getElementById('tab-citymap').style.display = 'block';
        initCityMap();
    }
}

// === ЛЕНТА И ПОСТЫ ===
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    setTimeout(() => document.getElementById(id).querySelector('.modal-card') || document.getElementById(id).classList.add('active'), 10);
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById(id).classList.add('hidden');
}

// Создание поста (Фото превью)
const postImgInput = document.getElementById('post-img-input');
if(postImgInput) {
    postImgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('img-preview-area').classList.remove('hidden');
                document.getElementById('img-preview-tag').src = ev.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
}
function removeImg() {
    document.getElementById('post-img-input').value = "";
    document.getElementById('img-preview-area').classList.add('hidden');
}
function publishPost() {
    const text = document.getElementById('new-post-text').value;
    if(!text) return alert("Напишите текст!");
    
    // Добавляем пост в ленту (визуально)
    const stream = document.getElementById('feed-stream');
    const newPost = `
    <div class="post-card">
        <div class="post-head">
            <div class="avatar-mini">Я</div>
            <div class="ph-info"><span class="ph-name">Вы</span><span class="ph-time">Только что</span></div>
            <button class="icon-btn-text text-danger" onclick="deletePost(this)"><ion-icon name="trash-outline"></ion-icon></button>
        </div>
        <div class="post-text">${text}</div>
        ${!document.getElementById('img-preview-area').classList.contains('hidden') ? '<div style="margin-top:10px; border-radius:10px; overflow:hidden;"><img src="'+document.getElementById('img-preview-tag').src+'" style="width:100%"></div>' : ''}
        <div class="post-actions">
            <button class="act-item"><ion-icon name="heart-outline"></ion-icon> 0</button>
            <button class="act-item"><ion-icon name="chatbubble-outline"></ion-icon> 0</button>
        </div>
    </div>`;
    
    stream.insertAdjacentHTML('afterbegin', newPost);
    closeModal('create-post-modal');
    document.getElementById('new-post-text').value = "";
    removeImg();
}

function deletePost(btn) {
    if(confirm("Удалить пост?")) {
        btn.closest('.post-card').remove();
    }
}
function toggleLike(btn) {
    const icon = btn.querySelector('ion-icon');
    if(icon.name === 'heart-outline') {
        icon.name = 'heart';
        icon.style.color = '#ff453a';
    } else {
        icon.name = 'heart-outline';
        icon.style.color = 'white';
    }
}

// === НАСТРОЙКИ (НОВЫЙ ЭКРАН) ===
function openSettings() {
    document.getElementById('settings-view').classList.add('active');
}
function closeSettings() {
    document.getElementById('settings-view').classList.remove('active');
}
function openSubSetting(id) {
    document.getElementById(id).classList.add('active');
}
function closeSubSetting(id) {
    document.getElementById(id).classList.remove('active');
}

// Редактирование профиля
function saveProfile() {
    const newName = document.getElementById('edit-name-inp').value;
    document.getElementById('settings-name-preview').innerText = newName;
    alert("Профиль сохранен!");
    closeSubSetting('profile-edit');
}
