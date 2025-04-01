
import { UIActions } from './types';

export const uiActions = (set: any, get: any): UIActions => ({
  toggleTheme: () => {
    set((state: any) => ({
      theme: state.theme === 'light' ? 'dark' : 'light'
    }));
    
    // Update document class for theme
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(get().theme);
  }
});
