import './globals.css'

export const metadata = {
  title: 'REM Waste Management',
  description: 'Professional waste management solutions for UK businesses',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}