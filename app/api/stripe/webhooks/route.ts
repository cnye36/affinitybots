import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        console.log('Payment succeeded:', checkoutSession.id);
        
        // Here you can:
        // - Update your database
        // - Send confirmation emails
        // - Fulfill orders
        await handleCheckoutSessionCompleted(checkoutSession);
        break;

      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscriptionCreated.id);
        await handleSubscriptionCreated(subscriptionCreated);
        break;

      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscriptionUpdated.id);
        await handleSubscriptionUpdated(subscriptionUpdated);
        break;

      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object as Stripe.Subscription;
        console.log('Subscription canceled:', subscriptionDeleted.id);
        await handleSubscriptionDeleted(subscriptionDeleted);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded:', invoice.id);
        await handleInvoicePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed:', failedInvoice.id);
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      case 'customer.created':
        const customer = event.data.object as Stripe.Customer;
        console.log('Customer created:', customer.id);
        await handleCustomerCreated(customer);
        break;

      case 'customer.updated':
        const updatedCustomer = event.data.object as Stripe.Customer;
        console.log('Customer updated:', updatedCustomer.id);
        await handleCustomerUpdated(updatedCustomer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Event handlers
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    // Log the successful payment
    console.log('Checkout session completed:', {
      sessionId: session.id,
      customerId: session.customer,
      customerEmail: session.customer_email,
      paymentStatus: session.payment_status,
      mode: session.mode,
      metadata: session.metadata,
    });

    // Here you can implement your business logic:
    // - Update user subscription status in your database
    // - Send welcome emails
    // - Activate user features
    // - Update user permissions

    // Example: Update user status in Supabase (if using)
    /*
    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();
    
    if (session.customer_email) {
      await supabase
        .from('users')
        .update({ 
          subscription_status: 'active',
          stripe_customer_id: session.customer,
          updated_at: new Date().toISOString()
        })
        .eq('email', session.customer_email);
    }
    */

  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log('Subscription created:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price.id,
      metadata: subscription.metadata,
    });

    // Implement your logic for new subscriptions
    // - Update user subscription in database
    // - Send welcome email
    // - Enable premium features

  } catch (error) {
    console.error('Error in handleSubscriptionCreated:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('Subscription updated:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      metadata: subscription.metadata,
    });

    // Handle subscription changes
    // - Update subscription tier
    // - Adjust user permissions
    // - Handle plan upgrades/downgrades

  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('Subscription deleted:', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    });

    // Handle subscription cancellation
    // - Update user access level
    // - Send cancellation confirmation
    // - Schedule data retention

  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Invoice payment succeeded:', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amountPaid: invoice.amount_paid,
    });

    // Handle successful payment
    // - Update billing records
    // - Send receipt
    // - Extend subscription period

  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Invoice payment failed:', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId: invoice.subscription,
      amountDue: invoice.amount_due,
    });

    // Handle failed payment
    // - Send payment retry notification
    // - Update subscription status
    // - Implement dunning management

  } catch (error) {
    console.error('Error in handleInvoicePaymentFailed:', error);
    throw error;
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    console.log('Customer created:', {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      metadata: customer.metadata,
    });

    // Handle new customer
    // - Sync with your user database
    // - Send welcome email
    // - Set up customer profile

  } catch (error) {
    console.error('Error in handleCustomerCreated:', error);
    throw error;
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  try {
    console.log('Customer updated:', {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      metadata: customer.metadata,
    });

    // Handle customer updates
    // - Sync profile changes
    // - Update contact information

  } catch (error) {
    console.error('Error in handleCustomerUpdated:', error);
    throw error;
  }
}