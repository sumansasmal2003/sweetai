import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // --- THE FIX: Await the cookies() function ---
  const cookieStore = await cookies();
  cookieStore.delete('sweet_ai_token');

  return NextResponse.json({ message: "Logged out successfully" });
}
