import { useState } from 'react';

export default function SetSelector({ sets, currentSet, onSelectSet, onCreateSet, onEditSet, onDeleteSet }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSetName, setNewSetName] = useState('');
    const [newSetDescription, setNewSetDescription] = useState('');

    const handleCreate = () => {
        if (newSetName.trim()) {
            onCreateSet(newSetName.trim(), newSetDescription.trim());
            setNewSetName('');
            setNewSetDescription('');
            setShowCreateModal(false);
        }
    };

    return (
        <div className="relative">
            {/* Current Set Display */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-6 py-3 glass-effect rounded-xl hover:bg-white/10 transition-all group"
            >
                <div className="text-left flex-1">
                    <div className="text-sm text-gray-400">Current Set</div>
                    <div className="font-semibold text-white group-hover:text-gradient-primary transition-all">
                        {currentSet?.name || 'No Set Selected'}
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute top-full mt-2 left-0 w-80 glass-effect rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                            {sets.map(set => (
                                <div
                                    key={set.id}
                                    className={`p-4 hover:bg-white/5 transition-all cursor-pointer border-l-4 ${set.id === currentSet?.id
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-transparent'
                                        }`}
                                    onClick={() => {
                                        onSelectSet(set.id);
                                        setShowDropdown(false);
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-semibold text-white">{set.name}</div>
                                            {set.description && (
                                                <div className="text-sm text-gray-400 mt-1">{set.description}</div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-2">
                                                {set.words?.length || 0} words
                                            </div>
                                        </div>
                                        {sets.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteSet(set.id);
                                                }}
                                                className="ml-2 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-white/10 p-3">
                            <button
                                onClick={() => {
                                    setShowDropdown(false);
                                    setShowCreateModal(true);
                                }}
                                className="w-full px-4 py-3 bg-gradient-primary rounded-lg font-semibold text-white hover:shadow-lg transition-all"
                            >
                                ➕ Create New Set
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Create Set Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-effect rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gradient-primary mb-6">Create New Set</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Set Name *
                                </label>
                                <input
                                    type="text"
                                    value={newSetName}
                                    onChange={(e) => setNewSetName(e.target.value)}
                                    placeholder="e.g., IELTS Vocabulary"
                                    className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={newSetDescription}
                                    onChange={(e) => setNewSetDescription(e.target.value)}
                                    placeholder="What is this set about?"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewSetName('');
                                    setNewSetDescription('');
                                }}
                                className="flex-1 px-6 py-3 glass-effect rounded-xl font-semibold hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newSetName.trim()}
                                className="flex-1 px-6 py-3 bg-gradient-primary rounded-xl font-semibold text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
