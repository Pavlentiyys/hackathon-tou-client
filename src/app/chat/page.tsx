'use client'

import React, { useState } from 'react'
import ChatInput from '../../components/ChatInput/ChatInput';
import ChatMessages from '@/components/ChatMessages/ChatMessages';
import { useChatStore } from '@/store/useChatStore';
import { FaTrash } from 'react-icons/fa';

const Chat: React.FC = () => {
  const clearHistory = useChatStore(state => state.clearHistory);
  const history = useChatStore(state => state.history);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearChat = () => {
    if (showConfirm) {
      clearHistory();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Автоматически скрываем подтверждение через 3 секунды
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <>
    <main className='mx-auto container'>   
        <div className='w-full h-full'>
            {/* Кнопка очистки чата */}
            {history.length > 0 && (
              <div className='w-4/5 mx-auto flex justify-end px-4 pt-4'>
                <button
                  onClick={handleClearChat}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                    showConfirm
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-red-400 border border-zinc-600'
                  }`}
                >
                  <FaTrash size={16} />
                  <span>{showConfirm ? 'Подтвердить очистку' : 'Очистить чат'}</span>
                </button>
              </div>
            )}
            
            <div className={`flex flex-col items-center ${history.length === 0 ? 'justify-center min-h-[calc(100vh-200px)] gap-4' : 'gap-10 pt-8 pb-20'}`}>
                <ChatMessages />
                <ChatInput/>
            </div>
        </div> 
    </main>
    </>
  )
}

export default Chat
