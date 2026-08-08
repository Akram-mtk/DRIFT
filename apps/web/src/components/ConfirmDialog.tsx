import { useEffect, useRef, useState } from 'react';

interface ConfirmDialogProps {
  title: string;
  body?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/** Blocks a destructive action until it is deliberately confirmed. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus lands on Cancel, not the destructive button, so a stray Enter
    // dismisses rather than deletes.
    cancelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="sheet-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="sheet confirm" role="alertdialog" aria-modal="true">
        <h2 className="confirm-title">{title}</h2>
        {body && <p className="confirm-body">{body}</p>}
        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn--quiet"
            onClick={onCancel}
            ref={cancelRef}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={confirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
