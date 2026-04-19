// src/app/api/music/route.ts
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/models/Chat";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { prompt, chatId } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("sweet_ai_token")?.value;

    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;
      } catch (e) {
        console.error("Invalid token format");
      }
    }

    // 1. Forward the request to your Hugging Face Backend
    const backendRes = await fetch(`${process.env.COLAB_API_URL}/generate-music`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
        return NextResponse.json({ error: data.error || "Music generation failed" }, { status: backendRes.status });
    }

    // 2. Save the User Prompt and the Audio Data URI to MongoDB
    await connectToDatabase();
    const userMsg = { id: Date.now().toString(), role: "user", text: prompt };
    const aiMsg = { id: (Date.now() + 1).toString(), role: "ai", text: data.audio }; // Stores the base64 audio

    let targetChatId = chatId;
    if (targetChatId) {
      await Chat.findByIdAndUpdate(targetChatId, {
        $push: { messages: { $each: [userMsg, aiMsg] } }
      });
    } else if (userId) {
      const newChat = await Chat.create({
        userId,
        title: "New Music Chat",
        messages: [userMsg, aiMsg]
      });
      targetChatId = newChat._id;
    }

    return NextResponse.json({
      reply: data.audio,
      chatId: targetChatId,
      enhanced_prompt: data.enhanced_prompt
    });
  } catch (error) {
    console.error("Music API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
