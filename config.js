// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyBXoooDXynE8rwwWKx1Nz13tBzxnBZH1hU",
    authDomain: "slay-school-51.firebaseapp.com",
    databaseURL: "https://slay-school-51-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "slay-school-51",
    storageBucket: "slay-school-51.firebasestorage.app",
    messagingSenderId: "448157237432",
    appId: "1:448157237432:web:c2d435625c04028d4fb44d",
    measurementId: "G-8V9CG09VL8"
};

// Admin password (измените на свой!)
export const ADMIN_PASSWORD = "admin2025";

// Nominations and Candidates Configuration
// Если есть image - используется картинка, если нет - emoji
export const nominations = [
    {
        id: "zavoz-goda",
        title: "Завоз года",
        emoji: "🚗",
        image: "zavoz.png" // Добавьте файл zavoz.png
    },
    {
        id: "alkash-goda",
        title: "Алкаш года",
        emoji: "🍺",
        image: "alkash.png"
    },
    {
        id: "korol-klassa",
        title: "Король класса",
        emoji: "👑",
        image: "korol.png" // Добавьте файл korol.png
    },
    {
        id: "koroleva-klassa",
        title: "Королева класса",
        emoji: "👸",
        image: "koroleva.png" // Добавьте файл koroleva.png
    },
    {
        id: "lubimets-uchiteley",
        title: "Любимец учителей",
        emoji: "📚",
        image: "lubimets.png" // Добавьте файл lubimets.png
    },
    {
        id: "luchshiy-igrok-cr",
        title: "Лучший игрок Clash Royale",
        emoji: "🎮",
        image: "clashroyale.png" // Добавьте файл clashroyale.png
    },
    {
        id: "mister-ne-ya",
        title: "Мистер \"Да это не я!\"",
        emoji: "🙈",
        image: "neya.png" // Добавьте файл neya.png
    },
    {
        id: "normis",
        title: "Нормис",
        emoji: "😎",
        image: "normis.png" // Добавьте файл normis.png
    },
    {
        id: "missis-podruga",
        title: "Мисис лучшая подружка",
        emoji: "💕",
        image: "podruga.png" // Добавьте файл podruga.png
    }
];

// Candidates list - ДОБАВЬТЕ СВОИХ КАНДИДАТОВ ЗДЕСЬ
// Формат: { id: "уникальный-id", name: "Имя Фамилия", photo: "photo.jpg" } или { id: "...", name: "...", emoji: "🧑" }
export const candidates = [
    { id: "candidate1", name: "Ерёмич Иван", photo: "candidates/candidate1.png" },
    { id: "candidate2", name: "Кандидат 2", photo: "candidates/candidate2.jpg" },
    { id: "candidate3", name: "Кандидат 3", photo: "candidates/candidate3.jpg" },
    { id: "candidate4", name: "Кандидат 4", photo: "candidates/candidate4.jpg" },
    { id: "candidate5", name: "Кандидат 5", photo: "candidates/candidate5.jpg" },
    // Добавьте больше кандидатов по необходимости
];
