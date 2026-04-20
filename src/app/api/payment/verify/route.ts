import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addedCredits } = await req.json();

    // 1. Verify the signature securely
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("sweet_ai_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // 3. Add Credits to User in DB
    await connectToDatabase();
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $inc: { credits: addedCredits } }, // Increment credits
      { new: true }
    );

    return NextResponse.json({ success: true, credits: updatedUser.credits });
  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
