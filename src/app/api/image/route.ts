// src/app/api/image/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { prompt, chatId } = await req.json();

    // 1. Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get('sweet_ai_token')?.value;
    let userId = null;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        userId = decoded.userId;
      } catch (e) {}
    }

    let currentChatId = chatId;
    const userMsg = { id: Date.now().toString(), role: "user", text: prompt };

    // 2. Save user prompt
    if (userId) {
      await connectToDatabase();
      if (currentChatId) {
        await Chat.findOneAndUpdate(
          { _id: currentChatId, userId },
          { $push: { messages: userMsg } }
        );
      } else {
        const newChat = await Chat.create({ userId, title: "New Chat", messages: [userMsg] });
        currentChatId = newChat._id.toString();
      }
    }

    // 3. Request Image from Python
    const colabUrl = `${process.env.COLAB_API_URL}/generate-image`;
    const colabResponse = await fetch(colabUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!colabResponse.ok) throw new Error("Image generation failed");

    const data = await colabResponse.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // FORMAT THE RESPONSE TO SHOW THE PROMPT ENHANCEMENT
    const displayPrompt = data.enhanced_prompt || prompt;
    const aiMarkdownResponse = `**Original Idea:** "${prompt}"\n\n*✨ Enhanced by Sweet AI:* "${displayPrompt}"\n\n![Generated Image](${data.image})`;

    // 4. Save AI Response
    if (userId && currentChatId) {
      const aiMsg = { id: (Date.now() + 1).toString(), role: "ai", text: aiMarkdownResponse };
      await Chat.findOneAndUpdate(
        { _id: currentChatId, userId },
        { $push: { messages: aiMsg } }
      );
    }

    return NextResponse.json({ reply: aiMarkdownResponse, chatId: currentChatId });

  } catch (error) {
    console.error("Image engine error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
