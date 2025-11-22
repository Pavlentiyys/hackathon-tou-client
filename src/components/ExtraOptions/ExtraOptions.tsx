import { MdOutlineUploadFile } from "react-icons/md";
import { FaVolumeUp } from "react-icons/fa";
import React, { useState } from 'react'
import { FileSelect } from "@/types/FileSelect";

const SelectFile: React.FC<FileSelect>= ({
  onFilesSelected, 
  accept = "*",
  multiple = true,
  textToSpeech = "",
  onSoundToggle,
  isSounded = false
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       const fileList = event.target.files;

       if (fileList && fileList.length > 0) {
        const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB
        const filesArray: File[] = Array.from(fileList);
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];
        
        filesArray.forEach(file => {
          if (file.size > MAX_FILE_SIZE) {
            invalidFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          } else {
            validFiles.push(file);
          }
        });
        
        if (invalidFiles.length > 0) {
          alert(`Файл(ы) слишком большие (максимум 4.5MB):\n${invalidFiles.join('\n')}`);
        }
        
        if (validFiles.length > 0) {
          onFilesSelected(validFiles);
        }
        event.target.value = '';
       } else {
        onFilesSelected([]);
       }
    }

    const handleTextToSpeech = () => {
      if (!textToSpeech || textToSpeech.trim() === '') {
        alert('Нет текста для чтения');
        return;
      }

      // Проверяем поддержку Web Speech API
      if ('speechSynthesis' in window) {
        // Останавливаем предыдущее воспроизведение, если оно есть
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeech);
        
        // Настройки голоса (можно настроить язык, скорость, высоту тона)
        utterance.lang = 'ru-RU'; // Русский язык
        utterance.rate = 1; // Скорость речи (0.1 - 10)
        utterance.pitch = 1; // Высота тона (0 - 2)
        utterance.volume = 1; // Громкость (0 - 1)

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = (error) => {
          console.error('Ошибка при воспроизведении речи:', error);
          setIsSpeaking(false);
          alert('Ошибка при воспроизведении речи');
        };

        window.speechSynthesis.speak(utterance);
      } else {
        alert('Ваш браузер не поддерживает синтез речи');
      }
    };

    const stopTextToSpeech = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  const handleSoundToggle = () => {
    if (onSoundToggle) {
      onSoundToggle(!isSounded);
    }
  };

  return (
    <div className='absolute top-0 left-full ml-2 w-60 h-auto bg-zinc-800 rounded-xl border-2 border-green-500 z-50'>
      <div className='flex flex-col p-2 space-y-2'>
          <div className='flex gap-2 p-2 hover:bg-zinc-700 rounded-lg cursor-pointer hover:translate-x-1 transition duration-300 ease-in'>
            <span><MdOutlineUploadFile size={20} /></span>
              <label
                className='block w-full text-sm font-bold text-left text-white cursor-pointer'
              >
                Выбрать файл
                <input
                  type="file"
                  multiple={multiple}
                  accept={accept}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
          </div>
          
          <div 
            className={`flex gap-2 p-2 rounded-lg cursor-pointer hover:translate-x-1 transition duration-300 ease-in ${
              isSounded ? 'bg-green-500/20 hover:bg-green-500/30' : 'hover:bg-zinc-700'
            }`}
            onClick={handleSoundToggle}
          >
            <span className={isSounded ? 'text-green-500' : 'text-white'}>
              <FaVolumeUp size={20} />
            </span>
            <span className='text-sm font-bold text-left text-white cursor-pointer'>
              {isSounded ? 'Отключить озвучку' : 'Включить озвучку'}
            </span>
          </div>
        
      </div>
    </div>
  )
}

export default SelectFile
