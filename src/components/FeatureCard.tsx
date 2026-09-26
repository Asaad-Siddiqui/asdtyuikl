import Icon from "@/components/Icon";
import type { IconName } from "@/lib/icons";

export default function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: IconName;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <article
      className="card card-hover flex flex-col gap-3 p-6"
      style={{
        animation: `fade-up 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
      }}
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-5.5 w-5.5" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-600">{description}</p>
    </article>
  );
}
