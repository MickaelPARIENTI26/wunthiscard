import { NextResponse } from 'next/server';
import { signOut } from '@/lib/auth';

export async function POST() {
  try {
    await signOut({ redirect: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: true }); // Return success anyway to clear client state
  }
}
