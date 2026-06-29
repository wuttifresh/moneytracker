import { getCategoryIcon } from '@/lib/icons';

/** Icon chip + name for a category. Pure component (safe in server or client). */
export function CategoryPill({
  name,
  icon,
  color,
}: {
  name: string;
  icon: string | null;
  color: string | null;
}) {
  const Icon = getCategoryIcon(icon);
  const tint = color ?? '#94a3b8';
  return (
    <span className="flex items-center gap-2">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${tint}22`, color: tint }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="truncate text-sm font-medium">{name}</span>
    </span>
  );
}
