let map;
let userMarker;
let selectedTariff = 'Эконом';
let intercityData = null;

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderPromoCards();
    renderPosts();
    
    // Тарифы
    document.querySelectorAll('.tariff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tariff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTariff = btn.dataset.tariff;
        });
    });

    // Превью фото
    const imgInput = document.getElementById('post-image-input');
    if(imgInput) {
        imgInput.addEventListener('change', function() {
            const file = this.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const container = document.getElementById('post-preview-container');
                    container.innerHTML = `<img src="${e.target.result}" style="width:100%; border-radius:12px; margin-bottom:10px;">`;
                    container.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// --- Навигация ---
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dock-item').forEach(d => d.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    el.classList.add('active');
    
    if(tabId === 'events') {
        setTimeout(() => map.invalidateSize(), 200);
    }
}

function switchSubTab(view) {
    document.querySelectorAll('.sub-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(view + '-view').classList.add('active');
    event.target.classList.add('active');
    
    if(view === 'map') {
        setTimeout(() => map.invalidateSize(), 200);
    }
}

// --- Карта ---
function initMap() {
    map = L.map('map', { zoomControl: false }).setView([49.8019, 73.1021], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
}

// --- AI и Заказ ---
function toggleAiModal() {
    const modal = document.getElementById('ai-modal');
    modal.classList.toggle('active');
}

function handleAiInput(e) {
    if(e.key === 'Enter') sendAiMessage();
}

function sendAiMessage() {
    const input = document.getElementById('ai-input');
    const text = input.value.trim();
    if(!text) return;

    addChatMessage('user', text);
    input.value = '';

    // Имитация ответа ИИ
    setTimeout(() => {
        addChatMessage('ai', "Принято! Ищу машину по адресу: " + text);
        // Сворачиваем через 2 сек, чтобы пользователь увидел ответ
        setTimeout(() => {
            document.getElementById('ai-modal').classList.remove('active');
        }, 1500);
    }, 800);
}

function addChatMessage(role, text) {
    const box = document.getElementById('ai-chat-box');
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.innerText = text;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
}

// --- Межгород ---
function saveIntercity() {
    const from = document.getElementById('inter-from').value;
    const to = document.getElementById('inter-to').value;
    const seats = document.getElementById('inter-seats').value;
    const price = document.getElementById('inter-price').value;
    
    intercityData = { from, to, seats, price };
    document.getElementById('intercity-display').innerText = `${from} → ${to}`;
    closeModal('intercity-modal');
}

function startOrder() {
    const to = document.getElementById('order-to').value;
    if(!to && !intercityData) {
        alert("Укажите куда едем!");
        return;
    }

    if(intercityData) {
        // Добавляем в ленту водителя
        addOrderToDriver(intercityData);
        alert("Заявка на межгород отправлена!");
    } else {
        alert(`Заказ принят! Тариф: ${selectedTariff}. Машина будет через 5 мин.`);
    }
    document.getElementById('ai-modal').classList.remove('active');
}

function addOrderToDriver(data) {
    const list = document.getElementById('intercity-orders-list');
    const order = document.createElement('div');
    order.className = 'order-card';
    order.innerHTML = `
        <div class="order-info">
            <strong>${data.from} → ${data.to}</strong>
            <span>Мест: ${data.seats} | ${data.price} ₸</span>
        </div>
        <button class="take-btn" onclick="this.parentElement.remove()">Взять</button>
    `;
    list.prepend(order);
    // Убираем empty state если он был
    const empty = list.querySelector('.empty-state');
    if(empty) empty.remove();
}

// --- Посты ---
function openCreatePostModal() {
    document.getElementById('create-post-modal').classList.add('active');
}

function closeCreatePost() {
    document.getElementById('create-post-modal').classList.remove('active');
    document.getElementById('post-text').value = '';
    document.getElementById('post-preview-container').classList.add('hidden');
}

function submitPost() {
    const text = document.getElementById('post-text').value;
    if(!text) return;
    
    const feed = document.getElementById('posts-feed');
    const post = document.createElement('div');
    post.className = 'post-card';
    post.innerHTML = `
        <div class="post-header">
            <div class="user-avatar-mini"></div>
            <strong>Вы</strong>
        </div>
        <div class="post-content">${text}</div>
        <div class="post-actions"><span>❤️ 0</span> <span>💬 0</span></div>
    `;
    feed.prepend(post);
    closeCreatePost();
}

// --- Прочее ---
function renderPromoCards() {
    const container = document.getElementById('promo-container');
    const promos = [
        { title: "Concert Show", desc: "Скидки 50% только сегодня!", color: "#1a1a1a" },
        { title: "Aitax Food", desc: "Доставка из ресторанов за 20 мин", color: "#0044cc" },
        { title: "Киноночь", desc: "Премьеры в эти выходные", color: "#cc0044" }
    ];
    container.innerHTML = promos.map(p => `
        <div class="promo-card" style="background: ${p.color}">
            <span class="badge">Promoted</span>
            <h2>${p.title}</h2>
            <p>${p.desc}</p>
        </div>
    `).join('');
}

function switchDriverTab(type) {
    document.querySelectorAll('.d-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.driver-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('driver-' + type).classList.add('active');
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function toggleLanguage() {
    const el = document.getElementById('lang-val');
    el.innerText = el.innerText === 'Русский' ? 'English' : 'Русский';
}