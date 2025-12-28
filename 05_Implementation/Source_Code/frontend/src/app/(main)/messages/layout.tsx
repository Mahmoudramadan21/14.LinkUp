import type { Metadata } from "next";
import MessagesClientLayout from "./messages-client-layout";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Messages | LinkUp",
    description: "Chat privately with friends and stay connected on LinkUp.",

    alternates: {
      canonical: "https://linkup-app-frontend.vercel.app/messages",
    },

    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },

    openGraph: {
      title: "Messages | LinkUp",
      description: "Chat privately and stay connected with your friends on LinkUp.",
      url: "https://linkup-app-frontend.vercel.app/messages",
      siteName: "LinkUp",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "og/og-messages.png",
          width: 1200,
          height: 630,
          alt: "LinkUp Messages – Private Chat Interface",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: "Messages | LinkUp",
      description: "Chat privately with friends on LinkUp.",
      images: ["og/og-messages.png"],
      site: "@LinkUp",
    },
  };
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  // Inject client-side logic layout
  return <MessagesClientLayout>{children}</MessagesClientLayout>;
}
