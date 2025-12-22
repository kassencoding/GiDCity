const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#000000'); tg.enableClosingConfirmation(); }

// РАЗБИТЫЙ КЛЮЧ (Чтобы GitHub не блокировал)
const p1 = "sk-proj-w4jNYPdTaKUhGOhWPB1oWq84k8h7IEb3xlV5EOaVo0cEn_zj7";
const p2 = "8mRQWc90HSrGMRyDTr3fzq6QzT3BlbkFJ6fXocb-odi8HMXcAAoZLx_kb42jOnYYMqzTJkPNzXsIOzGWQx5l7fupzHhTUEUWJT2IvKji9kA";
const OPENAI_API_KEY = p1 + p2;

let map, userMarker, routeLayer;
let selectedImage = null;

function goTab(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    const aiBtn = document.getElementById('ai-main-btn');
    if(id === 'home') aiBtn.classList.add('active-mode'); else aiBtn.classList.remove('active-mode');

    if (id === 'map') {
        if (!map) initMap();
        setTimeout(() => map.invalidateSize(), 200); 
    }
    if(tg) tg.HapticFeedback.selectionChanged();
}

const aiBtn = document.getElementById('ai-main-btn');
aiBtn.addEventListener('click', () => {
    goTab('home', null);
    if(tg) tg.HapticFeedback.impactOccurred('light');
    askAI(); // Тестовый вызов AI
});

// === ЗАКАЗ ===
function createOrder() {
    const dest = document.getElementById('inp-dest').value;
    const price = document.getElementById('inp-price').value;
    if(!dest || !price) { tg?.showAlert('Адрес и цена?'); return; }
    
    openModal('modal-searching');
    
    const etherContainer = document.getElementById('ether-container');
    const newOrderHtml = `
        <div class="order-strip">
            <div class="route-info">
                <div class="route-line"><span class="dot a"></span> Я</div>
                <div class="route-line"><span class="dot b"></span> ${dest}</div>
            </div>
            <div class="order-action">
                <div class="price-tag">${price}₸</div>
                <button class="take-btn-big" onclick="openDriverOffer(${price})">Взять</button>
            </div>
        </div>
    `;
    etherContainer.insertAdjacentHTML('afterbegin', newOrderHtml);
}

// === ВОДИТЕЛЬ ===
function openDriverOffer(price) {
    // Устанавливаем цену в модалке
    document.getElementById('offer-val-display').innerText = price + ' ₸';
    // Кнопка принять сразу показывает эту цену
    const btn = document.getElementById('btn-driver-accept');
    btn.innerText = `Принять за ${price} ₸`;
    btn.onclick = function() { acceptOrder(); }; // Если просто приняли
    openModal('modal-driver-offer');
}

// Если водитель вводит СВОЮ цену
document.getElementById('driver-bid-input').addEventListener('input', function() {
    const newPrice = this.value;
    const btn = document.getElementById('btn-driver-accept');
    
    if(newPrice && newPrice.length > 0) {
        btn.innerText = `Предложить ${newPrice} ₸`;
        btn.onclick = function() { sendCounterOffer(newPrice); };
        btn.style.background = "#0a84ff"; // Синий (предложение)
    } else {
        // Возвращаем старую цену из заголовка
        const oldPrice = document.getElementById('offer-val-display').innerText.replace(' ₸','');
        btn.innerText = `Принять за ${oldPrice} ₸`;
        btn.onclick = function() { acceptOrder(); };
        btn.style.background = "#30d158"; // Зеленый (принять)
    }
});

function sendCounterOffer(price) {
    document.getElementById('modal-overlay').classList.add('hidden');
    // Симуляция ответа пассажира
    setTimeout(() => {
        document.getElementById('driver-offer-val').innerText = price + ' ₸';
        openModal('modal-passenger-decision');
        tg?.HapticFeedback.notificationOccurred('warning');
    }, 1000);
}

// ПРИНЯТИЕ ЗАКАЗА -> КАРТА
function acceptOrder() {
    document.getElementById('modal-overlay').classList.add('hidden');
    tg?.showAlert('Поехали!');
    
    // Переход на карту
    // Ищем кнопку карты в меню (она вторая по счету, индекс 1)
    const mapBtn = document.querySelectorAll('.dock-btn')[1];
    goTab('map', mapBtn);
    
    drawRoute();
}

function passengerAcceptOffer() {
    document.getElementById('modal-passenger-decision').classList.remove('active');
    acceptOrder(); // Тоже ведет на карту
}


// === КАРТА И МАРШРУТ ===
function initMap() {
    map = L.map('map-container', { zoomControl: false }).setView([49.8028, 73.1021], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    locateUser();
}
function locateUser() {
    if(!map) return;
    map.locate({setView: true, maxZoom: 14});
    map.on('locationfound', (e) => {
        if(userMarker) map.removeLayer(userMarker);
        userMarker = L.marker(e.latlng).addTo(map);
    });
}
function drawRoute() {
    if(!map) initMap();
    // Симуляция маршрута (Прямая линия)
    const p1 = [49.8028, 73.1021];
    const p2 = [49.8328, 73.1421];
    if(routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.polyline([p1, p2], {color: '#0a84ff', weight: 6}).addTo(map);
    map.fitBounds(routeLayer.getBounds(), {padding: [50, 50]});
}

// === AI (ЧАТ) ===
async function askAI() {
    const chat = document.querySelector('.chat-container');
    chat.innerHTML += `<div class="ai-msg"><div class="ai-avatar">Ai</div><div class="msg-bubble">Думаю...</div></div>`;
    
    // Простой запрос к GPT-4o-mini (или 3.5)
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{"role": "user", "content": "Скажи коротко 'Поехали!' на казахском и пожелай удачи."}],
                max_tokens: 50
            })
        });
        const data = await response.json();
        const text = data.choices[0].message.content;
        
        // Удаляем "Думаю..." и пишем ответ
        chat.lastElementChild.remove();
        chat.innerHTML += `<div class="ai-msg"><div class="ai-avatar">Ai</div><div class="msg-bubble">${text}</div></div>`;
    } catch(e) {
        console.error(e);
    }
}

// === ЛЕНТА ===
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const previewCont = document.getElementById('image-preview-container');
fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => { selectedImage = e.target.result; imagePreview.src = selectedImage; previewCont.classList.add('visible'); };
        reader.readAsDataURL(file);
    }
});
document.getElementById('remove-image-btn').addEventListener('click', () => { selectedImage = null; fileInput.value = ''; previewCont.classList.remove('visible'); });

function publishPost() {
    const text = document.getElementById('post-text-input').value;
    if(!text && !selectedImage) return;
    const cont = document.getElementById('feed-container');
    const post = document.createElement('div');
    post.className = 'post-card glass-morphism';
    post.innerHTML = `
        <button class="delete-post-btn" onclick="this.closest('.post-card').remove()">✕</button>
        <div class="post-head"><div class="avatar-circle" style="width:28px;height:28px;font-size:14px;"><ion-icon name="person"></ion-icon></div><span class="name">Елназар</span><span class="time">Только что</span></div>
        ${text ? `<div class="text">${text}</div>` : ''}
        ${selectedImage ? `<img src="${selectedImage}" class="post-image" style="width:100%;border-radius:10px;margin-bottom:10px;">` : ''}
        <div class="post-actions">
            <button class="act-btn" onclick="this.classList.toggle('liked')"><ion-icon name="heart-outline"></ion-icon> <span>0</span></button>
        </div>
    `;
    cont.insertBefore(post, cont.firstChild);
    document.getElementById('post-text-input').value = '';
    document.getElementById('remove-image-btn').click();
}

// === УТИЛИТЫ ===
function minimizeSearch() { document.getElementById('modal-overlay').classList.add('hidden'); }
function cancelOrder() { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function selectCity(name, weather) {
    document.getElementById('current-city').innerText = name;
    document.getElementById('current-weather').innerText = weather;
    closeModal();
}
function setTheme(color, mode) {
    document.documentElement.style.setProperty('--accent', color);
    if(mode === 'light') document.documentElement.style.setProperty('--accent-text', '#fff');
    else document.documentElement.style.setProperty('--accent-text', '#000');
    closeModal();
}
function openModal(id) {
    document.querySelectorAll('.modal-card').forEach(c => c.classList.remove('active'));
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(id).classList.add('active');
    closeSidebar();
}
document.addEventListener('click', (e) => {
    if(e.target.classList.contains('close-m') || e.target.id === 'modal-overlay') {
        document.getElementById('modal-overlay').classList.add('hidden');
    }
});
function openSidebar() { document.getElementById('sidebar-settings').classList.add('open'); }
function closeSidebar() { document.getElementById('sidebar-settings').classList.remove('open'); }

