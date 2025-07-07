import { NextRequest, NextResponse } from 'next/server';
import { stripeOperations, STRIPE_CONFIG } from '@/lib/stripe';
import { z } from 'zod';

// Schema for checkout session creation
const createCheckoutSessionSchema = z.object({
  priceId: z.string(),
  customerId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  metadata: z.record(z.string()).optional(),
  allowPromotionCodes: z.boolean().optional().default(true),
  mode: z.enum(['payment', 'setup', 'subscription']).optional().default('subscription'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      priceId,
      customerId,
      customerEmail,
      successUrl,
      cancelUrl,
      metadata,
      allowPromotionCodes,
      mode,
    } = createCheckoutSessionSchema.parse(body);

    // Validate that either customerId or customerEmail is provided
    if (!customerId && !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Either customerId or customerEmail is required' },
        { status: 400 }
      );
    }

    const session = await stripeOperations.createCheckoutSession({
      priceId,
      customerId,
      customerEmail,
      successUrl,
      cancelUrl,
      metadata: {
        ...metadata,
        owner: STRIPE_CONFIG.ownerEmail,
        createdAt: new Date().toISOString(),
      },
      allowPromotionCodes,
      mode,
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        url: session.url,
        mode: session.mode,
        customer: session.customer,
        customer_email: session.customer_email,
        metadata: session.metadata,
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Using the stripe instance directly for session retrieval
    const { stripe } = await import('@/lib/stripe');
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'subscription'],
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        customer: session.customer,
        customer_email: session.customer_email,
        payment_status: session.payment_status,
        subscription: session.subscription,
        line_items: session.line_items,
        metadata: session.metadata,
        created: session.created,
      },
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve checkout session' },
      { status: 500 }
    );
  }
}