import { JetBrains_Mono } from 'next/font/google'
import ClientRoot from './components/ClientRoot'
import './globals.css'
import { SITE_NAME } from '../lib/site'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  metadataBase: new URL('https://alander.io'),
  title: SITE_NAME,
  description: 'Product designer and engineer.',
  openGraph: {
    title: SITE_NAME,
    description: 'Product designer and engineer.',
    url: 'https://alander.io',
    siteName: SITE_NAME,
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  )
}
