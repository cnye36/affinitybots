export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const PAYEE_EMAIL = 'cnye@ai-automated.xyz';

export const STRIPE_API_BASE = 'https://api.stripe.com/v1';

// Stripe Price IDs - These should be created in your Stripe dashboard
// For now, using placeholders - you'll need to replace these with actual Price IDs
export const STRIPE_PRICE_IDS = {
	starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
	pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
} as const;

export type PlanType = 'starter' | 'pro';

// Trial period in days
export const TRIAL_PERIOD_DAYS = 14;

interface CheckoutSessionParams {
  amount: number;
  currency: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
}

interface SubscriptionCheckoutParams {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
}

export async function createCheckoutSession(params: CheckoutSessionParams) {
  const body = new URLSearchParams();
  body.append('payment_method_types[]', 'card');
  body.append('line_items[0][price_data][currency]', params.currency);
  body.append('line_items[0][price_data][product_data][name]', params.description || 'Payment');
  body.append('line_items[0][price_data][unit_amount]', params.amount.toString());
  body.append('line_items[0][quantity]', '1');
  body.append('mode', 'payment');
  body.append('success_url', params.successUrl);
  body.append('cancel_url', params.cancelUrl);
  body.append('metadata[payee]', PAYEE_EMAIL);

  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error('Failed to create checkout session');
  }

  return res.json();
}

/**
 * Create a Stripe checkout session for subscription with trial period
 * Payment method is REQUIRED - Stripe will automatically charge after trial ends
 */
export async function createSubscriptionCheckoutSession(params: SubscriptionCheckoutParams) {
  const body = new URLSearchParams();
  body.append('mode', 'subscription');
  body.append('line_items[0][price]', params.priceId);
  body.append('line_items[0][quantity]', '1');
  body.append('success_url', params.successUrl);
  body.append('cancel_url', params.cancelUrl);
  body.append('subscription_data[trial_period_days]', String(params.trialPeriodDays || TRIAL_PERIOD_DAYS));
  body.append('metadata[user_id]', params.userId);
  
  // Require payment method collection - this ensures customer is charged after trial
  body.append('payment_method_collection', 'always');

  if (params.customerId) {
    body.append('customer', params.customerId);
  } else if (params.customerEmail) {
    body.append('customer_email', params.customerEmail);
  }

  const res = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Stripe API error:', error);
    throw new Error(`Failed to create subscription checkout session: ${error}`);
  }

  return res.json();
}

/**
 * Get or create a Stripe customer for a user
 * First checks the database for existing customer ID, then creates if needed
 */
export async function getOrCreateCustomer(userId: string, email: string) {
  // Check if we already have a customer ID in the database
  // This is more reliable than searching Stripe
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existing?.stripe_customer_id) {
      // Verify customer still exists in Stripe
      try {
        const verifyRes = await fetch(`${STRIPE_API_BASE}/customers/${existing.stripe_customer_id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          },
        });

        if (verifyRes.ok) {
          return await verifyRes.json();
        }
      } catch {
        // Customer doesn't exist in Stripe, create new one
      }
    }
  } catch (error) {
    console.error('Error checking database for customer:', error);
    // Continue to create new customer
  }

  // Create new customer
  const createBody = new URLSearchParams();
  createBody.append('email', email);
  createBody.append('metadata[user_id]', userId);

  const createRes = await fetch(`${STRIPE_API_BASE}/customers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: createBody.toString(),
  });

  if (!createRes.ok) {
    const error = await createRes.text();
    throw new Error(`Failed to create Stripe customer: ${error}`);
  }

  return createRes.json();
}
