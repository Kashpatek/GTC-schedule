import "./globals.css";

export const metadata = {
  title: "SemiAnalysis × SAIL — GTC 2026 Schedule",
  description: "Interview scheduling for NVIDIA GTC 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
