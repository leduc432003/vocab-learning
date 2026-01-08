import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function DeleteImagesModal({ isOpen, onClose, onConfirm, vocabulary }) {
    const { t } = useTranslation();
    const [selectedSources, setSelectedSources] = useState({
        pexels: false,
        pixabay: false,
        unsplash: false
    });
    const [counts, setCounts] = useState({
        pexels: 0,
        pixabay: 0,
        unsplash: 0,
        total: 0
    });

    useEffect(() => {
        if (isOpen && vocabulary) {
            const newCounts = { pexels: 0, pixabay: 0, unsplash: 0, total: 0 };
            vocabulary.forEach(word => {
                if (!word.image) return;
                const url = word.image.toLowerCase();
                if (url.includes('pexels.com')) newCounts.pexels++;
                else if (url.includes('pixabay.com')) newCounts.pixabay++;
                else if (url.includes('unsplash.com')) newCounts.unsplash++;
            });
            newCounts.total = newCounts.pexels + newCounts.pixabay + newCounts.unsplash;
            setCounts(newCounts);
        }
    }, [isOpen, vocabulary]);

    const handleToggle = (source) => {
        setSelectedSources(prev => ({ ...prev, [source]: !prev[source] }));
    };

    const handleConfirm = () => {
        const sourcesToDelete = Object.keys(selectedSources).filter(k => selectedSources[k]);
        onConfirm(sourcesToDelete);
        onClose();
        setSelectedSources({ pexels: false, pixabay: false, unsplash: false });
    };

    if (!isOpen) return null;

    const sources = [
        { id: 'pexels', label: 'Pexels', count: counts.pexels },
        { id: 'pixabay', label: 'Pixabay', count: counts.pixabay },
        { id: 'unsplash', label: 'Unsplash', count: counts.unsplash }
    ];

    const totalSelected = sources.reduce((acc, source) =>
        selectedSources[source.id] ? acc + source.count : acc, 0
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="glass-effect rounded-[2rem] p-8 max-w-md w-full border border-white/5 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>

                <h3 className="text-2xl font-black text-white text-center mb-2">
                    {t('common.deleteImages') || 'Xóa ảnh minh họa'}
                </h3>
                <p className="text-gray-400 text-center mb-8 font-medium">
                    {t('common.deleteImagesDesc') || 'Chọn nguồn ảnh bạn muốn xóa. Hành động này không thể hoàn tác.'}
                </p>

                <div className="space-y-3 mb-8">
                    {sources.map(source => (
                        <label
                            key={source.id}
                            onClick={() => handleToggle(source.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${selectedSources[source.id]
                                ? 'bg-red-500/10 border-red-500/50'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedSources[source.id]
                                    ? 'bg-red-500 border-red-500'
                                    : 'border-gray-500 group-hover:border-gray-400'
                                    }`}>
                                    {selectedSources[source.id] && (
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`font-medium ${selectedSources[source.id] ? 'text-white' : 'text-gray-400'}`}>
                                    {source.label}
                                </span>
                            </div>
                            <span className="text-sm font-bold text-gray-500 bg-black/20 px-2 py-1 rounded-lg">
                                {source.count}
                            </span>
                        </label>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 glass-effect rounded-2xl font-bold text-gray-400 hover:bg-white/10 transition-all"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={totalSelected === 0}
                        className="flex-1 py-4 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl font-bold text-white hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('common.delete')} ({totalSelected})
                    </button>
                </div>
            </div>
        </div>
    );
}
