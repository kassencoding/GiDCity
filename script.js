// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    // Можешь настроить цвета шапки Telegram
    tg.setHeaderColor("secondary_bg_color");
}

// Примеры действий по клику (пока просто отправляем, куда нажали)
function sendAction(action) {
    if (!tg) return;
    tg.sendData(JSON.stringify({ action }));
}

// Привязываем события — опционально
document.addEventListener("DOMContentLoaded", () => {
    const ariaCard = document.querySelector(".card-aria");
    const orderCard = document.querySelector(".card-slider");
    const cityCard = document.querySelector(".card-city");

    ariaCard.addEventListener("click", () => sendAction("chat_with_aria"));
    orderCard.addEventListener("click", () => sendAction("create_order"));
    cityCard.addEventListener("click", () => sendAction("city_chat"));

    document.querySelectorAll(".small-card").forEach((card) => {
        card.addEventListener("click", () =>
            sendAction(card.querySelector(".small-title").textContent.trim())
        );
    });

    // Переключение табов (пока визуально)
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            navItems.forEach((i) => i.classList.remove("active"));
            item.classList.add("active");
            sendAction("tab_" + item.querySelector(".nav-label").textContent.trim());
        });
    });
});