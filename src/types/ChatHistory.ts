export interface FileInfo {
    name: string;
    size: number;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    prompt: string;
    files: FileInfo[]
    timestamp: number;
    isSounded?: boolean; // Флаг для озвучки текста
    audioUrl?: string; // URL сгенерированного аудио
}

export interface ChatState {
    history: ChatMessage[];
    isLoading: boolean;
    loadHistory: () => void;
    clearHistory: () => void;
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>, files?: File[]) => void | Promise<void>;
    addVoiceMessage: (message: ChatMessage) => void;
    removeVoiceMessage: (messageId: string) => void;
}