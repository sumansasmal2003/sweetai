// src/app/api/music/route.ts
import connectToDatabase from "@/lib/mongodb";
import Chat from "@/models/Chat";
import User from "@/models/User"; // <-- IMPORTED USER MODEL
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
      } catch (e) {}
    }

    // --- NEW: CREDIT PROTECTION LOGIC ---
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Please sign in to use Sweet AI." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await connectToDatabase();
    const user = await User.findById(userId);

    if (!user || user.credits < 10) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits. Please top up your balance.", code: "OUT_OF_CREDITS" }),
        { status: 402, headers: { 'Content-Type': 'application/json' } } // 402 Payment Required
      );
    }

    // Deduct 10 credits for extreme heavy Music generation
    await User.findByIdAndUpdate(userId, { $inc: { credits: -10 } });
    // ------------------------------------

    let targetChatId = chatId;
    const userMsg = { id: Date.now().toString(), role: "user", text: prompt };

    if (userId) {
      // Note: We already called connectToDatabase() above
      if (targetChatId) {
        await Chat.findByIdAndUpdate(targetChatId, { $push: { messages: userMsg } });
      } else {
        const newChat = await Chat.create({ userId, title: "New Music Chat", messages: [userMsg] });
        targetChatId = newChat._id.toString();
      }
    }

    const backendRes = await fetch(`${process.env.COLAB_API_URL}/generate-music`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const reader = backendRes.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) { controller.close(); return; }
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.status) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: data.status })}\n\n`));
                  } else if (data.audio) {
                    if (userId && targetChatId) {
                      const aiMsg = { id: (Date.now() + 1).toString(), role: "ai", text: data.audio };
                      await Chat.findByIdAndUpdate(targetChatId, { $push: { messages: aiMsg } });
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ reply: data.audio, chatId: targetChatId })}\n\n`));
                  }
                } catch (e) {}
              }
            }
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
