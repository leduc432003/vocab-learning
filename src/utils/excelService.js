import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export words to Excel file
 * @param {Array} words - Array of word objects
 * @param {string} setName - Name of the word set
 */
export const exportToExcel = (words, setName = 'vocabulary') => {
    try {
        // Prepare data for Excel - 13 fields only
        const excelData = words.map((word, index) => ({
            'STT': index + 1,
            'Term': word.term || '',
            'Meaning': word.definition || '',
            'Phonetic': word.phonetic || '',
            'Type': word.type || '',
            'Level': word.level || '',
            'Topic': word.topic || '',
            'Example': word.example || '',
            'Example Meaning': word.example_definition || '',
            'Synonym': word.synonym || '',
            'Antonym': word.antonym || '',
            'Collocation': word.collocation || '',
            'Note': word.note || '',
            'Image URL': word.image || '',
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const columnWidths = [
            { wch: 5 },  // STT
            { wch: 20 }, // Term
            { wch: 30 }, // Meaning
            { wch: 20 }, // Phonetic
            { wch: 15 }, // Type
            { wch: 10 }, // Level
            { wch: 15 }, // Topic
            { wch: 40 }, // Example
            { wch: 30 }, // Example Meaning
            { wch: 20 }, // Synonym
            { wch: 20 }, // Antonym
            { wch: 25 }, // Collocation
            { wch: 25 }, // Note
            { wch: 30 }, // Image URL
        ];
        worksheet['!cols'] = columnWidths;

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Vocabulary');

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Download file
        const fileName = `${setName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        saveAs(blob, fileName);

        return { success: true, message: `Exported ${words.length} words successfully!` };
    } catch (error) {
        console.error('Export error:', error);
        return { success: false, message: 'Failed to export: ' + error.message };
    }
};

/**
 * Import words from Excel file
 * @param {File} file - Excel file
 * @returns {Promise<Array>} - Array of word objects
 */
export const importFromExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Map to word objects - 13 fields
                const words = jsonData.map((row) => ({
                    term: row['Term'] || row['term'] || '',
                    definition: row['Meaning'] || row['meaning'] || row['Definition'] || row['definition'] || '',
                    phonetic: row['Phonetic'] || row['phonetic'] || '',
                    type: row['Type'] || row['type'] || '',
                    level: row['Level'] || row['level'] || '',
                    topic: row['Topic'] || row['topic'] || '',
                    example: row['Example'] || row['example'] || '',
                    example_definition: row['Example Meaning'] || row['example_meaning'] || row['Example Definition'] || '',
                    synonym: row['Synonym'] || row['synonym'] || '',
                    antonym: row['Antonym'] || row['antonym'] || '',
                    collocation: row['Collocation'] || row['collocation'] || '',
                    note: row['Note'] || row['note'] || '',
                    image: row['Image URL'] || row['image'] || '',
                    srs_stage: 'new',
                    starred: false,
                }));

                // Filter out empty rows
                const validWords = words.filter(word => word.term && word.definition);

                if (validWords.length === 0) {
                    reject(new Error('No valid words found in the file. Make sure columns "Term" and "Meaning" are filled.'));
                } else {
                    resolve(validWords);
                }
            } catch (error) {
                console.error('Import error:', error);
                reject(new Error('Failed to parse Excel file: ' + error.message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * Download Excel template
 */
export const downloadTemplate = () => {
    const templateData = [
        {
            'STT': 1,
            'Term': 'apple',
            'Meaning': 'quả táo',
            'Phonetic': '/ˈæp.əl/',
            'Type': 'noun',
            'Level': 'A1',
            'Topic': 'food',
            'Example': 'I eat an apple every day.',
            'Example Meaning': 'Tôi ăn một quả táo mỗi ngày.',
            'Synonym': '',
            'Antonym': '',
            'Collocation': 'red apple, green apple',
            'Note': 'Common fruit',
            'Image URL': '',
        },
        {
            'STT': 2,
            'Term': 'beautiful',
            'Meaning': 'đẹp',
            'Phonetic': '/ˈbjuː.tɪ.fəl/',
            'Type': 'adjective',
            'Level': 'A2',
            'Topic': 'appearance',
            'Example': 'She is a beautiful girl.',
            'Example Meaning': 'Cô ấy là một cô gái xinh đẹp.',
            'Synonym': 'pretty, gorgeous',
            'Antonym': 'ugly',
            'Collocation': 'beautiful day, beautiful view',
            'Note': '',
            'Image URL': '',
        },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 15 },
        { wch: 10 }, { wch: 15 }, { wch: 40 }, { wch: 30 }, { wch: 20 },
        { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(blob, 'vocabulary_template.xlsx');
};
