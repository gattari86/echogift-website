# Stripe Payment Integration Setup

This guide will help you set up Stripe payments for your EchoGift website.

## 🚨 Important Security Note

**NEVER commit your actual Stripe secret keys to version control!** The current implementation is for demonstration purposes and requires server-side integration for production use.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. Your website deployed and accessible via HTTPS
3. A server/backend to handle payment processing securely

## Step 1: Get Your Stripe Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API Keys**
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

## Step 2: Update the Frontend Code

1. In `checkout.js`, line 3, replace the placeholder with your publishable key:
   ```javascript
   const stripe = Stripe('pk_test_YOUR_ACTUAL_KEY_HERE');
   ```

## Step 3: Create Products in Stripe

1. In your Stripe Dashboard, go to **Products**
2. Create two products:
   - **Personalized Song** - $79.00
   - **Custom Song Album** - $299.00
3. Note down the Price IDs for each product

## Step 4: Set Up Server-Side Payment Processing

The current frontend code simulates payment processing. For production, you need:

### Backend Requirements

Create endpoints to handle:
- `/create-payment-intent` - Creates a payment intent
- `/confirm-payment - Confirms payment and processes order
- `/webhook` - Handles Stripe webhooks for payment status

### Example Backend Implementation (Node.js/Express)

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
  const { amount, orderData } = req.body;
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: generateOrderId(),
        productType: orderData.productType,
        recipientName: orderData.recipientName,
        // ... other order data
      }
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Webhook handler
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed.`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // Process the order, send confirmation email, etc.
    processOrder(paymentIntent.metadata);
  }

  res.json({received: true});
});
```

## Step 5: Update Frontend to Use Real Payment Processing

Replace the mock payment processing in `checkout.js`:

```javascript
async function processPayment(paymentMethod) {
  try {
    // Create payment intent on your server
    const response = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: window.orderTotal,
        orderData: window.orderData
      })
    });
    
    const { clientSecret } = await response.json();
    
    // Confirm payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id
    });
    
    if (result.error) {
      throw result.error;
    }
    
    // Payment succeeded
    const confirmationData = {
      orderId: 'EG-' + Date.now(),
      amount: window.orderTotal,
      product: orderData.productType === 'single' ? 'Personalized Song' : 'Custom Song Album',
      email: orderData.email,
      estimatedDelivery: getEstimatedDelivery()
    };
    
    sessionStorage.setItem('confirmationData', JSON.stringify(confirmationData));
    window.location.href = 'success.html';
    
  } catch (error) {
    throw error;
  }
}
```

## Step 6: Set Up Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret

## Step 7: Environment Variables

Create a `.env` file (DO NOT commit this):

```
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Testing

1. Use Stripe's test card numbers:
   - Success: `4242424242424242`
   - Declined: `4000000000000002`
   - Requires 3D Secure: `4000002500003155`

2. Test the complete flow:
   - Fill out order form
   - Complete payment on checkout page
   - Verify success page shows correctly
   - Check Stripe Dashboard for payment

## Production Checklist

- [ ] Replace test keys with live keys
- [ ] Set up proper server-side payment processing
- [ ] Configure webhooks for live environment
- [ ] Test with real card (small amount)
- [ ] Set up monitoring and logging
- [ ] Configure email notifications
- [ ] Add fraud prevention measures

## Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Validate all data** on the server side
3. **Use HTTPS** everywhere
4. **Verify webhook signatures** to ensure requests are from Stripe
5. **Log payment events** for debugging and compliance
6. **Handle errors gracefully** and provide clear user feedback

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)