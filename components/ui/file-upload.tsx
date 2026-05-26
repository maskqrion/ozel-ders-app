"use client";

import { useCallback, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onChange: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({
  onChange,
  accept,
  maxSizeMB = 50,
  className,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const picked = files[0];
      if (picked.size > maxSizeMB * 1024 * 1024) return;
      setFile(picked);
      onChange(Array.from(files));
    },
    [onChange, maxSizeMB],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={cn("w-full", className)}>
      <m.div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        animate={dragging ? { scale: 1.02, borderColor: "#60a5fa" } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors duration-200",
          dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
        )}
      >
        {/* Icon */}
        <m.div
          animate={{ y: dragging ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-500"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
        </m.div>

        <AnimatePresence mode="wait">
          {file ? (
            <m.div
              key="file"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-center"
            >
              <p className="text-sm font-semibold text-slate-800">{file.name}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </m.div>
          ) : (
            <m.div
              key="empty"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-center"
            >
              <p className="text-sm font-medium text-slate-600">
                Dosyayı sürükle veya{" "}
                <span className="text-blue-500 underline underline-offset-2">seç</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Maks. {maxSizeMB} MB</p>
            </m.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </m.div>
    </div>
  );
}
