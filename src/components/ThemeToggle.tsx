import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-colors ${theme === 'light' ? 'bg-white dark:bg-gray-600 shadow-sm text-amber-500' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        title="Mode Terang"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-colors ${theme === 'system' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-500' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        title="Ikuti Sistem"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        title="Mode Gelap"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
