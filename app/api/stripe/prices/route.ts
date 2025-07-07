import { NextRequest, NextResponse } from 'next/server';
import { stripeOperations, STRIPE_CONFIG } from '@/lib/stripe';
import { z } from 'zod';

// Schema for price creation
const createPriceSchema = z.object({
  productId: z.string(),
  unitAmount: z.number().positive(),
  currency: z.string().default('usd'),
  recurring: z.object({
    interval: z.enum(['day', 'week', 'month', 'year']),
    interval_count: z.number().positive().optional().default(1),
  }).optional(),
  metadata: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, unitAmount, currency, recurring, metadata } = createPriceSchema.parse(body);

    const price = await stripeOperations.createPrice({
      productId,
      unitAmount,
      currency,
      recurring,
      metadata: {
        ...metadata,
        owner: STRIPE_CONFIG.ownerEmail,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      price: {
        id: price.id,
        product: price.product,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        metadata: price.metadata,
        active: price.active,
        created: price.created,
      },
    });
  } catch (error) {
    console.error('Error creating price:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create price' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priceId = searchParams.get('priceId');
    const productId = searchParams.get('productId');

    if (priceId) {
      // Get specific price
      const price = await stripeOperations.getPrice(priceId);

      if (!price) {
        return NextResponse.json(
          { success: false, error: 'Price not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        price: {
          id: price.id,
          product: price.product,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          metadata: price.metadata,
          active: price.active,
          created: price.created,
        },
      });
    } else {
      // List prices (optionally filtered by product)
      const { stripe } = await import('@/lib/stripe');
      const params: any = {
        limit: 100,
        active: true,
      };

      if (productId) {
        params.product = productId;
      }

      const prices = await stripe.prices.list(params);

      return NextResponse.json({
        success: true,
        prices: prices.data.map(price => ({
          id: price.id,
          product: price.product,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
          metadata: price.metadata,
          active: price.active,
          created: price.created,
        })),
      });
    }
  } catch (error) {
    console.error('Error retrieving price(s):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve price(s)' },
      { status: 500 }
    );
  }
}