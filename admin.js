import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, onValue, remove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { firebaseConfig, ADMIN_PASSWORD, nominations, candidates } from './config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Elements
const loginSection = document.getElementById('loginSection');
const resultsSection = document.getElementById('resultsSection');
const adminPassword = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const resetVotesBtn = document.getElementById('resetVotesBtn');
const errorMessage = document.getElementById('errorMessage');
const resultsGrid = document.getElementById('resultsGrid');
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmCancel = document.getElementById('confirmCancel');
const confirmOk = document.getElementById('confirmOk');

// Confirmation state
let confirmCallback = null;

// Check if already logged in
const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
if (isLoggedIn === 'true') {
    showResults();
}

// Login handler
loginBtn.addEventListener('click', login);
adminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        login();
    }
});

function login() {
    const password = adminPassword.value.trim();
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showResults();
    } else {
        errorMessage.textContent = 'Неверный пароль';
        errorMessage.style.display = 'block';
        adminPassword.value = '';
        adminPassword.focus();
        
        // Hide error after 3 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}

// Logout handler
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    loginSection.style.display = 'block';
    resultsSection.style.display = 'none';
    adminPassword.value = '';
});

// Reset votes handler
resetVotesBtn.addEventListener('click', () => {
    showConfirmation(
        'Сброс голосов - Шаг 1 из 2',
        'Вы действительно хотите удалить ВСЕ голоса? Это действие нельзя отменить!',
        () => {
            // First confirmation passed, show second
            showConfirmation(
                'Сброс голосов - Шаг 2 из 2',
                'Последнее предупреждение! Все данные голосования будут безвозвратно удалены. Продолжить?',
                async () => {
                    // Second confirmation passed, delete votes
                    hideConfirmation();
                    await resetAllVotes();
                }
            );
        }
    );
});

// Show confirmation modal
function showConfirmation(title, message, callback) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmCallback = callback;
    confirmModal.style.display = 'flex';
}

// Hide confirmation modal
function hideConfirmation() {
    confirmModal.style.display = 'none';
    confirmCallback = null;
}

// Confirmation buttons
confirmCancel.addEventListener('click', hideConfirmation);

confirmOk.addEventListener('click', () => {
    if (confirmCallback) {
        const callback = confirmCallback;
        confirmCallback = null;
        callback();
    }
});

// Close modal on overlay click
confirmModal.querySelector('.confirm-overlay').addEventListener('click', hideConfirmation);

// Reset all votes
async function resetAllVotes() {
    try {
        resetVotesBtn.disabled = true;
        resetVotesBtn.textContent = '⏳ Удаление...';
        
        // Delete all votes from Firebase
        await remove(ref(database, 'votes'));
        
        // Show success message
        alert('✅ Все голоса успешно удалены!');
        
        resetVotesBtn.disabled = false;
        resetVotesBtn.textContent = '🗑️ Сбросить все голоса';
    } catch (error) {
        console.error('Error resetting votes:', error);
        alert('❌ Ошибка при удалении голосов: ' + error.message);
        
        resetVotesBtn.disabled = false;
        resetVotesBtn.textContent = '🗑️ Сбросить все голоса';
    }
}

// Show results section
function showResults() {
    loginSection.style.display = 'none';
    resultsSection.style.display = 'block';
    loadResults();
}

// Load and display results
function loadResults() {
    const votesRef = ref(database, 'votes');
    
    // Listen for real-time updates
    onValue(votesRef, (snapshot) => {
        const votesData = snapshot.val() || {};
        renderResults(votesData);
    }, (error) => {
        console.error('Error loading results:', error);
        resultsGrid.innerHTML = '<div class="no-votes">Ошибка загрузки результатов</div>';
    });
}

// Render results
function renderResults(votesData) {
    resultsGrid.innerHTML = '';
    
    nominations.forEach(nomination => {
        const nominationVotes = votesData[nomination.id] || {};
        
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        // Sort candidates by votes
        const sortedCandidates = Object.entries(nominationVotes)
            .map(([candidateId, count]) => {
                const candidate = candidates.find(c => c.id === candidateId);
                return { candidate, count };
            })
            .filter(item => item.candidate)
            .sort((a, b) => b.count - a.count);
        
        let candidatesHTML = '';
        
        if (sortedCandidates.length === 0) {
            candidatesHTML = '<div class="no-votes">Голосов пока нет</div>';
        } else {
            candidatesHTML = '<div class="result-items-container">';
            sortedCandidates.forEach(({ candidate, count }) => {
                const emoji = candidate.emoji || '👤';
                candidatesHTML += `
                    <div class="result-item">
                        <span class="result-name">${emoji} ${candidate.name}</span>
                        <span class="result-votes">${count} ${getVotesWord(count)}</span>
                    </div>
                `;
            });
            candidatesHTML += '</div>';
        }
        
        const nominationEmoji = nomination.emoji || '🏆';
        resultCard.innerHTML = `
            <h3>${nominationEmoji} ${nomination.title}</h3>
            ${candidatesHTML}
        `;
        
        resultsGrid.appendChild(resultCard);
    });
}

// Helper function for Russian plurals
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


