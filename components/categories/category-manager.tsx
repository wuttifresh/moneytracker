'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { CategoryPill } from '@/components/transactions/category-pill';
import { Field, FormError, SubmitButton } from '@/components/auth/form-controls';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/server/actions/categories';
import { ICON_NAMES, DEFAULT_ICON, getCategoryIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { ActionState } from '@/lib/forms';
import type { CategoryDTO } from '@/server/services/categories';

type TxType = 'income' | 'expense';

function CategoryForm({
  category,
  onDone,
}: {
  category?: CategoryDTO;
  onDone: () => void;
}) {
  const router = useRouter();
  const action = category ? updateCategory : createCategory;
  const [state, formAction] = useFormState<ActionState, FormData>(
    action,
    undefined,
  );
  const [type, setType] = useState<TxType>(category?.type ?? 'expense');
  const [icon, setIcon] = useState(category?.icon ?? DEFAULT_ICON);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onDone();
    }
  }, [state, router, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="icon" value={icon} />
      <FormError message={state?.formError} />

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary p-1">
        {(['expense', 'income'] as TxType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              'rounded-md py-2 text-sm font-medium transition-colors',
              type === t
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'expense' ? 'รายจ่าย' : 'รายรับ'}
          </button>
        ))}
      </div>

      <Field
        label="ชื่อหมวดหมู่"
        name="name"
        defaultValue={category?.name}
        errors={state?.fieldErrors?.name}
      />

      <div className="space-y-1.5">
        <span className="text-sm font-medium">ไอคอน</span>
        <div className="grid grid-cols-7 gap-2">
          {ICON_NAMES.map((n) => {
            const Icon = getCategoryIcon(n);
            return (
              <button
                key={n}
                type="button"
                aria-label={n}
                onClick={() => setIcon(n)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-md border transition-colors',
                  icon === n
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-secondary',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="color" className="text-sm font-medium">
          สี
        </label>
        <input
          id="color"
          name="color"
          type="color"
          defaultValue={category?.color ?? '#94a3b8'}
          className="h-10 w-full cursor-pointer rounded-md border border-border bg-background p-1"
        />
        {state?.fieldErrors?.color?.map((e) => (
          <p key={e} className="text-xs text-expense">
            {e}
          </p>
        ))}
      </div>

      <SubmitButton pendingText="กำลังบันทึก...">
        {category ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
      </SubmitButton>
    </form>
  );
}

function CategoryModal({ category }: { category?: CategoryDTO }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {category ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="แก้ไขหมวดหมู่"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          เพิ่มหมวดหมู่
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={category ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
      >
        <CategoryForm category={category} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function DeleteCategoryButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="ลบหมวดหมู่"
      onClick={() => {
        if (!window.confirm('ลบหมวดหมู่นี้? รายการเดิมจะยังคงอยู่')) return;
        start(async () => {
          await deleteCategory(id);
          router.refresh();
        });
      }}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-expense disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export function CategoryManager({ categories }: { categories: CategoryDTO[] }) {
  const groups: { type: TxType; label: string }[] = [
    { type: 'expense', label: 'รายจ่าย' },
    { type: 'income', label: 'รายรับ' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CategoryModal />
      </div>
      {groups.map((g) => {
        const items = categories.filter((c) => c.type === g.type);
        return (
          <section key={g.type}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              {g.label}
            </h3>
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                ยังไม่มีหมวดหมู่
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {items.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <CategoryPill
                        name={c.name}
                        icon={c.icon}
                        color={c.color}
                      />
                    </div>
                    <CategoryModal category={c} />
                    <DeleteCategoryButton id={c.id} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
