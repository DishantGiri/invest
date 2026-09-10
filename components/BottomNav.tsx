'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Users, User, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Hide bottom nav on login/register pages
  if (pathname.includes('/login') || pathname.includes('/register')) {
    return null;
  }

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Orders', path: '/orders', icon: Layers },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Mine', path: '/mine', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/admin/dashboard', icon: ShieldAlert });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="max-w-lg mx-auto grid grid-cols-4 sm:grid-cols-5 items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-full transition-all ${isActive ? 'bg-blue-50 text-blue-600 scale-110' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-black text-blue-600' : 'font-semibold text-slate-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
