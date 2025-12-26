import { useState } from 'react';
import { toast } from 'react-hot-toast';

const ImportModal = ({ isOpen, onClose, onImport }) => {
    const [importText, setImportText] = useState('');
    const [importMethod, setImportMethod] = useState('text');

    const parseImportText = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        const words = [];

        lines.forEach(line => {
            const parts = line.split('|').map(p => p.trim());

            if (parts.length >= 2) {
                const word = {
                    term: parts[0],
                    definition: parts[1],
                    phonetic: parts[2] || '',
                    type: parts[3] || '',
                    level: parts[4] || '',
                    topic: parts[5] || '',
                    example: parts[6] || '',
                    exampleDefinition: parts[7] || '',
                    synonym: parts[8] || '',
                    antonym: parts[9] || '',
                    collocation: parts[10] || '',
                    note: parts[11] || '',
                    image: parts[12] || ''
                };

                words.push(word);
            }
        });

        return words;
    };

    const handleImport = () => {
        if (importText.trim()) {
            const words = parseImportText(importText);
            if (words.length > 0) {
                onImport(words);
                setImportText('');
                onClose();
            } else {
                toast.error('Không tìm thấy từ hợp lệ. Vui lòng kiểm tra định dạng.');
            }
        }
    };

    const handleFileImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImportText(event.target.result);
            };
            reader.readAsText(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-3xl w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gradient-primary">
                        Nhập từ vựng hàng loạt
                    </h2>
                    <button
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-gray-400 hover:text-white hover:rotate-90"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="flex gap-4 mb-6">
                    <button
                        className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${importMethod === 'text'
                            ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/30'
                            : 'glass-effect hover:bg-white/10'
                            }`}
                        onClick={() => setImportMethod('text')}
                    >
                        📝 Paste Text
                    </button>
                    <button
                        className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${importMethod === 'file'
                            ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/30'
                            : 'glass-effect hover:bg-white/10'
                            }`}
                        onClick={() => setImportMethod('file')}
                    >
                        📄 Upload File
                    </button>
                </div>

                {importMethod === 'text' ? (
                    <div className="mb-6">
                        <label className="block mb-2 text-gray-300 font-medium">
                            Paste your vocabulary (one word per line)
                        </label>
                        <textarea
                            className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all font-mono text-sm min-h-[250px]"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Format: Từ | Nghĩa | Phiên âm | Loại từ | Trình độ | Chủ đề | Ví dụ | Nghĩa ví dụ | Đồng nghĩa | Trái nghĩa | Cụm từ | Ghi chú | Link Ảnh&#10;&#10;Ví dụ:&#10;apple | quả táo | /ˈæp.əl/ | noun | A1 | Food | I eat an apple | Tôi ăn một quả táo | apple pie | pear | green apple | Good for health | https://...png"
                            rows="10"
                        />
                    </div>
                ) : (
                    <div className="mb-6">
                        <label className="block mb-2 text-gray-300 font-medium">
                            Upload a text file (.txt)
                        </label>
                        <input
                            type="file"
                            accept=".txt"
                            onChange={handleFileImport}
                            className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-500 file:text-white file:cursor-pointer hover:file:bg-primary-600"
                        />
                        {importText && (
                            <div className="mt-4 p-4 bg-gray-800 rounded-xl border border-white/10">
                                <p className="text-gray-400 mb-2 text-sm">
                                    Preview ({importText.split('\n').filter(l => l.trim()).length} lines):
                                </p>
                                <pre className="text-white text-xs overflow-x-auto whitespace-pre-wrap break-words">
                                    {importText.substring(0, 500)}...
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-gray-800/50 border-l-4 border-primary-500 p-4 rounded-xl mb-6 overflow-x-auto">
                    <h4 className="text-white font-semibold mb-3">📋 Full Format Guide (12 fields):</h4>
                    <div className="text-[10px] md:text-xs text-gray-400 font-mono bg-black/30 p-3 rounded-lg mb-3">
                        Term | Meaning | Phonetic | Type | Level | Topic | Example | Example Meaning | Synonym | Antonym | Collocation | Note | ImageURL
                    </div>
                    <ul className="space-y-2 text-gray-300 text-sm">
                        <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400 font-mono">Word | Meaning</code> (Minimum)</li>
                        <li><code className="bg-gray-900 px-2 py-1 rounded text-blue-400 font-mono">Word | Meaning | /phonetic/ | noun | B1 | Nature | ...</code></li>
                    </ul>
                    <p className="text-gray-500 text-xs mt-3 italic">
                        Use the pipe character (|) to separate fields. You can leave fields empty but keep the pipes for the order.
                    </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 justify-end mt-6">
                    <button
                        className="w-full sm:w-auto px-6 py-3 glass-effect rounded-xl font-semibold hover:bg-white/10 transition-all text-gray-400"
                        onClick={onClose}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-primary rounded-xl font-black text-white hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all"
                        onClick={handleImport}
                    >
                        Nhập từ vựng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
