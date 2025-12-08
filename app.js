import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getDatabase, ref, set, get, runTransaction } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js';
import { firebaseConfig, ADMIN_PASSWORD, nominations, candidates, VOTING_END_DATE } from './config.js';

// Initialize Firebase with error handling
let app, database;
try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    // Продолжаем работу без Firebase (только локально)
}

// Loading Screen
const loadingScreen = document.getElementById('loadingScreen');

// Hide loading screen after initialization (iOS-compatible)
function hideLoadingScreen() {
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 1500);
}

// Используем несколько событий для надежности на iOS
if (document.readyState === 'complete') {
    hideLoadingScreen();
} else {
    window.addEventListener('load', hideLoadingScreen);
    // Fallback для iOS
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(hideLoadingScreen, 100);
    });
    // Дополнительный fallback
    setTimeout(hideLoadingScreen, 3000);
}

// Elements
const nominationsView = document.getElementById('nominationsView');
const nominationsGrid = document.getElementById('nominationsGrid');
const votingModal = document.getElementById('votingModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalCandidates = document.getElementById('modalCandidates');
const modalSubmit = document.getElementById('modalSubmit');

// State
let votes = {};
let currentNomination = null;
let selectedCandidate = null;
let countdownInterval = null;

// Sound removed

// Check if user already voted (with error handling for iOS)
let hasVoted = false;
try {
    hasVoted = localStorage.getItem('hasVoted');
    votes = JSON.parse(localStorage.getItem('votes') || '{}');
} catch (error) {
    console.warn('LocalStorage access failed:', error);
    votes = {};
}

// Инициализация UI
try {
    console.log('Starting UI initialization...', { hasVoted, votesCount: Object.keys(votes).length });
    renderNominationsGrid();
    console.log('UI initialized successfully');
} catch (error) {
    console.error('UI initialization error:', error);
    // Показываем номинации в любом случае
    try {
        nominationsView.style.display = 'block';
        renderNominationsGrid();
    } catch (fallbackError) {
        console.error('Fallback rendering failed:', fallbackError);
        // Последняя попытка - показать хоть что-то
        if (loadingScreen) loadingScreen.style.display = 'none';
        document.body.innerHTML += '<div style="color: white; text-align: center; padding: 40px; font-size: 20px;">Ошибка загрузки. Пожалуйста, обновите страницу или попробуйте другой браузер.</div>';
    }
}

// Render nominations grid
function renderNominationsGrid() {
    try {
        nominationsView.style.display = 'block';
        
        // Запускаем таймер обратного отсчета (только один раз)
        if (!countdownInterval) {
            updateCountdown();
            countdownInterval = setInterval(updateCountdown, 1000);
        }
        
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
    } catch (error) {
        console.error('Error rendering nominations:', error);
        // Показываем сообщение об ошибке
        nominationsGrid.innerHTML = '<div style="color: #ff6b35; text-align: center; padding: 40px;">Ошибка загрузки. Обновите страницу.</div>';
    }
}

// Open nomination for voting
function openNomination(nomination) {
    // Проверяем, не завершилось ли голосование
    if (isVotingEnded()) {
        window.toast.warning(
            'Голосование завершено',
            'К сожалению, время голосования истекло'
        );
        return;
    }
    
    currentNomination = nomination;
    selectedCandidate = votes[nomination.id] || null;
    
    votingModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    modalTitle.textContent = nomination.title;
    
    modalCandidates.innerHTML = '';
    
    // Фильтруем кандидатов по полу
    const allowedGender = nomination.allowedGender || 'any';
    const filteredCandidates = candidates.filter(candidate => {
        if (allowedGender === 'any') return true;
        return candidate.gender === allowedGender;
    });
    
    filteredCandidates.forEach(candidate => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.setAttribute('data-candidate-id', candidate.id);
        
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
    cards.forEach(card => {
        const cardCandidateId = card.getAttribute('data-candidate-id');
        if (cardCandidateId === candidateId) {
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
        if (!database) {
            throw new Error('Database not initialized');
        }
        
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
            // Показываем уведомление о завершении
            window.toast.success(
                'Голосование завершено!',
                'Спасибо за участие! Все ваши голоса учтены.'
            );
        }
        
        // Обновляем отображение номинаций
        renderNominationsGrid();
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

// Check if voting has ended
function isVotingEnded() {
    return new Date().getTime() > VOTING_END_DATE.getTime();
}

// Countdown Timer
function updateCountdown() {
    const now = new Date().getTime();
    const endTime = VOTING_END_DATE.getTime();
    const distance = endTime - now;
    
    console.log('Countdown:', { now: new Date(now), endTime: new Date(endTime), distance });
    
    if (distance < 0) {
        // Голосование завершено - показываем сообщение и победителей
        const timerEl = document.getElementById('countdownTimer');
        if (timerEl) {
            timerEl.innerHTML = `
                <div class="voting-ended">
                    <div class="ended-title">ГОЛОСОВАНИЕ</div>
                    <div class="ended-title">ЗАВЕРШЕНО</div>
                </div>
            `;
        }
        
        // Меняем замок на закрытый (на весь экран)
        const decorativeElements = document.querySelector('.decorative-elements');
        if (decorativeElements) {
            decorativeElements.classList.add('voting-ended-state');
            decorativeElements.innerHTML = `
                <img src="assets/locked_locker.png" alt="Locked" class="locked-fullscreen">
            `;
        }
        
        // Показываем победителей
        showWinners();
        
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log('Time values:', { days, hours, minutes });
    
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    
    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
}

// Show winners after voting ends
async function showWinners() {
    try {
        if (!database) {
            console.error('Database not initialized');
            return;
        }
        
        // Получаем все голоса из Firebase
        const votesRef = ref(database, 'votes');
        const votesSnapshot = await get(votesRef);
        
        if (!votesSnapshot.exists()) {
            console.log('No votes found');
            return;
        }
        
        const allVotes = votesSnapshot.val();
        const winners = {};
        
        // Находим победителя для каждой номинации
        nominations.forEach(nomination => {
            const nominationVotes = allVotes[nomination.id] || {};
            let maxVotes = 0;
            let winnerId = null;
            
            Object.entries(nominationVotes).forEach(([candidateId, voteCount]) => {
                if (voteCount > maxVotes) {
                    maxVotes = voteCount;
                    winnerId = candidateId;
                }
            });
            
            if (winnerId) {
                winners[nomination.id] = {
                    candidateId: winnerId,
                    votes: maxVotes
                };
            }
        });
        
        // Отображаем победителей
        renderWinners(winners);
    } catch (error) {
        console.error('Error loading winners:', error);
    }
}

// Render winners grid
function renderWinners(winners) {
    nominationsGrid.innerHTML = '';
    
    nominations.forEach(nomination => {
        const winner = winners[nomination.id];
        const shield = document.createElement('div');
        shield.className = 'nomination-shield winner-shield';
        
        let shieldContent;
        if (winner) {
            const winnerCandidate = candidates.find(c => c.id === winner.candidateId);
            if (winnerCandidate && winnerCandidate.photo) {
                shieldContent = `
                    <div class="shield-container">
                        <img src="${winnerCandidate.photo}" alt="${winnerCandidate.name}" class="shield-voted-photo">
                        <div class="winner-badge">🏆</div>
                    </div>
                `;
            } else {
                shieldContent = `
                    <div class="shield-container">
                        <div class="shield-bg">
                            <div class="shield-stars">
                                <div class="shield-star"></div>
                                <div class="shield-star"></div>
                                <div class="shield-star"></div>
                                <div class="shield-star"></div>
                            </div>
                        </div>
                        <div class="shield-emoji">${nomination.emoji}</div>
                    </div>
                `;
            }
            
            shield.innerHTML = `
                ${shieldContent}
                <div class="nomination-info">
                    <div class="nomination-name">${nomination.title}</div>
                    <div class="winner-name">${winnerCandidate ? winnerCandidate.name : 'Нет данных'}</div>
                    <div class="winner-votes">${winner.votes} ${getVotesWord(winner.votes)}</div>
                </div>
            `;
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
            
            shield.innerHTML = `
                ${shieldContent}
                <div class="nomination-info">
                    <div class="nomination-name">${nomination.title}</div>
                    <div class="winner-name">Нет голосов</div>
                </div>
            `;
        }
        
        nominationsGrid.appendChild(shield);
    });
}

// Helper function for correct word form
function getVotesWord(count) {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'голосов';
    }
    if (lastDigit === 1) {
        return 'голос';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'голоса';
    }
    return 'голосов';
}


