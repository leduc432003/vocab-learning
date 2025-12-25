import { useState, useEffect } from 'react';
import { storage } from './utils/localStorage';
import VocabCard from './components/VocabCard';
import AddWordModal from './components/AddWordModal';
import ImportModal from './components/ImportModal';
import SetSelector from './components/SetSelector';
import FlashcardsMode from './components/FlashcardsMode';
import LearnMode from './components/LearnMode';
import WriteMode from './components/WriteMode';
import SpellMode from './components/SpellMode';
import MatchMode from './components/MatchMode';
import TestMode from './components/TestMode';
import ConfirmDialog from './components/ConfirmDialog';

function App() {
  const [vocabulary, setVocabulary] = useState([]);
  const [sets, setSets] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [statusCounts, setStatusCounts] = useState({ notLearned: 0, learning: 0, learned: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editWord, setEditWord] = useState(null);
  const [currentMode, setCurrentMode] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, title: '', message: '' });
  const [theme, setTheme] = useState(() => storage.getTheme());

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allSets = storage.getSets();
    const current = storage.getCurrentSet();
    const counts = storage.getStatusCounts();
    setSets(allSets);
    setCurrentSet(current);
    setVocabulary(current?.words || []);
    setStatusCounts(counts);
  };

  const handleSelectSet = (setId) => {
    storage.setCurrentSet(setId);
    loadData();
  };

  const handleCreateSet = (name, description) => {
    storage.createSet(name, description);
    loadData();
  };

  const handleDeleteSet = (setId) => {
    const set = sets.find(s => s.id === setId);
    setDeleteConfirm({
      isOpen: true,
      type: 'set',
      id: setId,
      title: 'Xóa bộ từ vựng',
      message: `Bạn có chắc chắn muốn xóa bộ từ "${set?.name}"? Hành động này không thể hoàn tác.`
    });
  };

  const confirmDelete = () => {
    if (deleteConfirm.type === 'word') {
      storage.deleteWord(deleteConfirm.id);
    } else if (deleteConfirm.type === 'set') {
      storage.deleteSet(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', message: '' });
    loadData();
  };

  const handleAddWord = (wordData) => {
    if (editWord) {
      storage.updateWord(editWord.id, wordData);
      setEditWord(null);
    } else {
      storage.addWord(wordData);
    }
    loadData();
  };

  const handleEditWord = (word) => {
    setEditWord(word);
    setShowAddModal(true);
  };

  const handleDeleteWord = (id) => {
    const word = vocabulary.find(w => w.id === id);
    setDeleteConfirm({
      isOpen: true,
      type: 'word',
      id: id,
      title: 'Xóa từ vựng',
      message: `Bạn có chắc chắn muốn xóa từ "${word?.term}" khỏi bộ này?`
    });
  };

  const handleToggleStar = (id) => {
    storage.toggleStar(id);
    loadData();
  };

  const handleImport = (words) => {
    storage.importWords(words);
    loadData();
  };

  const handleUpdateStats = (id, isCorrect, mode) => {
    storage.updateStats(id, isCorrect, mode);
    loadData();
  };

  const handleExport = () => {
    if (vocabulary.length === 0) {
      alert('Không có từ vựng nào để xuất!');
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
        word.exampleDefinition || '',
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
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditWord(null);
  };

  const filteredVocabulary = vocabulary.filter(word =>
    word.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render different modes
  if (currentMode === 'flashcards') {
    return (
      <FlashcardsMode
        vocabulary={vocabulary}
        onUpdateStats={handleUpdateStats}
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
        onUpdateStats={handleUpdateStats}
        onExit={() => setCurrentMode('browse')}
      />
    );
  }

  if (currentMode === 'review') {
    const learnedWords = vocabulary.filter(w => w.learningStatus === 'learned');
    return (
      <LearnMode
        vocabulary={learnedWords}
        onUpdateStats={handleUpdateStats}
        onExit={() => setCurrentMode('browse')}
        isReview={true}
      />
    );
  }

  if (currentMode === 'write') {
    return (
      <WriteMode
        vocabulary={vocabulary}
        onUpdateStats={handleUpdateStats}
        onExit={() => setCurrentMode('browse')}
      />
    );
  }

  if (currentMode === 'spell') {
    return (
      <SpellMode
        vocabulary={vocabulary}
        onUpdateStats={handleUpdateStats}
        onExit={() => setCurrentMode('browse')}
      />
    );
  }

  if (currentMode === 'match') {
    return (
      <MatchMode
        vocabulary={vocabulary}
        onExit={() => setCurrentMode('browse')}
      />
    );
  }

  if (currentMode === 'test') {
    return (
      <TestMode
        vocabulary={vocabulary}
        onUpdateStats={handleUpdateStats}
        onExit={() => setCurrentMode('browse')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#020617] transition-colors duration-300">
      {/* Header - Optimized for Mobile Header */}
      <header className="bg-gradient-to-b from-primary-100/50 dark:from-primary-900/20 to-transparent border-b border-gray-200 dark:border-white/5 pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-8">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                  Học từ vựng cùng <span className="text-primary-600 dark:text-primary-500">Đức</span>
                </h1>
                <p className="text-gray-500 font-medium text-sm md:text-base">Học tiếng Anh thông minh hơn mỗi ngày</p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={toggleTheme}
                  className="p-3 bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-sm"
                  title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
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

            {/* Dashboard Stats - Premium Card Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 w-full">
              {[
                { label: 'Chưa học', val: statusCounts.notLearned, color: 'blue', icon: '🆕' },
                { label: 'Đang học', val: statusCounts.learning, color: 'amber', icon: '⚡' },
                { label: 'Tốt nghiệp', val: statusCounts.learned, color: 'emerald', icon: '🎓' },
                { label: 'Đến hạn', val: statusCounts.due, color: 'rose', icon: '📅' }
              ].map((stat, i) => (
                <div key={i} className="glass-effect rounded-[2rem] p-4 md:p-6 border border-white/10 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-${stat.color}-500/10 transition-colors`}></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                      <div className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{stat.label}</div>
                      <div className={`text-2xl md:text-4xl font-black text-${stat.color}-600 dark:text-${stat.color}-500`}>{stat.val}</div>
                    </div>
                    <div className="text-2xl md:text-3xl opacity-20 group-hover:opacity-40 transition-opacity">{stat.icon}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-32">
        {/* Study Modes Section - Horizontal Scroll on Mobile */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-primary-600 dark:bg-primary-500 rounded-full"></span>
              Chế độ học tập
            </h2>
          </div>

          <div className="flex overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {[
              { id: 'flashcards', label: 'Flashcards', icon: '🎴', desc: 'Chuẩn Anki', color: 'indigo', count: vocabulary.length },
              { id: 'learn', label: 'Học thông minh', icon: '🎓', desc: 'Trắc nghiệm', color: 'blue', count: vocabulary.length },
              { id: 'write', label: 'Viết từ', icon: '✍️', desc: 'Ghi nhớ sâu', color: 'purple', count: vocabulary.length },
              { id: 'review', label: 'Ôn tập', icon: '🔄', desc: 'Từ đã thuộc', color: 'emerald', count: vocabulary.filter(w => w.learningStatus === 'learned').length },
              { id: 'spell', label: 'Chính tả', icon: '🔊', desc: 'Nghe & Viết', color: 'amber', count: vocabulary.length },
              { id: 'test', label: 'Kiểm tra', icon: '📝', desc: 'Tổng kết', color: 'rose', count: vocabulary.length }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setCurrentMode(mode.id)}
                disabled={mode.count === 0}
                className="flex-shrink-0 w-[160px] md:w-full p-6 glass-effect rounded-[2rem] hover:bg-white/10 transition-all group disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 hover:border-white/20 shadow-xl"
              >
                <div className="text-4xl mb-3 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">{mode.icon}</div>
                <div className="font-black text-gray-900 dark:text-white text-lg tracking-tight leading-tight mb-1">{mode.label}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar - Desktop & Tab */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
              🔍
            </div>
            <input
              type="text"
              className="w-full pl-16 pr-6 py-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium text-lg shadow-sm dark:shadow-none"
              placeholder="Tìm kiếm từ vựng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden md:flex gap-3">
            <button
              className="px-8 py-5 bg-white text-black rounded-3xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
              onClick={() => setShowAddModal(true)}
            >
              + Thêm từ
            </button>
            <button
              className="px-8 py-5 glass-effect rounded-3xl font-black hover:bg-gray-50 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
              onClick={() => setShowImportModal(true)}
            >
              📥 Nhập
            </button>
            <button
              className="px-8 py-5 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 rounded-3xl font-black hover:bg-secondary-500/20 transition-all"
              onClick={handleExport}
            >
              📤 Xuất
            </button>
          </div>
        </div>

        {/* Vocabulary Grid */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-gray-500 font-black text-xs uppercase tracking-[0.2em]">
            Danh sách ({filteredVocabulary.length} từ)
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-primary-400 text-xs font-bold hover:underline">Xóa lọc</button>
          )}
        </div>

        {filteredVocabulary.length === 0 ? (
          <div className="text-center py-20 px-8 glass-effect rounded-[3rem] border border-gray-200 dark:border-white/5">
            <div className="text-8xl mb-8 animate-bounce-slow">📖</div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Chưa có từ nào được tìm thấy</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-10 leading-relaxed font-medium">Bắt đầu hành trình chinh phục tiếng Anh bằng cách thêm từ vựng mới!</p>
            <button
              className="px-10 py-5 bg-gradient-primary rounded-3xl font-black text-white shadow-2xl shadow-primary-500/40 hover:scale-105 transition-all"
              onClick={() => setShowAddModal(true)}
            >
              Thêm từ đầu tiên ngay
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[850px] custom-scrollbar pr-4 -mr-4 pb-4 px-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
              {filteredVocabulary.map(word => (
                <VocabCard
                  key={word.id}
                  word={word}
                  onEdit={handleEditWord}
                  onDelete={handleDeleteWord}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Floating Action Buttons */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex md:hidden gap-3 px-4 w-full justify-center z-40">
        <button
          className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black shadow-2xl active:scale-95 transition-all text-sm"
          onClick={() => setShowAddModal(true)}
        >
          + Thêm từ
        </button>
        <button
          className="px-6 py-4 glass-effect rounded-2xl font-black shadow-2xl active:scale-95 transition-all border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm"
          onClick={() => setShowImportModal(true)}
        >
          📥
        </button>
        <button
          className="px-6 py-4 bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 rounded-2xl font-black shadow-2xl active:scale-95 transition-all text-sm"
          onClick={handleExport}
        >
          📤
        </button>
      </div>

      <AddWordModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSave={handleAddWord}
        editWord={editWord}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        confirmText="Xóa ngay"
        cancelText="Hủy bỏ"
      />

      {/* Global Style Injections */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.7); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}} />
    </div>
  );
}

export default App;
