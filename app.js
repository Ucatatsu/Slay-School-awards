import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, set, get, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
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
const adminSection = document.getElementById('adminSection');
const adminToggle = document.getElementById('adminToggle');
const adminPanel = document.getElementById('adminPanel');
const adminLogin = document.getElementById('adminLogin');
const adminResults = document.getElementById('adminResults');
const adminPassword = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const resultsContainer = document.getElementById('resultsContainer');

// State
let votes = {};
let currentNomination = null;
let selectedCandidate = null;

// Check if user already voted
const hasVoted = localStorage.getItem('hasVoted');
if (hasVoted) {
    votes = JSON.parse(localStorage.getItem('votes') || '{}');
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
        
        const shieldContent = nomination.image 
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

// Submit vote for current nomination
modalSubmit.addEventListener('click', async () => {
    if (!selectedCandidate || !currentNomination) return;
    
    modalSubmit.disabled = true;
    modalSubmit.textContent = 'Сохранение...';
    
    try {
        // Save vote locally
        votes[currentNomination.id] = selectedCandidate;
        localStorage.setItem('votes', JSON.stringify(votes));
        
        // Save to Firebase
        await set(ref(database, `votes/${currentNomination.id}/${selectedCandidate}`), increment(1));
        
        // Close modal
        closeModal();
        
        // Check if all nominations are voted
        if (Object.keys(votes).length === nominations.length) {
            localStorage.setItem('hasVoted', 'true');
            showCompletion();
        } else {
            renderNominationsGrid();
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('Ошибка при сохранении голоса. Попробуйте еще раз.');
    } finally {
        modalSubmit.disabled = false;
        modalSubmit.textContent = 'Подтвердить выбор';
    }
});

// Show completion screen
function showCompletion() {
    nominationsView.style.display = 'none';
    votingSection.style.display = 'none';
    completionSection.style.display = 'block';
    adminSection.style.display = 'block';
}

// Admin panel toggle
adminToggle.addEventListener('click', () => {
    adminPanel.style.display = adminPanel.style.display === 'none' ? 'block' : 'none';
});

// Admin login
loginBtn.addEventListener('click', () => {
    if (adminPassword.value === ADMIN_PASSWORD) {
        adminLogin.style.display = 'none';
        adminResults.style.display = 'block';
        loadResults();
    } else {
        alert('Неверный пароль');
    }
});

// Admin logout
logoutBtn.addEventListener('click', () => {
    adminLogin.style.display = 'block';
    adminResults.style.display = 'none';
    adminPassword.value = '';
});

// Load results
async function loadResults() {
    try {
        const snapshot = await get(ref(database, 'votes'));
        const votesData = snapshot.val() || {};
        
        resultsContainer.innerHTML = '';
        
        nominations.forEach(nomination => {
            const nominationVotes = votesData[nomination.id] || {};
            
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            let candidatesHTML = '';
            const sortedCandidates = Object.entries(nominationVotes)
                .sort((a, b) => b[1] - a[1]);
            
            if (sortedCandidates.length === 0) {
                candidatesHTML = '<p style="color: #999;">Голосов пока нет</p>';
            } else {
                sortedCandidates.forEach(([candidateId, count]) => {
                    const candidate = candidates.find(c => c.id === candidateId);
                    if (candidate) {
                        candidatesHTML += `
                            <div class="result-candidate">
                                <span>${candidate.emoji} ${candidate.name}</span>
                                <span class="result-votes">${count} ${getVotesWord(count)}</span>
                            </div>
                        `;
                    }
                });
            }
            
            resultItem.innerHTML = `
                <h4>${nomination.emoji} ${nomination.title}</h4>
                ${candidatesHTML}
            `;
            
            resultsContainer.appendChild(resultItem);
        });
    } catch (error) {
        console.error('Error loading results:', error);
        resultsContainer.innerHTML = '<p style="color: red;">Ошибка загрузки результатов</p>';
    }
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
