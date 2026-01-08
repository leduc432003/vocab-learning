/**
 * Export words to TXT file (pipe-separated format)
 * @param {Array} words - Array of word objects
 * @param {string} setName - Name of the word set
 */
export const exportToTxt = (words, setName = 'vocabulary') => {
    try {
        // Create header
        const header = 'Term | Meaning | Phonetic | Type | Level | Topic | Example | Example Meaning | Synonym | Antonym | Collocation | Note | Image URL';

        // Create data rows
        const rows = words.map(word => {
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
        });

        // Combine header and rows
        const content = [header, ...rows].join('\n');

        // Create and download file
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const fileName = `${setName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.txt`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, message: `Exported ${words.length} words to TXT successfully!` };
    } catch (error) {
        console.error('Export TXT error:', error);
        return { success: false, message: 'Failed to export TXT: ' + error.message };
    }
};

/**
 * Import words from TXT file (pipe-separated format)
 * @param {File} file - TXT file
 * @returns {Promise<Array>} - Array of word objects
 */
export const importFromTxt = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const lines = content.split('\n').filter(line => line.trim());

                if (lines.length === 0) {
                    reject(new Error('File is empty'));
                    return;
                }

                // Skip header if it exists
                const startIndex = lines[0].toLowerCase().includes('term') ? 1 : 0;
                const dataLines = lines.slice(startIndex);

                // Parse each line
                const words = dataLines.map(line => {
                    const parts = line.split('|').map(p => p.trim());

                    return {
                        term: parts[0] || '',
                        definition: parts[1] || '',
                        phonetic: parts[2] || '',
                        type: parts[3] || '',
                        level: parts[4] || '',
                        topic: parts[5] || '',
                        example: parts[6] || '',
                        example_definition: parts[7] || '',
                        synonym: parts[8] || '',
                        antonym: parts[9] || '',
                        collocation: parts[10] || '',
                        note: parts[11] || '',
                        image: parts[12] || '',
                        srs_stage: 'new',
                        starred: false,
                    };
                });

                // Filter out empty rows
                const validWords = words.filter(word => word.term && word.definition);

                if (validWords.length === 0) {
                    reject(new Error('No valid words found. Make sure each line has at least Term and Meaning.'));
                } else {
                    resolve(validWords);
                }
            } catch (error) {
                console.error('Import TXT error:', error);
                reject(new Error('Failed to parse TXT file: ' + error.message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file, 'UTF-8');
    });
};
