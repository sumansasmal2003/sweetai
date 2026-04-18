// src/app/api/chats/share/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    await dbConnect();

    // Await the cookies() function before getting the token
    const cookieStore = await cookies();

    // THE FIX: Use the exact cookie name from your login route ('sweet_ai_token')
    const token = cookieStore.get('sweet_ai_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { userId: string };
    const { chatId } = await req.json();

    // Mark the chat as shared, but only if it belongs to the logged-in user
    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: decoded.userId },
      { isShared: true },
      { new: true }
    );

    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    return NextResponse.json({ success: true, shareId: chat._id });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
