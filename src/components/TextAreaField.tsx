"use client";

export default function TextAreaField({
  id,
  label,
  placeholder,
  value,
  onChange,
  hint,
  rows = 3,
  optional = true,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-700">
        {label}{" "}
        {optional && (
          <span className="font-normal text-ink-400">(optional)</span>
        )}
      </label>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="field mt-2 resize-y leading-relaxed"
      />
    </div>
  );
}
