"use client";

import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';
import { fillMissingImages } from '../utils/imageService';
import Auth from '../components/Auth';
import VocabCard from '../components/VocabCard';
import AddWordModal from '../components/AddWordModal';
import ImportModal from '../components/ImportModal';
import SetSelector from '../components/SetSelector';
import FlashcardsMode from '../components/FlashcardsMode';
import LearnMode from '../components/LearnMode';
import WriteMode from '../components/WriteMode';
import SpellMode from '../components/SpellMode';
import MatchMode from '../components/MatchMode';
import TestMode from '../components/TestMode';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Page() {
  const [session, setSession] = useState(null);
  const [vocabulary, setVocabulary] = useState([]);
  const [sets, setSets] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [statusCounts, setStatusCounts] = useState({ notLearned: 0, learning: 0, learned: 0, due: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editWord, setEditWord] = useState(null);
  const [currentMode, setCurrentMode] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, title: '', message: '' });
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
    else toast.success('Đã đăng xuất');
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
        vocabulary={currentMode === 'review' ? dueWords : vocabulary}
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] transition-colors duration-300">
      <header className="bg-gradient-to-b from-primary-100/50 dark:from-primary-900/20 to-transparent border-b border-gray-200 dark:border-white/5 pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                  Chào, <span className="text-primary-600 dark:text-primary-500">{profile?.username || 'Bạn'}</span>
                </h1>
                <p className="text-gray-500 font-medium text-sm md:text-base">Dữ liệu được đồng bộ hóa với Supabase Cloud</p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={handleLogout}
                  className="p-3 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all shadow-sm"
                  title="Đăng xuất"
                >
                  🚪
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
                { label: 'Chưa học', val: statusCounts.notLearned, color: 'blue', icon: '🆕' },
                { label: 'Đang học', val: statusCounts.learning, color: 'amber', icon: '⚡' },
                { label: 'Thành thạo', val: statusCounts.learned, color: 'emerald', icon: '🎓' },
                { label: 'Đến hạn', val: statusCounts.due, color: 'rose', icon: '📅' }
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
            { id: 'flashcards', label: 'Flashcards', icon: '🎴', desc: 'Chuẩn Anki' },
            { id: 'learn', label: 'Học ngay', icon: '🎓', desc: 'Khởi đầu' },
            { id: 'write', label: 'Luyện viết', icon: '✍️', desc: 'Ghi nhớ sâu' },
            { id: 'review', label: 'Ôn tập', icon: '🔄', desc: 'Đến hạn' },
            { id: 'spell', label: 'Chính tả', icon: '🎧', desc: 'Nghe & Viết' },
            { id: 'test', label: 'Kiểm tra', icon: '📝', desc: 'Tổng kết' }
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
            placeholder="Tìm kiếm từ vựng..."
            className="w-full md:flex-1 px-6 md:px-8 py-4 md:py-5 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl text-white outline-none focus:border-primary-500 transition-all text-sm md:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-center overflow-x-auto no-scrollbar gap-2 md:gap-4 pb-2 md:pb-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 md:px-10 py-4 md:py-5 bg-white text-black rounded-2xl md:rounded-3xl font-black hover:scale-105 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap shrink-0"
            >
              <span>+ Thêm từ</span>
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
              onClick={() => setShowImportModal(true)}
              className="px-4 md:px-8 py-4 md:py-5 glass-effect rounded-2xl md:rounded-3xl font-black hover:bg-white/10 transition-all border border-white/10 text-white text-sm md:text-base whitespace-nowrap shrink-0"
              title="Nhập dữ liệu"
            >
              📥 <span className="hidden md:inline">Nhập</span>
            </button>
            <button
              onClick={handleExport}
              className="px-4 md:px-8 py-4 md:py-5 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 rounded-2xl md:rounded-3xl font-black hover:bg-secondary-500/20 transition-all text-sm md:text-base whitespace-nowrap shrink-0"
              title="Xuất dữ liệu"
            >
              📤 <span className="hidden md:inline">Xuất</span>
            </button>
          </div>
        </div>

        {/* Vocabulary Grid - Restricted Height with Scroll */}
        <div className="relative">
          <div className="max-h-[700px] md:max-h-[850px] overflow-y-auto no-scrollbar pb-10">
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
                  <h3 className="text-xl font-bold text-white">Không tìm thấy từ vựng nào</h3>
                  <p className="text-gray-500 mt-2">Thử tìm kiếm với từ khóa khác hoặc thêm từ mới</p>
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

      <Toaster position="top-center" />
    </div>
  );
}
