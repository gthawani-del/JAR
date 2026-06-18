'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
export function ThemeToggle(){const{theme,setTheme}=useTheme();return <button aria-label="Toggle theme" className="icon-ring" onClick={()=>setTheme(theme==='dark'?'light':'dark')}><Sun className="h-4 w-4 dark:hidden"/><Moon className="hidden h-4 w-4 dark:block"/></button>}
