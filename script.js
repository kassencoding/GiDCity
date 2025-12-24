// --- КАРТЫ (Leaflet) ---
let homeMap, cityMap;

function initMaps() {
    // Карта на главном экране
    if (document.getElementById('map-container')) {
        homeMap = L.map('map-container', { zoomControl: false }).setView([49.80, 73.10], 13); // Караганда
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(homeMap);
        
        // Маркер пользователя (пример)
        L.marker([49.80, 73.10]).addTo(homeMap).bindPopup("Я здесь").openPopup();
    }

    // Карта в разделе "Город"
    if (document.getElementById('city-map-container')) {
        cityMap = L.map('city-map-container', { zoomControl: false }).setView([49.80, 73.10], 12);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(cityMap);
    }
}

// Запускаем карты при загрузке
window.addEventListener('load', initMaps);

// --- НАВИГАЦИЯ (ТАБЫ) ---
function switchTab(tabName) {
    // Скрываем все views
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    // Убираем активность с кнопок док-бара
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active'));
    
    // Показываем нужный view
    const viewId = tabName + '-view';
    const viewEl = document.getElementById(viewId);
    if(viewEl) viewEl.classList.add('active');

    // Обновляем карту если перешли на вкладку карты или домой (чтобы исправить серый экран)
    setTimeout(() => {
        if(tabName === 'home' && homeMap) homeMap.invalidateSize();
        if(tabName === 'city' && cityMap) cityMap.invalidateSize();
    }, 100);

    // Подсветка кнопки в доке (упрощенная логика)
    // В реальном приложении можно привязать по ID
}

function switchCityTab(tabName) {
    // Вкладки внутри "Города" (Афиша / Карта)
    document.querySelectorAll('.c-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.city-content').forEach(el => el.classList.remove('active'));

    // Активируем кнопку
    const buttons = document.querySelectorAll('.c-tab');
    if (tabName === 'billboard') buttons[0].classList.add('active');
    else buttons[1].classList.add('active');

    // Активируем контент
    if (tabName === 'billboard') document.getElementById('tab-billboard').classList.add('active');
    else {
        document.getElementById('tab-citymap').classList.add('active');
        setTimeout(() => { if(cityMap) cityMap.invalidateSize(); }, 100);
    }
}


// --- ГЛАВНАЯ ПАНЕЛЬ (ORDER PANEL) ---
function togglePanelState() {
    const panel = document.getElementById('main-panel');
    panel.classList.toggle('collapsed');
}

function selectTariff(element) {
    document.querySelectorAll('.tariff-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

function startOrder() {
    // Симуляция поиска машины
    alert('Поиск машины... 🚖');
    setTimeout(() => {
        openModal('order-negotiation-modal');
    }, 1500);
}

// --- ЧАТ AI ---
function sendMessage() {
    const input = document.getElementById('chatInput');
    const area = document.getElementById('ai-response-area');
    if(input.value.trim() === "") return;

    area.style.display = "block";
    area.innerHTML = `<div style="padding:10px; background:rgba(255,255,255,0.1); border-radius:10px; margin-bottom:10px;">
        <strong>Вы:</strong> ${input.value}
    </div>`;
    
    // Имитация ответа AI
    setTimeout(() => {
        area.innerHTML += `<div style="padding:10px; background:rgba(10,132,255,0.2); border-radius:10px;">
            <strong>Aitax AI:</strong> Понял, строю маршрут до "${input.value}". Это займет 15 мин.
        </div>`;
    }, 1000);
    
    input.value = "";
}


// --- НАСТРОЙКИ ---
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

function toggleTheme() {
    alert('Переключение темы (Светлая/Темная/Неон)');
}
function toggleLanguage() {
    const lbl = document.getElementById('lang-label');
    lbl.innerText = lbl.innerText === 'Русский' ? 'Қазақша' : 'Русский';
}


// --- МОДАЛЬНЫЕ ОКНА ---
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Кошелек модалки (простой alert для примера)
function openWalletModal(type) {
    alert(type === 'deposit' ? 'Экран пополнения' : 'Экран перевода');
}


// --- ЛЕНТА (FEED) ---
function toggleLike(btn) {
    const icon = btn.querySelector('ion-icon');
    const countSpan = btn.querySelector('.count');
    let count = parseInt(countSpan.innerText);
    
    if (icon.name === 'heart-outline') {
        icon.name = 'heart';
        icon.style.color = '#ff453a';
        count++;
    } else {
        icon.name = 'heart-outline';
        icon.style.color = 'inherit';
        count--;
    }
    countSpan.innerText = count;
}

function deletePost(btn) {
    if(confirm('Удалить пост?')) {
        btn.closest('.post-card').remove();
    }
}

function publishPost() {
    const text = document.getElementById('new-post-text').value;
    if(!text) return;

    const stream = document.getElementById('feed-stream');
    const newPost = document.createElement('div');
    newPost.className = 'post-card';
    newPost.innerHTML = `
        <div class="post-head">
            <div class="avatar-mini" style="background:#0a84ff;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;">Я</div>
            <div class="ph-info">
                <span class="ph-name">Вы (Гость)</span>
                <span class="ph-time">Только что</span>
            </div>
            <button class="icon-btn-text text-danger" onclick="deletePost(this)"><ion-icon name="trash-outline"></ion-icon></button>
        </div>
        <div class="post-text">${text}</div>
        <div class="post-actions">
            <button class="act-item" onclick="toggleLike(this)"><ion-icon name="heart-outline"></ion-icon> 0</button>
        </div>
    `;
    stream.prepend(newPost);
    closeModal('create-post-modal');
    document.getElementById('new-post-text').value = '';
}


// --- ПРОФИЛЬ И АВТОРИЗАЦИЯ ---
function sendSms() {
    const phone = document.getElementById('auth-phone').value;
    if(phone.length < 10) { alert('Введите номер'); return; }
    
    document.getElementById('sms-block').style.display = 'block';
    document.getElementById('btn-login-action').innerText = 'Войти';
    document.getElementById('btn-login-action').onclick = function() {
        document.getElementById('auth-screen').style.display = 'none';
    }
}

function continueAsGuest() {
    document.getElementById('auth-screen').style.display = 'none';
}

function saveProfile() {
    const name = document.getElementById('edit-name-inp').value;
    document.getElementById('settings-name-preview').innerText = name;
    alert('Данные сохранены');
    closeSubSetting('profile-edit');
}

// Фото профиля
const fileInput = document.getElementById('avatar-input');
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            document.getElementById('edit-avatar-preview').innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        }
        reader.readAsDataURL(file);
    }
});

// Навигация карты
function centerMap() {
    if(homeMap) homeMap.setView([49.80, 73.10], 14);
}

// Торг (Modal logic)
function offerMyPrice() {
    let price = prompt("Ваша цена?");
    if(price) document.querySelector('.offer-price-display').innerText = price + " ₸";
}
function acceptPrice() {
    alert("Водитель принял заказ!");
    closeModal('order-negotiation-modal');
}
