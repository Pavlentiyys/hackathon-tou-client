"use client"

import React, { useState, useRef, useEffect } from 'react';
import { IoSend } from "react-icons/io5";
import { LuAudioWaveform } from "react-icons/lu";
import { FaPlus } from "react-icons/fa6";
import { IoIosClose } from "react-icons/io";
import { FaStop } from "react-icons/fa";
import { FaVolumeUp } from "react-icons/fa";
import SelectFile from '../ExtraOptions/ExtraOptions';
import { FileInfo } from '@/types/ChatHistory';
import { useChatStore } from '@/store/useChatStore';
import { Chat } from '@/features/data';

const ChatInput: React.FC = () => {
  const addMessage = useChatStore(state => state.addMessage);
  const history = useChatStore(state => state.history);
  const isLoading = useChatStore(state => state.isLoading);
  const [prompt, setPrompt] = useState<string>('');
  const [openSelectFile, setOpenSelectFile] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isSounded, setIsSounded] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const openSelectFileHandler = () => {
    setOpenSelectFile(!openSelectFile);
  }

  const handleFileSelected = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    } 
    setOpenSelectFile(false);
  }

  const removeFiles = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  }

  const truncateFileName = (fileName: string, maxLength: number = 20) => {
    if (fileName.length <= maxLength) {
      return fileName;
    }
    return fileName.substring(0, maxLength) + '...';
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFiles(prevFiles => [...prevFiles, audioFile]);
        
        // Остановка всех треков потока
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setRecordingTime(0);
      setIsRecording(true);
    } catch (error) {
      console.error('Ошибка при начале записи:', error);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleAudioButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Таймер для отображения времени записи
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  // Очистка ресурсов при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && selectedFiles.length === 0) return;
    if (isLoading || isSubmitting) {
      console.log('[ChatInput] Блокировка отправки: isLoading=', isLoading, 'isSubmitting=', isSubmitting);
      return; // Блокируем повторную отправку
    }

    console.log('[ChatInput] Отправка сообщения, промпт:', prompt.trim().substring(0, 50), 'файлов:', selectedFiles.length);

    setIsSubmitting(true);
    setIsTranscribing(true);

    const filesToStore: FileInfo[] = selectedFiles.map(file => ({
      name: file.name,
      size: file.size
    }));

    // Сохраняем данные перед очисткой
    const messagePrompt = prompt.trim();
    const messageFiles = [...selectedFiles];
    const messageIsSounded = isSounded;

    // Сразу очищаем поля
    setPrompt('');
    setSelectedFiles([]);
    setIsSounded(false);

    try {
      // Отправляем сообщение с файлами - транскрибация произойдет на сервере
      console.log('[ChatInput] Вызов addMessage с файлами:', messageFiles.length);
      await addMessage({
        sender: 'user',
        prompt: messagePrompt,
        files: filesToStore,
        isSounded: messageIsSounded
      }, messageFiles);

      console.log('[ChatInput] Сообщение отправлено');
    } catch (error) {
      console.error('[ChatInput] Ошибка при отправке:', error);
    } finally {
      setIsTranscribing(false);
      setIsSubmitting(false);
    }
  }


  return (
    <div className={`bg-zinc-700 border-2 border-green-500 w-4/5 rounded-3xl p-2 ${history.length > 0 ? 'fixed bottom-10 left-1/2 transform -translate-x-1/2 z-40' : ''}`}>
      <form action="" onSubmit={handleSubmit}>
        {selectedFiles.length > 0 && 
        <ul className='flex gap-2 h-10 py-2 px-3 overflow-x-auto whitespace-nowrap'>
          {selectedFiles.map((file, index) => (
            <li 
            className=''
            key={index}
            >
              <div className='border border-1 rounded-full'>
              <span className='pl-3 pr-2 flex gap-1 items-center'>
                <span className='max-w-[150px] truncate' title={file.name}>
                  {truncateFileName(file.name, 15)}
                </span>
                <button type='button' onClick={() => removeFiles(file.name)}><IoIosClose size={18} /></button>
              </span>
              </div>
            </li>
          ))}
        </ul>
        }
        {isRecording && (
          <div className='px-4 py-2 flex items-center gap-2 text-red-500'>
            <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
            <span className='text-sm font-bold'>
              Запись: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
        {(isTranscribing || isLoading) && (
          <div className='px-4 py-2 flex items-center gap-2 text-blue-500'>
            <div className='w-3 h-3 bg-blue-500 rounded-full animate-pulse'></div>
            <span className='text-sm font-bold'>
              {isTranscribing ? 'Обработка запроса...' : 'ИИ обрабатывает запрос...'}
            </span>
          </div>
        )}
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Введите промпт, добавьте файл и нажмите кнопку отправки!" className='resize-none text-md h-12 overflow-hidden w-full bg-zinc-700 ring-0 focus:ring-0 focus:outline-none px-4 py-3'/>
        <div className='flex justify-between items-center mt-3 mb-2 mx-2'>
          <div className='flex gap-2 relative items-center'>

          {openSelectFile && 
          <SelectFile 
            onFilesSelected={handleFileSelected}
            accept="*"
            multiple={true}
            textToSpeech={prompt}
            onSoundToggle={setIsSounded}
            isSounded={isSounded}
           />}

            <button type='button' onClick={openSelectFileHandler} className='rounded-full bg-zinc-700 border-2 text-md flex gap-1 items-center font-bold border-green-500 bg-transparent ease-in duration-200 hover:bg-green-500 hover:text-zinc-800 text-green-500 p-3'>
              <FaPlus size={18} />
            </button>
            
            {isSounded && (
              <button
                type='button'
                onClick={() => {setIsSounded(false); setOpenSelectFile(false);}}
                className='rounded-full border-2 border-green-500 bg-green-500/20 text-green-500 px-3 py-2.5 text-xs font-bold ease-in duration-200 hover:bg-green-500 hover:text-white'
                title='Отключить озвучку'
              >
                <span className='flex items-center gap-1'>
                  <FaVolumeUp size={18} />
                  <span>озвучка</span>
                </span>
              </button>
            )}
  
          </div>
          <div className='flex gap-2 items-center'>
            <button 
              type='button'
              onClick={handleAudioButtonClick}
              className={`rounded-full border-2 p-3 ease-in duration-200 ${
                isRecording 
                  ? 'border-red-500 text-red-500 bg-red-500/20 hover:bg-red-500 hover:text-white' 
                  : 'border-green-500 text-green-500 bg-transparent hover:bg-green-500 hover:text-zinc-800'
              }`}
            >
              {isRecording ? <FaStop size={18} /> : <LuAudioWaveform size={18} />}
            </button>
            <button 
              type='submit'
              disabled={isLoading || isTranscribing || isSubmitting}
              className={`rounded-full border-2 ease-in duration-200 p-3 ${
                isLoading || isTranscribing || isSubmitting
                  ? 'bg-zinc-600 text-zinc-400 border-zinc-600 cursor-not-allowed'
                  : 'bg-green-500 text-zinc-700 hover:bg-zinc-700 border-green-500 hover:text-green-500'
              }`}
            >
              <IoSend size={18}/>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ChatInput
