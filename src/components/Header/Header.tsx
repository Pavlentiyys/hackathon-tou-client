'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuAudioWaveform } from 'react-icons/lu';
import { FaBars, FaTimes } from 'react-icons/fa';

const Header: React.FC = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Главная' },
    { href: '/chat', label: 'Чат' },
    { href: '/about', label: 'О нас' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  // Закрываем меню при изменении пути
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Блокируем скролл при открытом меню
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <header className='bg-zinc-900 border-b-2 border-green-500/30 sticky top-0 z-50'>
      <div className='container mx-auto px-4 py-4'>
        <div className='w-4/5 mx-auto'>
          <div className='flex items-center justify-between'>
          {/* Логотип */}
          <Link 
            href='/' 
            className='flex items-center gap-2 hover:opacity-80 transition-opacity'
            onClick={() => setIsMenuOpen(false)}
          >
            <LuAudioWaveform size={24} className='text-green-500' />
            <span className='text-xl font-bold text-green-500'>WindTone AI</span>
          </Link>

          {/* Кнопка бургер-меню для мобильных */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='md:hidden text-green-500 p-2 hover:bg-zinc-800 rounded-lg transition-colors'
            aria-label='Toggle menu'
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Навигация для десктопа */}
          <nav className='hidden md:flex items-center gap-6'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                  isActive(item.href)
                    ? 'bg-green-500 text-zinc-900'
                    : 'text-zinc-300 hover:text-green-500 hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          </div>
        </div>

        {/* Мобильное меню */}
        <nav
          className={`md:hidden fixed inset-0 top-[73px] bg-zinc-900 border-t-2 border-green-500/30 transform transition-transform duration-300 ease-in-out z-40 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className='flex flex-col'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`px-6 py-4 text-lg font-bold transition-colors border-b border-zinc-800 ${
                  isActive(item.href)
                    ? 'bg-green-500/20 text-green-500'
                    : 'text-zinc-300 hover:text-green-500 hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;

