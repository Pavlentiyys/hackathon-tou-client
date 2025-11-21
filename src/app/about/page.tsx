import React from 'react';

const About: React.FC = () => {
  return (
    <main className='container mx-auto px-4 py-16'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-4xl font-bold text-green-500 mb-8'>О нас</h1>
        
        <div className='space-y-6 text-zinc-300'>
          <section>
            <h2 className='text-2xl font-bold text-green-500 mb-4'>WindTone AI</h2>
            <p className='text-lg leading-relaxed'>
              WindTone AI — это современный AI-ассистент с поддержкой голосовых сообщений, 
              транскрибации аудио и видео файлов, а также обработки текстовых документов.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-bold text-green-500 mb-4'>Возможности</h2>
            <ul className='list-disc list-inside space-y-2 text-lg'>
              <li>Интеллектуальный чат с AI на базе OpenAI GPT</li>
              <li>Голосовые сообщения с высококачественной озвучкой</li>
              <li>Транскрибация аудио и видео файлов</li>
              <li>Обработка и анализ текстовых документов</li>
              <li>Выбор различных голосов для озвучки</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-bold text-green-500 mb-4'>Технологии</h2>
            <p className='text-lg leading-relaxed'>
              Проект разработан с использованием Next.js, React, Zustand для управления состоянием, 
              и интегрирован с OpenAI API для обработки запросов и генерации аудио.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default About;

