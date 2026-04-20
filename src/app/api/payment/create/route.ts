import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    // 1. Connect to DB first
    await connectToDatabase();

    const { plan, amount } = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("sweet_ai_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // 2. Ensure Razorpay keys exist BEFORE initializing the SDK
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Missing Razorpay Keys in .env.local");
        return NextResponse.json({ error: "Server Configuration Error: Missing Payment Keys" }, { status: 500 });
    }

    // 3. Initialize Razorpay safely inside the handler
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `rcpt_${decoded.userId.substring(0, 8)}_${Date.now()}`,
    });

    return NextResponse.json({ order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (error: any) {
    // 4. Properly stringify the Razorpay error object so it doesn't log as 'undefined'
    console.error("RAZORPAY ERROR:", JSON.stringify(error, null, 2) || error);

    // Attempt to extract the nested Razorpay error description, fallback to standard message
    const errorMessage = error?.error?.description || error?.message || "Failed to create Razorpay order";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
