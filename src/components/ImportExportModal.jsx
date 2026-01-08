import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportToExcel, importFromExcel, downloadTemplate } from '../utils/excelService';
import { exportToTxt, importFromTxt } from '../utils/txtService';

export default function ImportExportModal({ isOpen, onClose, vocabulary, currentSet, onImport }) {
    const { t } = useTranslation();
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState(null);
    const [exportFormat, setExportFormat] = useState('excel'); // 'excel' or 'txt'
    const [importFormat, setImportFormat] = useState('excel'); // 'excel' or 'txt'

    if (!isOpen) return null;

    const handleExport = () => {
        const setName = currentSet?.name || 'vocabulary';
        let result;

        if (exportFormat === 'excel') {
            result = exportToExcel(vocabulary, setName);
        } else {
            result = exportToTxt(vocabulary, setName);
        }

        if (result.success) {
            setImportStatus({ type: 'success', message: result.message });
            setTimeout(() => setImportStatus(null), 3000);
        } else {
            setImportStatus({ type: 'error', message: result.message });
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        setImportStatus(null);

        try {
            let words;

            if (importFormat === 'excel') {
                words = await importFromExcel(file);
            } else {
                words = await importFromTxt(file);
            }

            if (words.length > 0) {
                await onImport(words);
                setImportStatus({
                    type: 'success',
                    message: `Successfully imported ${words.length} words!`
                });
                setTimeout(() => {
                    onClose();
                    setImportStatus(null);
                }, 2000);
            }
        } catch (error) {
            setImportStatus({ type: 'error', message: error.message });
        } finally {
            setImporting(false);
            e.target.value = ''; // Reset file input
        }
    };

    const handleDownloadTemplate = () => {
        downloadTemplate();
        setImportStatus({
            type: 'success',
            message: 'Template downloaded successfully!'
        });
        setTimeout(() => setImportStatus(null), 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            📊 {t('importExport.title') || 'Import / Export'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Message */}
                    {importStatus && (
                        <div className={`p-4 rounded-lg ${importStatus.type === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                            }`}>
                            <div className="flex items-center gap-2">
                                {importStatus.type === 'success' ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className="font-medium">{importStatus.message}</span>
                            </div>
                        </div>
                    )}

                    {/* Export Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-500 text-white p-3 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('importExport.exportTitle') || 'Export Vocabulary'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {t('importExport.exportDesc') || 'Download all your vocabulary'}
                                </p>

                                {/* Format Selection */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setExportFormat('excel')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${exportFormat === 'excel'
                                                ? 'bg-blue-500 text-white shadow-lg'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        📊 Excel
                                    </button>
                                    <button
                                        onClick={() => setExportFormat('txt')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${exportFormat === 'txt'
                                                ? 'bg-blue-500 text-white shadow-lg'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        📄 TXT
                                    </button>
                                </div>

                                <button
                                    onClick={handleExport}
                                    disabled={vocabulary.length === 0}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg disabled:cursor-not-allowed"
                                >
                                    📥 Export {vocabulary.length} words ({exportFormat.toUpperCase()})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Import Section */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <div className="flex items-start gap-4">
                            <div className="bg-green-500 text-white p-3 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('importExport.importTitle') || 'Import Vocabulary'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {t('importExport.importDesc') || 'Upload a file to add multiple words at once'}
                                </p>

                                {/* Format Selection */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setImportFormat('excel')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${importFormat === 'excel'
                                                ? 'bg-green-500 text-white shadow-lg'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        📊 Excel
                                    </button>
                                    <button
                                        onClick={() => setImportFormat('txt')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${importFormat === 'txt'
                                                ? 'bg-green-500 text-white shadow-lg'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        📄 TXT
                                    </button>
                                </div>

                                <label className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium cursor-pointer transition-all hover:shadow-lg">
                                    {importing ? (
                                        <>
                                            <svg className="animate-spin inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('importExport.importing') || 'Importing...'}
                                        </>
                                    ) : (
                                        <>
                                            📤 Choose {importFormat.toUpperCase()} File
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept={importFormat === 'excel' ? '.xlsx,.xls' : '.txt'}
                                        onChange={handleImport}
                                        disabled={importing}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Template Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-start gap-4">
                            <div className="bg-purple-500 text-white p-3 rounded-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('importExport.templateTitle') || 'Download Template'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {t('importExport.templateDesc') || 'Get a sample Excel file with the correct format'}
                                </p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:shadow-lg"
                                >
                                    📋 {t('importExport.templateBtn') || 'Download Template'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            {t('importExport.instructionsTitle') || 'Format'}
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                            <p className="font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                Term | Meaning | Phonetic | Type | Level | Topic | Example | Example Meaning | Synonym | Antonym | Collocation | Note | Image URL
                            </p>
                            <ul className="space-y-1 ml-4 list-disc">
                                <li><strong>Required:</strong> Term, Meaning</li>
                                <li><strong>Optional:</strong> All other fields</li>
                                <li><strong>Excel:</strong> Use columns with headers</li>
                                <li><strong>TXT:</strong> Use pipe (|) separator</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        {t('common.close') || 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}
