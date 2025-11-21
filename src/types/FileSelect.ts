
export interface FileSelect {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  textToSpeech?: string; // Текст для преобразования в речь
  onSoundToggle?: (isSounded: boolean) => void; // Колбэк для переключения озвучки
  isSounded?: boolean; // Текущее состояние озвучки
}