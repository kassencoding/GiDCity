// === INIT ===
let map, cityMap;
let userMarker;
let isGuest = true;
let currentProfile = { name: "Алибек", phone: "+7 777 123 45 67", avatar: "" };

document.addEventListener("DOMContentLoaded", () => {
    // По умолчанию показываем экран авторизации
    document.getElementById('auth-screen').style.display = 'flex';
});

// === АВТОРИЗАЦИЯ ===
function checkPhoneInput() {
    const phoneInp = document.getElementById('auth-phone');
    if (!phoneInp.value.startsWith('+7 ')) {
        phoneInp.value = '+7 ' + phoneInp.value.replace('+7 ', '');
    }
    // Если введено достаточно цифр, показываем поле кода
    if (phoneInp.value.length > 8) {
        document.getElementById('sms-block').style.display = 'block';
        if(!document.getElementById('auth-code').value) {
            document.getElementById('auth-code').focus();
        }
    }
}

function tryLogin() {
    const code = document.getElementById('auth-code').value;
    const name = document.getElementById('auth-name').value;
    
    if (code === '1234' && name) {
        currentProfile.name = name;
        updateProfileUI();
        document.getElementById('auth-screen').style.display = 'none';
        isGuest = false;
        switchTab('home');
    } else {
        alert("Введите имя и код 1234");
    }
}

function continueAsGuest() {
    isGuest = true;
    document.getElementById('auth-screen').style.display = 'none';
    switchTab('feed');
    alert("Гостевой режим: Только просмотр ленты");
}

function updateProfileUI() {
    // Обновляем сайдбар
    document.getElementById('profile-name').innerText = currentProfile.name;
    document.getElementById('profile-phone').innerText = document.getElementById('auth-phone').value;
    // Обновляем кабинет водителя
    document.getElementById('driver-name-display').innerText = currentProfile.name;
    if(currentProfile.avatar) {
        const imgTag = `<img src="${currentProfile.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        document.getElementById('sidebar-avatar').innerHTML = imgTag;
        document.getElementById('driver-avatar-display').innerHTML = imgTag;
    }
}

// Загрузка аватарки
document.getElementById('avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentProfile.avatar = e.target.result;
            updateProfileUI();
        }
        reader.readAsDataURL(file);
    }
});

// === НАВИГАЦИЯ ===
function switchTab(tabId) {
    if (isGuest && tabId !== 'feed') {
        document.getElementById('auth-screen').style.display = 'flex';
        return;
    }

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));

    if(tabId === 'home') {
        document.getElementById('home-view').classList.add('active');
        initMap();
        document.querySelector('.ai-button').parentElement.style.transform = "scale(1.1)";
    } else {
         document.querySelector('.ai-button').parentElement.style.transform = "scale(1)";
    }
    
    if(tabId === 'city') {
        document.getElementById('city-view').classList.add('active');
        // Переключаем на карту или афишу
        setTimeout(() => { if(cityMap) cityMap.invalidateSize(); }, 200);
    } else if (tabId !== 'home') {
        document.getElementById(tabId + '-view').classList.add('active');
    }
    
    // Подсветка кнопок докбара
    if(tabId === 'city') document.querySelectorAll('.dock-item')[0].classList.add('active');
    if(tabId === 'feed') document.querySelectorAll('.dock-item')[1].classList.add('active');
    if(tabId === 'wallet') document.querySelectorAll('.dock-item')[2].classList.add('active');
    if(tabId === 'driver') document.querySelectorAll('.dock-item')[3].classList.add('active');
}

// Сворачивание панели такси
function togglePanel() {
    const panel = document.getElementById('main-panel');
    const restoreBtn = document.querySelector('.restore-panel-btn');
    const overlays = document.querySelector('.map-overlays');
    
    panel.classList.toggle('minimized');
    
    if (panel.classList.contains('minimized')) {
        restoreBtn.style.display = 'grid'; // Показать кнопку
        overlays.style.bottom = "120px"; // Опустить кнопки
    } else {
        restoreBtn.style.display = 'none';
        overlays.style.bottom = "380px"; // Поднять кнопки
    }
}

// Выбор тарифа
function selectTariff(el) {
    document.querySelectorAll('.tariff').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
}

// === КАРТЫ ===
function initMap() {
    if(!map) {
        map = L.map('map-container', { zoomControl: false }).setView([49.80, 73.10], 13);
        // Темная карта
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);
    }
    if(!cityMap) {
        cityMap = L.map('city-map-container', { zoomControl: false }).setView([49.80, 73.10], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(cityMap);
    }
}

function centerMap() { map.setView([49.80, 73.10], 14); }
function centerCityMap() { cityMap.setView([49.80, 73.10], 14); }

// Вкладки города (Афиша/Карта)
function switchCityTab(tab) {
    document.querySelectorAll('.city-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.c-tab').forEach(t => t.classList.remove('active'));
    
    if(tab === 'billboard') {
        document.getElementById('tab-billboard').classList.add('active');
        document.querySelectorAll('.c-tab')[0].classList.add('active');
    } else {
        document.getElementById('tab-citymap').classList.add('active');
        document.querySelectorAll('.c-tab')[1].classList.add('active');
        setTimeout(() => cityMap.invalidateSize(), 100);
    }
}

// === ЛЕНТА (POSTS) ===
function publishPost() {
    const text = document.getElementById('new-post-text').value;
    if(!text) return;
    
    const container = document.getElementById('feed-container');
    const newId = 'post-' + Date.now();
    
    const html = `
    <div class="post-card" id="${newId}">
        <div class="post-head">
            <div class="avatar-circle">Я</div>
            <div style="flex:1; margin-left:10px;">
                <div class="name-row"><span class="name">${currentProfile.name}</span></div>
                <div class="time">Только что</div>
            </div>
            <button class="trash-btn" onclick="deletePost('${newId}')"><ion-icon name="trash-outline"></ion-icon></button>
        </div>
        <div class="post-content">${text}</div>
        <div class="post-actions-bar">
            <button class="act-btn" onclick="toggleLike(this)"><ion-icon name="heart-outline"></ion-icon> <span>0</span></button>
            <button class="act-btn" onclick="openCommentModal('${newId}')"><ion-icon name="chatbubble-outline"></ion-icon></button>
        </div>
    </div>`;
    
    container.insertAdjacentHTML('afterbegin', html);
    closeModal('create-post-modal');
    document.getElementById('new-post-text').value = "";
}

function deletePost(id) {
    if(confirm("Удалить пост?")) {
        const el = document.getElementById(id);
        if(el) el.remove();
    }
}

function toggleLike(btn) {
    btn.classList.toggle('liked');
    const icon = btn.querySelector('ion-icon');
    const countSpan = btn.querySelector('span');
    let count = parseInt(countSpan.innerText);
    
    if(btn.classList.contains('liked')) {
        icon.setAttribute('name', 'heart');
        count++;
    } else {
        icon.setAttribute('name', 'heart-outline');
        count--;
    }
    countSpan.innerText = count;
}

function openCommentModal(id) {
    openModal('comment-thread-modal');
}

// === ЧАТ и AI ===
function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addMessageBubble(text, 'user');
    input.value = '';
    setTimeout(() => aiReply(text), 1000);
}

function addMessageBubble(text, sender) {
    const container = document.querySelector('.chat-container');
    const div = document.createElement('div');
    div.className = 'ai-msg'; // Проверь в CSS есть ли этот класс (добавим если нет)
    div.style.display = 'flex';
    div.style.marginBottom = '10px';
    
    if(sender === 'user') {
        div.style.justifyContent = 'flex-end';
        div.innerHTML = `<div style="background:var(--accent); color:white; padding:10px 15px; border-radius:15px 15px 0 15px;">${text}</div>`;
    } else {
        div.innerHTML = `<div style="background:rgba(255,255,255,0.1); padding:10px 15px; border-radius:15px 15px 15px 0;">${text}</div>`;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function aiReply(text) {
    addMessageBubble("Ищу свободную машину...", 'ai');
}


// === ТОРГ И ЗАКАЗ ===
function openOrderNegotiation() { openModal('order-negotiation-modal'); }

function offerMyPrice() {
    const p = prompt("Ваша цена:");
    if(p) document.querySelector('.offer-price-display').innerText = p + " ₸";
}

function sendDriverOffer() {
    closeModal('order-negotiation-modal');
    setTimeout(() => {
        const price = document.querySelector('.offer-price-display').innerText;
        document.getElementById('client-offer-price').innerText = price;
        openModal('client-decision-modal');
    }, 1000);
}

function clientAccept() {
    closeModal('client-decision-modal');
    alert("Клиент принял предложение! Поехали.");
}

// === НАСТРОЙКИ (САЙДБАР) ===
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('open');
    if(!sb.classList.contains('open')) {
        setTimeout(() => closeSubMenu(), 300);
    }
}

function openSubMenu(id) {
    document.getElementById('sidebar-main').style.display = 'none';
    document.getElementById('sidebar-' + id).style.display = 'block';
}

function closeSubMenu() {
    document.querySelectorAll('.sidebar-sub').forEach(el => el.style.display = 'none');
    document.getElementById('sidebar-main').style.display = 'block';
}

// === UTIL ===
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openWalletModal(type) { openModal('wallet-action-modal'); }
