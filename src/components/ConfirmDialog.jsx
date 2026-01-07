import React from 'react';
import { useTranslation } from 'react-i18next';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText }) {
    const { t } = useTranslation();
    const finalConfirmText = confirmText || t('common.confirm');
    const finalCancelText = cancelText || t('common.cancel');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="glass-effect rounded-[2rem] p-8 max-w-sm w-full border border-white/5 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h3 className="text-2xl font-black text-white text-center mb-2">{title}</h3>
                <p className="text-gray-400 text-center mb-8 font-medium leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 glass-effect rounded-2xl font-bold text-gray-400 hover:bg-white/10 transition-all"
                    >
                        {finalCancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-4 bg-gradient-to-r from-red-600 to-red-500 rounded-2xl font-bold text-white hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all"
                    >
                        {finalConfirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
