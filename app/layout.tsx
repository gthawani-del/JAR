import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
export const metadata: Metadata = { title: 'JAR Advisory', description: 'Strategic advisory, intelligence and AI solutions for regulated and high-stakes environments.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body><ThemeProvider><SiteHeader/><main>{children}</main><SiteFooter/></ThemeProvider></body></html>}
