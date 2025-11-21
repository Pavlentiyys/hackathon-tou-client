import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string || 'ru';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Получаем API ключ из переменных окружения
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.' },
        { status: 500 }
      );
    }

    // Конвертируем файл в формат, который понимает OpenAI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Создаем multipart/form-data вручную для OpenAI API
    const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2, 15)}`;
    const formDataParts: Buffer[] = [];

    // Добавляем файл
    formDataParts.push(Buffer.from(`--${boundary}\r\n`));
    formDataParts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n`));
    formDataParts.push(Buffer.from(`Content-Type: ${file.type}\r\n\r\n`));
    formDataParts.push(buffer);
    formDataParts.push(Buffer.from(`\r\n`));

    // Добавляем модель
    formDataParts.push(Buffer.from(`--${boundary}\r\n`));
    formDataParts.push(Buffer.from(`Content-Disposition: form-data; name="model"\r\n\r\n`));
    formDataParts.push(Buffer.from(`whisper-1\r\n`));

    // Добавляем язык, если указан
    if (language) {
      formDataParts.push(Buffer.from(`--${boundary}\r\n`));
      formDataParts.push(Buffer.from(`Content-Disposition: form-data; name="language"\r\n\r\n`));
      formDataParts.push(Buffer.from(`${language}\r\n`));
    }

    // Закрываем boundary
    formDataParts.push(Buffer.from(`--${boundary}--\r\n`));

    const formDataBuffer = Buffer.concat(formDataParts);

    // Отправляем запрос в OpenAI API для транскрибации
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formDataBuffer,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.error?.message || `OpenAI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Извлекаем транскрибированный текст
    const transcript = data.text || 'Не удалось распознать текст.';

    return NextResponse.json({ text: transcript });
  } catch (error) {
    console.error('Error in transcription API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

