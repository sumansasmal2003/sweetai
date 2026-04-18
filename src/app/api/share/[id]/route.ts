// src/app/api/share/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';

// THE FIX: Type params as a Promise
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    // THE FIX: Await the params before extracting the ID
    const resolvedParams = await params;
    const chat = await Chat.findById(resolvedParams.id);

    // If it doesn't exist, or if the user never clicked "Share", block access!
    if (!chat || !chat.isShared) {
      return NextResponse.json({ error: 'Chat not found or is private' }, { status: 404 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
