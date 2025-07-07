'use client';

import React, { useState } from 'react';
import { getStripe } from '@/lib/stripe';

interface CheckoutButtonProps {
  priceId: string;
  customerEmail?: string;
  customerId?: string;
  mode?: 'payment' | 'setup' | 'subscription';
  className?: string;
  children?: React.ReactNode;
}

export function CheckoutButton({
  priceId,
  customerEmail,
  customerId,
  mode = 'subscription',
  className = '',
  children = 'Subscribe Now',
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!priceId) {
      setError('Price ID is required');
      return;
    }

    if (!customerId && !customerEmail) {
      setError('Either customer ID or email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerId,
          customerEmail,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cancel`,
          mode,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const { success, session, error: apiError } = await response.json();

      if (!success) {
        throw new Error(apiError || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-button-container">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`
          px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg
          hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transition-colors duration-200
          ${className}
        `}
      >
        {loading ? 'Processing...' : children}
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
}

// Example usage component
export function StripeExamples() {
  const [customerEmail, setCustomerEmail] = useState('');

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Stripe Integration Examples</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Customer Email
          </label>
          <input
            type="email"
            id="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="customer@example.com"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-700">Subscription Plans</h3>
          
          {/* Basic Plan */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800">Basic Plan - $9.99/month</h4>
            <p className="text-sm text-gray-600 mb-3">Perfect for getting started</p>
            <CheckoutButton
              priceId="price_PLACEHOLDER_BASIC"
              customerEmail={customerEmail}
              mode="subscription"
              className="w-full"
            >
              Subscribe to Basic
            </CheckoutButton>
          </div>

          {/* Pro Plan */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800">Pro Plan - $29.99/month</h4>
            <p className="text-sm text-gray-600 mb-3">For professional users</p>
            <CheckoutButton
              priceId="price_PLACEHOLDER_PRO"
              customerEmail={customerEmail}
              mode="subscription"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Subscribe to Pro
            </CheckoutButton>
          </div>

          {/* One-time Payment */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800">One-time Purchase - $49.99</h4>
            <p className="text-sm text-gray-600 mb-3">Single payment for lifetime access</p>
            <CheckoutButton
              priceId="price_PLACEHOLDER_ONETIME"
              customerEmail={customerEmail}
              mode="payment"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Buy Now
            </CheckoutButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutButton;