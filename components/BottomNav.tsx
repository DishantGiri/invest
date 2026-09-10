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
      .then(res => res.json())
      .then(data => {
        if (data.user?.role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Hide bottom nav on login/register/admin auth pages
  if (pathname.includes('/login') || pathname.includes('/register')) {
    return null;
  }

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Order', path: '/orders', icon: Layers },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Mine', path: '/mine', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/admin/dashboard', icon: ShieldAlert });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.75px]'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
