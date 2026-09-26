import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

/**
 * Modal built on the native <dialog> (showModal gives focus trapping, Esc and the top layer).
 * `dismissible` also closes on a backdrop click; turn it off for forms so typing isn't lost.
 */
export function Dialog({ open, onClose, title, description, children, footer, dismissible = true, className }) {
  const ref = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) {
      dialog.showModal();
      // React's autoFocus runs before the dialog is shown, so focus the marked field here.
      dialog.querySelector('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    const handleClose = () => onCloseRef.current?.();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, []);

  // Light-dismiss fallback for browsers without <dialog closedby> (Safari). The panel fills
  // the dialog box, so a click whose target is the <dialog> itself landed on the backdrop.
  const handleClick = (event) => {
    if (dismissible && event.target === event.currentTarget && !('closedBy' in HTMLDialogElement.prototype)) {
      event.currentTarget.close();
    }
  };

  return (
    <dialog
      ref={ref}
      closedby={dismissible ? 'any' : 'closerequest'}
      aria-labelledby={titleId}
      onClick={handleClick}
      className={cn(
        'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 text-left text-slate-900 shadow-2xl',
        'backdrop:bg-slate-950/40 backdrop:backdrop-blur-[2px]',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start gap-4 px-6 pt-6 pb-4">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-black tracking-tight">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => ref.current.close()}>
              <X />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** Confirmation for actions that can't be undone. `onConfirm` may be async. */
export function ConfirmDialog({ open, onClose, title, body, confirmLabel = 'Confirm', tone = 'primary', onConfirm }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Go back
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={confirm} loading={busy} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{body}</p>
    </Dialog>
  );
}
