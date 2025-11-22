'use client'

import { useChatStore } from '@/store/useChatStore';
import { ChatMessage } from '@/types/ChatHistory';
import React, { useEffect, useRef } from 'react'
import { LuAudioWaveform } from 'react-icons/lu';
import AudioMessage from '../AudioMessage/AudioMessage';

const ChatMessages: React.FC = () => {
  const history = useChatStore(state => state.history);
  const loadHistory = useChatStore(state => state.loadHistory);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Автоматическая прокрутка вниз при изменении истории
  useEffect(() => {
    if (messagesEndRef.current && history.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  const truncateFileName = (fileName: string, maxLength: number = 20) => {
    if (fileName.length <= maxLength) {
      return fileName;
    }
    return fileName.substring(0, maxLength) + '...';
  };

  // Функция для проверки, содержит ли текст запрос на озвучку
  const containsVoiceRequest = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const voiceKeywords = [
      'озвучь',
      'озвучи',
      'озвуч',
      'прочитай вслух',
      'прочитай голосом',
      'скажи',
      'произнеси',
      'прочитай',
      'озвучить',
      'голосом',
      'вслух',
      'озвучка'
    ];
    
    return voiceKeywords.some(keyword => lowerText.includes(keyword));
  };

  // Функция для проверки, была ли включена озвучка в предыдущем сообщении пользователя
  const shouldShowVoiceButton = (message: ChatMessage, index: number): boolean => {
    if (message.sender !== 'ai') {
      return false;
    }
    
    // Ищем предыдущее сообщение пользователя
    for (let i = index - 1; i >= 0; i--) {
      const prevMessage = history[i];
      if (prevMessage.sender === 'user') {
        // Если в предыдущем сообщении пользователя была включена озвучка ИЛИ есть запрос на озвучку в тексте
        return prevMessage.isSounded === true || containsVoiceRequest(prevMessage.prompt);
      }
    }
    
    return false;
  };

  return (
    <div className={`w-full md:w-5/6 ${history.length > 0 ? 'mb-32' : ''}`}>
      {history.length > 0 ? (
        <div className={`flex flex-col gap-4 md:gap-6 w-auto h-auto overflow-y-auto px-2 md:px-4 py-2 `}>
          {history.map((message, index) => {
            const showVoiceButton = shouldShowVoiceButton(message, index);
            
            return (
            <div 
            className={`w-full max-w-[280px] md:max-w-[320px] md:w-80 h-auto rounded-2xl md:rounded-3xl ${message.sender === 'user' ? 'self-end' : 'self-start'} relative`}  
            key={message.id || index}
            >
              {message.sender === 'ai' && showVoiceButton ? (
                <AudioMessage text={message.prompt} messageId={message.id} />
              ) : (
                <div 
                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${message.sender === 'user' ? 'bg-zinc-800 text-white border border-zinc-500' : 'bg-zinc-800 text-white border border-green-500/30'} ${
                    message.id?.startsWith('voice_') ? 'bg-green-500/20 border-green-500' : ''
                  }`}
                >
                  {message.sender === 'ai' && (
                    <div className='flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 pb-2 border-b border-green-500/20'>
                      <div className='flex items-center gap-0.5 md:gap-1'>
                        <div className='w-0.5 md:w-1 h-2 md:h-3 bg-green-500 rounded'></div>
                        <div className='w-0.5 md:w-1 h-3 md:h-4 bg-green-500 rounded'></div>
                        <div className='w-0.5 md:w-1 h-2 md:h-3 bg-green-500 rounded'></div>
                        <div className='w-0.5 md:w-1 h-3 md:h-5 bg-green-500 rounded'></div>
                      </div>
                      <LuAudioWaveform size={14} className='md:w-[18px] md:h-[18px] text-green-500' />
                      <span className='text-[10px] md:text-xs text-green-500 font-bold'>AI ответ</span>
                    </div>
                  )}
                  <div className={`text-sm md:text-base break-words ${message.sender === 'ai' ? 'text-white' : ''}`}>
                    {message.prompt}
                  </div>
                </div>
              )}
              <div className='py-1 md:py-2 px-2 md:px-3'>
                {message.files && message.files.length > 0 && (
                  <ul className='flex flex-wrap gap-1 mt-1 md:mt-2'>
                    {message.files.map((file, fileIndex) => (
                      <li key={fileIndex} className='text-xs md:text-sm'>
                        <span 
                          className='border border-green-500 text-green-500 font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full inline-block max-w-[150px] md:max-w-[200px] truncate'
                          title={file.name}
                        >
                          {truncateFileName(file.name, 12)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            );
          })}
          {/* Якорь для автоматической прокрутки */}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center gap-2 px-4'>
          <h2 className='text-2xl md:text-4xl text-green-500 font-bold text-center'>WindTone AI</h2>
          <p className='font-bold text-zinc-300 text-sm md:text-base text-center'>Ваш интеллектуальный помощник готов ответить на любой вопрос</p>
        </div>  
      )}
    </div>
  )
}

export default ChatMessages
