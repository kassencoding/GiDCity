const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#000000'); tg.enableClosingConfirmation(); }

let map, userMarker;
let selectedImage = null;

// === ВКЛАДКИ И КАРТА ===
function goTab(id, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');

    const aiBtn = document.getElementById('ai-main-btn');
    id === 'home' ? aiBtn.classList.add('active-mode') : aiBtn.classList.remove('active-mode');

    // ФИКС КАРТЫ: Если открыли карту, обновляем её размеры
    if (id === 'map') {
        if (!map) initMap();
        setTimeout(() => map.invalidateSize(), 100); 
    }
    if(tg) tg.HapticFeedback.selectionChanged();
}

// === КАРТА (LEAFLET) ===
function initMap() {
    map = L.map('map-container', { zoomControl: false }).setView([49.8028, 73.1021], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    // Показываем акции
    const createPromo = (lat, lng, emoji) => {
        const icon = L.divIcon({ className: 'promo-icon', html: `<div style="font-size:24px;">${emoji}</div>` });
        L.marker([lat, lng], {icon: icon}).addTo(map);
    }
    createPromo(49.81, 73.11, '🍔');
    createPromo(49.79, 73.09, '🎬');
    
    locateUser();
}

function locateUser() {
    if(!map) return;
    map.locate({setView: true, maxZoom: 14});
    map.on('locationfound', (e) => {
        if(userMarker) map.removeLayer(userMarker);
        const icon = L.divIcon({ html: '<div style="width:15px;height:15px;background:#0a84ff;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px #0a84ff;"></div>', className: 'user-dot' });
        userMarker = L.marker(e.latlng, {icon: icon}).addTo(map);
    });
}

// === СООБЩЕСТВО (С УДАЛЕНИЕМ) ===
// (Код загрузки фото тот же, что был)
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
        <button class="delete-post-btn" onclick="deletePost(this)">✕</button>
        <div class="post-head">
            <div class="avatar-mini" style="background:var(--accent)">E</div>
            <span class="name">Елназар</span><span class="time">Только что</span>
        </div>
        ${text ? `<div class="text">${text}</div>` : ''}
        ${selectedImage ? `<img src="${selectedImage}" class="post-image" style="width:100%;border-radius:10px;margin-bottom:10px;">` : ''}
        <div class="post-actions">
            <button class="act-btn"><ion-icon name="heart-outline"></ion-icon> 0</button>
        </div>
    `;
    cont.insertBefore(post, cont.firstChild);
    
    // Очистка
    document.getElementById('post-text-input').value = '';
    document.getElementById('remove-image-btn').click();
    if(tg) tg.HapticFeedback.notificationOccurred('success');
}

function deletePost(btn) {
    if(confirm('Удалить пост?')) {
        btn.closest('.post-card').remove();
        if(tg) tg.HapticFeedback.impactOccurred('light');
    }
}

// === НАСТРОЙКИ (ЛОГИКА) ===
function selectCity(name, weather) {
    document.getElementById('current-city').innerText = name;
    document.getElementById('current-weather').innerText = weather;
    document.getElementById('modal-overlay').classList.add('hidden');
    if(tg) tg.HapticFeedback.selectionChanged();
}

function setTheme(color) {
    document.documentElement.style.setProperty('--accent', color);
    document.getElementById('modal-overlay').classList.add('hidden');
    if(tg) tg.HapticFeedback.selectionChanged();
}

// === ОБЩИЕ ===
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

// Инит
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ai-main-btn').classList.add('active-mode');
});
