// Stripe configuration
const stripe = Stripe('pk_live_51RTWhNEinaZMSMtjUEnWpzUPDC8KZBlFOy9O4Is2iG6KDg0CrCLszCw8QksowdNQcUyFdp8BIuWmSPMYueau2t5200ayCjCLBw');

// Product pricing and Stripe Price IDs
const STRIPE_PRICES = {
    single: 'price_1RsuIhEinaZMSMtjh8LOF9vc', // $79 Personalized Song
    album: 'price_1RsuIqEinaZMSMtjlfcmwgvI'   // $299 Custom Song Album
};

// Alternative: Use Payment Links (more reliable than client-only checkout)
// Payment Links support promotion codes natively
const PAYMENT_LINKS = {
    single: 'https://buy.stripe.com/YOUR_SINGLE_SONG_PAYMENT_LINK',  // Replace with your actual link
    album: 'https://buy.stripe.com/YOUR_ALBUM_PAYMENT_LINK'   // Replace with your actual link
};

// Set this to true to use Payment Links instead of client-only checkout
const USE_PAYMENT_LINKS = false;

const PRICING = {
    single: { price: 79.00, name: 'Personalized Song', description: 'Custom AI-generated song with your story + custom artwork' },
    album: { price: 299.00, name: 'Custom Song Album', description: '5 personalized songs telling your complete story + custom artwork' }
};

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    loadOrderData();
    setupPaymentForm();
    setupCouponHandler();
});

// Store coupon state
let appliedCoupon = null;

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
    const couponCode = document.getElementById('coupon').value.trim();
    
    // Option 1: Use Payment Links if configured (supports coupons)
    if (USE_PAYMENT_LINKS && PAYMENT_LINKS[orderData.productType] && !PAYMENT_LINKS[orderData.productType].includes('YOUR_')) {
        const paymentLink = PAYMENT_LINKS[orderData.productType];
        
        // Build URL with prefilled email and client reference ID
        const url = new URL(paymentLink);
        url.searchParams.set('prefilled_email', orderData.email);
        url.searchParams.set('client_reference_id', 'EG-' + Date.now());
        
        // If coupon code entered, add it to the URL (if your payment link has promotion codes enabled)
        if (couponCode) {
            url.searchParams.set('prefilled_promo_code', couponCode);
        }
        
        // Store order data for retrieval after payment
        sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
        
        // Redirect to payment link
        window.location.href = url.toString();
        return;
    }
    
    // Option 2: Use client-only checkout (no coupon support)
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
        // Build checkout parameters
        const checkoutParams = {
            lineItems: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'payment',
            successUrl: `${currentDomain}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${currentDomain}/checkout.html?canceled=true`,
            customerEmail: orderData.email
        };
        
        // IMPORTANT: Client-only redirectToCheckout doesn't support coupons
        // To use coupons, you need to either:
        // 1. Use Stripe Payment Links (set USE_PAYMENT_LINKS = true and add your links)
        // 2. Implement server-side checkout sessions
        // 3. Use Stripe's Customer Portal for applying coupons
        
        if (couponCode && couponCode === 'ELYSON') {
            // For valid ELYSON code, proceed without alert since we handle it manually
            // The code is already included in the order email
            console.log('ELYSON promo code will be processed after payment');
        } else if (couponCode && couponCode !== 'ELYSON') {
            // For other codes, show a message
            alert('This promo code is not recognized. Please check the code and try again.');
            // Don't proceed to checkout
            throw new Error('Invalid promo code');
        }
        
        // Try client-only checkout first
        const { error } = await stripe.redirectToCheckout(checkoutParams);

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
    const couponCode = document.getElementById('coupon') ? document.getElementById('coupon').value.trim() : '';
    const emailData = {
        _subject: `🎵 NEW SONG ORDER - ${orderData.recipientName} (${orderData.occasion})${couponCode ? ' - PROMO: ' + couponCode : ''}`,
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
                emailData[`Song ${song.songNumber} Language`] = song.language || 'Not specified';
            }
        });
    }
    
    // Add promo code if entered
    if (couponCode) {
        emailData['PROMO CODE'] = couponCode;
        emailData['PROMO NOTE'] = couponCode === 'ELYSON' ? 'Valid code - Apply discount after payment' : 'Code entered but needs validation';
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

// Setup coupon handler
function setupCouponHandler() {
    const applyButton = document.getElementById('apply-coupon');
    const couponInput = document.getElementById('coupon');
    
    if (applyButton && couponInput) {
        applyButton.addEventListener('click', function() {
            const code = couponInput.value.trim().toUpperCase();
            validateCoupon(code);
        });
        
        // Also apply on Enter key
        couponInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const code = couponInput.value.trim().toUpperCase();
                validateCoupon(code);
            }
        });
    }
}

function validateCoupon(code) {
    const messageElement = document.getElementById('coupon-message');
    const discountRow = document.getElementById('discount-row');
    const discountAmount = document.getElementById('discount-amount');
    const finalTotal = document.getElementById('final-total');
    const buttonAmount = document.getElementById('button-amount');
    
    // Reset message
    messageElement.style.display = 'none';
    messageElement.className = 'form-help';
    
    if (!code) {
        messageElement.textContent = 'Please enter a promo code';
        messageElement.style.display = 'block';
        messageElement.style.color = '#d32f2f';
        return;
    }
    
    // Check if it's the ELYSON code
    if (code === 'ELYSON') {
        messageElement.innerHTML = '✓ Promo code accepted! Your discount will be automatically applied after checkout.';
        messageElement.style.display = 'block';
        messageElement.style.color = '#4caf50'; // Green color for success
        
        // Show discount row with estimated discount (you can adjust the percentage)
        // Assuming ELYSON gives a certain discount
        const subtotal = window.orderTotal || 79;
        const discountPercent = 0.20; // 20% discount - adjust based on your actual coupon
        const discountValue = subtotal * discountPercent;
        const newTotal = subtotal - discountValue;
        
        discountRow.style.display = 'flex';
        discountAmount.textContent = `-$${discountValue.toFixed(2)}`;
        finalTotal.textContent = `$${newTotal.toFixed(2)}`;
        buttonAmount.textContent = `${subtotal.toFixed(2)} (discount applied after checkout)`;
        
        // Show the promo notice above the button
        const promoNotice = document.getElementById('promo-notice');
        if (promoNotice) {
            promoNotice.style.display = 'block';
        }
        
        // Store the coupon for reference
        appliedCoupon = code;
        
        // Add note to order data
        if (window.orderData) {
            window.orderData.promoCode = code;
        }
    } else {
        messageElement.textContent = 'Invalid promo code';
        messageElement.style.display = 'block';
        messageElement.style.color = '#d32f2f';
        
        // Hide discount row and promo notice if shown
        discountRow.style.display = 'none';
        const promoNotice = document.getElementById('promo-notice');
        if (promoNotice) {
            promoNotice.style.display = 'none';
        }
        finalTotal.textContent = `$${(window.orderTotal || 79).toFixed(2)}`;
        buttonAmount.textContent = `${(window.orderTotal || 79).toFixed(2)}`;
    }
}

// Handle back navigation
window.addEventListener('beforeunload', function() {
    // Keep order data if user navigates away
    if (window.orderData && !sessionStorage.getItem('confirmationData')) {
        sessionStorage.setItem('orderData', JSON.stringify(window.orderData));
    }
});