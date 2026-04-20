// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User'; // Make sure User model is imported

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sweet_ai_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('-password'); // Don't send password!

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits // <-- Crucial: Send the credits to the frontend
      }
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
