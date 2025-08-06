// Gallery functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeGallery();
    setupAudioPlayers();
    setupFilterButtons();
});

function initializeGallery() {
    // Add loading states and error handling for images with lazy loading
    const images = document.querySelectorAll('.song-artwork img');
    images.forEach(img => {
        // Add loading class initially
        img.classList.add('loading');
        
        img.addEventListener('load', function() {
            this.classList.remove('loading');
            this.classList.add('loaded');
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            this.classList.remove('loading');
            this.src = 'audio/Two decades.png'; // Fallback image
            this.style.opacity = '1';
        });
        
        // Preload images that are in viewport
        if (img.loading === 'lazy' && 'IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.remove('loading');
                        observer.unobserve(img);
                    }
                });
            });
            imageObserver.observe(img);
        }
    });
}

function setupAudioPlayers() {
    const playButtons = document.querySelectorAll('.play-btn');
    let currentAudio = null;
    let currentButton = null;

    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const audioId = this.dataset.audio;
            const audio = document.getElementById(audioId);
            
            if (!audio) return;

            // Stop any currently playing audio
            if (currentAudio && currentAudio !== audio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                if (currentButton) {
                    currentButton.textContent = '▶️';
                    currentButton.closest('.song-artwork').classList.remove('playing');
                }
            }

            // Toggle play/pause
            if (audio.paused) {
                audio.play();
                this.textContent = '⏸️';
                this.closest('.song-artwork').classList.add('playing');
                currentAudio = audio;
                currentButton = this;
            } else {
                audio.pause();
                this.textContent = '▶️';
                this.closest('.song-artwork').classList.remove('playing');
                currentAudio = null;
                currentButton = null;
            }

            // Handle audio ended
            audio.addEventListener('ended', function() {
                button.textContent = '▶️';
                button.closest('.song-artwork').classList.remove('playing');
                currentAudio = null;
                currentButton = null;
            });
        });
    });
}

function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryCards = document.querySelectorAll('.gallery-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            // Filter cards
            galleryCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                } else {
                    const categories = card.dataset.category.split(' ');
                    if (categories.includes(filter)) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 100);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                }
            });
        });
    });
}

// Pause all audio when page is hidden/minimized
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        const audios = document.querySelectorAll('audio');
        audios.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                const button = document.querySelector(`[data-audio="${audio.id}"]`);
                if (button) {
                    button.textContent = '▶️';
                    button.closest('.song-artwork').classList.remove('playing');
                }
            }
        });
    }
});

// Analytics tracking for song plays (optional)
function trackSongPlay(songTitle) {
    // Add your analytics code here
    console.log(`Song played: ${songTitle}`);
}