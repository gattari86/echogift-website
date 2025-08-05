// Smooth scrolling function
function scrollToOrder() {
    const orderSection = document.getElementById('order');
    orderSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
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
            const data = Object.fromEntries(formData);
            
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
                genre: data.genre,
                tone: data.tone,
                email: data.email,
                delivery: data.delivery
            };
            
            // Store in session storage for checkout page
            sessionStorage.setItem('orderData', JSON.stringify(orderData));
            
            // Redirect to checkout
            window.location.href = 'checkout.html';
        });
    }
    
    // Vinyl waitlist form
    if (vinylForm) {
        const vinylButton = vinylForm.querySelector('.vinyl-button');
        const vinylEmail = vinylForm.querySelector('.vinyl-email');
        
        vinylButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const email = vinylEmail.value.trim();
            
            if (!validateEmail(email)) {
                showErrorMessage('Please enter a valid email address.');
                return;
            }
            
            // Show success message
            showSuccessMessage('Thank you! You\'ve been added to our vinyl waitlist.');
            vinylEmail.value = '';
        });
    }
    
    // Dynamic pricing update
    const productSelect = document.getElementById('product-type');
    if (productSelect) {
        productSelect.addEventListener('change', function() {
            updatePricingHighlight(this.value);
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
        'email',
        'delivery'
    ];
    
    for (let field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
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
`;
document.head.appendChild(style);