// Инициализируем Telegram WebApp
const tg = window.Telegram.WebApp;

// Показываем готовность приложения
tg.ready();

// Кнопка отправки тестовых данных
document.getElementById("btn").addEventListener("click", () => {
    tg.sendData(JSON.stringify({ status: "ok", message: "Mini App works!" }));
});