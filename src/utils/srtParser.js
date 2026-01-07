export const parseSRT = (srtText) => {
    if (!srtText) return [];

    // Normalize line endings and split by empty lines
    const blocks = srtText.trim().replace(/\r\n/g, '\n').split('\n\n');
    const segments = [];

    const timeToSeconds = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes, secondsAndMillis] = timeStr.split(':');
        const [seconds, millis] = secondsAndMillis.split(',');
        return (
            parseInt(hours) * 3600 +
            parseInt(minutes) * 60 +
            parseInt(seconds) +
            parseInt(millis) / 1000
        );
    };

    blocks.forEach(block => {
        const lines = block.split('\n');
        if (lines.length >= 3) {
            const id = lines[0];
            const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);

            if (timeMatch) {
                const start = timeToSeconds(timeMatch[1]);
                const end = timeToSeconds(timeMatch[2]);
                const text = lines.slice(2).join(' ').trim();

                segments.push({ id, start, end, text });
            }
        }
    });

    return segments;
};
