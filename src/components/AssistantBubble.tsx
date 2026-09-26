import { clsx } from "clsx";

import Icon from "@/components/Icon";

export default function AssistantBubble({
  children,
  label = "Wayfare Assistant",
  typing = false,
  className,
}: {
  children?: React.ReactNode;
  label?: string;
  typing?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-start gap-3", className)}>
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
        <Icon name="sparkles" className="h-4 w-4" />
      </span>

      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-semibold tracking-wide text-ink-400">
          {label}
        </p>
        <div className="w-fit max-w-full rounded-2xl rounded-tl-md border border-ink-200 bg-surface px-4 py-3 text-sm leading-relaxed text-ink-700 shadow-soft">
          {typing ? (
            <span
              className="flex items-center gap-1 py-0.5"
              role="status"
              aria-label="Assistant is typing"
            >
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
