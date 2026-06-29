import { Construction } from 'lucide-react';

/** Placeholder for routes whose features arrive in a later phase. */
export function ComingSoon({ phase }: { phase: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Construction className="h-7 w-7" />
      </span>
      <h2 className="text-lg font-semibold">กำลังจะมา</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        ฟีเจอร์นี้จะถูกพัฒนาใน {phase}
      </p>
    </div>
  );
}
