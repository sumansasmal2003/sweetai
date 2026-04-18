import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// 1. GET: Fetch Chats
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sweet_ai_token')?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    await connectToDatabase();

    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");

    if (chatId) {
      const chat = await Chat.findOne({ _id: chatId, userId: decoded.userId });
      return NextResponse.json({ chat });
    } else {
      const chats = await Chat.find({ userId: decoded.userId })
        .select('_id title updatedAt')
        .sort({ updatedAt: -1 });
      return NextResponse.json({ chats });
    }
  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. PATCH: Update Chat Title
export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sweet_ai_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    await connectToDatabase();

    const { chatId, title } = await req.json();

    if (!chatId || !title) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    await Chat.findOneAndUpdate({ _id: chatId, userId: decoded.userId }, { title });
    return NextResponse.json({ message: "Chat updated" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 3. DELETE: Remove Chat
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sweet_ai_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    await connectToDatabase();

    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) return NextResponse.json({ error: "Missing Chat ID" }, { status: 400 });

    await Chat.findOneAndDelete({ _id: chatId, userId: decoded.userId });
    return NextResponse.json({ message: "Chat deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
