'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Field, FormError, SubmitButton } from '@/components/auth/form-controls';
import {
  createGoal,
  updateGoal,
  deleteGoal,
  addSavings,
} from '@/server/actions/planning';
import { formatTHB } from '@/lib/money';
import type { ActionState } from '@/lib/forms';
import type { GoalDTO } from '@/server/services/planning';

const dateFmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' });

function GoalForm({ goal, onDone }: { goal?: GoalDTO; onDone: () => void }) {
  const router = useRouter();
  const action = goal ? updateGoal : createGoal;
  const [state, formAction] = useFormState<ActionState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onDone();
    }
  }, [state, router, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <FormError message={state?.formError} />
      <Field
        label="ชื่อเป้าหมาย"
        name="name"
        defaultValue={goal?.name}
        errors={state?.fieldErrors?.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="เป้าหมาย (บาท)"
          name="targetAmount"
          defaultValue={goal?.targetAmount}
          errors={state?.fieldErrors?.targetAmount}
        />
        <Field
          label="ออมแล้ว (บาท)"
          name="currentAmount"
          defaultValue={goal?.currentAmount}
          errors={state?.fieldErrors?.currentAmount}
        />
      </div>
      <Field
        label="กำหนดเวลา (ไม่บังคับ)"
        name="deadline"
        type="date"
        defaultValue={goal?.deadline ? goal.deadline.slice(0, 10) : ''}
        errors={state?.fieldErrors?.deadline}
      />
      <Field
        label="หมายเหตุ (ไม่บังคับ)"
        name="note"
        defaultValue={goal?.note ?? ''}
        errors={state?.fieldErrors?.note}
      />
      <SubmitButton pendingText="กำลังบันทึก...">
        {goal ? 'บันทึกการแก้ไข' : 'เพิ่มเป้าหมาย'}
      </SubmitButton>
    </form>
  );
}

function GoalModal({ goal }: { goal?: GoalDTO }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {goal ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="แก้ไขเป้าหมาย"
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
          เพิ่มเป้าหมาย
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={goal ? 'แก้ไขเป้าหมาย' : 'เพิ่มเป้าหมายการออม'}
      >
        <GoalForm goal={goal} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function AddSavings({ goalId }: { goalId: string }) {
  const [value, setValue] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="decimal"
        placeholder="เพิ่มเงินออม"
        className="w-28 rounded-md border border-border bg-background px-2 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="button"
        disabled={pending || !value}
        onClick={() =>
          start(async () => {
            await addSavings(goalId, value);
            setValue('');
            router.refresh();
          })
        }
        className="rounded-md bg-income px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        ออม
      </button>
    </div>
  );
}

function DeleteGoalButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="ลบเป้าหมาย"
      onClick={() => {
        if (!window.confirm('ต้องการลบเป้าหมายนี้หรือไม่?')) return;
        start(async () => {
          await deleteGoal(id);
          router.refresh();
        });
      }}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-expense disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export function GoalsManager({ goals }: { goals: GoalDTO[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GoalModal />
      </div>
      {goals.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          ยังไม่มีเป้าหมายการออม
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <div
              key={g.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{g.name}</p>
                  {g.deadline && (
                    <p className="text-xs text-muted-foreground">
                      ภายใน {dateFmt.format(new Date(g.deadline))}
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <GoalModal goal={g} />
                  <DeleteGoalButton id={g.id} />
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded bg-secondary">
                <div
                  className="h-full bg-income transition-all"
                  style={{ width: `${g.pct}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="tabular-nums">
                  {formatTHB(g.current)}{' '}
                  <span className="text-muted-foreground">
                    / {formatTHB(g.target)}
                  </span>
                </span>
                <span className="font-medium text-income">{g.pct}%</span>
              </div>

              <div className="mt-3 flex justify-end">
                <AddSavings goalId={g.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
