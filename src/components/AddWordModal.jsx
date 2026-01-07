import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { searchImage } from '../utils/imageService';

const AddWordModal = ({ isOpen, onClose, onSave, editWord }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
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

    // Update form data when editWord changes or modal opens
    useEffect(() => {
        if (editWord) {
            setFormData(editWord);
        } else {
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
        }
    }, [editWord, isOpen]);

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

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-2xl w-11/12 max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gradient-primary">
                        {editWord ? t('addWord.titleEdit') : t('addWord.titleNew')}
                    </h2>
                    <button
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all text-gray-400 hover:text-white hover:rotate-90"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="term" className="block mb-2 text-gray-300 font-medium text-sm">
                            {t('addWord.word')} *
                        </label>
                        <input
                            type="text"
                            id="term"
                            name="term"
                            className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                            value={formData.term}
                            onChange={handleChange}
                            placeholder="e.g., Serendipity"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="phonetic" className="block mb-2 text-gray-300 font-medium text-sm">
                            {t('addWord.phonetic')}
                        </label>
                        <input
                            type="text"
                            id="phonetic"
                            name="phonetic"
                            className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                            value={formData.phonetic}
                            onChange={handleChange}
                            placeholder="e.g., /ˌserənˈdɪpɪti/"
                        />
                    </div>

                    <div>
                        <label htmlFor="definition" className="block mb-2 text-gray-300 font-medium text-sm">
                            {t('addWord.definition')} *
                        </label>
                        <textarea
                            id="definition"
                            name="definition"
                            className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-vertical min-h-[100px]"
                            value={formData.definition}
                            onChange={handleChange}
                            placeholder="Enter the meaning..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="type" className="block mb-2 text-gray-300 font-medium text-sm">
                                {t('addWord.type')}
                            </label>
                            <select
                                id="type"
                                name="type"
                                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                value={formData.type}
                                onChange={handleChange}
                            >
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

                        <div>
                            <label htmlFor="level" className="block mb-2 text-gray-300 font-medium text-sm">
                                {t('addWord.level')}
                            </label>
                            <select
                                id="level"
                                name="level"
                                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                value={formData.level}
                                onChange={handleChange}
                            >
                                <option value="">{t('addWord.selectLevel')}</option>
                                <option value="A1">A1 - Beginner</option>
                                <option value="A2">A2 - Elementary</option>
                                <option value="B1">B1 - Intermediate</option>
                                <option value="B2">B2 - Upper Intermediate</option>
                                <option value="C1">C1 - Advanced</option>
                                <option value="C2">C2 - Proficiency</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="example" className="block mb-2 text-gray-300 font-medium text-sm">
                            {t('addWord.example')}
                        </label>
                        <textarea
                            id="example"
                            name="example"
                            className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-vertical min-h-[80px]"
                            value={formData.example}
                            onChange={handleChange}
                            placeholder="e.g., I love the serendipity of findind a $20 bill in an old coat."
                        />
                    </div>

                    <div>
                        <label htmlFor="exampleDefinition" className="block mb-2 text-gray-300 font-medium text-sm">
                            {t('addWord.exampleDef')}
                        </label>
                        <input
                            type="text"
                            id="exampleDefinition"
                            name="exampleDefinition"
                            className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all font-medium"
                            value={formData.exampleDefinition}
                            onChange={handleChange}
                            placeholder="Dịch nghĩa của câu ví dụ trên..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="synonym" className="block mb-2 text-gray-300 font-medium text-sm">
                                {t('addWord.synonyms')}
                            </label>
                            <input
                                type="text"
                                id="synonym"
                                name="synonym"
                                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                value={formData.synonym}
                                onChange={handleChange}
                                placeholder="Similar words..."
                            />
                        </div>
                        <div>
                            <label htmlFor="antonym" className="block mb-2 text-gray-300 font-medium text-sm">
                                {t('addWord.antonyms')}
                            </label>
                            <input
                                type="text"
                                id="antonym"
                                name="antonym"
                                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                value={formData.antonym}
                                onChange={handleChange}
                                placeholder="Opposite words..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="collocation" className="block mb-2 text-gray-300 font-medium text-sm">
                                {t('addWord.collocations')}
                            </label>
                            <input
                                type="text"
                                id="collocation"
                                name="collocation"
                                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                value={formData.collocation}
                                onChange={handleChange}
                                placeholder="Words usually used together..."
                            />
                        </div>
                        <div>
                            <label htmlFor="topic" className="block mb-2 text-gray-300 font-medium text-sm">
                                {t('addWord.topic')}
                            </label>
                            <input
                                type="text"
                                id="topic"
                                name="topic"
                                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                value={formData.topic}
                                onChange={handleChange}
                                placeholder="e.g., Nature, Technology..."
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="note" className="block mb-2 text-gray-300 font-medium text-sm">
                            {t('addWord.note')}
                        </label>
                        <textarea
                            id="note"
                            name="note"
                            className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-vertical min-h-[80px]"
                            value={formData.note}
                            onChange={handleChange}
                            placeholder="Mẹo nhớ hoặc ghi chú thêm..."
                        />
                    </div>

                    <div>
                        <label htmlFor="image" className="block mb-2 text-gray-300 font-medium text-sm">
                            {t('addWord.image')}
                        </label>
                        <div className="space-y-3">
                            <input
                                type="file"
                                id="imageFile"
                                accept="image/*"
                                onChange={handleImageChange}
                                title="Upload from computer"
                                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-500 file:text-white file:cursor-pointer hover:file:bg-primary-600 text-sm"
                            />
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-white/10"></div>
                                <span className="text-gray-500 text-[10px] font-bold uppercase">{t('addWord.or')}</span>
                                <div className="h-px flex-1 bg-white/10"></div>
                            </div>
                            <input
                                type="url"
                                name="image"
                                value={formData.image && formData.image.startsWith('data:') ? '' : (formData.image || '')}
                                onChange={handleChange}
                                placeholder={t('addWord.pasteUrl')}
                                className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                            />
                        </div>
                        {formData.image && (
                            <div className="relative mt-4 group">
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    className="w-full max-w-xs h-40 object-cover rounded-2xl border-2 border-white/10 shadow-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                    className="absolute top-2 left-2 w-8 h-8 bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    ×
                                </button>
                            </div>
                        )}
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
                                className="mt-2 text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1"
                            >
                                🔍 {t('addWord.autoFindImage')}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 justify-end pt-4">
                        <button
                            type="button"
                            className="w-full sm:w-auto px-6 py-3 glass-effect rounded-xl font-semibold hover:bg-white/10 transition-all text-gray-400"
                            onClick={onClose}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-3 bg-gradient-primary rounded-xl font-black text-white hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all"
                        >
                            {editWord ? t('common.update') : t('common.addWord')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddWordModal;
