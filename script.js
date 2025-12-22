const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#000000'); tg.enableClosingConfirmation(); }

let map, userMarker;
let selectedImage = null;

function goTab(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    const aiBtn = document.getElementById('ai-main-btn');
    if(id === 'home') aiBtn.classList.add('active-mode'); else aiBtn.classList.remove('active-mode');
    if (id === 'map') { if (!map) initMap(); setTimeout(() => map.invalidateSize(), 200); }
    if(tg) tg.HapticFeedback.selectionChanged();
}

const aiBtn = document.getElementById('ai-main-btn');
aiBtn.addEventListener('click', () => {
    goTab('home', null);
    if(tg) tg.HapticFeedback.impactOccurred('light');
});

// === ЗАКАЗ И ТОРГ ===
function createOrder() {
    const dest = document.getElementById('inp-dest').value;
    const price = document.getElementById('inp-price').value;
    if(!dest || !price) { if(tg) tg.showAlert('Заполните адрес и цену'); return; }
    
    openModal('modal-searching');
    
    const etherContainer = document.getElementById('ether-container');
    const newOrderHtml = `
        <div class="order-strip glass-morphism">
            <div class="route-info">
                <div class="route-line"><span class="dot a"></span> Моё местоположение</div>
                <div class="route-arrow">↓</div>
                <div class="route-line"><span class="dot b"></span> ${dest}</div>
            </div>
            <div class="order-action">
                <div class="price-tag">${price}₸</div>
                <button class="take-btn-big glow-anim" onclick="openOfferModal(${price})">Взять</button>
            </div>
        </div>
    `;
    etherContainer.insertAdjacentHTML('afterbegin', newOrderHtml);
}

function minimizeSearch() { document.getElementById('modal-overlay').classList.add('hidden'); }
function cancelOrder() { document.getElementById('modal-overlay').classList.add('hidden'); }

// 1. Водитель открывает торг
function openOfferModal(price) {
    document.querySelector('#modal-driver-offer .offer-price-big').innerText = price + ' ₸';
    openModal('modal-driver-offer');
}
// 2. Водитель отправляет свою цену
function sendCounterOffer() {
    const bid = document.getElementById('driver-bid-input').value;
    if(!bid) return;
    document.getElementById('modal-overlay').classList.add('hidden');
    
    // Симуляция: Пассажир получает предложение
    setTimeout(() => {
        document.getElementById('driver-offer-val').innerText = bid + ' ₸';
        openModal('modal-passenger-decision');
        if(tg) tg.HapticFeedback.notificationOccurred('warning');
    }, 1500);
}
// 3. Водитель принимает заказ сразу
function acceptOrder() {
    document.getElementById('modal-overlay').classList.add('hidden');
    if(tg) tg.showAlert('Вы приняли заказ!');
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
            <button class="act-btn" onclick="toggleLike(this)"><ion-icon name="heart-outline"></ion-icon> <span>0</span></button>
            <button class="act-btn" onclick="openComments()"><ion-icon name="chatbubble-outline"></ion-icon> <span>0</span></button>
            <button class="act-btn" onclick="sharePost()"><ion-icon name="share-social-outline"></ion-icon></button>
        </div>
    `;
    cont.insertBefore(post, cont.firstChild);
    document.getElementById('post-text-input').value = '';
    document.getElementById('remove-image-btn').click();
    if(tg) tg.HapticFeedback.notificationOccurred('success');
}
function toggleLike(btn) {
    btn.classList.toggle('liked');
    const icon = btn.querySelector('ion-icon');
    const span = btn.querySelector('span');
    let count = parseInt(span.innerText);
    if(btn.classList.contains('liked')) { icon.setAttribute('name', 'heart'); count++; } 
    else { icon.setAttribute('name', 'heart-outline'); count--; }
    span.innerText = count;
    if(tg) tg.HapticFeedback.selectionChanged();
}
function openComments() { openModal('modal-comments'); }
function sharePost() { if(navigator.share) navigator.share({title: 'Aitax', text: 'Пост из Aitax', url: window.location.href}); }

// === КАРТА ===
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

// === НАСТРОЙКИ ===
function selectCity(name, weather) {
    document.getElementById('current-city').innerText = name;
    document.getElementById('current-weather').innerText = weather;
    document.getElementById('modal-overlay').classList.add('hidden');
}
function setTheme(color, mode) {
    document.documentElement.style.setProperty('--accent', color);
    // Контраст текста
    if(mode === 'light') document.documentElement.style.setProperty('--accent-text', '#fff');
    else document.documentElement.style.setProperty('--accent-text', '#000');
    
    document.getElementById('modal-overlay').classList.add('hidden');
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ai-main-btn').classList.add('active-mode');
});
