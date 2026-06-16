import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { searchImage } from '../utils/imageService';

const AddWordModal = ({ isOpen, onClose, onSave, editWord, initialTerm = '' }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        term: initialTerm,
        phonetic: '',
        definition: '',
        type: '',
        example: '',
        exampleDefinition: '',
        synonym: '',
        antonym: '',
        collocation: '',
        note: '',
        level: '',
        topic: '',
        image: ''
    });
    const [dictLoading, setDictLoading] = useState(false);
    const [dictFetched, setDictFetched] = useState(false);

    // Auto-fetch dictionary data when initialTerm changes
    useEffect(() => {
        if (!initialTerm || editWord) {
            setDictFetched(false);
            return;
        }
        if (dictFetched) return; // Already fetched for this term

        const fetchDict = async () => {
            setDictLoading(true);
            try {
                const res = await fetch(`/api/dictionary?word=${encodeURIComponent(initialTerm)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.found) {
                        setFormData(prev => ({
                            ...prev,
                            term: initialTerm,
                            phonetic: data.phonetic || '',
                            definition: data.definition || '',
                            type: data.type || '',
                            example: data.example || '',
                            synonym: (data.synonyms || []).join(', '),
                            antonym: (data.antonyms || []).join(', '),
                        }));
                        toast.success('Đã tự động điền thông tin từ điển! 📖');
                    }
                }
            } catch (err) {
                console.error('[DictFetch] Error:', err);
            } finally {
                setDictLoading(false);
                setDictFetched(true);
            }
        };

        fetchDict();
    }, [initialTerm, editWord]);

    useEffect(() => {
        if (editWord) {
            setFormData(editWord);
        } else {
            setFormData({
                term: initialTerm,
                phonetic: '',
                definition: '',
                type: '',
                example: '',
                exampleDefinition: '',
                synonym: '',
                antonym: '',
                collocation: '',
                note: '',
                level: '',
                topic: '',
                image: ''
            });
        }
        // Reset dictFetched when modal reopens for a new word
        setDictFetched(false);
    }, [editWord, isOpen, initialTerm]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.term && formData.definition) {
            onSave(formData);
            setFormData({
                term: '',
                phonetic: '',
                definition: '',
                type: '',
                example: '',
                exampleDefinition: '',
                synonym: '',
                antonym: '',
                collocation: '',
                note: '',
                level: '',
                topic: '',
                image: ''
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    const inputCls = "w-full px-3 py-2.5 bg-gray-800/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-gray-600";
    const labelCls = "block mb-1.5 text-gray-400 font-semibold text-xs uppercase tracking-wider";
    const fieldCls = "flex flex-col";

    return (
        <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl animate-slide-up flex flex-col"
                style={{ width: '100%', maxWidth: '780px', maxHeight: '95vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/8 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gradient-primary">
                        {editWord ? t('addWord.titleEdit') : t('addWord.titleNew')}
                    </h2>
                    <button
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-gray-400 hover:text-white text-lg"
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5">
                    <form id="add-word-form" onSubmit={handleSubmit}>
                        {/* Row 1: Term + Phonetic */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className={fieldCls}>
                                <label htmlFor="term" className={labelCls}>
                                    {t('addWord.word')} <span className="text-primary-400 normal-case tracking-normal">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="term"
                                    name="term"
                                    className={inputCls}
                                    value={formData.term}
                                    onChange={handleChange}
                                    placeholder="e.g., Serendipity"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className={fieldCls}>
                                <label htmlFor="phonetic" className={labelCls}>
                                    {t('addWord.phonetic')}
                                </label>
                                <input
                                    type="text"
                                    id="phonetic"
                                    name="phonetic"
                                    className={inputCls}
                                    value={formData.phonetic}
                                    onChange={handleChange}
                                    placeholder="e.g., /ˌserənˈdɪpɪti/"
                                />
                            </div>
                        </div>

                        {/* Row 2: Definition (full width) */}
                        <div className={`${fieldCls} mb-4`}>
                            <label htmlFor="definition" className={labelCls}>
                                {t('addWord.definition')} <span className="text-primary-400 normal-case tracking-normal">*</span>
                            </label>
                            <textarea
                                id="definition"
                                name="definition"
                                className={`${inputCls} resize-none`}
                                rows={2}
                                value={formData.definition}
                                onChange={handleChange}
                                placeholder="Enter the meaning..."
                                required
                            />
                        </div>

                        {/* Row 3: Type + Level */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className={fieldCls}>
                                <label htmlFor="type" className={labelCls}>{t('addWord.type')}</label>
                                <select id="type" name="type" className={inputCls} value={formData.type} onChange={handleChange}>
                                    <option value="">{t('addWord.selectType')}</option>
                                    <option value="noun">Noun</option>
                                    <option value="verb">Verb</option>
                                    <option value="adjective">Adjective</option>
                                    <option value="adverb">Adverb</option>
                                    <option value="pronoun">Pronoun</option>
                                    <option value="preposition">Preposition</option>
                                    <option value="conjunction">Conjunction</option>
                                    <option value="interjection">Interjection</option>
                                </select>
                            </div>
                            <div className={fieldCls}>
                                <label htmlFor="level" className={labelCls}>{t('addWord.level')}</label>
                                <select id="level" name="level" className={inputCls} value={formData.level} onChange={handleChange}>
                                    <option value="">{t('addWord.selectLevel')}</option>
                                    <option value="A1">A1 – Beginner</option>
                                    <option value="A2">A2 – Elementary</option>
                                    <option value="B1">B1 – Intermediate</option>
                                    <option value="B2">B2 – Upper Intermediate</option>
                                    <option value="C1">C1 – Advanced</option>
                                    <option value="C2">C2 – Proficiency</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 4: Example + Example translation */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className={fieldCls}>
                                <label htmlFor="example" className={labelCls}>{t('addWord.example')}</label>
                                <textarea
                                    id="example"
                                    name="example"
                                    className={`${inputCls} resize-none`}
                                    rows={2}
                                    value={formData.example}
                                    onChange={handleChange}
                                    placeholder="e.g., I love the serendipity of finding a $20 bill..."
                                />
                            </div>
                            <div className={fieldCls}>
                                <label htmlFor="exampleDefinition" className={labelCls}>{t('addWord.exampleDef')}</label>
                                <textarea
                                    id="exampleDefinition"
                                    name="exampleDefinition"
                                    className={`${inputCls} resize-none`}
                                    rows={2}
                                    value={formData.exampleDefinition}
                                    onChange={handleChange}
                                    placeholder="Dịch nghĩa của câu ví dụ trên..."
                                />
                            </div>
                        </div>

                        {/* Row 5: Synonym + Antonym */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className={fieldCls}>
                                <label htmlFor="synonym" className={labelCls}>{t('addWord.synonyms')}</label>
                                <input
                                    type="text"
                                    id="synonym"
                                    name="synonym"
                                    className={inputCls}
                                    value={formData.synonym}
                                    onChange={handleChange}
                                    placeholder="Similar words..."
                                />
                            </div>
                            <div className={fieldCls}>
                                <label htmlFor="antonym" className={labelCls}>{t('addWord.antonyms')}</label>
                                <input
                                    type="text"
                                    id="antonym"
                                    name="antonym"
                                    className={inputCls}
                                    value={formData.antonym}
                                    onChange={handleChange}
                                    placeholder="Opposite words..."
                                />
                            </div>
                        </div>

                        {/* Row 6: Collocation + Topic */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className={fieldCls}>
                                <label htmlFor="collocation" className={labelCls}>{t('addWord.collocations')}</label>
                                <input
                                    type="text"
                                    id="collocation"
                                    name="collocation"
                                    className={inputCls}
                                    value={formData.collocation}
                                    onChange={handleChange}
                                    placeholder="Words usually used together..."
                                />
                            </div>
                            <div className={fieldCls}>
                                <label htmlFor="topic" className={labelCls}>{t('addWord.topic')}</label>
                                <input
                                    type="text"
                                    id="topic"
                                    name="topic"
                                    className={inputCls}
                                    value={formData.topic}
                                    onChange={handleChange}
                                    placeholder="e.g., Nature, Technology..."
                                />
                            </div>
                        </div>

                        {/* Row 7: Note (full width) */}
                        <div className={`${fieldCls} mb-4`}>
                            <label htmlFor="note" className={labelCls}>{t('addWord.note')}</label>
                            <textarea
                                id="note"
                                name="note"
                                className={`${inputCls} resize-none`}
                                rows={2}
                                value={formData.note}
                                onChange={handleChange}
                                placeholder="Mẹo nhớ hoặc ghi chú thêm..."
                            />
                        </div>

                        {/* Row 8: Image */}
                        <div className={fieldCls}>
                            <label className={labelCls}>{t('addWord.image')}</label>
                            <div className="flex gap-3 items-start">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="file"
                                        id="imageFile"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        title="Upload from computer"
                                        className="w-full px-3 py-2 bg-gray-800/80 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary-500 transition-all file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white file:cursor-pointer file:text-xs hover:file:bg-primary-500"
                                    />
                                    <input
                                        type="url"
                                        name="image"
                                        value={formData.image && formData.image.startsWith('data:') ? '' : (formData.image || '')}
                                        onChange={handleChange}
                                        placeholder={t('addWord.pasteUrl')}
                                        className={inputCls}
                                    />
                                    {!formData.image && formData.term && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const toastId = toast.loading('Đang tìm ảnh...');
                                                const imageUrl = await searchImage(formData.term, formData.topic);
                                                if (imageUrl) {
                                                    setFormData(prev => ({ ...prev, image: imageUrl }));
                                                    toast.success('Đã tìm thấy ảnh!', { id: toastId });
                                                } else {
                                                    toast.error('Không tìm thấy ảnh phù hợp', { id: toastId });
                                                }
                                            }}
                                            className="text-primary-400 text-xs hover:text-primary-300 flex items-center gap-1"
                                        >
                                            🔍 {t('addWord.autoFindImage')}
                                        </button>
                                    )}
                                </div>

                                {/* Image preview */}
                                {formData.image && (
                                    <div className="relative group flex-shrink-0">
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-24 h-24 object-cover rounded-xl border border-white/10 shadow"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end px-6 py-4 border-t border-white/8 flex-shrink-0">
                    <button
                        type="button"
                        className="px-5 py-2.5 glass-effect rounded-xl font-semibold hover:bg-white/10 transition-all text-gray-400 text-sm"
                        onClick={onClose}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        form="add-word-form"
                        className="px-6 py-2.5 bg-gradient-primary rounded-xl font-black text-white text-sm hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all"
                    >
                        {editWord ? t('common.update') : t('common.addWord')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddWordModal;
