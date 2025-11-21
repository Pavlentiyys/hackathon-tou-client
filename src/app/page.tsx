'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { LuAudioWaveform } from 'react-icons/lu';
import { FaCheckCircle, FaRobot, FaMicrophone, FaFileAlt, FaComments } from 'react-icons/fa';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Имитация отправки формы
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <main className='min-h-screen bg-zinc-900'>
      {/* Hero Section */}
      <section className='container mx-auto px-4 py-20 md:py-32'>
        <div className='flex flex-col items-center text-center max-w-4xl mx-auto'>
          <div className='flex items-center gap-3 mb-6'>
            <LuAudioWaveform size={48} className='text-green-500' />
            <h1 className='text-5xl md:text-7xl font-bold text-green-500'>WindTone AI</h1>
          </div>
          <p className='text-xl md:text-2xl text-zinc-300 mb-8 leading-relaxed'>
            Интеллектуальный AI-ассистент с поддержкой голосовых сообщений, 
            транскрибации и обработки файлов
          </p>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Link
              href='/chat'
              className='px-8 py-4 bg-green-500 text-zinc-900 font-bold rounded-lg hover:bg-green-600 transition-colors text-lg'
            >
              Начать чат
            </Link>
            <Link
              href='/about'
              className='px-8 py-4 bg-zinc-800 text-green-500 font-bold rounded-lg border-2 border-green-500 hover:bg-zinc-700 transition-colors text-lg'
            >
              Узнать больше
            </Link>
          </div>
        </div>
      </section>

      {/* Почему именно мы */}
      <section className='container mx-auto px-4 py-20 bg-zinc-800/50'>
        <div className='max-w-6xl mx-auto'>
          <h2 className='text-4xl md:text-5xl font-bold text-green-500 text-center mb-12'>
            Почему именно мы?
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* Преимущество 1 */}
            <div className='bg-zinc-800 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500 transition-colors'>
              <div className='flex items-center gap-3 mb-4'>
                <FaRobot size={32} className='text-green-500' />
                <h3 className='text-xl font-bold text-green-500'>Умный AI</h3>
              </div>
              <p className='text-zinc-300 leading-relaxed'>
                Используем передовые технологии OpenAI для точных и полезных ответов на ваши вопросы
              </p>
            </div>

            {/* Преимущество 2 */}
            <div className='bg-zinc-800 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500 transition-colors'>
              <div className='flex items-center gap-3 mb-4'>
                <FaMicrophone size={32} className='text-green-500' />
                <h3 className='text-xl font-bold text-green-500'>Голосовые сообщения</h3>
              </div>
              <p className='text-zinc-300 leading-relaxed'>
                Записывайте аудио, получайте ответы в виде голосовых сообщений с выбором голоса
              </p>
            </div>

            {/* Преимущество 3 */}
            <div className='bg-zinc-800 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500 transition-colors'>
              <div className='flex items-center gap-3 mb-4'>
                <FaFileAlt size={32} className='text-green-500' />
                <h3 className='text-xl font-bold text-green-500'>Обработка файлов</h3>
              </div>
              <p className='text-zinc-300 leading-relaxed'>
                Транскрибация аудио и видео, чтение текстовых документов - AI понимает содержимое ваших файлов
              </p>
            </div>

            {/* Преимущество 4 */}
            <div className='bg-zinc-800 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500 transition-colors'>
              <div className='flex items-center gap-3 mb-4'>
                <FaComments size={32} className='text-green-500' />
                <h3 className='text-xl font-bold text-green-500'>Удобный интерфейс</h3>
              </div>
              <p className='text-zinc-300 leading-relaxed'>
                Современный и интуитивно понятный дизайн для комфортного общения с AI
              </p>
            </div>

            {/* Преимущество 5 */}
            <div className='bg-zinc-800 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500 transition-colors'>
              <div className='flex items-center gap-3 mb-4'>
                <FaCheckCircle size={32} className='text-green-500' />
                <h3 className='text-xl font-bold text-green-500'>Быстрая работа</h3>
              </div>
              <p className='text-zinc-300 leading-relaxed'>
                Мгновенная обработка запросов и генерация ответов без задержек
              </p>
            </div>

            {/* Преимущество 6 */}
            <div className='bg-zinc-800 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500 transition-colors'>
              <div className='flex items-center gap-3 mb-4'>
                <LuAudioWaveform size={32} className='text-green-500' />
                <h3 className='text-xl font-bold text-green-500'>Выбор голоса</h3>
              </div>
              <p className='text-zinc-300 leading-relaxed'>
                Выбирайте из 6 различных голосов для озвучки ответов AI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Форма обратной связи */}
      <section className='container mx-auto px-4 py-20'>
        <div className='max-w-2xl mx-auto'>
          <h2 className='text-4xl md:text-5xl font-bold text-green-500 text-center mb-4'>
            Свяжитесь с нами
          </h2>
          <p className='text-zinc-400 text-center mb-12 text-lg'>
            Есть вопросы или предложения? Мы будем рады услышать от вас!
          </p>

          <form onSubmit={handleSubmit} className='bg-zinc-800 border-2 border-green-500/30 rounded-2xl p-8'>
            <div className='space-y-6'>
              {/* Имя */}
              <div>
                <label htmlFor='name' className='block text-green-500 font-bold mb-2'>
                  Имя
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-3 bg-zinc-700 border-2 border-zinc-600 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors'
                  placeholder='Введите ваше имя'
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor='email' className='block text-green-500 font-bold mb-2'>
                  Email
                </label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-3 bg-zinc-700 border-2 border-zinc-600 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors'
                  placeholder='your@email.com'
                />
              </div>

              {/* Сообщение */}
              <div>
                <label htmlFor='message' className='block text-green-500 font-bold mb-2'>
                  Сообщение
                </label>
                <textarea
                  id='message'
                  name='message'
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className='w-full px-4 py-3 bg-zinc-700 border-2 border-zinc-600 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors resize-none'
                  placeholder='Напишите ваше сообщение...'
                />
              </div>

              {/* Кнопка отправки */}
              <button
                type='submit'
                disabled={isSubmitting}
                className='w-full px-8 py-4 bg-green-500 text-zinc-900 font-bold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg'
              >
                {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
              </button>

              {/* Статус отправки */}
              {submitStatus === 'success' && (
                <div className='bg-green-500/20 border-2 border-green-500 rounded-lg p-4 text-center'>
                  <p className='text-green-500 font-bold'>Сообщение успешно отправлено! 🎉</p>
                </div>
              )}
              {submitStatus === 'error' && (
                <div className='bg-red-500/20 border-2 border-red-500 rounded-lg p-4 text-center'>
                  <p className='text-red-500 font-bold'>Ошибка при отправке. Попробуйте еще раз.</p>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
