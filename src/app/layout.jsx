import './globals.css';

export const metadata = {
    title: 'Vocab Learning App',
    description: 'Learn English vocabulary efficiently with Spaced Repetition',
};

import DictionaryPopup from '../components/DictionaryPopup';

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                {children}
                <DictionaryPopup />
            </body>
        </html>
    );
}
