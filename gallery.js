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
    let currentCard = null;

    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const audioId = this.dataset.audio;
            const audio = document.getElementById(audioId);
            const galleryCard = this.closest('.gallery-card');
            
            if (!audio || !galleryCard) return;

            // Stop any currently playing audio
            if (currentAudio && currentAudio !== audio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                if (currentCard) {
                    currentCard.classList.remove('playing');
                }
            }

            // Toggle play/pause
            if (audio.paused) {
                audio.play().catch(e => {
                    console.log('Playback failed:', e);
                });
                galleryCard.classList.add('playing');
                currentAudio = audio;
                currentCard = galleryCard;
                
                // Track play for analytics
                const songTitle = galleryCard.querySelector('h3').textContent;
                trackSongPlay(songTitle);
            } else {
                audio.pause();
                galleryCard.classList.remove('playing');
                currentAudio = null;
                currentCard = null;
            }

            // Handle audio ended
            audio.addEventListener('ended', function() {
                galleryCard.classList.remove('playing');
                currentAudio = null;
                currentCard = null;
            }, { once: true });

            // Handle audio errors
            audio.addEventListener('error', function() {
                console.error('Audio playback error for:', audioId);
                galleryCard.classList.remove('playing');
                currentAudio = null;
                currentCard = null;
            }, { once: true });
        });
    });

    // Pause all audio when another starts playing
    document.addEventListener('play', function(e) {
        if (e.target.tagName === 'AUDIO') {
            const audios = document.querySelectorAll('audio');
            audios.forEach(audio => {
                if (audio !== e.target && !audio.paused) {
                    audio.pause();
                    const card = audio.closest('.gallery-card');
                    if (card) {
                        card.classList.remove('playing');
                    }
                }
            });
        }
    }, true);
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
                const card = audio.closest('.gallery-card');
                if (card) {
                    card.classList.remove('playing');
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