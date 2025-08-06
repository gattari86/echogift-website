// Stripe configuration
const stripe = Stripe('pk_live_51RTWhNEinaZMSMtjUEnWpzUPDC8KZBlFOy9O4Is2iG6KDg0CrCLszCw8QksowdNQcUyFdp8BIuWmSPMYueau2t5200ayCjCLBw');

// Product pricing and Stripe Price IDs
const STRIPE_PRICES = {
    single: 'price_1RsuIhEinaZMSMtjh8LOF9vc', // $79 Personalized Song
    album: 'price_1RsuIqEinaZMSMtjlfcmwgvI'   // $299 Custom Song Album
};

// Alternative: Use Payment Links (more reliable than client-only checkout)
const PAYMENT_LINKS = {
    single: 'https://buy.stripe.com/YOUR_SINGLE_SONG_PAYMENT_LINK',
    album: 'https://buy.stripe.com/YOUR_ALBUM_PAYMENT_LINK'
};

const PRICING = {
    single: { price: 79.00, name: 'Personalized Song', description: 'Custom AI-generated song with your story + custom artwork' },
    album: { price: 299.00, name: 'Custom Song Album', description: '5 personalized songs telling your complete story + custom artwork' }
};

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    loadOrderData();
    setupPaymentForm();
});

function loadOrderData() {
    // Get order data from sessionStorage (passed from main form)
    const orderData = JSON.parse(sessionStorage.getItem('orderData') || '{}');
    
    // If no order data, redirect back to main page
    if (!orderData.productType) {
        window.location.href = 'index.html';
        return;
    }

    // Populate order summary
    const product = PRICING[orderData.productType];

    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('subtotal').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('processing-fee').textContent = 'Included';
    document.getElementById('final-total').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('button-amount').textContent = product.price.toFixed(2);

    // Populate order details
    document.getElementById('recipient-display').textContent = orderData.recipientName || 'N/A';
    document.getElementById('occasion-display').textContent = orderData.occasion || 'N/A';
    document.getElementById('genre-display').textContent = orderData.genre || 'N/A';
    document.getElementById('tone-display').textContent = orderData.tone || 'N/A';
    document.getElementById('email').value = orderData.email || '';

    // Store for payment processing
    window.orderData = orderData;
    window.orderTotal = product.price;
}

function setupPaymentForm() {
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const submitButton = document.getElementById('submit-payment');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('payment-spinner');
    
    // Disable submit button and show loading
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    spinner.classList.remove('hidden');

    try {
        await createStripeCheckoutSession();
    } catch (error) {
        console.error('Checkout failed:', error);
        showError(error.message || 'An error occurred starting checkout.');
        
        // Re-enable submit button
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        spinner.classList.add('hidden');
    }
}

async function createStripeCheckoutSession() {
    const orderData = window.orderData;
    const priceId = STRIPE_PRICES[orderData.productType];
    
    if (!priceId || priceId.includes('1234567890')) {
        throw new Error('Stripe price IDs not configured. Please set up your products in Stripe Dashboard.');
    }
    
    // Send order details via email before payment (backup)
    try {
        await sendOrderDetailsEmail(orderData);
    } catch (error) {
        console.warn('Failed to send order email backup:', error);
        // Don't block checkout if email fails
    }
    
    // Get current domain for success/cancel URLs
    const currentDomain = window.location.origin;
    
    try {
        // Try client-only checkout first
        const { error } = await stripe.redirectToCheckout({
            lineItems: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'payment',
            successUrl: `${currentDomain}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${currentDomain}/checkout.html?canceled=true`,
            customerEmail: orderData.email
        });

        if (error) {
            throw error;
        }
    } catch (error) {
        // If client-only checkout fails, show instructions to enable it
        if (error.message && error.message.includes('client-only integration')) {
            throw new Error('Stripe checkout needs to be configured. Please enable "Client-only integration" in your Stripe Dashboard at https://dashboard.stripe.com/account/checkout/settings, or contact support.');
        }
        throw error;
    }
}

// Backup: Send order details via email before payment
async function sendOrderDetailsEmail(orderData) {
    const emailData = {
        _subject: `🎵 NEW SONG ORDER - ${orderData.recipientName} (${orderData.occasion})`,
        _template: 'box',
        _next: window.location.href, // Stay on current page
        
        // Order Summary
        'Order Type': orderData.productType === 'single' ? 'Personalized Song ($79)' : 'Custom Album ($299)',
        'Customer Email': orderData.email,
        'Order Date': new Date().toLocaleDateString(),
        
        // Song Details
        'Recipient Name': orderData.recipientName,
        'Occasion': orderData.occasion,
        'Genre': orderData.genre,
        'Tone': orderData.tone,
        'Delivery Method': orderData.delivery,
        
        // Customer Story
        'Story & Themes': orderData.storyThemes,
        'Artwork Inspiration': orderData.artworkInspiration || 'None provided',
    };
    
    // Add album songs if applicable
    if (orderData.productType === 'album' && orderData.albumSongs) {
        orderData.albumSongs.forEach((song, index) => {
            if (song.title || song.story) {
                emailData[`Song ${song.songNumber} Title`] = song.title || 'No title provided';
                emailData[`Song ${song.songNumber} Story`] = song.story || 'No story provided';
            }
        });
    }
    
    // Add technical details
    emailData['Order Source'] = 'echogifts.shop';
    emailData['Order ID'] = 'EG-' + Date.now();
    emailData['Status'] = 'Payment Pending';
    
    const response = await fetch('https://formspree.io/f/xkgzqpyy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
        throw new Error('Failed to send order email');
    }
    
    return response.json();
}

function getEstimatedDelivery() {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 business days
    return deliveryDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function showError(message) {
    // Create or update error display
    let errorDiv = document.getElementById('payment-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'payment-error';
        errorDiv.className = 'error-message';
        errorDiv.style.marginTop = '16px';
        errorDiv.style.padding = '16px';
        errorDiv.style.backgroundColor = '#ffebee';
        errorDiv.style.color = '#c62828';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.border = '1px solid #ffcdd2';
        document.getElementById('payment-form').appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Handle back navigation
window.addEventListener('beforeunload', function() {
    // Keep order data if user navigates away
    if (window.orderData && !sessionStorage.getItem('confirmationData')) {
        sessionStorage.setItem('orderData', JSON.stringify(window.orderData));
    }
});