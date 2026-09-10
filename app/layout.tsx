import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ToastContainer from '@/components/Toast';

export const metadata: Metadata = {
  title: 'CATL - Contemporary Amperex Technology Co. Limited',
  description: 'Official CATL Clean Energy & Battery Storage Investment Platform. Earn daily returns with state-of-the-art battery technology investments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 min-h-screen text-slate-800 antialiased pb-20 md:pb-8 selection:bg-emerald-500 selection:text-white">
        <ToastContainer />
        <Header />
        <main className="max-w-md md:max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
