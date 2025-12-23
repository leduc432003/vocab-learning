import { useState, useEffect } from 'react';

export default function FlashcardsMode({ vocabulary, onUpdateStats, onToggleStar, onExit }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);
    const [showEnglishFirst, setShowEnglishFirst] = useState(true);
    const [cards, setCards] = useState(vocabulary);
    const [starredOnly, setStarredOnly] = useState(false);

    useEffect(() => {
        let filtered = starredOnly ? vocabulary.filter(w => w.starred) : vocabulary;
        setCards(isShuffled ? shuffleArray([...filtered]) : filtered);
        setCurrentIndex(0);
    }, [isShuffled, vocabulary, starredOnly]);

    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    };

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    const handlePrevious = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const handleKeyPress = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setIsFlipped(!isFlipped);
        } else if (e.key === 'ArrowRight') {
            handleNext();
        } else if (e.key === 'ArrowLeft') {
            handlePrevious();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isFlipped, currentIndex]);

    if (cards.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h2 className="text-2xl font-bold text-gray-300 mb-2">No cards to study</h2>
                    <p className="text-gray-500 mb-6">
                        {starredOnly ? 'No starred cards found' : 'Add some vocabulary first'}
                    </p>
                    <button
                        onClick={onExit}
                        className="px-6 py-3 bg-gradient-primary rounded-xl font-semibold text-white"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onExit}
                        className="px-6 py-3 glass-effect rounded-xl font-semibold hover:bg-white/10 transition-all"
                    >
                        ← Back
                    </button>

                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gradient-primary">Flashcards</h1>
                        <p className="text-gray-400 mt-1">
                            {currentIndex + 1} / {cards.length}
                        </p>
                    </div>

                    <div className="w-32" /> {/* Spacer for alignment */}
                </div>

                {/* Controls */}
                <div className="flex gap-3 flex-wrap justify-center">
                    <button
                        onClick={() => setIsShuffled(!isShuffled)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${isShuffled
                            ? 'bg-primary-500 text-white'
                            : 'glass-effect hover:bg-white/10'
                            }`}
                    >
                        🔀 {isShuffled ? 'Shuffled' : 'Shuffle'}
                    </button>

                    <button
                        onClick={() => setShowEnglishFirst(!showEnglishFirst)}
                        className="px-4 py-2 glass-effect rounded-lg font-semibold hover:bg-white/10 transition-all"
                    >
                        🔄 {showEnglishFirst ? 'EN → VI' : 'VI → EN'}
                    </button>

                    <button
                        onClick={() => setStarredOnly(!starredOnly)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${starredOnly
                            ? 'bg-yellow-500 text-white'
                            : 'glass-effect hover:bg-white/10'
                            }`}
                    >
                        ⭐ {starredOnly ? 'Starred Only' : 'All Cards'}
                    </button>

                    <button
                        onClick={() => speak(currentCard.term)}
                        className="px-4 py-2 glass-effect rounded-lg font-semibold hover:bg-white/10 transition-all"
                    >
                        🔊 Speak
                    </button>
                </div>
            </div>

            {/* Flashcard */}
            <div className="max-w-2xl mx-auto">
                <div
                    className="relative h-96 cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div
                        className={`absolute inset-0 transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''
                            }`}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden">
                            <div className="h-full glass-effect rounded-3xl p-12 flex flex-col items-center justify-center border-2 border-primary-500/30 hover:border-primary-500/50 transition-all">
                                <div className="absolute top-6 right-6">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleStar(currentCard.id);
                                        }}
                                        className="text-3xl hover:scale-125 transition-transform"
                                    >
                                        {currentCard.starred ? '⭐' : '☆'}
                                    </button>
                                </div>

                                <div className="text-center">
                                    {currentCard.image && (
                                        <img
                                            src={currentCard.image}
                                            alt={currentCard.term}
                                            className="w-32 h-32 object-cover rounded-2xl mb-6 mx-auto border-2 border-primary-500/20 shadow-xl"
                                        />
                                    )}
                                    <div className="text-6xl font-bold text-white mb-4">
                                        {showEnglishFirst ? currentCard.term : currentCard.definition}
                                    </div>
                                    {showEnglishFirst && currentCard.phonetic && (
                                        <div className="text-2xl text-primary-400 mb-4">
                                            {currentCard.phonetic}
                                        </div>
                                    )}
                                    {currentCard.type && (
                                        <div className="inline-block px-4 py-2 bg-secondary-500/20 rounded-full text-secondary-400 text-sm font-semibold">
                                            {currentCard.type}
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-8 text-gray-500 text-sm">
                                    Click or press Space to flip
                                </div>
                            </div>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180">
                            <div className="h-full glass-effect rounded-3xl p-6 md:p-12 flex flex-col items-center justify-center border-2 border-secondary-500/30 hover:border-secondary-500/50 transition-all">
                                <div className="text-center px-4">
                                    <div className="text-2xl md:text-5xl font-black text-white mb-4 md:mb-6 tracking-tight leading-tight">
                                        {showEnglishFirst ? currentCard.definition : currentCard.term}
                                    </div>
                                    {!showEnglishFirst && currentCard.phonetic && (
                                        <div className="text-xl text-primary-400 mb-4 font-medium italic">
                                            {currentCard.phonetic}
                                        </div>
                                    )}
                                    {currentCard.example && (
                                        <div className="text-gray-400 italic mt-4 md:mt-6 max-w-md text-sm md:text-base">
                                            "{currentCard.example}"
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-6 md:bottom-8 text-gray-500 text-[10px] md:text-sm uppercase font-bold tracking-widest">
                                    Chạm để lật lại
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 md:mt-8 gap-4">
                    <button
                        onClick={handlePrevious}
                        className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 glass-effect rounded-xl font-bold hover:bg-white/10 transition-all group text-sm md:text-base flex items-center justify-center gap-2"
                    >
                        <span className="group-hover:-translate-x-1 inline-block transition-transform">←</span>
                        <span className="hidden xs:inline">Trước</span>
                    </button>

                    <div className="hidden sm:flex gap-1.5 md:gap-2 overflow-hidden max-w-[150px] md:max-w-none">
                        {cards.slice(Math.max(0, currentIndex - 2), Math.min(cards.length, currentIndex + 3)).map((_, idx) => {
                            const actualIdx = cards.indexOf(_) === currentIndex;
                            return (
                                <div
                                    key={idx}
                                    className={`h-1.5 md:h-2 rounded-full transition-all ${actualIdx
                                        ? 'w-6 md:w-8 bg-primary-500'
                                        : 'w-1.5 md:w-2 bg-gray-600'
                                        }`}
                                />
                            );
                        })}
                    </div>

                    <button
                        onClick={handleNext}
                        className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 glass-effect rounded-xl font-bold hover:bg-white/10 transition-all group text-sm md:text-base flex items-center justify-center gap-2"
                    >
                        <span className="hidden xs:inline">Tiếp</span>
                        <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
                    </button>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>⌨️ Keyboard: Space/Enter to flip • ← → to navigate</p>
                </div>
            </div>
        </div>
    );
}
