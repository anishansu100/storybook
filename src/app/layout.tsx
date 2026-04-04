import "~/styles/globals.css";

import { type Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { TRPCReactProvider } from "~/trpc/react";
import { Header } from "~/app/_components/Header";

export const metadata: Metadata = {
  title: "TripTales — Turn Family Trips into Magical Storybooks",
  description:
    "Upload your family trip photos and our AI will weave a personalized children's storybook with beautiful illustrations.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${nunito.variable} ${fredoka.variable}`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
        <TRPCReactProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-12 bg-muted/30">
            <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
              <p>&copy; {new Date().getFullYear()} TripTales. Making memories magical.</p>
            </div>
          </footer>
        </TRPCReactProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
