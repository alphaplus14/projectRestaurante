import React, { useEffect, useId, useRef } from 'react';

const ACCENT_STYLES = {
    violet: {
        focus: 'focus:border-violet-500 focus:ring-violet-500/30',
        filled: 'border-violet-400 dark:border-violet-500/70 bg-violet-50/50 dark:bg-violet-950/20',
        progress: 'bg-violet-600 dark:bg-violet-400',
    },
    amber: {
        focus: 'focus:border-amber-500 focus:ring-amber-500/30',
        filled: 'border-amber-400 dark:border-amber-500/70 bg-amber-50/50 dark:bg-amber-950/20',
        progress: 'bg-amber-600 dark:bg-amber-400',
    },
};

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

/**
 * Input OTP de 6 dígitos: casillas separadas, pegado, autofill móvil y navegación con teclado.
 */
export function TotpSixDigitInput({
    value,
    onChange,
    disabled = false,
    accent = 'violet',
    label = 'Código de 6 dígitos',
    hint = 'Introduce el código que muestra tu app de autenticación.',
    autoFocus = false,
}) {
    const groupId = useId();
    const inputRefs = useRef([]);
    const slots = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

    useEffect(() => {
        if (autoFocus && !disabled) {
            inputRefs.current[0]?.focus();
        }
    }, [autoFocus, disabled]);

    useEffect(() => {
        if (value === '' && !disabled) {
            inputRefs.current[0]?.focus();
        }
    }, [value, disabled]);

    function focusSlot(index) {
        const el = inputRefs.current[index];
        if (el) {
            el.focus();
            el.select();
        }
    }

    function emit(next) {
        onChange(next.replace(/\D/g, '').slice(0, 6));
    }

    function fillFromIndex(startIndex, digits) {
        const arr = slots.slice();
        for (let i = 0; i < digits.length && startIndex + i < 6; i += 1) {
            arr[startIndex + i] = digits[i];
        }
        const next = arr.join('');
        emit(next);
        focusSlot(Math.min(startIndex + digits.length, 5));
    }

    function onSlotChange(index, raw) {
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 0) {
            const arr = slots.slice();
            arr[index] = '';
            emit(arr.join(''));
            return;
        }
        if (digits.length === 1) {
            const arr = slots.slice();
            arr[index] = digits;
            emit(arr.join(''));
            if (index < 5) {
                focusSlot(index + 1);
            }
            return;
        }
        fillFromIndex(index, digits.slice(0, 6 - index));
    }

    function onSlotKeyDown(index, e) {
        if (e.key === 'Backspace') {
            if (slots[index]) {
                return;
            }
            if (index > 0) {
                e.preventDefault();
                const arr = slots.slice();
                arr[index - 1] = '';
                emit(arr.join(''));
                focusSlot(index - 1);
            }
            return;
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            focusSlot(index - 1);
        }
        if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            focusSlot(index + 1);
        }
    }

    function onPaste(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) {
            return;
        }
        emit(pasted);
        focusSlot(Math.min(pasted.length, 5));
    }

    const filledCount = value.length;
    const accentStyles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.violet;

    return (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/50 p-5 space-y-4">
            <div className="space-y-1">
                <p id={groupId} className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                    {label}
                </p>
                {hint ? <p className="text-xs text-stone-500 leading-relaxed">{hint}</p> : null}
            </div>

            {/* Autofill iOS / Android */}
            <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={value}
                disabled={disabled}
                onChange={(e) => emit(e.target.value)}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
            />

            <div
                role="group"
                aria-labelledby={groupId}
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
                onPaste={onPaste}
            >
                {slots.map((digit, index) => {
                    const filled = digit !== '';
                    return (
                        <input
                            key={index}
                            ref={(el) => {
                                inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={6}
                            disabled={disabled}
                            value={digit}
                            aria-label={`Dígito ${index + 1} de 6`}
                            onChange={(e) => onSlotChange(index, e.target.value)}
                            onKeyDown={(e) => onSlotKeyDown(index, e)}
                            onFocus={(e) => e.target.select()}
                            className={classNames(
                                'h-12 w-10 sm:h-14 sm:w-12 rounded-xl border-2 bg-white dark:bg-stone-900',
                                'text-center text-xl sm:text-2xl font-semibold font-mono tabular-nums',
                                'text-stone-900 dark:text-stone-50',
                                'transition-all duration-150',
                                'focus:outline-none focus:ring-4',
                                disabled && 'opacity-50 cursor-not-allowed',
                                filled ? accentStyles.filled : 'border-stone-200 dark:border-stone-700',
                                accentStyles.focus,
                            )}
                        />
                    );
                })}
            </div>

            <div className="flex items-center justify-center gap-1.5" aria-hidden>
                {Array.from({ length: 6 }, (_, i) => (
                    <span
                        key={i}
                        className={classNames(
                            'h-1.5 rounded-full transition-all duration-200',
                            i < filledCount
                                ? classNames('w-5', accentStyles.progress)
                                : 'w-1.5 bg-stone-300 dark:bg-stone-700',
                        )}
                    />
                ))}
            </div>

            <p className="text-center text-[11px] text-stone-400">
                {filledCount === 6 ? 'Código completo — puedes confirmar' : `${filledCount}/6 dígitos`}
            </p>
        </div>
    );
}
