'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Field, FormError, SubmitButton } from '@/components/auth/form-controls';
import {
  createTransaction,
  updateTransaction,
} from '@/server/actions/transactions';
import type { CategoryDTO } from '@/server/services/categories';
import type { TransactionDTO } from '@/server/services/transactions';
import type { ActionState } from '@/lib/forms';
import { cn } from '@/lib/utils';

type TxType = 'income' | 'expense';

function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function TransactionForm({
  categories,
  transaction,
  onDone,
}: {
  categories: CategoryDTO[];
  transaction?: TransactionDTO;
  onDone: () => void;
}) {
  const router = useRouter();
  const action = transaction ? updateTransaction : createTransaction;
  const [state, formAction] = useFormState<ActionState, FormData>(
    action,
    undefined,
  );
  const [type, setType] = useState<TxType>(transaction?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState(transaction?.category.id ?? '');

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onDone();
    }
  }, [state, router, onDone]);

  const options = categories.filter((c) => c.type === type);
  const selectValue = options.some((o) => o.id === categoryId)
    ? categoryId
    : '';

  return (
    <form action={formAction} className="space-y-4">
      {transaction && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="type" value={type} />
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
                ? t === 'expense'
                  ? 'bg-expense text-white'
                  : 'bg-income text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'expense' ? 'รายจ่าย' : 'รายรับ'}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="amount" className="text-sm font-medium">
          จำนวนเงิน (บาท)
        </label>
        <input
          id="amount"
          name="amount"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={transaction?.amount}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-right text-lg font-semibold outline-none transition focus:ring-2 focus:ring-ring"
        />
        {state?.fieldErrors?.amount?.map((e) => (
          <p key={e} className="text-xs text-expense">
            {e}
          </p>
        ))}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium">
          หมวดหมู่
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={selectValue}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        >
          <option value="">— เลือกหมวดหมู่ —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.categoryId?.map((e) => (
          <p key={e} className="text-xs text-expense">
            {e}
          </p>
        ))}
        {options.length === 0 && (
          <p className="text-xs text-muted-foreground">
            ยังไม่มีหมวดหมู่ประเภทนี้ — เพิ่มได้ที่หน้าจัดการหมวดหมู่
          </p>
        )}
      </div>

      <Field
        label="วันที่"
        name="date"
        type="date"
        defaultValue={transaction ? transaction.date.slice(0, 10) : todayISO()}
        errors={state?.fieldErrors?.date}
      />
      <Field
        label="หมายเหตุ (ไม่บังคับ)"
        name="note"
        defaultValue={transaction?.note ?? ''}
        errors={state?.fieldErrors?.note}
      />

      <SubmitButton pendingText="กำลังบันทึก...">
        {transaction ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
      </SubmitButton>
    </form>
  );
}

export function TransactionModal({
  categories,
  transaction,
}: {
  categories: CategoryDTO[];
  transaction?: TransactionDTO;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {transaction ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="แก้ไขรายการ"
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
          เพิ่ม
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={transaction ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}
      >
        <TransactionForm
          categories={categories}
          transaction={transaction}
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
