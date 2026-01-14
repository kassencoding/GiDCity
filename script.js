// === TELEGRAM WEB APP ===
const tg = window.Telegram?.WebApp;
if (tg) { 
    tg.ready(); 
    tg.expand(); 
    tg.setHeaderColor('#0000'); 
    tg.enableClosingConfirmation(); 
}

// === ПЕРЕМЕННЫЕ ===
let map, cityMap;
let userMarker;
let isGuest = false;
let currentLang = 'ru';
let selectedTariff = 'economy';
let orderComment = '';
let intercityRoute = null;

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
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('auth-screen').style.display = 'flex';
    
    // Синхронизация языка в настройках
    const v = document.getElementById('settings-lang-value');
    if (v) v.innerText = (currentLang === 'ru') ? 'Русский' : 'Қазақша';
    
    // Рендер демо-постов
    renderPosts();
    
    // Обработка выбора тарифа
    document.querySelectorAll('.tariff').forEach(t => {
        t.addEventListener('click', function() {
            document.querySelectorAll('.tariff').forEach(x => x.classList.remove('selected'));
            this.classList.add('selected');
            selectedTariff = this.dataset.tariff || 'economy';
        });
    });
});

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
        smsBlock.style.display = 'block';
        btn.innerText = "Войти";
        if(tg) tg.showAlert(`Код отправлен на ${phone}`);
    } else {
        completeLogin(name, phone);
    }
}

function completeLogin(name, phone) {
    document.getElementById('auth-screen').style.display = 'none';
    isGuest = false;
    
    document.getElementById('profile-name').innerText = name;
    document.getElementById('profile-phone').innerText = phone;
    
    switchTab('home');
}

function continueAsGuest() {
    document.getElementById('auth-screen').style.display = 'none';
    isGuest = true;
    document.getElementById('profile-name').innerText = "Гость";
    
    switchTab('feed');
    
    if(tg) tg.showAlert("Режим гостя: Доступна только Лента");
}

// === ГЛАВНАЯ НАВИГАЦИЯ ===
function switchTab(tabId) {
    if (isGuest && tabId !== 'feed') {
        document.getElementById('auth-screen').style.display = 'flex';
        return;
    }

    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    document.querySelectorAll('.dock-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('.ai-button').classList.remove('active');

    const dockItems = document.querySelectorAll('.dock-item');
    
    if (tabId === 'city') {
        document.getElementById('city-view').classList.add('active');
        dockItems[0].classList.add('active');
        setTimeout(() => { if(cityMap) cityMap.invalidateSize(); }, 100);
    } 
    else if (tabId === 'feed') {
        document.getElementById('feed-view').classList.add('active');
        dockItems[1].classList.add('active');
    } 
    else if (tabId === 'home') {
        document.getElementById('home-view').classList.add('active');
        document.querySelector('.ai-button').classList.add('active');
        
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
    document.querySelectorAll('.c-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.city-content').forEach(c => c.classList.remove('active'));

    if (subTab === 'billboard') {
        document.getElementById('tab-billboard').classList.add('active');
        document.querySelectorAll('.c-tab')[0].classList.add('active');
    } else {
        document.getElementById('tab-citymap').classList.add('active');
        document.querySelectorAll('.c-tab')[1].classList.add('active');
        setTimeout(() => initCityMap(), 100);
    }
}

// === ВОДИТЕЛЬ (Вкладки) ===
function switchDriverTab(subTab) {
    document.querySelectorAll('.d-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.driver-content').forEach(c => c.classList.remove('active'));

    if (subTab === 'city') {
        document.getElementById('driver-city-orders').classList.add('active');
        document.querySelectorAll('.d-tab')[0].classList.add('active');
    } else {
        document.getElementById('driver-intercity-orders').classList.add('active');
        document.querySelectorAll('.d-tab')[1].classList.add('active');
    }
}

// === КАРТЫ (LEAFLET) ===
function initMap() {
    const mapDiv = document.getElementById('map-container');
    if(mapDiv && !map) {
        map = L.map('map-container', { zoomControl: false }).setView([49.80, 73.10], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '', maxZoom: 19
        }).addTo(map);
        centerMap();
    }
}

function initCityMap() {
    const mapDiv = document.getElementById('city-map-container');
    if(mapDiv && !cityMap) {
        cityMap = L.map('city-map-container', { zoomControl: false }).setView([49.80, 73.10], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '', maxZoom: 19
        }).addTo(cityMap);
        
        L.marker([49.805, 73.09]).addTo(cityMap).bindPopup("Кинотеатр Ленина");
        L.marker([49.81, 73.11]).addTo(cityMap).bindPopup("Сити Молл");
    }
}

function centerMap() {
    if(!map) { initMap(); return; }
    map.locate({setView: true, maxZoom: 14});
    
    map.once('locationfound', (e) => {
        if(userMarker) map.removeLayer(userMarker);
        userMarker = L.marker(e.latlng).addTo(map);
    });
}

// === ЧАТ И AI ===
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
    else if(lower.includes("межгород")) reply = "Открываю настройки межгорода. Выберите маршрут!";
    
    addMessageBubble(reply, 'ai');
}

// === ЗАКАЗ ТАКСИ ===
function startOrder() {
    const to = document.getElementById('order-to').value.trim();
    
    if (!to && !intercityRoute) {
        if(tg) tg.showAlert("Укажите точку назначения или выберите межгород");
        else alert("Укажите точку назначения");
        return;
    }

    const tariffNames = {
        economy: 'Эконом',
        comfort: 'Комфорт',
        business: 'Бизнес',
        lady: 'Lady 🌸'
    };

    let orderText = `Заказ создан!\n\nТариф: ${tariffNames[selectedTariff] || 'Эконом'}`;
    
    if (intercityRoute) {
        orderText += `\nМаршрут: ${intercityRoute.from} → ${intercityRoute.to}`;
        orderText += `\nМест: ${intercityRoute.seats}`;
    } else {
        orderText += `\nКуда: ${to}`;
    }
    
    if (orderComment) {
        orderText += `\nКомментарий: ${orderComment}`;
    }

    if(tg) tg.showAlert(orderText);
    else alert(orderText);
}

function saveComment() {
    const input = document.getElementById('comment-input');
    orderComment = input.value.trim();
    
    const display = document.getElementById('comment-display');
    if (display) {
        display.innerText = orderComment || 'Указать...';
    }
    
    closeModal('comment-modal');
}

function saveIntercity() {
    const from = document.getElementById('intercity-from').value;
    const to = document.getElementById('intercity-to').value;
    const seats = document.getElementById('intercity-seats').value;
    
    if (from === to) {
        if(tg) tg.showAlert("Выберите разные города");
        else alert("Выберите разные города");
        return;
    }
    
    intercityRoute = { from, to, seats };
    
    const display = document.getElementById('intercity-display');
    if (display) {
        display.innerText = `${from} → ${to}`;
    }
    
    closeModal('intercity-modal');
    if(tg) tg.showAlert(`Межгород: ${from} → ${to}, мест: ${seats}`);
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
const POSTS_KEY = 'aitax_posts_v1';

function openCreatePostModal() {
    openModal('create-post-modal');
    const ta = document.getElementById('create-post-text');
    const imgInput = document.getElementById('create-post-image');
    const preview = document.getElementById('create-post-preview');

    if (ta) ta.value = '';
    if (imgInput) imgInput.value = '';
    if (preview) { preview.innerHTML = ''; preview.classList.add('hidden'); }

    setTimeout(() => ta?.focus(), 50);
}

function closeCreatePost() {
    closeModal('create-post-modal');
}

function getProfileAvatarDataUrlOrNull() {
    const el = document.querySelector('#sidebar-avatar img');
    return el?.getAttribute('src') || null;
}

function getCurrentAuthor() {
    const name = document.getElementById('profile-name')?.innerText?.trim() || 'Гость';
    return { name, avatar: getProfileAvatarDataUrlOrNull() };
}

function loadPosts() {
    try { return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]'); }
    catch { return []; }
}

function savePosts(posts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function renderPosts() {
    const stream = document.querySelector('.feed-stream');
    if (!stream) return;

    const staticCards = Array.from(stream.querySelectorAll('.post-card[data-static="1"]'));
    if (staticCards.length === 0) {
        stream.querySelectorAll('.post-card').forEach(c => c.dataset.static = "1");
    }

    stream.querySelectorAll('.post-card[data-demo="1"]').forEach(n => n.remove());

    const posts = loadPosts();
    posts.slice().reverse().forEach(p => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.demo = "1";
        card.dataset.postId = p.id;

        const avatarHtml = p.author.avatar
            ? `<div class="avatar-circle" style="width:36px;height:36px;overflow:hidden;">
                 <img src="${p.author.avatar}" style="width:100%;height:100%;object-fit:cover;">
               </div>`
            : `<div class="avatar-circle" style="width:36px; height:36px;">${(p.author.name || 'U')[0]}</div>`;

        const imgHtml = p.image
            ? `<div style="margin-top:12px;">
                 <img src="${p.image}" style="width:100%;max-height:320px;object-fit:cover;border-radius:18px;border:1px solid var(--border);">
               </div>`
            : '';

        card.innerHTML = `
            <div class="post-head">
                ${avatarHtml}
                <div style="flex:1; margin-left:10px;">
                    <div class="name-row">
                        <span class="name">${escapeHtml(p.author.name)}</span>
                    </div>
                </div>
                <div class="time">только что</div>
                <button class="more-btn"><ion-icon name="ellipsis-horizontal"></ion-icon></button>
            </div>

            <div class="post-content">${escapeHtml(p.text)}</div>
            ${imgHtml}

            <div class="post-actions-bar">
                <button class="act-btn" onclick="toggleLike('${p.id}')"><ion-icon name="${p.liked ? 'heart' : 'heart-outline'}"></ion-icon></button>
                <button class="act-btn" onclick="openComments('${p.id}')"><ion-icon name="chatbubble-outline"></ion-icon></button>
                <button class="act-btn" onclick="repost('${p.id}')"><ion-icon name="repeat-outline"></ion-icon></button>
                <button class="act-btn" onclick="sharePost('${p.id}')"><ion-icon name="paper-plane-outline"></ion-icon></button>
            </div>
            <div class="likes-count">${p.likes || 0} лайков</div>
        `;

        stream.prepend(card);
    });
}

function submitPost() {
    const textEl = document.getElementById('create-post-text');
    const imgInput = document.getElementById('create-post-image');
    const text = textEl?.value?.trim() || '';
    if (!text && !imgInput?.files?.length) {
        if (tg) tg.showAlert("Напишите текст или прикрепите фото");
        else alert("Напишите текст или прикрепите фото");
        return;
    }

    const author = getCurrentAuthor();
    const post = {
        id: String(Date.now()),
        author,
        text,
        image: null,
        likes: 0,
        liked: false,
        createdAt: Date.now()
    };

    const finalize = () => {
        const posts = loadPosts();
        posts.push(post);
        savePosts(posts);
        closeCreatePost();
        renderPosts();
        if (tg) tg.HapticFeedback.impactOccurred('medium');
    };

    if (imgInput?.files?.[0]) {
        const reader = new FileReader();
        reader.onload = (e) => { post.image = e.target.result; finalize(); };
        reader.readAsDataURL(imgInput.files[0]);
    } else {
        finalize();
    }
}

function toggleLike(postId) {
    const posts = loadPosts();
    const p = posts.find(x => x.id === postId);
    if (!p) return;
    p.liked = !p.liked;
    p.likes = Math.max(0, (p.likes || 0) + (p.liked ? 1 : -1));
    savePosts(posts);
    renderPosts();
}

function repost(postId) {
    if (tg) tg.showAlert("Репост (Demo): скоро добавим выбор «в ленту / в чат города»");
    else alert("Репост (Demo)");
}

function sharePost(id) {
    openCreatePostModal();
}

function openComments(postId) {
    openModal('thread-view-modal');
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
}

// Превью картинки в модалке
document.addEventListener('change', (e) => {
    if (e.target?.id !== 'create-post-image') return;
    const file = e.target.files?.[0];
    const preview = document.getElementById('create-post-preview');
    if (!preview) return;

    if (!file) { preview.innerHTML = ''; preview.classList.add('hidden'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
        preview.innerHTML = `<img src="${ev.target.result}">`;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

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
    
    const v = document.getElementById('settings-lang-value');
    if (v) v.innerText = (currentLang === 'ru') ? 'Русский' : 'Қазақша';
    
    if(tg) tg.showAlert(`Язык изменен на ${currentLang.toUpperCase()}`);
}

function toggleTheme() {
    const body = document.body;
    const bg = document.getElementById('background-layer');
    
    if (bg.style.background.includes('1c1c1e')) {
        bg.style.background = 'radial-gradient(circle at 50% 30%, #2b0042, #0000 90%)';
    } else {
        bg.style.background = 'radial-gradient(circle at 50% 30%, #1c1c1e, #0000 90%)';
    }
    
    if(tg) tg.showAlert("Тема изменена");
}

function logoutDemo() {
    isGuest = true;
    document.getElementById('profile-name').innerText = "Гость";
    document.getElementById('profile-phone').innerText = "+7 ...";
    document.getElementById('sidebar-avatar').innerHTML = `<ion-icon name="person"></ion-icon>`;
    closeModal('settings-modal');
    switchTab('feed');
    if (tg) tg.showAlert("Вы вышли (Demo)");
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
        setTimeout(() => m.classList.add('active'), 10);
    }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if(m) { 
        m.classList.remove('active'); 
        setTimeout(() => m.classList.add('hidden'), 300); 
    }
}
