'use client';

import Link from 'next/link';

const PrimaryButton = ({
    text,
    url,
    size = 'md',
    className = '',
    children,
    isLoading, // 1. Pull isLoading out here
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
    relative inline-flex items-center justify-center gap-2
    overflow-hidden rounded-xl font-semibold
    text-white whitespace-nowrap
    bg-gradient-to-r from-blue-600 to-indigo-600
    hover:from-blue-700 hover:to-indigo-700
    shadow-lg hover:shadow-xl
    transition-all duration-300
    group
    ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} 
    ${sizeClasses}
    ${className}
  `;

    const content = (
        <>
            {/* 2. Show a spinner or different text if loading */}
            {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : children}

            <span>{isLoading ? 'Processing...' : text}</span>

            {/* Shiny effect overlay */}
            {!isLoading && (
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent"></span>
            )}
        </>
    );

    if (!url) {
        return (
            // 3. isLoading is now excluded from ...props
            <button
                className={baseClasses}
                disabled={isLoading} // Good practice: disable button when loading
                {...props}
            >
                {content}
            </button>
        );
    }

    return (
        <Link href={url} className={baseClasses} {...props}>
            {content}
        </Link>
    );
};

export default PrimaryButton;