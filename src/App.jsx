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
        onExit={() => setCurrentMode('browse')}
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
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-b border-white/10 py-6 md:py-8 mb-4 md:mb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
            <div className="flex-1 w-full">
              <h1 className="text-3xl md:text-5xl font-extrabold text-gradient-primary mb-2">
                📚 VocabMaster Pro
              </h1>
              <p className="text-gray-400 text-sm md:text-lg">
                Master your vocabulary with advanced learning modes
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 w-full md:w-auto">
              <div className="w-full sm:w-auto">
                <SetSelector
                  sets={sets}
                  currentSet={currentSet}
                  onSelectSet={handleSelectSet}
                  onCreateSet={handleCreateSet}
                  onDeleteSet={handleDeleteSet}
                />
              </div>

              <div className="grid grid-cols-2 xs:flex sm:flex gap-3 md:gap-4 w-full sm:w-auto">
                <div className="glass-effect rounded-2xl px-3 md:px-4 py-2 md:py-3 text-center min-w-[70px] border-red-500/20">
                  <div className="text-lg md:text-xl font-bold text-red-500">
                    {statusCounts.notLearned}
                  </div>
                  <div className="text-gray-500 text-[8px] md:text-[10px] uppercase tracking-wide mt-1 font-bold">
                    Chưa học
                  </div>
                </div>
                <div className="glass-effect rounded-2xl px-3 md:px-4 py-2 md:py-3 text-center min-w-[70px] border-yellow-500/20">
                  <div className="text-lg md:text-xl font-bold text-yellow-500">
                    {statusCounts.learning}
                  </div>
                  <div className="text-gray-500 text-[8px] md:text-[10px] uppercase tracking-wide mt-1 font-bold">
                    Đang học
                  </div>
                </div>
                <div className="glass-effect rounded-2xl px-3 md:px-4 py-2 md:py-3 text-center min-w-[70px] border-green-500/20">
                  <div className="text-lg md:text-xl font-bold text-green-500">
                    {statusCounts.learned}
                  </div>
                  <div className="text-gray-500 text-[8px] md:text-[10px] uppercase tracking-wide mt-1 font-bold">
                    Đã học
                  </div>
                </div>
                <div className="glass-effect rounded-2xl px-3 md:px-4 py-2 md:py-3 text-center min-w-[70px] border-primary-500/20">
                  <div className="text-lg md:text-xl font-bold text-primary-500">
                    {vocabulary.filter(w => w.starred).length}
                  </div>
                  <div className="text-gray-500 text-[8px] md:text-[10px] uppercase tracking-wide mt-1 font-bold">
                    Starred
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        {/* Study Modes Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📖 Study Modes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              onClick={() => setCurrentMode('flashcards')}
              disabled={vocabulary.length === 0}
              className="p-6 glass-effect rounded-xl hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎴</div>
              <div className="font-semibold">Flashcards</div>
              <div className="text-xs text-gray-500 mt-1">Flip & Learn</div>
            </button>

            <button
              onClick={() => setCurrentMode('learn')}
              disabled={vocabulary.length === 0}
              className="p-6 glass-effect rounded-xl hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎓</div>
              <div className="font-semibold">Learn</div>
              <div className="text-xs text-gray-500 mt-1">Smart Study</div>
            </button>

            <button
              onClick={() => setCurrentMode('write')}
              disabled={vocabulary.length === 0}
              className="p-6 glass-effect rounded-xl hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">✍️</div>
              <div className="font-semibold">Write</div>
              <div className="text-xs text-gray-500 mt-1">Type Answer</div>
            </button>

            <button
              onClick={() => setCurrentMode('review')}
              disabled={vocabulary.filter(w => w.learningStatus === 'learned').length === 0}
              className="p-6 glass-effect rounded-xl hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🔄</div>
              <div className="font-semibold">Review</div>
              <div className="text-xs text-gray-500 mt-1">Learned Words</div>
            </button>

            <button
              onClick={() => setCurrentMode('spell')}
              disabled={vocabulary.length === 0}
              className="p-6 glass-effect rounded-xl hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🔊</div>
              <div className="font-semibold">Spell</div>
              <div className="text-xs text-gray-500 mt-1">Listen & Type</div>
            </button>

            <button
              onClick={() => setCurrentMode('match')}
              disabled={vocabulary.length < 2}
              className="p-6 glass-effect rounded-xl hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🎮</div>
              <div className="font-semibold">Match</div>
              <div className="text-xs text-gray-500 mt-1">Timed Game</div>
            </button>

            <button
              onClick={() => setCurrentMode('test')}
              disabled={vocabulary.length < 4}
              className="p-6 glass-effect rounded-xl hover:bg-white/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📝</div>
              <div className="font-semibold">Test</div>
              <div className="text-xs text-gray-500 mt-1">Quiz Mode</div>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-6 mb-8 flex-wrap items-center">
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              className="w-full px-6 py-4 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="🔍 Search vocabulary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              className="px-6 py-4 bg-gradient-primary rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all"
              onClick={() => setShowAddModal(true)}
            >
              ➕ Add Word
            </button>
            <button
              className="px-6 py-4 glass-effect rounded-xl font-semibold hover:bg-white/10 hover:border-primary-500/50 transition-all"
              onClick={() => setShowImportModal(true)}
            >
              📥 Import
            </button>
          </div>
        </div>

        {/* Vocabulary Cards */}
        {filteredVocabulary.length === 0 ? (
          <div className="text-center py-20 max-w-2xl mx-auto">
            <div className="text-8xl mb-8 animate-pulse">📖</div>
            <h2 className="text-4xl font-bold text-gradient-primary mb-4">
              {searchTerm ? 'No matches found' : 'No vocabulary yet'}
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              {searchTerm
                ? 'Try a different search term'
                : 'Start building your vocabulary by adding words or importing a list!'}
            </p>
            {!searchTerm && (
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  className="px-8 py-4 bg-gradient-primary rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all"
                  onClick={() => setShowAddModal(true)}
                >
                  Add Your First Word
                </button>
                <button
                  className="px-8 py-4 glass-effect rounded-xl font-semibold hover:bg-white/10 transition-all"
                  onClick={() => setShowImportModal(true)}
                >
                  Import Words
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        )}
      </main>

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
        cancelText="Để sau"
      />
    </div>
  );
}

export default App;
