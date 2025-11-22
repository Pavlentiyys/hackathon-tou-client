import { ChatMessage } from '@/types/ChatHistory';

export class Chat {
	private static STORAGE_KEY = 'chat_history';

	/**
	 * Получить историю сообщений из localStorage
	 */
	static getHistory(): ChatMessage[] {
		try {
			const stored = localStorage.getItem(Chat.STORAGE_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch (e) {
			console.error('Ошибка чтения истории:', e);
			return [];
		}
	}

    static sendMessage(newMessage: ChatMessage) {
        const history = Chat.getHistory();
        const nextMessage = [...history, newMessage];
        try {
            localStorage.setItem(Chat.STORAGE_KEY, JSON.stringify(nextMessage));
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * Очистить историю сообщений
     */
    static clearHistory(): void {
        try {
            localStorage.removeItem(Chat.STORAGE_KEY);
            console.log('[Chat] История очищена');
        } catch (err) {
            console.error('Ошибка очистки истории:', err);
        }
    }

	/**
	 * Отправить сообщение в OpenAI API и получить ответ
	 * Теперь файлы отправляются на сервер, где транскрибируются
	 */
	static async sendToOpenAI(userMessage: ChatMessage, files: File[], onResponse?: (aiMessage: ChatMessage) => void): Promise<ChatMessage | null> {
		try {
			console.log('[Chat.sendToOpenAI] Начало отправки сообщения, файлов:', files.length);
			
			// Получаем историю для контекста (уже включает userMessage, так как оно было добавлено в store)
			const history = Chat.getHistory();
			console.log('[Chat.sendToOpenAI] История загружена, сообщений:', history.length);
			
			// Формируем массив сообщений для OpenAI (только текст, без файлов)
			// История уже содержит userMessage, поэтому просто маппим все сообщения
			const messages = history
				.filter(msg => msg.prompt.trim() !== '') // Фильтруем пустые сообщения
				.map(msg => ({
					role: msg.sender === 'user' ? 'user' : 'assistant',
					content: msg.prompt
				}));

			console.log('[Chat.sendToOpenAI] Сообщений для отправки:', messages.length);

			// Создаем FormData для отправки файлов и сообщений
			const formData = new FormData();
			formData.append('messages', JSON.stringify(messages));
			formData.append('model', 'gpt-3.5-turbo');
			
			// Добавляем все файлы для обработки (транскрибация аудио/видео, чтение текстовых)
			console.log('[Chat.sendToOpenAI] Всего файлов для обработки:', files.length);
			files.forEach(file => {
				console.log('[Chat.sendToOpenAI] Добавление файла в FormData:', file.name, file.type, file.size);
				formData.append('files', file);
			});

			console.log('[Chat.sendToOpenAI] Отправка запроса в /api/openai');
			const startTime = Date.now();
			
			// Отправляем запрос в API route Next.js
			const response = await fetch('/api/openai', {
				method: 'POST',
				body: formData,
			});
			
			const fetchDuration = Date.now() - startTime;
			console.log('[Chat.sendToOpenAI] Ответ получен за', fetchDuration, 'мс, статус:', response.status);

			if (!response.ok) {
				let errorMessage = `Ошибка HTTP: ${response.status}`;
				
				if (response.status === 413) {
					errorMessage = 'Размер запроса слишком большой. Пожалуйста:\n- Уменьшите размер файлов (максимум 4MB на файл)\n- Или очистите историю чата';
				} else {
					const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
					console.error('[Chat.sendToOpenAI] Ошибка ответа:', errorData);
					errorMessage = errorData.error || errorMessage;
				}
				
				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('[Chat.sendToOpenAI] Данные получены, длина ответа:', data.content?.length || 0);

			// Создаем сообщение от AI с уникальным ID
			const uniqueId = `${Date.now()}_ai_${Math.random().toString(36).substring(2, 9)}`;
			const aiMessage: ChatMessage = {
				id: uniqueId,
				sender: 'ai',
				prompt: data.content || data.message || 'Извините, не удалось получить ответ.',
				files: [],
				timestamp: Date.now()
			};
			
			console.log('[Chat.sendToOpenAI] Сообщение AI создано, ID:', uniqueId);

			// НЕ сохраняем здесь - сохранение происходит в useChatStore через колбэк
			// Вызываем колбэк, если он передан - он добавит сообщение в store и сохранит в localStorage
			if (onResponse) {
				onResponse(aiMessage);
			}

			return aiMessage;
		} catch (error) {
			console.error('[Chat.sendToOpenAI] Ошибка при отправке в OpenAI:', error);
			
			// Создаем сообщение об ошибке с уникальным ID и деталями ошибки
			const uniqueId = `${Date.now()}_error_${Math.random().toString(36).substring(2, 9)}`;
			const errorText = error instanceof Error 
				? `❌ Ошибка: ${error.message}\n\nПожалуйста, проверьте:\n- Настроен ли API ключ OpenAI в .env файле\n- Правильность формата файлов\n- Подключение к интернету`
				: '❌ Произошла неизвестная ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.';
			
			const errorMessage: ChatMessage = {
				id: uniqueId,
				sender: 'ai',
				prompt: errorText,
				files: [],
				timestamp: Date.now()
			};

			if (onResponse) {
				onResponse(errorMessage);
			}

			return errorMessage;
		}
	}

	/**
	 * Транскрибировать аудио/видео файл в текст
	 */
	static async transcribeAudio(file: File, onTranscription?: (text: string) => void): Promise<string | null> {
		try {
			// Проверяем, является ли файл аудио или видео
			const isAudio = file.type.startsWith('audio/');
			const isVideo = file.type.startsWith('video/');

			if (!isAudio && !isVideo) {
				throw new Error('Файл должен быть аудио или видео формата');
			}

			// Создаем FormData для отправки файла
			const formData = new FormData();
			formData.append('file', file);
			formData.append('language', 'ru'); // Русский язык по умолчанию

			// Отправляем запрос в API route для транскрибации
			const response = await fetch('/api/transcribe', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const transcript = data.text || 'Не удалось распознать текст.';

			// Вызываем колбэк, если он передан
			if (onTranscription) {
				onTranscription(transcript);
			}

			return transcript;
		} catch (error) {
			console.error('Ошибка при транскрибации:', error);
			
			const errorMessage = error instanceof Error 
				? error.message 
				: 'Произошла ошибка при транскрибации файла.';

			if (onTranscription) {
				onTranscription(errorMessage);
			}

			return null;
		}
	}

	/**
	 * Проверяет, является ли файл аудио или видео
	 */
	static isAudioOrVideoFile(file: File): boolean {
		return file.type.startsWith('audio/') || file.type.startsWith('video/');
	}
}