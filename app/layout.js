import './globals.css';

export const metadata = {
  title: 'hlpr — Find your class',
  description: 'Find your class. Find your people.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
