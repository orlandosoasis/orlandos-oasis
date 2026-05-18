import { useCallback, useRef, useState, type ReactNode } from "react";
import { Upload } from "lucide-react";

interface Props {
  /** Called with the selected file (whether dropped, pasted, or picked). */
  onFile: (file: File) => void;
  /** Accept attribute. e.g. "image/*", "application/pdf,application/msword" */
  accept?: string;
  /** Max size in bytes; rejects larger files with an inline error. */
  maxBytes?: number;
  /** Disables the dropzone (during upload). */
  disabled?: boolean;
  /** Optional custom label / children to render inside the zone. */
  children?: ReactNode;
  className?: string;
  /** ID used for the hidden <input>. Required for label association. */
  inputId?: string;
}

/**
 * Reusable drag-and-drop file pick.
 *
 * Features:
 *   - Drop, click-to-pick, paste (Ctrl/Cmd+V with an image in clipboard)
 *   - Visible focus ring + keyboard activation (Enter / Space)
 *   - Live size validation with a friendly error
 *   - Honors `accept` and `maxBytes`
 *   - Pure presentation; no upload logic. Caller decides storage destination.
 */
export function FileDropzone({
  onFile,
  accept,
  maxBytes,
  disabled,
  children,
  className = "",
  inputId,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accepted = useCallback(
    (file: File) => {
      setError(null);
      if (maxBytes && file.size > maxBytes) {
        const mb = Math.round((maxBytes / 1024 / 1024) * 10) / 10;
        setError(`File too large. Max ${mb} MB.`);
        return;
      }
      onFile(file);
    },
    [maxBytes, onFile],
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) accepted(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) accepted(file);
    if (ref.current) ref.current.value = "";
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ref.current?.click();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const file = e.clipboardData.files?.[0];
    if (file) accepted(file);
  };

  return (
    <div className={className}>
      <input
        ref={ref}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={handleChange}
        disabled={disabled}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Drop file or click to upload"
        onClick={() => !disabled && ref.current?.click()}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        onDragEnter={(e) => { e.preventDefault(); !disabled && setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); !disabled && setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragOver && !disabled
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/60 hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"}`}
      >
        {children ?? (
          <>
            <Upload className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            {accept ? (
              <p className="text-xs text-muted-foreground">{accept}</p>
            ) : null}
          </>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default FileDropzone;
