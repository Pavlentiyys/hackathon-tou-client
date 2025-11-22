'use client'

import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaDownload, FaCog, FaTimes, FaSpinner } from 'react-icons/fa';
import { LuAudioWaveform } from 'react-icons/lu';

interface AudioMessageProps {
  text: string;
  messageId: string;
}

// Доступные голоса OpenAI TTS
const TTS_VOICES = [
  { value: 'alloy', label: 'Alloy (нейтральный)' },
  { value: 'echo', label: 'Echo (мужской)' },
  { value: 'fable', label: 'Fable (британский)' },
  { value: 'onyx', label: 'Onyx (мужской)' },
  { value: 'nova', label: 'Nova (женский)' },
  { value: 'shimmer', label: 'Shimmer (женский)' },
];

const AudioMessage: React.FC<AudioMessageProps> = ({ text, messageId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('alloy');
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);

  // Загружаем доступные голоса браузера
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Ищем лучший русский голос
      const russianVoices = voices.filter(voice => 
        voice.lang.toLowerCase().includes('ru') || 
        voice.lang.toLowerCase().includes('russian')
      );
      
      // Приоритет: ru-RU > ru > другие русские варианты
      const bestRussianVoice = 
        russianVoices.find(v => v.lang.toLowerCase() === 'ru-ru') ||
        russianVoices.find(v => v.lang.toLowerCase() === 'ru') ||
        russianVoices[0] ||
        voices.find(v => v.lang.toLowerCase().includes('ru')) ||
        null;
      
      setSelectedBrowserVoice(bestRussianVoice);
    };

    loadVoices();
    
    // Некоторые браузеры загружают голоса асинхронно
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Генерируем аудио из текста при монтировании
  useEffect(() => {
    generateAudio();
  }, [text, selectedBrowserVoice]);

  const generateAudio = async () => {
    if (!text || !('speechSynthesis' in window)) return;

    setIsGenerating(true);
    
    // Создаем utterance для воспроизведения
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Используем выбранный русский голос
    if (selectedBrowserVoice) {
      utterance.voice = selectedBrowserVoice;
      console.log('[AudioMessage] Используется голос:', selectedBrowserVoice.name, selectedBrowserVoice.lang);
    } else {
      // Fallback: ищем любой русский голос
      const voices = window.speechSynthesis.getVoices();
      const russianVoice = voices.find(voice => 
        voice.lang.toLowerCase().includes('ru') || 
        voice.lang.toLowerCase().includes('russian')
      );
      if (russianVoice) {
        utterance.voice = russianVoice;
        console.log('[AudioMessage] Используется fallback голос:', russianVoice.name);
      } else {
        console.warn('[AudioMessage] Русский голос не найден, используется системный по умолчанию');
      }
    }

    // Оцениваем длительность (примерно 150 слов в минуту)
    const wordsCount = text.split(/\s+/).length;
    const estimatedDuration = (wordsCount / 150) * 60; // секунды
    setDuration(estimatedDuration);

    utteranceRef.current = utterance;
    setIsGenerating(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      window.speechSynthesis.cancel();
      
      // Обновляем utterance для отслеживания времени
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Используем выбранный русский голос
      if (selectedBrowserVoice) {
        utterance.voice = selectedBrowserVoice;
      } else {
        const voices = window.speechSynthesis.getVoices();
        const russianVoice = voices.find(voice => 
          voice.lang.toLowerCase().includes('ru') || 
          voice.lang.toLowerCase().includes('russian')
        );
        if (russianVoice) {
          utterance.voice = russianVoice;
        }
      }

      startTimeRef.current = Date.now() - currentTime * 1000;
      
      utterance.onstart = () => {
        setIsPlaying(true);
        startTimeRef.current = Date.now() - currentTime * 1000;
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    // Для speechSynthesis перемотка не поддерживается напрямую
    // Останавливаем и начинаем заново с нужной позиции
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      // Можно было бы обрезать текст, но это сложно
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return; // Предотвращаем повторные клики
    
    try {
      setIsDownloading(true);
      console.log('[AudioMessage] Начало генерации аудио для скачивания, голос:', selectedVoice);
      
      // Генерируем аудио через серверный API с выбранным голосом
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          lang: 'ru',
          voice: selectedVoice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Получаем аудио как blob
      const audioBlob = await response.blob();
      console.log('[AudioMessage] Аудио получено, размер:', audioBlob.size);

      // Создаем ссылку для скачивания
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audio-message-${messageId}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[AudioMessage] Аудио скачано');
    } catch (error) {
      console.error('[AudioMessage] Ошибка при скачивании аудио:', error);
      alert('Не удалось сгенерировать аудио. Пожалуйста, проверьте настройки API.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Обновляем время во время воспроизведения
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (elapsed >= duration) {
          setCurrentTime(duration);
          setIsPlaying(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          setCurrentTime(elapsed);
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, duration]);

  return (
    <div className='bg-zinc-800 rounded-xl md:rounded-2xl p-3 md:p-4 border border-green-500/30'>
      {/* Заголовок AI ответ */}
      <div className='flex items-center justify-between gap-1.5 md:gap-2 mb-2 md:mb-3 pb-2 border-b border-green-500/20'>
        <div className='flex items-center gap-1.5 md:gap-2'>
          <div className='flex items-center gap-0.5 md:gap-1'>
            <div className='w-0.5 md:w-1 h-2 md:h-3 bg-green-500 rounded'></div>
            <div className='w-0.5 md:w-1 h-3 md:h-4 bg-green-500 rounded'></div>
            <div className='w-0.5 md:w-1 h-2 md:h-3 bg-green-500 rounded'></div>
            <div className='w-0.5 md:w-1 h-3 md:h-5 bg-green-500 rounded'></div>
          </div>
          <LuAudioWaveform size={14} className='md:w-[18px] md:h-[18px] text-green-500' />
          <span className='text-[10px] md:text-xs text-green-500 font-bold'>AI ответ</span>
        </div>
        
        {/* Кнопка настроек голоса */}
        <button
          onClick={() => setShowVoiceSelector(true)}
          className='rounded-full bg-zinc-700 text-green-500 p-1 md:p-1.5 hover:bg-zinc-600 transition-colors'
          title='Настройки голоса'
        >
          <FaCog size={10} className='md:w-3 md:h-3' />
        </button>
      </div>

      {/* Аудиоплеер */}
      {isGenerating ? (
        <div className='flex items-center gap-2 text-green-500 py-3 md:py-4'>
          <div className='w-1.5 md:w-2 h-1.5 md:h-2 bg-green-500 rounded-full animate-pulse'></div>
          <span className='text-xs md:text-sm'>Генерация аудио...</span>
        </div>
      ) : (
        <div className='flex items-center gap-2 md:gap-3'>
          <button
            onClick={togglePlay}
            disabled={isGenerating}
            className='rounded-full bg-green-500 text-white p-2 md:p-3 hover:bg-green-600 transition-colors disabled:opacity-50 flex-shrink-0'
          >
            {isPlaying ? <FaPause size={12} className='md:w-4 md:h-4' /> : <FaPlay size={12} className='md:w-4 md:h-4' />}
          </button>
          
          <div className='flex-1 min-w-0'>
            <input
              type='range'
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className='w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-500'
              style={{
                background: `linear-gradient(to right, #22c55e 0%, #22c55e ${(currentTime / (duration || 1)) * 100}%, #3f3f46 ${(currentTime / (duration || 1)) * 100}%, #3f3f46 100%)`
              }}
            />
            <div className='flex justify-between text-[10px] md:text-xs text-zinc-400 mt-0.5 md:mt-1'>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className='rounded-full bg-zinc-700 text-green-500 p-1.5 md:p-2 hover:bg-zinc-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
            title={isDownloading ? 'Генерация аудио...' : 'Скачать аудио'}
          >
            {isDownloading ? (
              <FaSpinner size={12} className='md:w-3.5 md:h-3.5 animate-spin' />
            ) : (
              <FaDownload size={12} className='md:w-3.5 md:h-3.5' />
            )}
          </button>
        </div>
      )}

      {/* Модальное окно настроек голоса */}
      {showVoiceSelector && (
        <div 
          className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVoiceSelector(false);
            }
          }}
        >
          <div className='bg-zinc-800 border-2 border-green-500/30 rounded-xl md:rounded-2xl p-4 md:p-6 max-w-md w-full mx-2 md:mx-4 relative'>
            {/* Кнопка закрытия */}
            <button
              onClick={() => setShowVoiceSelector(false)}
              className='absolute top-4 right-4 text-zinc-400 hover:text-green-500 transition-colors'
              title='Закрыть'
            >
              <FaTimes size={20} />
            </button>

            {/* Заголовок */}
            <h3 className='text-xl font-bold text-green-500 mb-6 pr-8'>
              Настройки озвучки
            </h3>

            {/* Голос для скачивания */}
            <div className='mb-6'>
              <div className='text-sm text-green-500 font-bold mb-3'>
                Голос для скачивания (OpenAI TTS):
              </div>
              <div className='space-y-2'>
                {TTS_VOICES.map((voice) => (
                  <button
                    key={voice.value}
                    onClick={() => setSelectedVoice(voice.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors border ${
                      selectedVoice === voice.value
                        ? 'bg-green-500/20 text-green-500 font-bold border-green-500'
                        : 'text-zinc-300 hover:bg-zinc-700 border-zinc-600'
                    }`}
                  >
                    {voice.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Голос браузера */}
            {selectedBrowserVoice && (
              <div className='mb-6'>
                <div className='text-sm text-green-500 font-bold mb-3'>
                  Голос браузера (для воспроизведения):
                </div>
                <div className='bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3'>
                  <div className='text-sm text-zinc-300 font-medium'>
                    {selectedBrowserVoice.name}
                  </div>
                  <div className='text-xs text-zinc-400 mt-1'>
                    {selectedBrowserVoice.lang}
                  </div>
                </div>
                {availableVoices.filter(v => 
                  v.lang.toLowerCase().includes('ru') || 
                  v.lang.toLowerCase().includes('russian')
                ).length > 1 && (
                  <div className='mt-3'>
                    <div className='text-xs text-zinc-400 mb-2'>
                      Доступные русские голоса:
                    </div>
                    <div className='space-y-1 max-h-32 overflow-y-auto'>
                      {availableVoices
                        .filter(v => 
                          v.lang.toLowerCase().includes('ru') || 
                          v.lang.toLowerCase().includes('russian')
                        )
                        .map((voice, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedBrowserVoice(voice);
                              generateAudio();
                            }}
                            className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                              selectedBrowserVoice.name === voice.name
                                ? 'bg-green-500/20 text-green-500 font-bold'
                                : 'text-zinc-400 hover:bg-zinc-700'
                            }`}
                          >
                            {voice.name} ({voice.lang})
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Кнопка закрытия внизу */}
            <button
              onClick={() => setShowVoiceSelector(false)}
              className='w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors mt-4'
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioMessage;

