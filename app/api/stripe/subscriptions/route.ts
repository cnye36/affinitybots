import { NextRequest, NextResponse } from 'next/server';
import { stripeOperations, STRIPE_CONFIG } from '@/lib/stripe';
import { z } from 'zod';

// Schema for subscription update
const updateSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  priceId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const customerId = searchParams.get('customerId');

    if (subscriptionId) {
      // Get specific subscription
      const subscription = await stripeOperations.getSubscription(subscriptionId);

      if (!subscription) {
        return NextResponse.json(
          { success: false, error: 'Subscription not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription['current_period_start'],
          current_period_end: subscription['current_period_end'],
          items: subscription.items.data.map(item => ({
            id: item.id,
            price: {
              id: item.price.id,
              unit_amount: item.price.unit_amount,
              currency: item.price.currency,
              recurring: item.price.recurring,
            },
          })),
          metadata: subscription.metadata,
          created: subscription.created,
        },
      });
    } else if (customerId) {
      // List customer subscriptions
      const { stripe } = await import('@/lib/stripe');
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
        expand: ['data.items.data.price'],
      });

      return NextResponse.json({
        success: true,
        subscriptions: subscriptions.data.map(subscription => ({
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          items: subscription.items.data.map(item => ({
            id: item.id,
            price: {
              id: item.price.id,
              unit_amount: item.price.unit_amount,
              currency: item.price.currency,
              recurring: item.price.recurring,
            },
          })),
          metadata: subscription.metadata,
          created: subscription.created,
        })),
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Either subscriptionId or customerId is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error retrieving subscription(s):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve subscription(s)' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, priceId, metadata } = updateSubscriptionSchema.parse(body);

    const subscription = await stripeOperations.updateSubscription(subscriptionId, {
      priceId,
      metadata: {
        ...metadata,
        updatedBy: STRIPE_CONFIG.ownerEmail,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        items: subscription.items.data.map(item => ({
          id: item.id,
          price: {
            id: item.price.id,
            unit_amount: item.price.unit_amount,
            currency: item.price.currency,
            recurring: item.price.recurring,
          },
        })),
        metadata: subscription.metadata,
      },
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const canceledSubscription = await stripeOperations.cancelSubscription(subscriptionId);

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceled_at: canceledSubscription.canceled_at,
        current_period_end: canceledSubscription.current_period_end,
      },
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}