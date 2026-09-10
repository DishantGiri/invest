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
