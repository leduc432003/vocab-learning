"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const DictionaryPopup = () => {
    const [selection, setSelection] = useState(null); // { text, rect }
    const [definition, setDefinition] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [showPopup, setShowPopup] = useState(false);
    const [mounted, setMounted] = useState(false);
    const popupRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleSelection = (e) => {
            // Lưu tọa độ chuột/touch ngay lập tức để dùng làm fallback
            const clientX = e?.clientX || e?.changedTouches?.[0]?.clientX;
            const clientY = e?.clientY || e?.changedTouches?.[0]?.clientY;

            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection) return;

                const selectedText = selection.toString().trim();

                // Chỉ xử lý nếu text không rỗng và không quá dài (tăng lên 10 từ)
                if (selectedText && selectedText.split(/\s+/).length <= 10) {
                    try {
                        const range = selection.getRangeAt(0);
                        let rect = range.getBoundingClientRect();

                        // FIX: Nếu rect bị lỗi (do 3D transform), dùng tọa độ chuột làm fallback
                        if ((rect.width === 0 || rect.height === 0 || rect.top === 0) && clientX && clientY) {
                            rect = {
                                top: clientY - 20, // Hiện cao hơn chuột chút
                                left: clientX,
                                width: 0,
                                height: 0,
                                bottom: clientY
                            };
                        }

                        setSelection({
                            text: selectedText,
                            rect: rect
                        });

                        // Tính toán vị trí hiển thị nút tra từ
                        setPosition({
                            top: rect.top + window.scrollY - 45,
                            left: rect.left + window.scrollX + (rect.width > 0 ? rect.width / 2 : 0),
                            isFlipped: false
                        });
                    } catch (e) {
                        console.error('Selection error:', e);
                    }
                } else {
                    // Nếu click ra ngoài hoặc bỏ chọn -> Ẩn nút/popup
                    if (!popupRef.current?.contains(document.activeElement)) {
                        // Logic ẩn đi nếu cần
                        // Check thêm touch events
                    }
                }
            }, 10); // Giảm delay xuống 10ms để phản hồi nhanh hơn
        };

        const handleInteractionStart = (e) => {
            // Nếu click/touch ra ngoài popup thì đóng
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                // Kiểm tra xem có phải đang select text không, nếu không phải thì mới đóng
                const selection = window.getSelection();
                if (!selection.toString()) {
                    setShowPopup(false);
                    setSelection(null);
                }
            }
        };

        // Mouse events
        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('mousedown', handleInteractionStart);

        // Touch events (Mobile)
        document.addEventListener('touchend', handleSelection);
        document.addEventListener('touchstart', handleInteractionStart);

        // Selection change (Backup cho một số browser)
        const handleSelectionChange = () => {
            // Debounce hoặc xử lý nhẹ nếu cần, nhưng handleSelection ở mouseup/touchend là đủ tốt
        };
        document.addEventListener('selectionchange', handleSelectionChange);

        return () => {
            document.removeEventListener('mouseup', handleSelection);
            document.removeEventListener('mousedown', handleInteractionStart);
            document.removeEventListener('touchend', handleSelection);
            document.removeEventListener('touchstart', handleInteractionStart);
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [selection, showPopup]);

    const fetchDefinition = async (word) => {
        setIsLoading(true);
        setError(null);
        setShowPopup(true);
        setDefinition(null);

        // Smart Positioning: Tính toán vị trí để không bị tràn màn hình
        if (selection) {
            const viewportHeight = window.innerHeight;
            const rect = selection.rect;
            const popupHeight = 400; // Chiều cao ước lượng tối đa

            let top = rect.bottom + window.scrollY + 10;

            // Nếu bên dưới không đủ chỗ, lật lên trên
            if (rect.bottom + popupHeight > window.scrollY + viewportHeight) {
                top = rect.top + window.scrollY - 10; // Sẽ dùng transform translate-y-full để lật lên
            }

            setPosition({
                top: top,
                left: Math.max(10, Math.min(rect.left + window.scrollX, window.innerWidth - 350)), // Giữ popup trong màn hình, width khoảng 340px
                isFlipped: rect.bottom + popupHeight > window.scrollY + viewportHeight
            });
        }

        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) throw new Error('Definition not found');
            const data = await response.json();
            setDefinition(data[0]);
        } catch (err) {
            setError(`Could not find definition for "${word}"`);
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = (url) => {
        if (url) {
            new Audio(url).play();
        }
    };

    if (!mounted) return null;
    if (!selection && !showPopup) return null;

    return createPortal(
        <div className="z-[999999]" ref={popupRef}>
            {/* Nút Tra Từ (Vẫn hiện gần vùng chọn để tiện click) */}
            {selection && !showPopup && (
                <div
                    className="fixed transition-all duration-200"
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        transform: 'translateX(-50%)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => fetchDefinition(selection.text)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl text-xs font-bold uppercase tracking-wider hover:bg-black hover:scale-105 transition-all flex items-center gap-2 animate-in zoom-in duration-200 border border-white/10"
                    >
                        <span>🔍 Quick Lookup</span>
                    </button>
                </div>
            )}

            {/* Popup Kết Quả (Docked ở góc dưới bên phải) */}
            {showPopup && (
                <div
                    className="fixed bottom-6 right-6 w-[22rem] sm:w-96 bg-white dark:bg-[#0f172a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-white/10 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[80vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button Header */}
                    <div className="absolute top-2 right-2 z-10">
                        <button
                            onClick={() => setShowPopup(false)}
                            className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors text-slate-500 dark:text-slate-300"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[200px]">
                            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-slate-400 font-medium animate-pulse">Searching dictionary...</span>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
                            <span className="text-4xl mb-3 block opacity-50">🤔</span>
                            <p className="text-slate-500 font-medium">{error}</p>
                        </div>
                    ) : definition && (
                        <>
                            {/* Header Section */}
                            <div className="relative bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-5 border-b border-gray-100 dark:border-white/5 shrink-0">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white capitalize tracking-tight mb-1">
                                            {definition.word}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            {definition.phonetic && (
                                                <span className="text-blue-500 font-mono text-sm bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-500/20">
                                                    {definition.phonetic}
                                                </span>
                                            )}
                                            {/* Show extra phonetics if any */}
                                            {definition.phonetics?.map((p, i) => (
                                                p.text && p.text !== definition.phonetic && (
                                                    <span key={i} className="text-slate-400 font-mono text-xs border border-slate-100 dark:border-white/10 px-1.5 py-0.5 rounded">
                                                        {p.text}
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                        {definition.origin && (
                                            <p className="text-[10px] text-slate-500 italic font-serif leading-relaxed line-clamp-2">
                                                {definition.origin}
                                            </p>
                                        )}
                                    </div>

                                    {definition.phonetics?.find(p => p.audio)?.audio && (
                                        <button
                                            onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)}
                                            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 shrink-0"
                                            title="Listen"
                                        >
                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="overflow-y-auto custom-scrollbar p-5 space-y-8 bg-white dark:bg-[#0f172a]">
                                {definition.meanings.map((meaning, idx) => (
                                    <div key={idx} className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-700">
                                        <div className="absolute -left-[9px] top-0">
                                            <span className={`inline-block w-4 h-4 rounded-full border-4 border-white dark:border-[#0f172a] ${meaning.partOfSpeech === 'noun' ? 'bg-rose-400' :
                                                meaning.partOfSpeech === 'verb' ? 'bg-amber-400' :
                                                    meaning.partOfSpeech === 'adjective' ? 'bg-blue-400' :
                                                        'bg-emerald-400'
                                                }`}></span>
                                        </div>

                                        <div className="mb-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                                {meaning.partOfSpeech}
                                            </h4>

                                            {/* Synonyms/Antonyms per PartOfSpeech */}
                                            {(meaning.synonyms?.length > 0 || meaning.antonyms?.length > 0) && (
                                                <div className="flex flex-wrap gap-3 text-xs mb-3">
                                                    {meaning.synonyms?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 items-center">
                                                            <span className="text-slate-400 font-bold text-[10px] uppercase">Syns:</span>
                                                            {meaning.synonyms.slice(0, 5).map(s => (
                                                                <span key={s} className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded cursor-pointer hover:underline" onClick={() => fetchDefinition(s)}>{s}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {meaning.antonyms?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 items-center">
                                                            <span className="text-slate-400 font-bold text-[10px] uppercase">Ants:</span>
                                                            {meaning.antonyms.slice(0, 5).map(a => (
                                                                <span key={a} className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded cursor-pointer hover:underline" onClick={() => fetchDefinition(a)}>{a}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <ul className="space-y-6">
                                            {meaning.definitions.map((def, dIdx) => (
                                                <li key={dIdx} className="group">
                                                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                                                        <span className="text-slate-300 dark:text-slate-600 font-bold mr-2 select-none">{dIdx + 1}.</span>
                                                        {def.definition}
                                                    </p>

                                                    {def.example && (
                                                        <div className="mt-2 ml-6 text-xs text-slate-500 bg-slate-50 dark:bg-white/5 p-2 rounded-lg italic border-l-2 border-slate-200 dark:border-white/10">
                                                            "{def.example}"
                                                        </div>
                                                    )}

                                                    {/* Definition specific synonyms/antonyms */}
                                                    {(def.synonyms?.length > 0 || def.antonyms?.length > 0) && (
                                                        <div className="mt-2 ml-6 flex flex-wrap gap-3 text-xs opacity-80">
                                                            {def.synonyms?.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    <span className="text-slate-400 text-[9px] uppercase">≈</span>
                                                                    {def.synonyms.map(s => (
                                                                        <span key={s} className="text-emerald-500 dark:text-emerald-400 cursor-pointer hover:underline" onClick={() => fetchDefinition(s)}>{s}</span>
                                                                    )).reduce((prev, curr) => [prev, ', ', curr])}
                                                                </div>
                                                            )}
                                                            {def.antonyms?.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    <span className="text-slate-400 text-[9px] uppercase">≠</span>
                                                                    {def.antonyms.map(a => (
                                                                        <span key={a} className="text-rose-500 dark:text-rose-400 cursor-pointer hover:underline" onClick={() => fetchDefinition(a)}>{a}</span>
                                                                    )).reduce((prev, curr) => [prev, ', ', curr])}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}

                                <div className="pt-4 border-t border-slate-100 dark:border-white/5 text-center">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                                        Dictionary API
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>,
        document.body
    );
};

export default DictionaryPopup;
