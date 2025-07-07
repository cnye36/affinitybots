import { NextRequest, NextResponse } from 'next/server';
import { stripeOperations, STRIPE_CONFIG } from '@/lib/stripe';
import { z } from 'zod';

// Schema for product creation
const createProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
});

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
    const { name, description, metadata, images } = createProductSchema.parse(body);

    const product = await stripeOperations.createProduct({
      name,
      description,
      images,
      metadata: {
        ...metadata,
        owner: STRIPE_CONFIG.ownerEmail,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        active: product.active,
        created: product.created,
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      // Get specific product
      const product = await stripeOperations.getProduct(productId);

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          metadata: product.metadata,
          active: product.active,
          created: product.created,
        },
      });
    } else {
      // List all products
      const { stripe } = await import('@/lib/stripe');
      const products = await stripe.products.list({
        limit: 100,
        active: true,
      });

      return NextResponse.json({
        success: true,
        products: products.data.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          metadata: product.metadata,
          active: product.active,
          created: product.created,
        })),
      });
    }
  } catch (error) {
    console.error('Error retrieving product(s):', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve product(s)' },
      { status: 500 }
    );
  }
}