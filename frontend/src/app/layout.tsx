import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Solar Sentinel",
  description:
    "AI due-diligence copilot for solar capital projects racing the ITC deadline.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <TopNav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
