import { Providers } from './Providers'
import { ColorModeScript } from "@chakra-ui/react"
import theme from "@/styles/theme"
import { Metadata } from 'next'
import Analytics from '@/components/Analytics'

export const metadata: Metadata = {
  title: 'Proper Shopper',
  description: 'The proper way to track your grocery shopping.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon-48x48.png" sizes="48x48" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Proper Shopper" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Providers>
          <Analytics />
          {children}
        </Providers>
      </body>
    </html>
  )
}