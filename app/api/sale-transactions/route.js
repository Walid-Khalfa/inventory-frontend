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
      date: data.date || new Date().toISOString(),
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
    const { searchParams } = new URL(request.url);
    console.log(`Received request with URL: ${request.url}`);
    const db = await readDb();
    let sales = db.sales;
    console.log("All sales from DB:", JSON.stringify(sales, null, 2));

    // Filtering
    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("filters[")) {
        // Corrected regex to handle nested brackets in query parameters
        const match = key.match(/filters\[([^\]]+)\]\[\$([^\]]+)\]/);
        if (match) {
          const field = match[1];
          const operator = match[2]; // Use the correct capture group
          if (!filters[field]) {
            filters[field] = [];
          }
          filters[field].push({ value, operator });
        }
      }
    }

    if (Object.keys(filters).length > 0) {
      sales = sales.filter(sale => {
        return Object.entries(filters).every(([field, conditions]) => {
          return conditions.every(({ value, operator }) => {
            const saleValue = sale[field];
            if (saleValue === undefined) return false;

            switch (operator) {
              case 'eqi':
                return saleValue.toString().toLowerCase() === value.toLowerCase();
              case 'containsi':
                return saleValue.toString().toLowerCase().includes(value.toLowerCase());
              case 'gte':
                return new Date(saleValue) >= new Date(value);
              case 'lte':
                return new Date(saleValue) <= new Date(value);
              default:
                return false;
            }
          });
        });
      });
    }

    // Pagination
    const page = parseInt(searchParams.get('pagination[page]') || '1', 10);
    const pageSize = parseInt(searchParams.get('pagination[pageSize]') || '10', 10);
    const total = sales.length;
    const pageCount = Math.ceil(total / pageSize);
    const paginatedSales = sales.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json(
      {
        message: 'Sale transactions retrieved successfully',
        data: paginatedSales,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount,
            total,
          },
        },
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
