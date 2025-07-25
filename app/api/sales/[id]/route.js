import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const db = await readDb();
    
    // Find the sale by ID
    const sale = db.sales.find(s => s.id.toString() === id);
    
    if (!sale) {
      return NextResponse.json(
        { message: 'Sale not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        message: 'Sale retrieved successfully',
        data: sale,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch sale',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Handle DELETE request for a single sale
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const db = await readDb();
    
    // Find the sale index
    const saleIndex = db.sales.findIndex(s => s.id.toString() === id);
    
    if (saleIndex === -1) {
      return NextResponse.json(
        { message: 'Sale not found' },
        { status: 404 }
      );
    }
    
    // Remove the sale
    db.sales.splice(saleIndex, 1);
    
    // Write back to db
    const { writeDb } = await import('@/lib/db');
    await writeDb(db);
    
    return NextResponse.json(
      {
        message: 'Sale deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      {
        message: 'Failed to delete sale',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
