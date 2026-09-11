import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ToastContainer from '@/components/Toast';
import CustomerSupportWidget from '@/components/CustomerSupportWidget';

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://catl-invest.com'),
  title: {
    default: 'CATL - Contemporary Amperex Technology Clean Energy Investment',
    template: '%s | CATL Clean Power Platform'
  },
  description:
    'Official Contemporary Amperex Technology Co. Limited (CATL) Clean Energy & Battery Storage Investment Platform. Invest in next-generation battery technology and earn guaranteed daily income.',
  keywords: [
    'CATL',
    'Contemporary Amperex Technology',
    'Battery Investment',
    'Clean Energy',
    'Solar Storage',
    'Daily Returns',
    'Passive Income',
    'eSewa Recharge',
    'Khalti Recharge',
    'USDT TRC20'
  ],
  authors: [{ name: 'Contemporary Amperex Technology Co., Limited' }],
  creator: 'CATL Clean Energy Group',
  publisher: 'Contemporary Amperex Technology Co., Limited',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.png',
    apple: '/icon.png'
  },
  openGraph: {
    title: 'CATL - Contemporary Amperex Technology Clean Energy Investment',
    description:
      'Earn reliable daily income investing in CATL battery cells and clean power grid infrastructure. Instant withdrawals & welcome bonuses.',
    url: 'https://catl-invest.com',
    siteName: 'CATL Clean Energy Platform',
    images: [
      {
        url: '/catl_logo.png',
        width: 1200,
        height: 630,
        alt: 'CATL Contemporary Amperex Technology Logo'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CATL Clean Energy & Battery Storage Platform',
    description: 'Earn daily passive returns with state-of-the-art lithium battery technology.',
    images: ['/catl_logo.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://catl-invest.com/#organization',
      name: 'Contemporary Amperex Technology Co., Limited (CATL)',
      url: 'https://catl-invest.com',
      logo: 'https://catl-invest.com/catl_logo.png',
      description: 'Global leader in new energy innovative technologies, specializing in lithium-ion battery development, production, and energy storage investments.'
    },
    {
      '@type': 'WebSite',
      '@id': 'https://catl-invest.com/#website',
      url: 'https://catl-invest.com',
      name: 'CATL Energy Investment',
      publisher: {
        '@id': 'https://catl-invest.com/#organization'
      }
    }
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-50 min-h-screen text-slate-900 antialiased pb-24 md:pb-8 selection:bg-blue-600 selection:text-white">
        <ToastContainer />
        <Header />
        <main className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-2 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <BottomNav />
        <CustomerSupportWidget />
      </body>
    </html>
  );
}
