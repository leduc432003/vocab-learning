import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useSpeechWithSilence } from '../hooks/useSpeechWithSilence';
import { useSpeechStore } from '../store/use-speech-store';
import { useMessagesStore } from '../store/use-messages-store';

export default function SpeakingMode({ vocabulary, onExit, theme }) {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect', null
    const [speakMode, setSpeakMode] = useState('word'); // 'word' or 'sentence'
    const [audioPlaying, setAudioPlaying] = useState(false);

    // State from Zustand
    const transcript = useSpeechStore(state => state.transcript);
    const interimTranscript = useSpeechStore(state => state.interimTranscript);
    const isListening = useSpeechStore(state => state.isListening);
    const isLoading = useSpeechStore(state => state.isLoading);
    const resetTranscript = useSpeechStore(state => state.resetTranscript);

    // Messages Store
    const addMessage = useMessagesStore(state => state.addMessage);

    const currentWord = vocabulary[currentIndex];
    const targetText = speakMode === 'word' ? currentWord?.term : currentWord?.example;

    // Clean text for comparison
    const cleanText = (text) => {
        return text?.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim() || "";
    };

    const validateSpeech = useCallback((spokenText) => {
        if (!spokenText) return;

        // Save to message history
        addMessage(spokenText);

        const target = cleanText(targetText);
        const spoken = cleanText(spokenText);

        if (target === spoken || (spoken.includes(target) && speakMode === 'word')) {
            setFeedback('correct');
            new Audio('/sounds/correct.mp3').play().catch(() => { });
        } else {
            setFeedback('incorrect');
        }
    }, [targetText, speakMode, addMessage]);

    const { start, stop } = useSpeechWithSilence(
        validateSpeech,
        3000,
        15
    );

    // Reset state when word changes
    useEffect(() => {
        if (isListening) stop(true);
        resetTranscript();
        setFeedback(null);
        setSpeakMode('word');
    }, [currentIndex, isListening, stop, resetTranscript]);

    const playTTS = () => {
        if ('speechSynthesis' in window) {
            setAudioPlaying(true);
            const utterance = new SpeechSynthesisUtterance(targetText);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            utterance.onend = () => setAudioPlaying(false);

            if (speakMode === 'sentence') {
                utterance.text = targetText.replace(/\*\*/g, "");
            }

            speechSynthesis.speak(utterance);
        }
    };

    const handleNext = () => {
        if (currentIndex < vocabulary.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onExit();
        }
    };

    if (!currentWord) return null;

    const displayTranscript = transcript + (interimTranscript ? (transcript ? " " : "") + interimTranscript : "");

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#020617] flex flex-col items-center p-4 transition-colors duration-300 font-sans">
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-8 pt-4">
                <button
                    onClick={onExit}
                    className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 transition-colors text-gray-700 dark:text-gray-300"
                >
                    ✕
                </button>
                <div className="h-2 flex-1 mx-6 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-500 transition-all duration-300 ease-out"
                        style={{ width: `${((currentIndex + 1) / vocabulary.length) * 100}%` }}
                    />
                </div>
                <span className="font-bold text-gray-500">
                    {currentIndex + 1}/{vocabulary.length}
                </span>
            </div>

            {/* Main Card */}
            <div className="w-full max-w-2xl bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">

                {/* Mode Switcher */}
                {currentWord.example && (
                    <div className="flex bg-gray-100 dark:bg-black/20 p-1 rounded-xl mb-8">
                        {['word', 'sentence'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setSpeakMode(mode)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${speakMode === mode
                                    ? 'bg-white dark:bg-white/10 shadow text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                )}

                {/* Target Display */}
                <div className="mb-10 flex-1 flex flex-col justify-center">
                    {speakMode === 'word' ? (
                        <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                            {currentWord.term}
                        </h2>
                    ) : (
                        <h2 className="text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                            {currentWord.example.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                                part.startsWith('**') ? <span key={i} className="text-primary-500 font-bold">{part.slice(2, -2)}</span> : part
                            )}
                        </h2>
                    )}
                    {speakMode === 'word' && currentWord.phonetic && (
                        <p className="text-xl text-gray-400 font-serif italic mb-6">{currentWord.phonetic}</p>
                    )}
                </div>

                {/* Transcript Display */}
                <div className={`w-full min-h-[100px] mb-8 p-6 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 relative ${feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-500/10' :
                    feedback === 'incorrect' ? 'border-red-500 bg-red-50 dark:bg-red-500/10' :
                        isListening ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]' :
                            'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20'
                    }`}>

                    {isListening && (
                        <div className="absolute top-3 right-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">REC</span>
                        </div>
                    )}

                    <p className={`text-lg font-medium leading-relaxed ${feedback === 'correct' ? 'text-green-600 dark:text-green-400' :
                        feedback === 'incorrect' ? 'text-red-600 dark:text-red-400' :
                            'text-gray-500'
                        }`}>
                        {isListening ? (displayTranscript || (t('speaking.listening') || "Listening...")) : (displayTranscript || (t('speaking.tapMic') || "Tap microphone and speak"))}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-8">
                    <button
                        onClick={playTTS}
                        disabled={audioPlaying}
                        className={`p-5 rounded-2xl transition-all duration-300 ${audioPlaying
                            ? 'bg-primary-100 text-primary-600 scale-95'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 hover:scale-105'
                            }`}
                    >
                        <span className="text-2xl">🔊</span>
                    </button>

                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            {isListening && (
                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
                            )}
                            <button
                                onClick={start}
                                disabled={isLoading}
                                className={`relative p-8 rounded-full transition-all duration-500 shadow-2xl z-10 ${isListening
                                    ? 'bg-red-500 text-white scale-110 shadow-red-500/40 ring-4 ring-red-500/20'
                                    : feedback === 'correct'
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-110'
                                    }`}
                            >
                                <span className="text-4xl">
                                    {isLoading ? '⏳' : (isListening ? '⏹️' : '🎙️')}
                                </span>
                            </button>
                        </div>
                        {isListening && (
                            <span className="text-red-500 font-bold text-sm tracking-widest animate-pulse uppercase">Stop</span>
                        )}
                    </div>

                    <button
                        onClick={handleNext}
                        className="p-5 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all hover:scale-105"
                    >
                        <span className="text-2xl">⏭️</span>
                    </button>
                </div>

                {/* Feedback */}
                {feedback && (
                    <p className={`mt-6 font-bold text-lg animate-bounce ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                        {feedback === 'correct' ? (t('speaking.excellent') || "Excellent!") : (t('speaking.tryAgain') || "Try again!")}
                    </p>
                )}
            </div>

            <p className="mt-8 text-gray-400 text-sm max-w-md text-center">
                {t('speaking.instruction') || "Listen to the pronunciation first, then tap the microphone to repeat."}
            </p>
        </div>
    );
}
