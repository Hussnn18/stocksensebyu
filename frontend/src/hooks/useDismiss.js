import { useEffect } from 'react';

/** Closes a dropdown when the user clicks outside `ref` or presses Escape. */
export function useDismiss(open, onDismiss, ref) {
  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onDismiss();
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onDismiss, ref]);
}
