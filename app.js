import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, get, runTransaction } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { firebaseConfig, ADMIN_PASSWORD, nominations, candidates } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Loading Screen
const loadingScreen = document.getElementById('loadingScreen');

// Hide loading screen after initialization
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 1500); // Показываем загрузку минимум 1.5 секунды
});

// Elements
const nominationsView = document.getElementById('nominationsView');
const nominationsGrid = document.getElementById('nominationsGrid');
const votingModal = document.getElementById('votingModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalCandidates = document.getElementById('modalCandidates');
const modalSubmit = document.getElementById('modalSubmit');
const completionSection = document.getElementById('completionSection');

// State
let votes = {};
let currentNomination = null;
let selectedCandidate = null;

// Sound removed

// Check if user already voted
const hasVoted = localStorage.getItem('hasVoted');
votes = JSON.parse(localStorage.getItem('votes') || '{}');

if (hasVoted) {
    showCompletion();
} else {
    renderNominationsGrid();
}

// Render nominations grid
function renderNominationsGrid() {
    nominationsView.style.display = 'block';
    
    nominationsGrid.innerHTML = '';
    
    nominations.forEach(nomination => {
        const hasVotedForThis = votes[nomination.id];
        
        const shield = document.createElement('div');
        shield.className = 'nomination-shield';
        shield.setAttribute('data-nomination', nomination.id);
        
        // Если проголосовали - показываем фото кандидата
        let shieldContent;
        if (hasVotedForThis) {
            const votedCandidate = candidates.find(c => c.id === hasVotedForThis);
            if (votedCandidate && votedCandidate.photo) {
                shieldContent = `<div class="shield-container">
                       <img src="${votedCandidate.photo}" alt="${votedCandidate.name}" class="shield-voted-photo">
                   </div>`;
            } else {
                shieldContent = nomination.image 
                    ? `<div class="shield-container">
                           <img src="${nomination.image}" alt="${nomination.title}" class="shield-full-image">
                       </div>`
                    : `<div class="shield-container">
                           <div class="shield-bg">
                               <div class="shield-stars">
                                   <div class="shield-star"></div>
                                   <div class="shield-star"></div>
                                   <div class="shield-star"></div>
                                   <div class="shield-star"></div>
                               </div>
                           </div>
                           <div class="shield-emoji">${nomination.emoji}</div>
                       </div>`;
            }
        } else {
            shieldContent = nomination.image 
                ? `<div class="shield-container">
                       <img src="${nomination.image}" alt="${nomination.title}" class="shield-full-image">
                   </div>`
                : `<div class="shield-container">
                       <div class="shield-bg">
                           <div class="shield-stars">
                               <div class="shield-star"></div>
                               <div class="shield-star"></div>
                               <div class="shield-star"></div>
                               <div class="shield-star"></div>
                           </div>
                       </div>
                       <div class="shield-emoji">${nomination.emoji}</div>
                   </div>`;
        }
        
        shield.innerHTML = `
            ${shieldContent}
            <div class="nomination-info">
                <div class="nomination-name">${nomination.title}</div>
                <div class="nomination-status ${hasVotedForThis ? 'voted' : ''}">
                    ${hasVotedForThis ? '✓ Голос отдан' : 'Сделай выбор'}
                </div>
            </div>
        `;
        
        shield.addEventListener('click', () => openNomination(nomination));
        nominationsGrid.appendChild(shield);
    });
}

// Open nomination for voting
function openNomination(nomination) {
    currentNomination = nomination;
    selectedCandidate = votes[nomination.id] || null;
    
    votingModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    modalTitle.textContent = nomination.title;
    
    modalCandidates.innerHTML = '';
    
    candidates.forEach(candidate => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        
        if (selectedCandidate === candidate.id) {
            card.classList.add('selected');
        }
        
        const avatarContent = candidate.photo 
            ? `<img src="${candidate.photo}" alt="${candidate.name}" class="candidate-photo">`
            : `<div class="candidate-emoji">${candidate.emoji}</div>`;
        
        card.innerHTML = `
            ${avatarContent}
            <div class="candidate-name">${candidate.name}</div>
        `;
        
        card.addEventListener('click', () => selectCandidate(candidate.id));
        modalCandidates.appendChild(card);
    });
    
    updateVoteButton();
}

// Close modal
function closeModal() {
    votingModal.style.display = 'none';
    document.body.style.overflow = '';
    currentNomination = null;
    selectedCandidate = null;
}

// Select candidate
function selectCandidate(candidateId) {
    selectedCandidate = candidateId;
    
    // Update UI
    const cards = modalCandidates.querySelectorAll('.candidate-card');
    cards.forEach((card, index) => {
        if (candidates[index].id === candidateId) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    updateVoteButton();
}

// Update vote button state
function updateVoteButton() {
    modalSubmit.disabled = !selectedCandidate;
}

// Modal close handlers
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Generate browser fingerprint (iOS-compatible)
function generateFingerprint() {
    try {
        // Более простой fingerprint без canvas (для совместимости с iOS)
        const fingerprint = 
            navigator.userAgent + 
            navigator.language + 
            screen.colorDepth + 
            screen.width + 'x' + screen.height +
            new Date().getTimezoneOffset() +
            (navigator.hardwareConcurrency || '') +
            (navigator.deviceMemory || '');
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'fp_' + Math.abs(hash).toString(36);
    } catch (error) {
        // Fallback: generate random ID
        return 'fp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
}

// Get or create user ID (with error handling for iOS)
function getUserId() {
    try {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = generateFingerprint();
            localStorage.setItem('userId', userId);
        }
        return userId;
    } catch (error) {
        console.error('LocalStorage error:', error);
        // Fallback if localStorage is blocked (private mode)
        return generateFingerprint();
    }
}

// Submit vote for current nomination
modalSubmit.addEventListener('click', async () => {
    if (!selectedCandidate || !currentNomination) return;
    
    modalSubmit.disabled = true;
    modalSubmit.textContent = 'Сохранение...';
    
    try {
        const userId = getUserId();
        
        // Check if this user already voted (in Firebase) with timeout
        const userVoteRef = ref(database, `userVotes/${userId}`);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        
        const userVoteSnapshot = await Promise.race([
            get(userVoteRef),
            timeoutPromise
        ]);
        
        if (userVoteSnapshot.exists()) {
            const existingVotes = userVoteSnapshot.val();
            if (existingVotes[currentNomination.id]) {
                window.toast.warning(
                    'Уже проголосовали',
                    'Вы уже голосовали в этой номинации!'
                );
                modalSubmit.disabled = false;
                modalSubmit.textContent = 'Подтвердить выбор';
                return;
            }
        }
        
        // Save vote locally (with error handling)
        votes[currentNomination.id] = selectedCandidate;
        try {
            localStorage.setItem('votes', JSON.stringify(votes));
        } catch (storageError) {
            console.warn('LocalStorage save failed:', storageError);
        }
        
        // Save to Firebase (both vote count and user tracking) with timeout
        await Promise.race([
            Promise.all([
                // Increment vote count using transaction
                runTransaction(ref(database, `votes/${currentNomination.id}/${selectedCandidate}`), (currentValue) => {
                    return (currentValue || 0) + 1;
                }),
                // Save user vote tracking
                set(ref(database, `userVotes/${userId}/${currentNomination.id}`), selectedCandidate)
            ]),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout при сохранении')), 10000)
            )
        ]);
        
        // Show success notification
        const candidateName = candidates.find(c => c.id === selectedCandidate)?.name || 'кандидат';
        window.toast.success(
            'Голос учтен!',
            `Ваш голос за ${candidateName} сохранен`
        );
        
        // Close modal
        closeModal();
        
        // Check if all nominations are voted
        if (Object.keys(votes).length === nominations.length) {
            try {
                localStorage.setItem('hasVoted', 'true');
            } catch (storageError) {
                console.warn('LocalStorage save failed:', storageError);
            }
            showCompletion();
        } else {
            renderNominationsGrid();
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        
        // Формируем код ошибки для отладки
        const errorCode = error.code || error.name || 'UNKNOWN';
        const errorDetails = error.message || 'Неизвестная ошибка';
        
        let errorMessage = 'Ошибка при сохранении голоса. Попробуйте еще раз.';
        
        if (error.message === 'Timeout' || error.message === 'Timeout при сохранении') {
            errorMessage = 'Превышено время ожидания. Проверьте подключение к интернету и попробуйте снова.';
        } else if (error.code === 'PERMISSION_DENIED') {
            errorMessage = 'Ошибка доступа к базе данных. Обратитесь к администратору.';
        }
        
        // Показываем toast с кодом ошибки
        window.toast.error(
            'Ошибка сохранения',
            errorMessage,
            `Код: ${errorCode} | ${errorDetails}`
        );
    } finally {
        modalSubmit.disabled = false;
        modalSubmit.textContent = 'Подтвердить выбор';
    }
});

// Show completion screen
function showCompletion() {
    // Показываем номинации с выбранными кандидатами
    renderNominationsGrid();
    
    votingModal.style.display = 'none';
    completionSection.style.display = 'block';
    
    // Отключаем возможность голосовать повторно
    const shields = document.querySelectorAll('.nomination-shield');
    shields.forEach(shield => {
        shield.style.cursor = 'default';
        shield.style.pointerEvents = 'none';
    });
}
