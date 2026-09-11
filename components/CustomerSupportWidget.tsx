'use client';

import Image from 'next/image';
import { MessageCircle, Headphones } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function CustomerSupportWidget() {
  const pathname = usePathname();

  // Hide on login / register pages if needed, or show everywhere
  if (pathname.includes('/login') || pathname.includes('/register')) {
    return null;
  }

  const telegramUrl = 'https://t.me/CALT_costomer_care';

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 group">
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="CATL Telegram Customer Support"
        className="flex items-center space-x-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white p-2.5 md:p-3 rounded-full md:rounded-2xl shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-cyan-400/40"
      >
        <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden border-2 border-white/80 shadow-md shrink-0 bg-slate-900">
          <Image
            src="/image.png"
            alt="CATL Telegram Customer Support"
            width={44}
            height={44}
            className="object-cover w-full h-full"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 border-2 border-slate-900 rounded-full animate-pulse" />
        </div>

        <div className="hidden md:flex flex-col pr-1 text-left">
          <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest leading-none flex items-center">
            <Headphones className="w-3 h-3 mr-1 text-cyan-300" />
            24/7 Support
          </span>
          <span className="text-xs font-black text-white leading-tight mt-0.5">
            Telegram Customer Care
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
          <MessageCircle className="w-4 h-4 fill-white text-blue-600" />
        </div>
      </a>
    </div>
  );
}
