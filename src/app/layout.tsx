import Navbar from '@/components/Navbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}