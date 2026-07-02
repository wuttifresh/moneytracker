'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import {
  Field,
  FormError,
  SubmitButton,
} from '@/components/auth/form-controls';
import { createDebtStatement } from '@/server/actions/debt-statements';
import type { ActionState } from '@/lib/forms';

function currentMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function StatementForm({
  debtId,
  onDone,
}: {
  debtId: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useFormState<ActionState, FormData>(
    createDebtStatement,
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
      <input type="hidden" name="debtId" value={debtId} />
      <FormError message={state?.formError} />

      <Field
        label="เดือนของรอบบิล"
        name="statementMonth"
        type="month"
        defaultValue={currentMonthISO()}
        errors={state?.fieldErrors?.statementMonth}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="ยอดเต็ม"
          name="fullBalance"
          inputMode="decimal"
          placeholder="ยอดเต็มตามใบแจ้งหนี้"
          errors={state?.fieldErrors?.fullBalance}
        />
        <Field
          label="ยอดขั้นต่ำ"
          name="minPayment"
          inputMode="decimal"
          placeholder="ยอดชำระขั้นต่ำ"
          errors={state?.fieldErrors?.minPayment}
        />
      </div>

      <Field
        label="วันครบกำหนด (ไม่บังคับ)"
        name="dueDate"
        type="date"
        errors={state?.fieldErrors?.dueDate}
      />

      <Field
        label="หมายเหตุ (ไม่บังคับ)"
        name="note"
        placeholder="เช่น รูดเพิ่ม / ผ่อนสินค้า"
        errors={state?.fieldErrors?.note}
      />

      <SubmitButton pendingText="กำลังบันทึก...">บันทึกรอบบิล</SubmitButton>
    </form>
  );
}

export function StatementModal({ debtId }: { debtId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        เพิ่มรอบบิล
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="เพิ่มรอบบิลบัตรเครดิต"
      >
        <StatementForm debtId={debtId} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
