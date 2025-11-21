import { Chat } from "@/features/data";
import { ChatMessage, ChatState } from "@/types/ChatHistory";
import { create } from "zustand";

export const useChatStore = create<ChatState>((set, get) => ({
  history: [],
  isLoading: false,

  loadHistory: () => {
    const initialHistory = Chat.getHistory();
    set({ history: initialHistory });
  },

  clearHistory: () => {
    Chat.clearHistory();
    set({ history: [], isLoading: false });
    console.log('[useChatStore] История очищена');
  },

  addVoiceMessage: (message: ChatMessage) => {
    const currentHistory = get().history;
    if (!currentHistory.some(msg => msg.id === message.id)) {
      set({ history: [...currentHistory, message] });
    }
  },

  removeVoiceMessage: (messageId: string) => {
    const currentHistory = get().history;
    set({ history: currentHistory.filter(msg => msg.id !== messageId) });
  },

  addMessage: async (newMessageData, files?: File[]) => {
    // Блокируем отправку, если уже идет загрузка
    if (get().isLoading) {
      console.log('[useChatStore] Блокировка: уже идет загрузка');
      return;
    }

    // Генерируем уникальный ID
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const newMessage: ChatMessage = {
      ...newMessageData,
      id: uniqueId,
      timestamp: Date.now()
    };

    const currentHistory = get().history;
    
    // Проверяем, нет ли уже такого сообщения по содержимому и времени (защита от дублей)
    const isDuplicate = currentHistory.some(msg => 
      msg.id === newMessage.id || 
      (msg.sender === newMessage.sender && 
       msg.prompt === newMessage.prompt && 
       Math.abs(msg.timestamp - newMessage.timestamp) < 1000)
    );
    
    if (isDuplicate) {
      console.log('[useChatStore] Дубликат сообщения обнаружен, пропуск');
      return;
    }

    console.log('[useChatStore] Добавление нового сообщения, ID:', uniqueId);
    const nextHistory = [...currentHistory, newMessage];

    set({ history: nextHistory });
    Chat.sendMessage(newMessage);

    // Если сообщение от пользователя, отправляем в OpenAI и получаем ответ
    // Файлы передаются для транскрибации на сервере
    if (newMessage.sender === 'user' && (newMessage.prompt.trim() !== '' || (files && files.length > 0))) {
      set({ isLoading: true });
      
      try {
        await Chat.sendToOpenAI(newMessage, files || [], (aiMessage) => {
          // Проверяем, нет ли уже такого ответа
          const currentHistory = get().history;
          const isDuplicate = currentHistory.some(msg => 
            msg.id === aiMessage.id || 
            (msg.sender === 'ai' && 
             msg.prompt === aiMessage.prompt && 
             Math.abs(msg.timestamp - aiMessage.timestamp) < 1000)
          );
          
          if (!isDuplicate) {
            console.log('[useChatStore] Добавление ответа AI, ID:', aiMessage.id);
            const finalHistory = [...currentHistory, aiMessage];
            set({ history: finalHistory });
            Chat.sendMessage(aiMessage);
          } else {
            console.log('[useChatStore] Дубликат ответа AI обнаружен, пропуск');
          }
        });
      } catch (error) {
        console.error('[useChatStore] Ошибка при отправке сообщения:', error);
        // Создаем сообщение об ошибке
        const uniqueId = `${Date.now()}_error_${Math.random().toString(36).substring(2, 9)}`;
        const errorMessage: ChatMessage = {
          id: uniqueId,
          sender: 'ai',
          prompt: error instanceof Error 
            ? `❌ Ошибка: ${error.message}\n\nПожалуйста, проверьте настройки и попробуйте еще раз.`
            : '❌ Произошла ошибка при обработке запроса.',
          files: [],
          timestamp: Date.now()
        };
        const currentHistory = get().history;
        const finalHistory = [...currentHistory, errorMessage];
        set({ history: finalHistory });
        Chat.sendMessage(errorMessage);
      } finally {
        set({ isLoading: false });
      }
    }
  }
}));