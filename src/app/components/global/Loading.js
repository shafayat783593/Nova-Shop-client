'use client';

import { FiLoader } from "react-icons/fi";

const Loading = () => {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-body">
        <FiLoader size={36} className="animate-spin text-[color:var(--color-primary)]" />
        <p className="text-sm font-semibold">Loading products…</p>
      </div>
    );
};

export default Loading;