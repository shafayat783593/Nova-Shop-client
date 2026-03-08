'use client';

import Link from 'next/link';

const SecondaryButton = ({
    text,
    url,
    size = 'md',
    className = '',
    children,
    ...props
}) => {
    const sizeClasses =
        size === 'xs'
            ? 'h-7 px-3 text-xs'
            : size === 'sm'
                ? 'h-9 px-4 text-sm'
                : size === 'lg'
                    ? 'h-12 px-8 text-base'
                    : size === 'xl'
                        ? 'h-14 px-10 text-lg'
                        : 'h-10 px-6 text-sm';

    const baseClasses = `
    inline-flex items-center justify-center gap-2 
    rounded-xl font-semibold
    border border-gray-300
    bg-white text-gray-800
    hover:bg-gray-100
    hover:border-gray-400
    transition-all duration-300
    shadow-sm hover:shadow-md
    whitespace-nowrap
    ${sizeClasses}
    ${className}
  `;

    const content = (
        <>
            {children}
            <span>{text}</span>
        </>
    );

    // If no URL → use button
    if (!url) {
        return (
            <button className={baseClasses} {...props}>
                {content}
            </button>
        );
    }

    // If URL → use Link
    return (
        <Link href={url} className={baseClasses}>
            {content}
        </Link>
    );
};

export default SecondaryButton;