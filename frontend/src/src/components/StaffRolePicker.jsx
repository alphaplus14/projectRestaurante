import React from 'react';
import { STAFF_ROLE_ORDER, STAFF_ROLES } from '../auth/staffLogin';
import { StaffRoleIcon } from './StaffRoleIcons';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

export function StaffRolePicker({ value, onChange, disabled = false }) {
    return (
        <fieldset className="space-y-3" disabled={disabled}>
            <legend className="text-sm font-medium text-stone-700 dark:text-stone-200">
                ¿Cuál es tu área de trabajo?
            </legend>
            <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                role="radiogroup"
                aria-label="Rol del personal"
            >
                {STAFF_ROLE_ORDER.map((key) => {
                    const role = STAFF_ROLES[key];
                    const selected = value === key;

                    return (
                        <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={`${role.label}, ${role.subtitle}. ${role.description}`}
                            onClick={() => onChange(key)}
                            className={classNames(
                                'group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-150',
                                selected ? 'pr-10' : 'pr-3',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-stone-950',
                                selected
                                    ? classNames('ring-2', role.ringClass, role.selectedClass)
                                    : 'border-stone-200/90 dark:border-white/10 bg-stone-50/80 dark:bg-stone-950/40 hover:border-stone-300 dark:hover:border-white/20 hover:bg-stone-100/90 dark:hover:bg-stone-900/50',
                                disabled && 'opacity-60 cursor-not-allowed',
                            )}
                        >
                            <span
                                className={classNames(
                                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform',
                                    role.avatarClass,
                                    selected && 'scale-105',
                                )}
                                aria-hidden
                            >
                                <StaffRoleIcon roleKey={key} className={role.iconClass} />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-sm leading-tight text-stone-900 dark:text-stone-50 truncate">
                                    {role.label}
                                </span>
                                <span
                                    className={classNames(
                                        'mt-1 inline-flex max-w-full items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide truncate',
                                        selected
                                            ? classNames('border', role.selectedClass)
                                            : 'bg-stone-200/70 dark:bg-white/10 text-stone-600 dark:text-stone-400',
                                    )}
                                >
                                    {role.subtitle}
                                </span>
                                <span className="mt-1.5 block text-[11px] leading-snug text-stone-600 dark:text-stone-400 line-clamp-2">
                                    {role.description}
                                </span>
                            </span>

                            {selected ? (
                                <svg
                                    className={classNames('absolute top-3 right-3 h-4 w-4 shrink-0', role.iconClass)}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}
