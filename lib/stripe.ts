export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const PAYEE_EMAIL = 'cnye@ai-automated.xyz';

export const STRIPE_API_BASE = 'https://api.stripe.com/v1';

interface CheckoutSessionParams {
  amount: number;
  currency: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
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
