# Stripe API Integration Documentation

This documentation covers the comprehensive Stripe API integration implemented for the application with owner email `cnye@ai-automated.xyz`.

## Overview

The integration includes:
- Server-side Stripe configuration with TypeScript support
- Complete API routes for all major Stripe operations
- Webhook handling for real-time event processing
- React components for frontend integration
- Comprehensive error handling and validation

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Stripe credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your webhook endpoint secret
- `NEXT_PUBLIC_APP_URL`: Your application URL

### 2. Install Dependencies

Dependencies are already installed:
- `stripe`: Server-side Stripe SDK
- `@stripe/stripe-js`: Client-side Stripe SDK

### 3. Webhook Configuration

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Create a new endpoint pointing to: `https://yourdomain.com/api/stripe/webhooks`
3. Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.created`
   - `customer.updated`

## API Endpoints

### Customer Management

#### Create Customer
```http
POST /api/stripe/customers
Content-Type: application/json

{
  "email": "customer@example.com",
  "name": "John Doe",
  "metadata": {
    "userId": "123"
  }
}
```

#### Get Customer
```http
GET /api/stripe/customers?customerId=cus_XXXXXXXX
```

#### Update Customer
```http
PUT /api/stripe/customers
Content-Type: application/json

{
  "customerId": "cus_XXXXXXXX",
  "email": "newemail@example.com",
  "name": "John Smith"
}
```

#### Delete Customer
```http
DELETE /api/stripe/customers?customerId=cus_XXXXXXXX
```

### Product Management

#### Create Product
```http
POST /api/stripe/products
Content-Type: application/json

{
  "name": "Premium Subscription",
  "description": "Access to premium features",
  "images": ["https://example.com/image.jpg"],
  "metadata": {
    "category": "subscription"
  }
}
```

#### Get Product(s)
```http
GET /api/stripe/products?productId=prod_XXXXXXXX
GET /api/stripe/products  # List all products
```

### Price Management

#### Create Price
```http
POST /api/stripe/prices
Content-Type: application/json

{
  "productId": "prod_XXXXXXXX",
  "unitAmount": 2999,
  "currency": "usd",
  "recurring": {
    "interval": "month",
    "interval_count": 1
  }
}
```

#### Get Price(s)
```http
GET /api/stripe/prices?priceId=price_XXXXXXXX
GET /api/stripe/prices?productId=prod_XXXXXXXX  # List prices for product
GET /api/stripe/prices  # List all prices
```

### Checkout Sessions

#### Create Checkout Session
```http
POST /api/stripe/checkout
Content-Type: application/json

{
  "priceId": "price_XXXXXXXX",
  "customerEmail": "customer@example.com",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel",
  "mode": "subscription",
  "allowPromotionCodes": true,
  "metadata": {
    "orderId": "order_123"
  }
}
```

#### Retrieve Checkout Session
```http
GET /api/stripe/checkout?session_id=cs_XXXXXXXX
```

### Subscription Management

#### Get Subscription
```http
GET /api/stripe/subscriptions?subscriptionId=sub_XXXXXXXX
GET /api/stripe/subscriptions?customerId=cus_XXXXXXXX  # List customer subscriptions
```

#### Update Subscription
```http
PUT /api/stripe/subscriptions
Content-Type: application/json

{
  "subscriptionId": "sub_XXXXXXXX",
  "priceId": "price_YYYYYYYY",
  "metadata": {
    "plan": "upgraded"
  }
}
```

#### Cancel Subscription
```http
DELETE /api/stripe/subscriptions?subscriptionId=sub_XXXXXXXX
```

## Frontend Integration

### Basic Usage

```tsx
import { CheckoutButton } from '@/components/stripe/CheckoutButton';

function PricingPage() {
  return (
    <div>
      <CheckoutButton
        priceId="price_XXXXXXXX"
        customerEmail="user@example.com"
        mode="subscription"
      >
        Subscribe Now
      </CheckoutButton>
    </div>
  );
}
```

### Advanced Usage

```tsx
import { getStripe } from '@/lib/stripe';

async function createCustomCheckout() {
  // Create checkout session
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: 'price_XXXXXXXX',
      customerEmail: 'user@example.com',
      successUrl: window.location.origin + '/success',
      cancelUrl: window.location.origin + '/cancel',
      mode: 'subscription'
    })
  });

  const { session } = await response.json();

  // Redirect to Stripe Checkout
  const stripe = await getStripe();
  await stripe?.redirectToCheckout({ sessionId: session.id });
}
```

## Webhook Handling

The webhook endpoint (`/api/stripe/webhooks`) automatically handles:

- **checkout.session.completed**: Payment confirmation
- **customer.subscription.created**: New subscription setup
- **customer.subscription.updated**: Subscription changes
- **customer.subscription.deleted**: Subscription cancellation
- **invoice.payment_succeeded**: Successful recurring payments
- **invoice.payment_failed**: Failed payments
- **customer.created/updated**: Customer profile changes

### Customizing Webhook Handlers

Edit the handler functions in `/app/api/stripe/webhooks/route.ts`:

```typescript
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Your custom logic here
  // - Update user database
  // - Send confirmation emails
  // - Activate features
}
```

## Configuration

All Stripe operations include metadata with the owner email (`cnye@ai-automated.xyz`) for tracking and management purposes.

### Key Configuration Options

```typescript
// lib/stripe.ts
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  ownerEmail: 'cnye@ai-automated.xyz',
};
```

## Error Handling

All API endpoints include comprehensive error handling:

- Input validation with Zod schemas
- Proper HTTP status codes
- Detailed error messages
- Console logging for debugging

Example error response:
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

## Testing

### Test Mode

Use Stripe test keys for development:
- Test publishable key: `pk_test_...`
- Test secret key: `sk_test_...`

### Test Cards

Use Stripe's test card numbers:
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Requires authentication: `4000002500003155`

### Webhook Testing

Use Stripe CLI for local webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

## Security Considerations

1. **Environment Variables**: Never expose secret keys in client-side code
2. **Webhook Verification**: All webhooks are verified using the webhook secret
3. **Input Validation**: All inputs are validated using Zod schemas
4. **HTTPS**: Always use HTTPS in production for webhook endpoints

## Common Use Cases

### Subscription Business Model
1. Create products and prices for your subscription tiers
2. Use checkout sessions for customer sign-up
3. Handle subscription lifecycle with webhooks
4. Manage customer portal for self-service

### One-time Payments
1. Create products with one-time pricing
2. Use `mode: 'payment'` in checkout sessions
3. Handle successful payments in webhooks

### Freemium Model
1. Create customers without immediate payment
2. Upgrade to paid plans using checkout sessions
3. Manage trial periods and plan changes

## Support

For issues or questions:
1. Check Stripe Dashboard logs
2. Review webhook event logs
3. Check application console logs
4. Refer to [Stripe Documentation](https://stripe.com/docs)

## Owner Information

This Stripe integration is configured for:
- **Owner**: cnye@ai-automated.xyz
- All created resources include owner metadata for tracking
- Webhook events are logged with owner context