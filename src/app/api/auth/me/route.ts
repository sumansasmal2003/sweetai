import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    // --- THE FIX: Await the cookies() function ---
    const cookieStore = await cookies();
    const token = cookieStore.get('sweet_ai_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json({ user: decoded }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
