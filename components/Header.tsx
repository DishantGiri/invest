'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Home, Layers, Users, User, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.user.role === 'admin') {
            setIsAdmin(true);
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (pathname.includes('/login') || pathname.includes('/register')) {
    return null;
  }

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'My Orders', path: '/orders', icon: Layers },
    { name: 'Referral Team', path: '/team', icon: Users },
    { name: 'Profile & Wallet', path: '/mine', icon: User },
  ];

  return (
    <header className="bg-slate-900 text-white py-3 px-4 lg:px-8 sticky top-0 z-40 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-md p-1">
            <Image
              src="/catl_logo_transparent.png"
              alt="Contemporary Amperex Technology Co. Limited Logo"
              width={40}
              height={40}
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black tracking-tight leading-none text-white">
              CATL ENERGY
            </h1>
            <p className="text-[9px] md:text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
              Contemporary Amperex Technology
            </p>
          </div>
        </Link>

        {/* Desktop PC Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Wallet & Badge */}
        <div className="flex items-center space-x-3">
          {user && (
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Balance</span>
              <span className="text-xs font-black text-cyan-400">NPR {user.balance?.toFixed(2) || '0.00'}</span>
            </div>
          )}

          <a
            href="https://wa.me/message/UBPVDRWPZGS7H1?src=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CATL WhatsApp Customer Support"
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40 transition-all"
          >
            <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center bg-emerald-500 text-white p-0.5">
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <span>Support</span>
          </a>

          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-950 text-cyan-400 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              Official CATL
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
