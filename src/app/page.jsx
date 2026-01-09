"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic'; // Tối ưu: Lazy load components
import { Toaster, toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import '../i18n';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';
import { fillMissingImages } from '../utils/imageService';
import Auth from '../components/Auth';
import VocabCard from '../components/VocabCard';
import AddWordModal from '../components/AddWordModal';
import ImportModal from '../components/ImportModal';
import ImportExportModal from '../components/ImportExportModal';
import SetSelector from '../components/SetSelector';
import ConfirmDialog from '../components/ConfirmDialog';
import DeleteImagesModal from '../components/DeleteImagesModal';

// Loading Component
const ModeLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 font-medium animate-pulse">Loading mode...</p>
    </div>
  </div>
);

// Dynamic Imports (Chỉ tải khi cần)
const FlashcardsMode = dynamic(() => import('../components/FlashcardsMode'), { loading: () => <ModeLoading />, ssr: false });
const LearnMode = dynamic(() => import('../components/LearnMode'), { loading: () => <ModeLoading />, ssr: false });
const WriteMode = dynamic(() => import('../components/WriteMode'), { loading: () => <ModeLoading />, ssr: false });
const SpellMode = dynamic(() => import('../components/SpellMode'), { loading: () => <ModeLoading />, ssr: false });
const MatchMode = dynamic(() => import('../components/MatchMode'), { loading: () => <ModeLoading />, ssr: false });
const TestMode = dynamic(() => import('../components/TestMode'), { loading: () => <ModeLoading />, ssr: false });
const YoutubeDictation = dynamic(() => import('../components/YoutubeDictation'), { loading: () => <ModeLoading />, ssr: false });
const SpeakingMode = dynamic(() => import('../components/SpeakingMode'), { loading: () => <ModeLoading />, ssr: false });

export default function Page() {
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState(null);
  const [vocabulary, setVocabulary] = useState([]);
  const [sets, setSets] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [statusCounts, setStatusCounts] = useState({ notLearned: 0, learning: 0, learned: 0, due: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [editWord, setEditWord] = useState(null);
  const [currentMode, setCurrentMode] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, title: '', message: '' });
  const [showDeleteImagesModal, setShowDeleteImagesModal] = useState(false);
  const [autoFillConfirm, setAutoFillConfirm] = useState({ isOpen: false, count: 0 });
  const [theme, setTheme] = useState('dark');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillProgress, setAutoFillProgress] = useState({ current: 0, total: 0 });
  const [profile, setProfile] = useState(null);

  // Quản lý Authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Reset data khi logout
        setSets([]);
        setVocabulary([]);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Khởi tạo dữ liệu khi có session
  useEffect(() => {
    if (session) {
      loadInitialData();
    }
  }, [session]);

  const loadInitialData = async () => {
    const userProfile = await storage.getProfile();
    setProfile(userProfile);
    if (userProfile?.theme) setTheme(userProfile.theme);
    await loadData();
  };

  const loadData = async () => {
    const allSets = await storage.getSets();
    const current = await storage.getCurrentSet();
    const counts = await storage.getStatusCounts(current?.id);

    setSets(allSets);
    setCurrentSet(current);
    setVocabulary(current?.words || []);
    setStatusCounts(counts);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (session) storage.setTheme(theme);
  }, [theme, session]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success(i18n.language === 'vi' ? 'Đã đăng xuất' : 'Logged out');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  // Các handlers khác (giống bản cũ nhưng bọc async/await)
  const handleSelectSet = async (setId) => {
    await storage.setCurrentSet(setId);
    await loadData();
  };

  const handleCreateSet = async (name, description) => {
    const toastId = toast.loading('Đang tạo bộ từ vựng mới...');
    const newSet = await storage.createSet(name, description);

    if (newSet) {
      await storage.setCurrentSet(newSet.id);
      await loadData();
      toast.success(`Đã tạo bộ từ vựng "${name}" thành công!`, { id: toastId });
    } else {
      toast.error('Không thể tạo bộ từ vựng. Vui lòng thử lại!', { id: toastId });
    }
  };

  const handleDeleteSet = (setId) => {
    const set = sets.find(s => s.id === setId);
    setDeleteConfirm({
      isOpen: true,
      type: 'set',
      id: setId,
      title: 'Xóa bộ từ vựng',
      message: `Bạn có chắc chắn muốn xóa bộ từ "${set?.name}"?`
    });
  };

  const confirmDelete = async () => {
    const toastId = toast.loading('Đang xử lý...');
    try {
      let success = false;
      if (deleteConfirm.type === 'word') {
        success = await storage.deleteWord(deleteConfirm.id);
      } else if (deleteConfirm.type === 'set') {
        success = await storage.deleteSet(deleteConfirm.id);
      }

      if (success) {
        toast.success(`Đã xóa ${deleteConfirm.type === 'word' ? 'từ vựng' : 'bộ thẻ'} thành công!`, { id: toastId });
      } else {
        toast.error(`Không thể xóa ${deleteConfirm.type === 'word' ? 'từ vựng' : 'bộ thẻ'}. Vui lòng thử lại!`, { id: toastId });
      }
    } catch (error) {
      toast.error('Lỗi hệ thống khi xóa dữ liệu', { id: toastId });
    } finally {
      setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', message: '' });
      await loadData();
    }
  };

  const handleAddWord = async (wordData) => {
    if (editWord) {
      await storage.updateWord(editWord.id, wordData);
      setEditWord(null);
    } else {
      await storage.addWord(wordData);
    }
    await loadData();
  };

  const handleAutoFill = () => {
    const missingCount = vocabulary.filter(w => !w.image).length;
    if (missingCount === 0) {
      toast.success('Tất cả từ vựng đều đã có ảnh!');
      return;
    }

    setAutoFillConfirm({
      isOpen: true,
      count: missingCount
    });
  };

  const processAutoFill = async () => {
    setIsAutoFilling(true);
    const toastId = toast.loading('Đang tự động tìm ảnh cho các từ còn thiếu...');

    try {
      const { updated, failed } = await fillMissingImages(
        vocabulary,
        (current, total) => setAutoFillProgress({ current, total })
      );

      if (updated.length > 0) {
        await storage.saveVocabulary(updated);
        await loadData();
        toast.success(`Đã tự động thêm ${updated.length} ảnh minh họa!`, { id: toastId });
      } else {
        toast('Không tìm thấy ảnh mới phù hợp.', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tự động điền ảnh', { id: toastId });
    } finally {
      setIsAutoFilling(false);
      setAutoFillProgress({ current: 0, total: 0 });
    }
  };

  const handleDeleteImages = async (sources) => {
    const toastId = toast.loading('Đang xóa ảnh...');
    try {
      const updates = [];
      vocabulary.forEach(word => {
        if (!word.image) return;
        const url = word.image.toLowerCase();
        let shouldDelete = false;

        if (sources.includes('pexels') && url.includes('pexels.com')) shouldDelete = true;
        if (sources.includes('pixabay') && url.includes('pixabay.com')) shouldDelete = true;
        if (sources.includes('unsplash') && url.includes('unsplash.com')) shouldDelete = true;

        if (shouldDelete) {
          updates.push({ id: word.id, image: null });
        }
      });

      if (updates.length > 0) {
        await storage.saveVocabulary(updates);
        await loadData();
        toast.success(`Đã xóa ${updates.length} ảnh thành công!`, { id: toastId });
      } else {
        toast.success('Không có ảnh nào để xóa!', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi xóa ảnh', { id: toastId });
    }
  };

  const handleToggleStar = async (id) => {
    await storage.toggleStar(id);
    await loadData();
  };

  const handleUpdateStats = async (id, isCorrect, mode) => {
    await storage.updateStats(id, isCorrect, mode);
    await loadData();
  };

  const handleSRSUpdate = async (id, rating) => {
    await storage.updateSRS(id, rating);
    await loadData();
  };

  const handleDeleteWord = (id) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'word',
      id: id,
      title: 'Xóa từ vựng',
      message: 'Bạn có chắc chắn muốn xóa từ này?'
    });
  };

  const handleImport = async (words) => {
    await storage.importWords(words);
    await loadData();
    setShowImportModal(false);
    toast.success('Đã nhập từ vựng thành công!');
  };

  const handleImportExcel = async (words) => {
    await storage.importWords(words);
    await loadData();
    toast.success(`Đã nhập ${words.length} từ vựng thành công!`);
  };

  const handleExport = () => {
    if (vocabulary.length === 0) {
      toast.error('Không có từ vựng nào để xuất!');
      return;
    }

    const exportText = vocabulary.map(word => {
      const parts = [
        word.term || '',
        word.definition || '',
        word.phonetic || '',
        word.type || '',
        word.level || '',
        word.topic || '',
        word.example || '',
        word.example_definition || '',
        word.synonym || '',
        word.antonym || '',
        word.collocation || '',
        word.note || '',
        word.image || ''
      ];
      return parts.join(' | ');
    }).join('\n');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSet?.name || 'vocabulary'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Xuất dữ liệu thành công!');
  };

  if (!session) {
    return (
      <>
        <Auth />
        <Toaster position="top-center" />
      </>
    );
  }

  // Chế độ Ôn tập: Chỉ lấy những từ đến hạn
  const dueWords = vocabulary.filter(w => !w.nextReview || new Date(w.nextReview) <= new Date());

  if (currentMode === 'flashcards' || currentMode === 'review') {
    return (
      <FlashcardsMode
        vocabulary={dueWords}
        statusCounts={statusCounts}
        onUpdateSRS={handleSRSUpdate}
        onToggleStar={handleToggleStar}
        onExit={() => { loadData(); setCurrentMode('browse'); }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentMode === 'learn') {
    return (
      <LearnMode
        vocabulary={vocabulary}
        statusCounts={statusCounts}
        onUpdateStats={handleUpdateStats}
        onExit={() => { loadData(); setCurrentMode('browse'); }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentMode === 'write') {
    return (
      <WriteMode
        vocabulary={vocabulary}
        statusCounts={statusCounts}
        onUpdateStats={handleUpdateStats}
        onExit={() => { loadData(); setCurrentMode('browse'); }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentMode === 'spell') {
    return (
      <SpellMode
        vocabulary={vocabulary}
        statusCounts={statusCounts}
        onUpdateStats={handleUpdateStats}
        onExit={() => { loadData(); setCurrentMode('browse'); }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentMode === 'test') {
    return (
      <TestMode
        vocabulary={vocabulary}
        statusCounts={statusCounts}
        onUpdateStats={handleUpdateStats}
        onExit={() => { loadData(); setCurrentMode('browse'); }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentMode === 'match') {
    return (
      <MatchMode
        vocabulary={vocabulary}
        statusCounts={statusCounts}
        onUpdateStats={handleUpdateStats}
        onExit={() => { loadData(); setCurrentMode('browse'); }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentMode === 'dictation') {
    return (
      <YoutubeDictation
        user={session.user}
        onExit={() => { loadData(); setCurrentMode('browse'); }}
      />
    );
  }

  if (currentMode === 'speaking') {
    return (
      <SpeakingMode
        vocabulary={vocabulary}
        onExit={() => { loadData(); setCurrentMode('browse'); }}
        theme={theme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] transition-colors duration-300">
      <header className="bg-gradient-to-b from-primary-100/50 dark:from-primary-900/20 to-transparent border-b border-gray-200 dark:border-white/5 pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                  {t('common.welcome')}, <span className="text-primary-600 dark:text-primary-500">{profile?.username || (i18n.language === 'vi' ? 'Bạn' : 'Guest')}</span>
                </h1>
                <p className="text-gray-500 font-medium text-sm md:text-base">{t('common.syncText')}</p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all shadow-sm font-semibold text-sm group"
                  title={t('common.logout')}
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">{t('common.logout')}</span>
                </button>
                <button
                  onClick={toggleLanguage}
                  className="p-3 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm font-bold text-xs"
                  title={t('common.language')}
                >
                  {i18n.language === 'vi' ? 'VN' : 'EN'}
                </button>
                <button
                  onClick={toggleTheme}
                  className="p-3 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm"
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <div className="flex-1 md:flex-none">
                  <SetSelector
                    sets={sets}
                    currentSet={currentSet}
                    onSelectSet={handleSelectSet}
                    onCreateSet={handleCreateSet}
                    onDeleteSet={handleDeleteSet}
                  />
                </div>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {[
                { label: t('common.notLearned'), val: statusCounts.notLearned, color: 'blue', icon: '🆕' },
                { label: t('common.learning'), val: statusCounts.learning, color: 'amber', icon: '⚡' },
                { label: t('common.mastered'), val: statusCounts.learned, color: 'emerald', icon: '🎓' },
                { label: t('common.due'), val: statusCounts.due, color: 'rose', icon: '📅' }
              ].map((stat, i) => (
                <div key={i} className="glass-effect rounded-3xl p-6 border border-white/10 bg-white/5 shadow-xl">
                  <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
                  <div className={`text-3xl font-black text-${stat.color}-500 flex items-center justify-between`}>
                    {stat.val}
                    <span className="text-2xl opacity-30">{stat.icon}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-32">
        {/* Study Modes Horizontal Scroll on Mobile, Grid on Desktop */}
        <div className="my-8 md:my-12 flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 pb-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          {[
            { id: 'flashcards', label: t('modes.flashcards'), icon: '🎴', desc: 'Anki Pro' },
            { id: 'learn', label: t('modes.learn'), icon: '🎓', desc: 'Start' },
            { id: 'write', label: t('modes.write'), icon: '✍️', desc: 'Focus' },
            { id: 'review', label: t('modes.review'), icon: '🔄', desc: 'Due' },
            { id: 'spell', label: t('modes.spell'), icon: '🎧', desc: 'Listen' },
            { id: 'speaking', label: t('modes.speaking'), icon: '🎙️', desc: 'Voice' },
            { id: 'dictation', label: t('modes.video'), icon: '📺', desc: 'YouTube' },
            { id: 'test', label: t('modes.test'), icon: '📝', desc: 'Final' }
          ].map(mode => (
            <button
              key={mode.id + mode.label}
              onClick={() => setCurrentMode(mode.id)}
              className="group min-w-[140px] md:min-w-0 p-6 glass-effect rounded-[2rem] hover:bg-white/10 transition-all border border-white/5 text-center relative overflow-hidden snap-center"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{mode.icon}</div>
              <div className="font-black text-white text-sm">{mode.label}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">{mode.desc}</div>
            </button>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 md:mb-20">
          <input
            type="text"
            placeholder={t('common.search')}
            className="w-full md:flex-1 px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-white outline-none focus:border-primary-500 transition-all text-sm md:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center overflow-x-auto no-scrollbar gap-2 md:gap-4 pb-2 md:pb-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 md:px-10 py-4 md:py-5 bg-white text-black rounded-2xl md:rounded-3xl font-black hover:scale-105 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap shrink-0"
            >
              <span>+ {t('common.addWord')}</span>
            </button>
            <button
              onClick={handleAutoFill}
              disabled={isAutoFilling}
              className="px-6 md:px-8 py-4 md:py-5 glass-effect rounded-2xl md:rounded-3xl font-black hover:bg-white/10 transition-all border border-white/10 text-white flex items-center justify-center gap-2 group text-sm md:text-base whitespace-nowrap shrink-0"
            >
              {isAutoFilling ? (
                <>
                  <div className="w-4 h-4 md:w-5 md:h-5 border-[3px] md:border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>{Math.round((autoFillProgress.current / autoFillProgress.total) * 100) || 0}%</span>
                </>
              ) : (
                <>
                  <span className="group-hover:rotate-12 transition-transform">🖼️</span>
                  <span className="md:inline">Auto-Fill</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowDeleteImagesModal(true)}
              className="px-4 py-4 md:py-5 glass-effect rounded-2xl md:rounded-3xl font-black hover:bg-white/10 transition-all border border-white/10 text-white flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap shrink-0"
              title={t('common.deleteImages') || 'Xóa ảnh'}
            >
              🗑️
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 md:px-8 py-4 md:py-5 glass-effect rounded-2xl md:rounded-3xl font-black hover:bg-white/10 transition-all border border-white/10 text-white text-sm md:text-base whitespace-nowrap shrink-0"
              title="Nhập dữ liệu"
            >
              📥 <span className="hidden md:inline">{t('common.import')}</span>
            </button>
            <button
              onClick={() => setShowImportExportModal(true)}
              className="px-4 md:px-8 py-4 md:py-5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl md:rounded-3xl font-black hover:bg-green-500/20 transition-all text-sm md:text-base whitespace-nowrap shrink-0"
              title="Import/Export Excel"
            >
              📊 <span className="hidden md:inline">Excel</span>
            </button>
          </div>
        </div>

        {/* Vocabulary Grid - Restricted Height with Scroll */}
        <div className="relative">
          <div className="max-h-[calc(100vh-320px)] md:max-h-[850px] overflow-y-auto no-scrollbar pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {vocabulary.filter(w => w.term.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                vocabulary.filter(w => w.term.toLowerCase().includes(searchTerm.toLowerCase())).map(word => (
                  <VocabCard
                    key={word.id}
                    word={word}
                    onEdit={(w) => { setEditWord(w); setShowAddModal(true); }}
                    onDelete={(id) => handleDeleteWord(id)}
                    onToggleStar={handleToggleStar}
                  />
                ))
              ) : (
                <div className="col-span-full py-20 text-center glass-effect rounded-[2.5rem] border border-white/5">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-white">{t('common.noWords')}</h3>
                  <p className="text-gray-500 mt-2">{t('common.trySearch')}</p>
                </div>
              )}
            </div>
          </div>
          {/* Fading overlay at the bottom to indicate more content */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 dark:from-[#020617] to-transparent pointer-events-none z-10" />
        </div>
      </main>

      <AddWordModal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditWord(null); }} onSave={handleAddWord} editWord={editWord} />
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImport} />
      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        vocabulary={vocabulary}
        currentSet={currentSet}
        onImport={handleImportExcel}
      />
      <ConfirmDialog isOpen={deleteConfirm.isOpen} title={deleteConfirm.title} message={deleteConfirm.message} onConfirm={confirmDelete} onCancel={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} />

      <ConfirmDialog
        isOpen={autoFillConfirm.isOpen}
        title="Tự động tìm ảnh"
        message={`Phát hiện ${autoFillConfirm.count} từ chưa có ảnh minh họa. Bạn có muốn hệ thống tự động tìm ảnh cho những từ này không?`}
        confirmText="Tìm ngay"
        onConfirm={() => {
          setAutoFillConfirm({ ...autoFillConfirm, isOpen: false });
          processAutoFill();
        }}
        onCancel={() => setAutoFillConfirm({ ...autoFillConfirm, isOpen: false })}
      />

      <DeleteImagesModal
        isOpen={showDeleteImagesModal}
        onClose={() => setShowDeleteImagesModal(false)}
        onConfirm={handleDeleteImages}
        vocabulary={vocabulary}
      />

      <Toaster position="top-center" />
    </div>
  );
}
