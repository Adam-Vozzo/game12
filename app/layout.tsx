import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luma Tide — A Fishing & Exploration Adventure',
  description:
    'Captain a little boat across a luminous 3D archipelago. Catch fish, dive for relics, upgrade your gear, and discover the ocean’s story. Keyboard, gamepad, and touch controls.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
