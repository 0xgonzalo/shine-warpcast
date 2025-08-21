export async function GET() {
    return Response.json({
      accountAssociation: {
        header: process.env.FARCASTER_HEADER,
        payload: process.env.FARCASTER_PAYLOAD,
        signature: process.env.FARCASTER_SIGNATURE,
      },
      baseBuilder: {
        allowedAddresses: ["0x6B0425666196885aeA6F2630F5B8750Be2C81ea1", "0x6B0425666196885aeA6F2630F5B8750Be2C81ea1"]
      },
      frame: {
        version: process.env.NEXT_PUBLIC_VERSION,
        name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
        homeUrl: process.env.NEXT_PUBLIC_URL,
        iconUrl: process.env.NEXT_PUBLIC_ICON_URL,
        imageUrl: process.env.NEXT_PUBLIC_IMAGE_URL,
        buttonTitle: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
        splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL,
        splashBackgroundColor: `#${process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR}`,
        webhookUrl: `${process.env.NEXT_PUBLIC_URL}/api/webhook`,
        tags: ["music", "creator", "artist", "miniapp", "baseapp"],
        subtitle: "Listen and collect music",
        description: "Shine is a music platform that lets artists own their music",
        primaryCategory: "music"
      }
    });
  }