import { NextRequest, NextResponse } from 'next/server';

// Функция для транскрибации аудио/видео файла
async function transcribeFile(file: File, apiKey: string): Promise<string> {
  console.log('[TRANSCRIBE] Начало транскрибации файла:', file.name, 'тип:', file.type, 'размер:', file.size);
  
  const startTime = Date.now();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log('[TRANSCRIBE] Файл конвертирован в buffer, размер:', buffer.length);

  const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}`;
  const formDataParts: Buffer[] = [];

  formDataParts.push(Buffer.from(`--${boundary}\r\n`));
  formDataParts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n`));
  formDataParts.push(Buffer.from(`Content-Type: ${file.type}\r\n\r\n`));
  formDataParts.push(buffer);
  formDataParts.push(Buffer.from(`\r\n`));

  formDataParts.push(Buffer.from(`--${boundary}\r\n`));
  formDataParts.push(Buffer.from(`Content-Disposition: form-data; name="model"\r\n\r\n`));
  formDataParts.push(Buffer.from(`whisper-1\r\n`));

  formDataParts.push(Buffer.from(`--${boundary}\r\n`));
  formDataParts.push(Buffer.from(`Content-Disposition: form-data; name="language"\r\n\r\n`));
  formDataParts.push(Buffer.from(`ru\r\n`));

  formDataParts.push(Buffer.from(`--${boundary}--\r\n`));

  const formDataBuffer = Buffer.concat(formDataParts);
  console.log('[TRANSCRIBE] FormData создан, отправка запроса в OpenAI Whisper API...');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: formDataBuffer,
  });

  console.log('[TRANSCRIBE] Ответ получен, статус:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('[TRANSCRIBE] Ошибка транскрибации:', errorData);
    throw new Error(errorData.error?.message || `Transcription error: ${response.status}`);
  }

  const data = await response.json();
  const transcript = data.text || '';
  const duration = Date.now() - startTime;
  console.log('[TRANSCRIBE] Транскрибация завершена за', duration, 'мс, длина текста:', transcript.length);
  
  return transcript;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const messagesJson = formData.get('messages') as string;
    const model = (formData.get('model') as string) || 'gpt-3.5-turbo';
    
    let messages = JSON.parse(messagesJson || '[]');
    const files = formData.getAll('files') as File[];

    // Получаем API ключ из переменных окружения
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Добавляем системное сообщение, если есть файлы
    if (files.length > 0 && messages.length > 0) {
      const hasSystemMessage = messages.some((msg: any) => msg.role === 'system');
      if (!hasSystemMessage) {
        messages.unshift({
          role: 'system',
          content: 'Ты - полезный AI-ассистент. Пользователь может отправлять файлы (текстовые, аудио, видео). Ты получаешь содержимое этих файлов в сообщениях пользователя. Всегда анализируй и работай с содержимым файлов, отвечай на вопросы о них, обрабатывай данные из них. Для аудио и видео файлов ты получаешь транскрибированный текст - прочитай его и предоставь информацию из него. Для текстовых файлов ты получаешь их полное содержимое - прочитай и проанализируй его. Если пользователь отправил только файл без текстового сообщения, обработай содержимое файла и предоставь полезную информацию о нем.'
        });
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.' },
        { status: 500 }
      );
    }

    // Обрабатываем файлы: транскрибируем аудио/видео и читаем текстовые файлы
    console.log('[OPENAI API] Получено файлов:', files.length, 'сообщений:', messages.length);
    
    if (files.length > 0 && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        console.log('[OPENAI API] Начало обработки файлов для сообщения пользователя');
        const fileContents: string[] = [];
        
        for (const file of files) {
          const isAudio = file.type.startsWith('audio/');
          const isVideo = file.type.startsWith('video/');
          const isText = file.type.startsWith('text/') || 
                        file.type === 'application/pdf' ||
                        file.name.toLowerCase().endsWith('.txt') || 
                        file.name.toLowerCase().endsWith('.md') || 
                        file.name.toLowerCase().endsWith('.json') ||
                        file.name.toLowerCase().endsWith('.csv') ||
                        file.name.toLowerCase().endsWith('.log') ||
                        file.name.toLowerCase().endsWith('.xml') ||
                        file.name.toLowerCase().endsWith('.html') ||
                        file.name.toLowerCase().endsWith('.css') ||
                        file.name.toLowerCase().endsWith('.js') ||
                        file.name.toLowerCase().endsWith('.ts') ||
                        file.name.toLowerCase().endsWith('.py') ||
                        file.name.toLowerCase().endsWith('.java') ||
                        file.name.toLowerCase().endsWith('.cpp') ||
                        file.name.toLowerCase().endsWith('.c') ||
                        file.name.toLowerCase().endsWith('.h') ||
                        file.name.toLowerCase().endsWith('.pdf');
          
          console.log('[OPENAI API] Проверка файла:', file.name, 'тип:', file.type, 'isAudio:', isAudio, 'isVideo:', isVideo, 'isText:', isText);
          
          if (isAudio || isVideo) {
            try {
              console.log('[OPENAI API] Транскрибация файла:', file.name);
              const transcript = await transcribeFile(file, apiKey);
              if (transcript.trim()) {
                fileContents.push(`[Транскрибация файла ${file.name}]:\n${transcript}`);
                console.log('[OPENAI API] Транскрибация успешна, длина текста:', transcript.length);
              }
            } catch (error) {
              console.error('[OPENAI API] Ошибка транскрибации файла', file.name, ':', error);
              fileContents.push(`[Ошибка транскрибации файла ${file.name}]`);
            }
          } else if (isText) {
            try {
              console.log('[OPENAI API] Чтение текстового файла:', file.name);
              // Для PDF пытаемся прочитать как текст (базовая поддержка)
              if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
                // PDF требует специальной обработки, но для базовой поддержки попробуем
                fileContents.push(`[PDF файл ${file.name} загружен. Для полной обработки PDF требуется специальная библиотека.]`);
                console.log('[OPENAI API] PDF файл обнаружен, требуется специальная обработка');
              } else {
                const text = await file.text();
                if (text.trim()) {
                  fileContents.push(`[Содержимое файла ${file.name}]:\n${text}`);
                  console.log('[OPENAI API] Текстовый файл прочитан, длина:', text.length);
                }
              }
            } catch (error) {
              console.error('[OPENAI API] Ошибка чтения текстового файла', file.name, ':', error);
              fileContents.push(`[Ошибка чтения файла ${file.name}]`);
            }
          } else {
            console.log('[OPENAI API] Файл не поддерживается (не аудио/видео/текст):', file.name, 'тип:', file.type);
            fileContents.push(`[Файл ${file.name} не может быть обработан. Поддерживаются только текстовые, аудио и видео файлы.]`);
          }
        }
        
        if (fileContents.length > 0) {
          const separator = lastMessage.content ? '\n\n---\n\n' : '';
          const filesSection = `\n\n=== СОДЕРЖИМОЕ ФАЙЛОВ ===\n\n${fileContents.join('\n\n---\n\n')}\n\n=== КОНЕЦ ФАЙЛОВ ===\n\n`;
          lastMessage.content = lastMessage.content + separator + filesSection;
          console.log('[OPENAI API] Содержимое файлов добавлено к сообщению, общая длина:', lastMessage.content.length);
        } else {
          console.log('[OPENAI API] Нет обработанных файлов');
        }
      }
    }
    
    console.log('[OPENAI API] Отправка запроса в OpenAI Chat API с', messages.length, 'сообщениями');

    // Отправляем запрос в OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.error?.message || `OpenAI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Извлекаем ответ от AI
    const aiResponse = data.choices?.[0]?.message?.content || 'Извините, не удалось получить ответ.';

    return NextResponse.json({ content: aiResponse });
  } catch (error) {
    console.error('Error in OpenAI API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

