import './globals.css'; // Assuming a global stylesheet
import { Sidebar } from '../components/Sidebar';

export const metadata = {
  title: 'SoulState: The Zero-Overhead State of Mind',
  description: 'Effortless, scalable, and high-performance state management for modern web applications.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
