'use client'

import { useChatStore } from '@/store/useChatStore';
import { ChatMessage } from '@/types/ChatHistory';
import React, { useEffect } from 'react'
import { LuAudioWaveform } from 'react-icons/lu';
import AudioMessage from '../AudioMessage/AudioMessage';

const ChatMessages: React.FC = () => {
  const history = useChatStore(state => state.history);
  const loadHistory = useChatStore(state => state.loadHistory);
  

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const truncateFileName = (fileName: string, maxLength: number = 20) => {
    if (fileName.length <= maxLength) {
      return fileName;
    }
    return fileName.substring(0, maxLength) + '...';
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
        // Если в предыдущем сообщении пользователя была включена озвучка, показываем кнопку
        return prevMessage.isSounded === true;
      }
    }
    
    return false;
  };

  return (
    <div className='w-5/6 mb-32G'>
      {history.length > 0 ? (
        <div className={`flex flex-col gap-6 w-auto h-auto overflow-y-auto px-4 py-2 `}>
          {history.map((message, index) => {
            const showVoiceButton = shouldShowVoiceButton(message, index);
            
            return (
            <div 
            className={`w-80 h-auto rounded-3xl ${message.sender === 'user' ? 'self-end' : ' self-start'} relative`}  
            key={message.id || index}
            >
              {message.sender === 'ai' && showVoiceButton ? (
                <AudioMessage text={message.prompt} messageId={message.id} />
              ) : (
                <div 
                  className={`p-4 rounded-2xl ${message.sender === 'user' ? 'bg-zinc-800 text-white border border-zinc-500' : 'bg-zinc-800 text-white border border-green-500/30'} ${
                    message.id?.startsWith('voice_') ? 'bg-green-500/20 border-green-500' : ''
                  }`}
                >
                  {message.sender === 'ai' && (
                    <div className='flex items-center gap-2 mb-3 pb-2 border-b border-green-500/20'>
                      <div className='flex items-center gap-1'>
                        <div className='w-1 h-3 bg-green-500 rounded'></div>
                        <div className='w-1 h-4 bg-green-500 rounded'></div>
                        <div className='w-1 h-3 bg-green-500 rounded'></div>
                        <div className='w-1 h-5 bg-green-500 rounded'></div>
                      </div>
                      <LuAudioWaveform size={18} className='text-green-500' />
                      <span className='text-xs text-green-500 font-bold'>AI ответ</span>
                    </div>
                  )}
                  <div className={message.sender === 'ai' ? 'text-white' : ''}>
                    {message.prompt}
                  </div>
                </div>
              )}
              <div className='py-2 px-3'>
                {message.files && message.files.length > 0 && (
                  <ul className='flex flex-wrap gap-1 mt-2'>
                    {message.files.map((file, fileIndex) => (
                      <li key={fileIndex} className='text-sm'>
                        <span 
                          className='border border-green-500 text-green-500 font-bold px-2 py-1 rounded-full inline-block max-w-[200px] truncate'
                          title={file.name}
                        >
                          {truncateFileName(file.name, 15)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center gap-2'>
          <h2 className='text-4xl text-green-500 font-bold'>WindTone AI</h2>
          <p className='font-bold'>Введите сообщение или отправьте файл...</p>
        </div>  
      )}
    </div>
  )
}

export default ChatMessages
