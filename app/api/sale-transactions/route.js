import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { data } = body;
    console.log('Received data:', data); // Log the incoming data

    // Validate required fields
    if (!data) {
      console.log('Validation failed: Request data is required');
      return NextResponse.json(
        { message: 'Request data is required' },
        { status: 400 }
      );
    }

    const requiredFields = ['customer_name', 'invoice_number', 'customer_email', 'customer_phone', 'products'];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.log(`Validation failed: ${field} is required. Received value:`, data[field]);
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(data.products) || data.products.length === 0) {
      return NextResponse.json(
        { message: 'At least one product is required' },
        { status: 400 }
      );
    }

    // Validate products
    for (const product of data.products) {
      if (!product.product || !product.quantity || !product.price) {
        return NextResponse.json(
          { message: 'Each product must have product ID, quantity, and price' },
          { status: 400 }
        );
      }
    }

    const db = await readDb();
    const transaction = {
      id: Date.now(), // Generate a simple ID
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.sales.push(transaction);
    await writeDb(db);

    return NextResponse.json(
      {
        message: 'Sale transaction created successfully',
        data: transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating sale transaction:', error);
    return NextResponse.json(
      {
        message: 'Failed to create sale transaction',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle GET requests to fetch sale transactions
export async function GET(request) {
  try {
    const db = await readDb();
    return NextResponse.json(
      {
        message: 'Sale transactions retrieved successfully',
        data: db.sales,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching sale transactions:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch sale transactions',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
