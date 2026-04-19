// src/app/api/ask/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { prompt, chatId, webSearch, fileData, fileName, persona, history } = await req.json();

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

    if (userId) {
      await connectToDatabase();
      if (currentChatId) {
        await Chat.findOneAndUpdate(
          { _id: currentChatId, userId },
          { $push: { messages: userMsg } }
        );
      } else {
        const newChat = await Chat.create({
          userId,
          title: "New Chat",
          messages: [userMsg],
        });
        currentChatId = newChat._id.toString();
      }
    }

    const colabUrl = `${process.env.COLAB_API_URL}/ask`;
    const colabResponse = await fetch(colabUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        web_search: webSearch || false,
        file_data: fileData || "", // 2. Send the Base64 file to Python
        file_name: fileName || "",  // 3. Send the filename so Python knows if it's a PDF
        persona: persona || "Default",
        history: history || []
      }),
    });

    if (!colabResponse.ok) throw new Error("Backend error");

    // Create a TransformStream to pass data to the client AND read it here
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const reader = colabResponse.body?.getReader();

    if (!reader) throw new Error("No response stream");

    // Process the stream asynchronously so we can return the response immediately
    (async () => {
      const decoder = new TextDecoder();
      let fullAiResponse = "";
      let buffer = ""; // Add a buffer to prevent broken JSON chunks
      let extractedSources: {title: string, url: string}[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Write raw bytes to the client
          await writer.write(value);

          // Decode and add to buffer
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith('data: ')) {
               try {
                 const dataObj = JSON.parse(line.slice(6));
                 if (dataObj.token !== undefined) {
                   fullAiResponse += dataObj.token;
                 }
                 if (dataObj.sources !== undefined) {
                   extractedSources = dataObj.sources;
                 }
               } catch (e) {
                 // Ignore incomplete JSON
               }
            }
          }
        }
      } finally {
        await writer.close();

        // Save to DB AFTER the stream completes
        if (userId && currentChatId) {
          const aiMsg = {
            id: (Date.now() + 1).toString(),
            role: "ai",
            text: fullAiResponse,
            sources: extractedSources.length > 0 ? extractedSources : undefined
          };

          await Chat.findOneAndUpdate(
            { _id: currentChatId, userId },
            { $push: { messages: aiMsg } }
          );
        }
      }
    })();

    // Return the readable side of the stream to the client
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Chat-Id': currentChatId || '' // Pass ID via header since body is a stream
      },
    });

  } catch (error) {
    console.error("AI engine error:", error);
    return NextResponse.json({ error: "Failed to communicate with AI" }, { status: 500 });
  }
}
