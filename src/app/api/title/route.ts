import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { prompt, chatId } = await req.json();

    const colabUrl = `${process.env.COLAB_API_URL}/title`;
    const colabResponse = await fetch(colabUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!colabResponse.ok) throw new Error("Title generation failed");
    const data = await colabResponse.json();
    const title = data.title;

    // Save title to DB if user is logged in and passing a valid chatId
    if (chatId) {
      const cookieStore = await cookies();
      const token = cookieStore.get('sweet_ai_token')?.value;
      if (token) {
        try {
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
          await connectToDatabase();
          await Chat.findOneAndUpdate({ _id: chatId, userId: decoded.userId }, { title });
        } catch (e) {}
      }
    }

    return NextResponse.json({ title });
  } catch (error) {
    return NextResponse.json({ title: "New Chat" }, { status: 500 });
  }
}
