'use client';

import { AudioProvider } from '../context/AudioContext';

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AudioProvider>{children}</AudioProvider>;
} 