export default function Loading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50">
      <svg
        className="h-10 w-10 animate-spin text-primary"
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Yükleniyor"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
        />
      </svg>
    </div>
  );
}
