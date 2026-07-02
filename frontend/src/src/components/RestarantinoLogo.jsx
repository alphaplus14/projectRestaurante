import React from 'react';

const LOGO_SRC = '/logo-restarantino.png';

function classNames(...xs) {
    return xs.filter(Boolean).join(' ');
}

const SIZE_CLASS = {
    sm: 'h-8 w-auto max-w-[7rem] sm:max-w-[8rem]',
    md: 'h-9 w-auto max-w-[9rem] sm:h-10 sm:max-w-[10rem] lg:h-11 lg:max-w-[11rem]',
    lg: 'h-12 w-auto max-w-[12rem] sm:h-14 sm:max-w-[14rem]',
};

/**
 * Logo oficial del proyecto (Restarantino).
 */
export function RestarantinoLogo({ size = 'md', className, alt = 'Restarantino — Cocina & sabor' }) {
    return (
        <img
            src={LOGO_SRC}
            alt={alt}
            draggable={false}
            className={classNames(
                'block object-contain object-left shrink-0 bg-transparent',
                'dark:brightness-0 dark:invert',
                SIZE_CLASS[size] ?? SIZE_CLASS.md,
                className,
            )}
        />
    );
}

export { LOGO_SRC };
