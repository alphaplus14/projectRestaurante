import React, { useEffect, useRef } from 'react';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function MasterConfirmModal({
    open,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'default',
    busy = false,
    onConfirm,
    onCancel,
    children,
}) {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return;
        }
        const prev = document.activeElement;
        dialogRef.current?.focus();
        return () => {
            prev?.focus?.();
        };
    }, [open]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-sm"
            role="presentation"
            onClick={onCancel}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="master-confirm-title"
                tabIndex={-1}
                className="w-full max-w-md rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl p-5 space-y-4 outline-none"
                onClick={(e) => e.stopPropagation()}
            >
                <div>
                    <h2 id="master-confirm-title" className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{description}</p>
                    ) : null}
                </div>

                {children ? <div className="text-sm">{children}</div> : null}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onCancel}
                        className="rounded-xl border border-stone-200 dark:border-stone-700 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={onConfirm}
                        className={classNames(
                            'rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50',
                            variant === 'danger'
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-violet-700 hover:bg-violet-600',
                        )}
                    >
                        {busy ? 'Procesando…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
