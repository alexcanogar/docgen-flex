import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Docgen flex',
  description: 'Crea facturas, recibos, presupuestos o lo que se te ocurra, con total libertad de edición'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
