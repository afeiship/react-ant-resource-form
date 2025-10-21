import { useEffect } from 'react';

export const useKeyboardSave = (callback: (e: KeyboardEvent) => void) => {
  const handler = function (e: KeyboardEvent) {
    // 检查是否按下了 Ctrl+S (Windows/Linux) 或 Cmd+S (macOS)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      callback(e);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);
};
