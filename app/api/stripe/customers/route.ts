import { NextRequest, NextResponse } from 'next/server';
import { stripeOperations, STRIPE_CONFIG } from '@/lib/stripe';
import { z } from 'zod';

// Schema for customer creation
const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

// Schema for customer update
const updateCustomerSchema = z.object({
  customerId: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, metadata } = createCustomerSchema.parse(body);

    const customer = await stripeOperations.createCustomer({
      email,
      name,
      metadata: {
        ...metadata,
        owner: STRIPE_CONFIG.ownerEmail,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        metadata: customer.metadata,
      },
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const customer = await stripeOperations.getCustomer(customerId);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        metadata: customer.metadata,
        created: customer.created,
      },
    });
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, email, name, metadata } = updateCustomerSchema.parse(body);

    const customer = await stripeOperations.updateCustomer(customerId, {
      email,
      name,
      metadata: {
        ...metadata,
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        metadata: customer.metadata,
      },
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const deletedCustomer = await stripeOperations.deleteCustomer(customerId);

    return NextResponse.json({
      success: true,
      deleted: deletedCustomer.deleted,
      customerId: deletedCustomer.id,
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}