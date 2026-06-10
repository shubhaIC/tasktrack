import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Sidebar } from '../components/ui/sidebar';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaskTrack',
  description: 'Modern task, course, and meeting management for students and professionals.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.className}>
      <body className="bg-surface text-on-surface">
        <div className="min-h-screen bg-surface">
          <div className="mx-auto flex min-h-screen max-w-[1600px]">
            <Sidebar />
            <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
