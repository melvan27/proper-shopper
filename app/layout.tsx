import { Providers } from './Providers'
import { ColorModeScript } from "@chakra-ui/react"
import theme from "@/styles/theme"
import { Metadata } from 'next'

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
      <body>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}