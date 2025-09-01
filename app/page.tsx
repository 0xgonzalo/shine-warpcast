import { redirect } from "next/navigation";
import type { Metadata } from "next";

// Force dynamic rendering
export const dynamic = "force-dynamic" as const;

export const metadata: Metadata = {
  title: "Shine",
  description: "Shine, the simplest way to create music onchain",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Shine",
    description: "Shine, the simplest way to create music onchain",
    images: [`${process.env.NEXT_PUBLIC_URL}/ogImage.png`]
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Shine",
      imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL || "http://shine-warpcast.vercel.app/ogImage.png",
      aspectRatio: "1:1",
      button: {
        title: "Launch Shine",
        action: {
          type: "launch_frame",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Shine",
          url: process.env.NEXT_PUBLIC_URL || "shine-warpcast.vercel.app",
          splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL || `${process.env.NEXT_PUBLIC_URL}/splash.png`,
          splashBackgroundColor: "#000000",
        },
      },
    }),
  },
};

export default function RootPage() {
  redirect("/home");
  return null;
}
