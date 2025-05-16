'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic' as const;

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/home');
  return null;
}
