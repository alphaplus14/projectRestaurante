import React, { useState } from 'react';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

function EyeIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1 1 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    );
}

function EyeOffIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639a10.496 10.496 0 0 1-1.022 2.093M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
            />
        </svg>
    );
}

const MARGIN_CLASS = /^-?m[trblxy]?-/;

function splitMarginClasses(className) {
    const tokens = String(className || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    const margin = tokens.filter((t) => MARGIN_CLASS.test(t));
    const input = tokens.filter((t) => !MARGIN_CLASS.test(t));

    return {
        marginClass: margin.join(' '),
        inputClass: input.join(' '),
    };
}

/**
 * Campo de contraseña con botón mostrar/ocultar.
 * Acepta las mismas props que <input> (excepto type).
 */
export function PasswordInput({ className, wrapperClassName, toggleClassName, disabled, ...inputProps }) {
    const [visible, setVisible] = useState(false);
    const { marginClass, inputClass } = splitMarginClasses(className);

    return (
        <div className={classNames(marginClass, wrapperClassName)}>
            <div className="relative">
                <input
                    {...inputProps}
                    disabled={disabled}
                    type={visible ? 'text' : 'password'}
                    className={classNames(inputClass, 'password-input-field pr-11')}
                />
                <button
                    type="button"
                    disabled={disabled}
                    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={visible}
                    onClick={() => setVisible((v) => !v)}
                    className={classNames(
                        'absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg',
                        'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/80',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        toggleClassName,
                    )}
                >
                    {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
}
