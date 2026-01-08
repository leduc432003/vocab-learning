// Tối ưu hóa: Sử dụng memo để ngăn re-render không cần thiết
import { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';

function VocabCard({ word, onEdit, onDelete, onToggleStar }) {
    const { t, i18n } = useTranslation();
    const [isFlipped, setIsFlipped] = useState(false);

    const speak = (e, text) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const renderExampleWithBold = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part && part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-primary-400 font-black not-italic">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div
            className="group h-[340px] md:h-[400px] perspective-2000 cursor-pointer"
            onClick={() => {
                if (window.getSelection().toString().length > 0) return;
                setIsFlipped(!isFlipped);
            }}
        >
            <div className={`relative w-full h-full transition-transform duration-700 preserve-3d will-change-transform ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* FRONT SIDE */}
                <div className="absolute inset-0 backface-hidden">
                    <div className="h-full glass-effect rounded-[2rem] md:rounded-[2.5rem] border border-gray-200 dark:border-white/10 flex flex-col p-6 md:p-8 transition-all group-hover:bg-white dark:group-hover:bg-white/[0.07] group-hover:border-primary-500/30 shadow-xl overflow-hidden relative bg-white/80 dark:bg-white/5">
                        {/* Status Label */}
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border ${word.srsStage === 'review' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                                word.srsStage === 'learning' ? 'text-amber-600 dark:text-amber-400 border-amber-500/30' :
                                    'text-blue-600 dark:text-blue-400 border-blue-500/30'
                                }`}>
                                {word.srsStage === 'review' ? t('vocabCard.review') : word.srsStage === 'learning' ? t('vocabCard.learning') : t('vocabCard.new')}
                            </span>

                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleStar(word.id); }}
                                className={`text-xl transition-transform hover:scale-125 ${word.starred ? 'text-yellow-400' : 'text-gray-600 opacity-20 md:opacity-20 group-hover:opacity-100 opacity-100'}`}
                            >
                                {word.starred ? '⭐' : '☆'}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 md:space-y-4">
                            {word.image && (
                                <img
                                    src={word.image}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="w-20 h-20 md:w-32 md:h-32 object-cover rounded-2xl mb-1 md:mb-2 shadow-2xl border border-white/10 transform transition-transform duration-500 will-change-transform"
                                />
                            )}

                            <div className="flex items-center justify-center gap-2 md:gap-3">
                                <h3
                                    className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight line-clamp-2 cursor-text select-text"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {word.term}
                                </h3>
                                <button
                                    onClick={(e) => speak(e, word.term)}
                                    className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-primary-500/20 text-lg md:text-2xl transition-all active:scale-90 border border-gray-200 dark:border-white/5 hover:border-primary-500/30"
                                    title="Phát âm"
                                >
                                    🔊
                                </button>
                            </div>

                            <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 opacity-80 dark:opacity-60">
                                {word.phonetic && <span className="text-xs md:text-base text-primary-600 dark:text-primary-400 font-medium italic">{word.phonetic}</span>}
                                {word.type && <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[8px] md:text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{word.type}</span>}
                            </div>
                        </div>

                        {/* Quick Actions (Bottom) */}
                        <div className="flex justify-center gap-3 md:gap-4 mt-4 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(word); }}
                                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 md:border-transparent"
                            >✏️</button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(word.id); }}
                                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20 text-rose-500 transition-colors border border-rose-500/20 md:border-transparent"
                            >🗑️</button>
                        </div>
                    </div>
                </div>

                {/* BACK SIDE */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="h-full bg-white dark:bg-[#0a0c16] text-gray-900 dark:text-white rounded-[2rem] md:rounded-[2.5rem] flex flex-col p-6 md:p-8 transition-colors shadow-2xl relative overflow-hidden border-2 border-transparent dark:border-white/10">
                        {/* Word Ref */}
                        <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-gray-100 dark:border-white/10 pb-3 md:pb-4">
                            <span className="text-[10px] md:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{word.term}</span>
                            {word.nextReview && (
                                <span className="text-[9px] md:text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 px-2 py-1 rounded-lg">
                                    {t('vocabCard.nextReview')}: {formatDate(word.nextReview)}
                                </span>
                            )}
                        </div>

                        {/* Scrollable Definition & Details */}
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 md:space-y-4">
                            <div>
                                <h4
                                    className="text-lg md:text-2xl font-black text-gray-900 dark:text-white leading-tight cursor-text select-text"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {word.definition}
                                </h4>
                            </div>

                            {word.example && (
                                <div className="bg-gray-50 dark:bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 dark:border-white/5 italic">
                                    <div className="text-[8px] md:text-[9px] font-black text-primary-600 dark:text-primary-500 uppercase tracking-widest mb-1">{t('vocabCard.example')}</div>
                                    <p className="text-gray-700 dark:text-gray-300 text-xs md:text-base leading-snug">
                                        "{renderExampleWithBold(word.example)}"
                                    </p>
                                    {word.exampleDefinition && (
                                        <p className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs mt-2 border-t border-gray-200 dark:border-white/10 pt-2">
                                            {renderExampleWithBold(word.exampleDefinition)}
                                        </p>
                                    )}
                                </div>
                            )}

                            {(word.synonym || word.antonym) && (
                                <div className="grid grid-cols-2 gap-2">
                                    {word.synonym && (
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 md:p-3 rounded-lg border border-emerald-100 dark:border-transparent">
                                            <span className="block text-[7px] md:text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">{t('vocabCard.synonym')}</span>
                                            <span className="text-[10px] md:text-xs font-bold text-emerald-700 dark:text-emerald-400">{word.synonym}</span>
                                        </div>
                                    )}
                                    {word.antonym && (
                                        <div className="bg-rose-50 dark:bg-rose-500/10 p-2 md:p-3 rounded-lg border border-rose-100 dark:border-transparent">
                                            <span className="block text-[7px] md:text-[8px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest mb-1">{t('vocabCard.antonym')}</span>
                                            <span className="text-[10px] md:text-xs font-bold text-rose-700 dark:text-rose-400">{word.antonym}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {word.note && (
                                <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-transparent">
                                    <span className="block text-[8px] md:text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-1">{t('vocabCard.note')}</span>
                                    <p className="text-[10px] md:text-[11px] text-blue-800 dark:text-blue-200 leading-tight">{word.note}</p>
                                </div>
                            )}
                        </div>

                        {/* Hint to Flip Back */}
                        <div className="mt-4 text-center">
                            <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest animate-pulse italic">{t('vocabCard.tapToFlip')}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default memo(VocabCard);
