// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
}

// Initialize mobile menu on page load
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav-link, .nav-cta');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const navMenu = document.querySelector('.nav-menu');
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            }
        });
    });
});

// Smooth scrolling function
function scrollToOrder() {
    const orderSection = document.getElementById('order');
    orderSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Scroll to samples section and highlight specific song
function scrollToSamples(songTitle) {
    const samplesSection = document.getElementById('audio-samples');
    samplesSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Highlight the specific song card after scrolling
    setTimeout(() => {
        const sampleCards = document.querySelectorAll('.sample-card');
        sampleCards.forEach(card => {
            const title = card.querySelector('h3').textContent;
            if (title.includes(songTitle.replace(' (Remix)', ''))) {
                card.classList.add('highlighted');
                setTimeout(() => {
                    card.classList.remove('highlighted');
                }, 3000); // Remove highlight after 3 seconds
            }
        });
    }, 800); // Wait for scroll to complete
}

// Form handling
document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.querySelector('.order-form-content');
    const vinylForm = document.querySelector('.vinyl-signup');
    
    // Order form submission
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(orderForm);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                if (key === 'terms-agreement') {
                    data[key] = orderForm.querySelector(`[name="${key}"]`).checked;
                } else {
                    data[key] = value;
                }
            }
            
            // Basic validation
            if (!validateOrderForm(data)) {
                return;
            }
            
            // Store order data and redirect to checkout
            const orderData = {
                productType: data['product-type'],
                recipientName: data['recipient-name'],
                occasion: data.occasion,
                storyThemes: data['story-themes'],
                artworkInspiration: data['artwork-inspiration'] || '',
                genre: data.genre,
                tone: data.tone,
                languagePreference: data['language-preference'],
                email: data.email,
                delivery: 'Email Download' // Default since delivery preference was removed
            };
            
            // Add album-specific song details if album is selected
            if (data['product-type'] === 'album') {
                orderData.albumSongs = [];
                for (let i = 1; i <= 5; i++) {
                    const songTitle = data[`song${i}-title`] || '';
                    const songStory = data[`song${i}-story`] || '';
                    const songLanguage = data[`song${i}-language`] || '';
                    if (songTitle || songStory) {
                        orderData.albumSongs.push({
                            songNumber: i,
                            title: songTitle,
                            story: songStory,
                            language: songLanguage
                        });
                    }
                }
            }
            
            // Store in session storage for checkout page
            sessionStorage.setItem('orderData', JSON.stringify(orderData));
            
            // Redirect to checkout
            window.location.href = 'checkout.html';
        });
    }
    
    // Vinyl waitlist form (now handled by Formspree)
    if (vinylForm) {
        vinylForm.addEventListener('submit', function(e) {
            const email = vinylForm.querySelector('.vinyl-email').value.trim();
            
            if (!validateEmail(email)) {
                e.preventDefault();
                showErrorMessage('Please enter a valid email address.');
                return;
            }
            
            // Show loading state
            const submitButton = vinylForm.querySelector('.vinyl-button');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Joining...';
            submitButton.disabled = true;
            
            // Form will submit to Formspree, then redirect back
            // Success message will be shown when they return
        });
    }
    
    // Check if user returned from Formspree vinyl signup
    if (window.location.hash === '#vinyl-success') {
        showSuccessMessage('Thank you! You\'ve been added to our vinyl waitlist. We\'ll email you when vinyl records are available!');
        // Clean up the hash
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
    
    // Dynamic pricing update and form fields
    const productSelect = document.getElementById('product-type');
    if (productSelect) {
        productSelect.addEventListener('change', function() {
            updatePricingHighlight(this.value);
            toggleAlbumFields(this.value);
        });
    }
});

// Form validation functions
function validateOrderForm(data) {
    const requiredFields = [
        'product-type',
        'recipient-name', 
        'occasion',
        'story-themes',
        'genre',
        'tone',
        'language-preference',
        'email',
        'terms-agreement'
    ];
    
    for (let field of requiredFields) {
        if (field === 'terms-agreement') {
            // Special validation for checkbox
            if (!data[field]) {
                showErrorMessage('You must agree to the Terms of Service and Privacy Policy to proceed.');
                return false;
            }
        } else if (!data[field] || data[field].trim() === '') {
            showErrorMessage(`Please fill in the ${field.replace('-', ' ')} field.`);
            return false;
        }
    }
    
    if (!validateEmail(data.email)) {
        showErrorMessage('Please enter a valid email address.');
        return false;
    }
    
    return true;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Update pricing highlight based on selection
function updatePricingHighlight(selectedType) {
    const priceCards = document.querySelectorAll('.price-card');
    
    priceCards.forEach(card => {
        card.classList.remove('featured');
    });
    
    if (selectedType === 'single') {
        priceCards[0].classList.add('featured');
    } else if (selectedType === 'album') {
        priceCards[1].classList.add('featured');
    }
}

// Toggle album-specific fields
function toggleAlbumFields(selectedType) {
    // First, check if album fields already exist
    let albumFieldsContainer = document.getElementById('album-fields');
    
    if (selectedType === 'album') {
        // Show album-specific fields if not already present
        if (!albumFieldsContainer) {
            albumFieldsContainer = createAlbumFields();
            const storyGroup = document.querySelector('textarea[name="story-themes"]').closest('.form-group');
            storyGroup.parentNode.insertBefore(albumFieldsContainer, storyGroup.nextSibling);
        }
        albumFieldsContainer.style.display = 'block';
        
        // Update the main story field label and placeholder for albums
        const storyLabel = document.querySelector('label[for="story-themes"]');
        const storyTextarea = document.getElementById('story-themes');
        storyLabel.textContent = 'Tell Us Your Story (Overall Album Theme)';
        storyTextarea.placeholder = 'Share the overarching theme or story that connects all 5 songs...';
    } else {
        // Hide album fields for single songs
        if (albumFieldsContainer) {
            albumFieldsContainer.style.display = 'none';
        }
        
        // Reset the main story field for single songs
        const storyLabel = document.querySelector('label[for="story-themes"]');
        const storyTextarea = document.getElementById('story-themes');
        storyLabel.textContent = 'Tell Us Your Story';
        storyTextarea.placeholder = 'Share the key stories, memories, or themes you\'d like included in your song...';
    }
}

// Create album-specific fields for 5 songs
function createAlbumFields() {
    const container = document.createElement('div');
    container.id = 'album-fields';
    container.className = 'album-fields-container';
    
    // Create the header
    const header = document.createElement('div');
    header.className = 'album-fields-header';
    header.innerHTML = `
        <h4>Individual Song Details</h4>
        <p>Please provide specific details for each of the 5 songs in your album:</p>
    `;
    container.appendChild(header);
    
    // Create each song field group
    for (let i = 1; i <= 5; i++) {
        const songGroup = document.createElement('div');
        songGroup.className = 'song-field-group';
        
        // Create the HTML for this song - using different class names to avoid conflicts
        songGroup.innerHTML = `
            <h5>Song ${i}</h5>
            <div class="album-form-row">
                <div class="album-form-group">
                    <label for="song${i}-title">Song Title/Theme</label>
                    <input type="text" id="song${i}-title" name="song${i}-title" 
                           class="album-input"
                           placeholder="e.g., 'Our First Dance', 'College Years'..." 
                           autocomplete="off">
                </div>
                <div class="album-form-group">
                    <label for="song${i}-language">Language</label>
                    <select id="song${i}-language" name="song${i}-language"
                            class="album-select">
                        <option value="">Select language</option>
                        <option value="english">English</option>
                        <option value="spanish">Spanish</option>
                    </select>
                </div>
            </div>
            <div class="album-form-group">
                <label for="song${i}-story">Story/Memory for This Song</label>
                <textarea id="song${i}-story" name="song${i}-story" rows="3" 
                          class="album-textarea"
                          placeholder="Brief story or memory for song ${i}..." 
                          autocomplete="off"></textarea>
            </div>
        `;
        
        container.appendChild(songGroup);
    }
    
    // Add event listeners to ensure fields work properly after creation
    setTimeout(() => {
        // Force focus capability on all album fields
        const albumFields = container.querySelectorAll('.album-input, .album-textarea, .album-select');
        albumFields.forEach(field => {
            // Remove any existing event listeners
            field.removeAttribute('readonly');
            field.removeAttribute('disabled');
            
            // Add focus event listeners
            field.addEventListener('focus', function() {
                this.style.borderColor = '#3498DB';
                this.style.backgroundColor = 'white';
            });
            
            field.addEventListener('blur', function() {
                this.style.borderColor = '#E8E8E8';
                this.style.backgroundColor = 'white';
            });
            
            // Ensure the field is clickable
            field.addEventListener('click', function(e) {
                e.stopPropagation();
                this.focus();
            });
            
            // Add input event to ensure typing works
            if (field.type === 'text' || field.tagName === 'TEXTAREA') {
                field.addEventListener('input', function() {
                    console.log(`Input detected in ${this.id}: ${this.value}`);
                });
            }
        });
        
        console.log(`Album fields initialized: ${albumFields.length} fields found`);
    }, 200);
    
    return container;
}

// Message display functions
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message-popup');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-popup ${type}`;
    messageDiv.textContent = message;
    
    // Style the message
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27AE60' : '#E74C3C'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 400px;
        font-size: 16px;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 5000);
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.price-card, .testimonial, .form-group');
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .price-card,
    .testimonial,
    .form-group {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .message-popup {
        font-family: 'Inter', sans-serif;
    }
    
    .album-fields-container {
        margin: 20px 0;
        padding: 24px;
        background: #f8f9fa;
        border-radius: 12px;
        border: 1px solid #e9ecef;
        display: none;
    }
    
    .album-fields-header h4 {
        margin: 0 0 8px 0;
        color: #D4AF37;
        font-size: 18px;
        font-weight: 600;
    }
    
    .album-fields-header p {
        margin: 0 0 20px 0;
        color: #666;
        font-size: 14px;
    }
    
    .song-field-group {
        margin-bottom: 24px;
        padding: 16px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }
    
    .song-field-group h5 {
        margin: 0 0 12px 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
        border-bottom: 1px solid #e9ecef;
        padding-bottom: 8px;
    }
    
    .album-input,
    .album-textarea,
    .album-select {
        width: 100% !important;
        padding: 12px 16px !important;
        border: 2px solid #E8E8E8 !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        background: white !important;
        background-color: white !important;
        color: #333 !important;
        box-sizing: border-box !important;
        transition: border-color 0.3s ease !important;
        resize: vertical;
        pointer-events: auto !important;
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        opacity: 1 !important;
        z-index: 10 !important;
        position: relative !important;
    }
    
    .album-input:focus,
    .album-textarea:focus,
    .album-select:focus {
        outline: none !important;
        border-color: #3498DB !important;
        background: white !important;
        background-color: white !important;
        box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1) !important;
    }
    
    .album-input::placeholder,
    .album-textarea::placeholder {
        color: #999 !important;
        opacity: 1 !important;
    }
    
    .album-input:disabled,
    .album-textarea:disabled,
    .album-select:disabled {
        background: #f5f5f5 !important;
        cursor: not-allowed;
    }
    
    /* Additional styling for album form groups */
    .album-form-group {
        margin-bottom: 16px !important;
    }
    
    .album-form-group label {
        display: block !important;
        margin-bottom: 8px !important;
        font-weight: 500 !important;
        color: #333 !important;
    }
    
    .album-form-row {
        display: flex !important;
        gap: 16px !important;
        margin-bottom: 16px !important;
    }
    
    .album-form-row .album-form-group {
        flex: 1 !important;
    }
    
    /* Ensure album fields container is interactive */
    .album-fields-container * {
        pointer-events: auto !important;
    }
`;
document.head.appendChild(style);