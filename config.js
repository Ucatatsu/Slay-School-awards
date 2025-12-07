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
export const ADMIN_PASSWORD = "9192931418";

// Nominations and Candidates Configuration
// Если есть image - используется картинка, если нет - emoji
// allowedGender: "male" (только парни), "female" (только девушки), "any" (все)
export const nominations = [
    {
        id: "zavoz-goda",
        title: "Завоз года",
        emoji: "🚗",
        image: "assets/nominations/zavoz.png",
        allowedGender: "any"
    },
    {
        id: "alkash-goda",
        title: "Алкаш года",
        emoji: "🍺",
        image: "assets/nominations/alkash.png",
        allowedGender: "any"
    },
    {
        id: "korol-klassa",
        title: "Король класса",
        emoji: "👑",
        image: "assets/nominations/korol.png",
        allowedGender: "male"
    },
    {
        id: "koroleva-klassa",
        title: "Королева класса",
        emoji: "👸",
        image: "assets/nominations/koroleva.png",
        allowedGender: "female"
    },
    {
        id: "lubimets-uchiteley",
        title: "Любимец учителей",
        emoji: "📚",
        image: "assets/nominations/lubimets.png",
        allowedGender: "any"
    },
    {
        id: "luchshiy-igrok-cr",
        title: "Лучший игрок Clash Royale",
        emoji: "🎮",
        image: "assets/nominations/clashroyale.png",
        allowedGender: "any"
    },
    {
        id: "mister-ne-ya",
        title: "Мистер \"Да это не я!\"",
        emoji: "🙈",
        image: "assets/nominations/neya.png",
        allowedGender: "any"
    },
    {
        id: "normis",
        title: "Нормис",
        emoji: "😎",
        image: "assets/nominations/normis.png",
        allowedGender: "any"
    },
    {
        id: "missis-podruga",
        title: "Мисис лучшая подружка",
        emoji: "💕",
        image: "assets/nominations/podruga.png",
        allowedGender: "female"
    }
];

// Candidates list - ДОБАВЬТЕ СВОИХ КАНДИДАТОВ ЗДЕСЬ
// Формат: { id: "уникальный-id", name: "Имя Фамилия", photo: "photo.jpg", gender: "male"/"female" }
// gender: "male" (парень), "female" (девушка)
export const candidates = [
    { id: "candidate1", name: "Ерёмич Иван", photo: "assets/candidates/candidate1.png", gender: "male" },
    { id: "candidate2", name: "Жигалин Никита", photo: "assets/candidates/candidate2.png", gender: "male" },
    { id: "candidate3", name: "Гуркова Ксения", photo: "assets/candidates/candidate3.png", gender: "female" },
    { id: "candidate4", name: "Махмудян Роман", photo: "assets/candidates/candidate4.png", gender: "male" },
    { id: "candidate5", name: "Киреева Настя", photo: "assets/candidates/candidate5.png", gender: "female" },
    // Добавьте больше кандидатов по необходимости
];
