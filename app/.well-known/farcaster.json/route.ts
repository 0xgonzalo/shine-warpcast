export async function GET() {
    return Response.json({
      accountAssociation: {
        header: process.env.FARCASTER_HEADER,
        payload: process.env.FARCASTER_PAYLOAD,
        signature: process.env.FARCASTER_SIGNATURE,
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
      },
    });
  }