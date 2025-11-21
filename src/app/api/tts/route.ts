import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'ru', voice = 'alloy' } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Валидация голоса
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';

    // Получаем API ключ из переменных окружения
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.' },
        { status: 500 }
      );
    }

    console.log('[TTS API] Генерация аудио для текста, длина:', text.length, 'голос:', selectedVoice);

    // Используем OpenAI TTS API для генерации аудио
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: selectedVoice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[TTS API] Ошибка:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || `OpenAI TTS API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Получаем аудио как blob
    const audioBlob = await response.blob();
    console.log('[TTS API] Аудио сгенерировано, размер:', audioBlob.size);

    // Возвращаем аудио как ответ
    return new NextResponse(audioBlob, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="audio-${Date.now()}.mp3"`,
      },
    });
  } catch (error) {
    console.error('Error in TTS API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

