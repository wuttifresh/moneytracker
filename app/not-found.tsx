import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-bold">404</h1>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        ไม่พบหน้าที่คุณกำลังมองหา
      </p>
      <Link
        href="/"
        className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
