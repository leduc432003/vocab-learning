import { useState } from 'react';

const VocabCard = ({ word, onEdit, onDelete, onToggleStar }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const accuracy = word.reviewCount > 0
        ? Math.round((word.correctCount / word.reviewCount) * 100)
        : 0;

    return (
        <div className="relative">
            <div
                className={`relative w-full h-72 cursor-pointer transition-transform duration-600 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front of card */}
                <div
                    className="absolute w-full h-full backface-hidden glass-effect rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg hover:shadow-xl transition-all"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="absolute top-4 left-4">
                        {(!word.learningStatus || word.learningStatus === 'not-learned') && (
                            <span className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] uppercase font-bold">Chưa học</span>
                        )}
                        {word.learningStatus === 'learning' && (
                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-[10px] uppercase font-bold">Đang học</span>
                        )}
                        {word.learningStatus === 'learned' && (
                            <span className="px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[10px] uppercase font-bold">Đã học</span>
                        )}
                    </div>
                    <div className="text-center w-full">
                        {word.image && (
                            <img
                                src={word.image}
                                alt={word.term}
                                className="w-24 h-24 object-cover rounded-xl mb-4 border-2 border-white/10 mx-auto"
                            />
                        )}
                        <div className="flex items-center justify-center gap-3">
                            <div className="text-3xl font-bold text-gradient-primary mb-2">
                                {word.term}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const utterance = new SpeechSynthesisUtterance(word.term);
                                    utterance.lang = 'en-US';
                                    window.speechSynthesis.speak(utterance);
                                }}
                                className="mb-2 p-2 glass-effect rounded-full hover:bg-white/10 text-primary-400 transition-all transform active:scale-90"
                                title="Nghe phát âm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            </button>
                        </div>
                        {word.phonetic && (
                            <div className="text-gray-400 italic text-base mb-4">
                                {word.phonetic}
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-4 text-xs text-gray-500">
                        Click to flip
                    </div>
                </div>

                {/* Back of card */}
                <div
                    className="absolute w-full h-full backface-hidden glass-effect rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg hover:shadow-xl transition-all rotate-y-180"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="text-xl text-white text-center mb-4">
                        {word.definition}
                    </div>
                    {word.type && (
                        <div className="mb-4">
                            <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm">
                                {word.type}
                            </span>
                        </div>
                    )}
                    {word.reviewCount > 0 && (
                        <div className="flex gap-8 pt-4 border-t border-white/10 w-full justify-center">
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Reviewed</span>
                                <span className="text-xl font-bold text-gradient-success">{word.reviewCount}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Accuracy</span>
                                <span className="text-xl font-bold text-gradient-success">{accuracy}%</span>
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-4 text-xs text-gray-500">
                        Click to flip
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-center mt-4">
                <button
                    className={`w-10 h-10 glass-effect rounded-full flex items-center justify-center text-lg hover:bg-white/10 hover:border-primary-500/50 transition-all hover:-translate-y-0.5 ${word.starred ? 'bg-yellow-500/20 border-yellow-500/50' : ''
                        }`}
                    onClick={() => onToggleStar(word.id)}
                    title={word.starred ? 'Unstar' : 'Star'}
                >
                    {word.starred ? '⭐' : '☆'}
                </button>
                <button
                    className="w-10 h-10 glass-effect rounded-full flex items-center justify-center text-lg hover:bg-white/10 hover:border-primary-500/50 transition-all hover:-translate-y-0.5"
                    onClick={() => onEdit(word)}
                    title="Edit"
                >
                    ✏️
                </button>
                <button
                    className="w-10 h-10 glass-effect rounded-full flex items-center justify-center text-lg hover:bg-white/10 hover:border-primary-500/50 transition-all hover:-translate-y-0.5"
                    onClick={() => onDelete(word.id)}
                    title="Delete"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};

export default VocabCard;
