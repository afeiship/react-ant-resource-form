import { useEffect, useCallback } from 'react';

export const useKeyboardSave = (callback: (e: KeyboardEvent) => void) => {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      // 使用 code 更可靠（不受键盘布局或大小写影响）
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault();
        callback(e);
      }
    },
    [callback] // 确保 handler 随 callback 更新而更新
  );

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [handler]); // handler 是 useCallback 包装的，稳定依赖
};
