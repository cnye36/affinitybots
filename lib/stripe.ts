import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Environment variables for Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_PLACEHOLDER_KEY',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER_KEY',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_PLACEHOLDER_SECRET',
  ownerEmail: 'cnye@ai-automated.xyz',
} as const;

// Server-side Stripe instance
export const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

// Client-side Stripe instance
let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
};

// Stripe types and interfaces
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, string>;
  active: boolean;
}

export interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      id: string;
      price: StripePrice;
    }>;
  };
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  allowPromotionCodes?: boolean;
  mode?: 'payment' | 'setup' | 'subscription';
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateProductParams {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
  images?: string[];
}

export interface CreatePriceParams {
  productId: string;
  unitAmount: number;
  currency?: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count?: number;
  };
  metadata?: Record<string, string>;
}

// Utility functions
export const formatPrice = (amount: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

// Common Stripe operations
export const stripeOperations = {
  // Customer operations
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    return await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        ...params.metadata,
        createdBy: STRIPE_CONFIG.ownerEmail,
      },
    });
  },

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      return await stripe.customers.retrieve(customerId) as Stripe.Customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      return null;
    }
  },

  async updateCustomer(customerId: string, params: Partial<CreateCustomerParams>): Promise<Stripe.Customer> {
    return await stripe.customers.update(customerId, {
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
  },

  async deleteCustomer(customerId: string): Promise<Stripe.DeletedCustomer> {
    return await stripe.customers.del(customerId);
  },

  // Product operations
  async createProduct(params: CreateProductParams): Promise<Stripe.Product> {
    return await stripe.products.create({
      name: params.name,
      description: params.description,
      images: params.images,
      metadata: {
        ...params.metadata,
        createdBy: STRIPE_CONFIG.ownerEmail,
      },
    });
  },

  async getProduct(productId: string): Promise<Stripe.Product | null> {
    try {
      return await stripe.products.retrieve(productId);
    } catch (error) {
      console.error('Error retrieving product:', error);
      return null;
    }
  },

  async updateProduct(productId: string, params: Partial<CreateProductParams>): Promise<Stripe.Product> {
    return await stripe.products.update(productId, {
      name: params.name,
      description: params.description,
      images: params.images,
      metadata: params.metadata,
    });
  },

  // Price operations
  async createPrice(params: CreatePriceParams): Promise<Stripe.Price> {
    return await stripe.prices.create({
      product: params.productId,
      unit_amount: params.unitAmount,
      currency: params.currency || 'usd',
      recurring: params.recurring,
      metadata: {
        ...params.metadata,
        createdBy: STRIPE_CONFIG.ownerEmail,
      },
    });
  },

  async getPrice(priceId: string): Promise<Stripe.Price | null> {
    try {
      return await stripe.prices.retrieve(priceId);
    } catch (error) {
      console.error('Error retrieving price:', error);
      return null;
    }
  },

  // Checkout operations
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: params.mode || 'subscription',
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      allow_promotion_codes: params.allowPromotionCodes || true,
      metadata: {
        ...params.metadata,
        createdBy: STRIPE_CONFIG.ownerEmail,
      },
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail;
    }

    return await stripe.checkout.sessions.create(sessionParams);
  },

  // Subscription operations
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
      });
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return null;
    }
  },

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.cancel(subscriptionId);
  },

  async updateSubscription(subscriptionId: string, params: {
    priceId?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    const updateParams: Stripe.SubscriptionUpdateParams = {};

    if (params.priceId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      updateParams.items = [
        {
          id: subscription.items.data[0].id,
          price: params.priceId,
        },
      ];
    }

    if (params.metadata) {
      updateParams.metadata = params.metadata;
    }

    return await stripe.subscriptions.update(subscriptionId, updateParams);
  },

  // Invoice operations
  async getInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });
    return invoices.data;
  },

  // Payment method operations
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return paymentMethods.data;
  },
};

export default stripe;