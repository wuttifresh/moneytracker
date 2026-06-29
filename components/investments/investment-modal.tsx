'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Field, FormError, SubmitButton } from '@/components/auth/form-controls';
import {
  createInvestment,
  updateInvestment,
} from '@/server/actions/investments';
import { INVESTMENT_KINDS } from '@/lib/validations/investment';
import type { InvestmentDTO } from '@/server/services/investments';
import type { ActionState } from '@/lib/forms';

function InvestmentForm({
  investment,
  onDone,
}: {
  investment?: InvestmentDTO;
  onDone: () => void;
}) {
  const router = useRouter();
  const action = investment ? updateInvestment : createInvestment;
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
      {investment && <input type="hidden" name="id" value={investment.id} />}
      <FormError message={state?.formError} />
      <Field
        label="ชื่อสินทรัพย์"
        name="name"
        defaultValue={investment?.name}
        errors={state?.fieldErrors?.name}
      />
      <div className="space-y-1.5">
        <label htmlFor="kind" className="text-sm font-medium">
          ประเภท
        </label>
        <select
          id="kind"
          name="kind"
          defaultValue={investment?.kind ?? ''}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        >
          <option value="">— ไม่ระบุ —</option>
          {INVESTMENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <Field
        label="จำนวนหน่วย"
        name="units"
        defaultValue={investment?.units}
        errors={state?.fieldErrors?.units}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="ต้นทุน/หน่วย (บาท)"
          name="costPerUnit"
          defaultValue={investment?.costPerUnit}
          errors={state?.fieldErrors?.costPerUnit}
        />
        <Field
          label="ราคาปัจจุบัน/หน่วย"
          name="currentPrice"
          defaultValue={investment?.currentPrice}
          errors={state?.fieldErrors?.currentPrice}
        />
      </div>
      <Field
        label="หมายเหตุ (ไม่บังคับ)"
        name="note"
        defaultValue={investment?.note ?? ''}
        errors={state?.fieldErrors?.note}
      />
      <SubmitButton pendingText="กำลังบันทึก...">
        {investment ? 'บันทึกการแก้ไข' : 'เพิ่มสินทรัพย์'}
      </SubmitButton>
    </form>
  );
}

export function InvestmentModal({ investment }: { investment?: InvestmentDTO }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {investment ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="แก้ไขสินทรัพย์"
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
          เพิ่มสินทรัพย์
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={investment ? 'แก้ไขสินทรัพย์' : 'เพิ่มสินทรัพย์'}
      >
        <InvestmentForm investment={investment} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
