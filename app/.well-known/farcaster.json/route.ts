function withValidProperties(properties: Record<string, undefined | string | string[]>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL as string;
    return Response.json({
      accountAssociation: {
        header: process.env.FARCASTER_HEADER,
        payload: process.env.FARCASTER_PAYLOAD,
        signature: process.env.FARCASTER_SIGNATURE,
      },
      frame: withValidProperties({
        version: "1",
        name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
        subtitle: "Listen and collect music",
        description: "Shine is a music platform that lets artists own their music",
        homeUrl: URL,
        imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL,
        iconUrl: process.env.NEXT_PUBLIC_ICON_URL,
        buttonTitle: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
        splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL,
        splashBackgroundColor: `#${process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR}`,
        webhookUrl: `${process.env.NEXT_PUBLIC_URL}/api/webhook`,
        tags: ["music", "creator", "artist", "miniapp", "baseapp"],
        primaryCategory: "music",
        heroImageUrl: "",
        tagline: "Where all the stars shines",
        ogTitle: "Shine",
        ogDescription: "Create music onchain in a simple way and share it with your friends",
        ogImageUrl: "https://shine-mini-app.vercel.app/opImage.png",
        canonicalDomain: "shine-mini-app.vercel.app"
      }),
      baseBuilder: {
        allowedAddresses: ["0x6B0425666196885aeA6F2630F5B8750Be2C81ea1", "0xB6A50Db52F703dbB009F03F6Eb7f558f110C9b0D"]
      },
    });
  }