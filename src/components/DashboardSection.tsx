import Icon from "@/components/Icon";
import type { IconName } from "@/lib/icons";

export default function DashboardSection({
  id,
  eyebrow,
  title,
  description,
  icon,
  children,
  action,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: IconName;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-600 uppercase">
              {icon && <Icon name={icon} className="h-4 w-4" />}
              {eyebrow}
            </p>
          )}
          <h2 id={headingId} className="mt-2 text-2xl font-semibold">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
