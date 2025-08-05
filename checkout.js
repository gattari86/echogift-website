// Stripe configuration
const stripe = Stripe('pk_live_51RTWhNEinaZMSMtjUEnWpzUPDC8KZBlFOy9O4Is2iG6KDg0CrCLszCw8QksowdNQcUyFdp8BIuWmSPMYueau2t5200ayCjCLBw');
const elements = stripe.elements();

// Product pricing
const PRICING = {
    single: { price: 79.00, name: 'Personalized Song', description: 'Custom AI-generated song with your story' },
    album: { price: 299.00, name: 'Custom Song Album', description: '3-5 personalized songs telling your complete story' }
};

// Processing fee (2.9% + $0.30 for Stripe)
const calculateProcessingFee = (amount) => Math.round((amount * 0.029 + 0.30) * 100) / 100;

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    loadOrderData();
    setupStripeElements();
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
    const processingFee = calculateProcessingFee(product.price);
    const total = product.price + processingFee;

    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('subtotal').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('processing-fee').textContent = `$${processingFee.toFixed(2)}`;
    document.getElementById('final-total').textContent = `$${total.toFixed(2)}`;
    document.getElementById('button-amount').textContent = total.toFixed(2);

    // Populate order details
    document.getElementById('recipient-display').textContent = orderData.recipientName || 'N/A';
    document.getElementById('occasion-display').textContent = orderData.occasion || 'N/A';
    document.getElementById('genre-display').textContent = orderData.genre || 'N/A';
    document.getElementById('tone-display').textContent = orderData.tone || 'N/A';
    document.getElementById('email').value = orderData.email || '';

    // Store for payment processing
    window.orderData = orderData;
    window.orderTotal = total;
}

function setupStripeElements() {
    // Create card element
    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#2C3E50',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                '::placeholder': {
                    color: '#95A5A6',
                },
                padding: '16px',
            },
            invalid: {
                color: '#E74C3C',
            },
        },
    });

    cardElement.mount('#card-element');

    // Handle real-time validation errors from the card Element
    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
            displayError.style.display = 'block';
        } else {
            displayError.textContent = '';
            displayError.style.display = 'none';
        }
    });

    window.cardElement = cardElement;
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
        // Create payment method
        const {paymentMethod, error} = await stripe.createPaymentMethod({
            type: 'card',
            card: window.cardElement,
            billing_details: {
                name: document.getElementById('billing-name').value,
                email: document.getElementById('email').value,
            },
        });

        if (error) {
            throw error;
        }

        // In a real implementation, you would send this to your server
        // For now, we'll simulate success and redirect
        await processPayment(paymentMethod);
        
    } catch (error) {
        console.error('Payment failed:', error);
        showError(error.message || 'An error occurred processing your payment.');
        
        // Re-enable submit button
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        spinner.classList.add('hidden');
    }
}

async function processPayment(paymentMethod) {
    // TODO: In production, send this data to your server to create a payment intent
    const orderData = window.orderData;
    const paymentData = {
        paymentMethodId: paymentMethod.id,
        amount: Math.round(window.orderTotal * 100), // Amount in cents
        currency: 'usd',
        orderDetails: orderData,
        billingDetails: paymentMethod.billing_details
    };

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo purposes, we'll assume success and redirect
    // Store order confirmation data
    const confirmationData = {
        orderId: 'EG-' + Date.now(),
        amount: window.orderTotal,
        product: orderData.productType === 'single' ? 'Personalized Song' : 'Custom Song Album',
        email: orderData.email,
        estimatedDelivery: getEstimatedDelivery()
    };
    
    sessionStorage.setItem('confirmationData', JSON.stringify(confirmationData));
    sessionStorage.removeItem('orderData'); // Clear order data
    
    // Redirect to success page
    window.location.href = 'success.html';
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