'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import {
  Field,
  SelectField,
  FormError,
  SubmitButton,
} from '@/components/auth/form-controls';
import { createBill, updateBill } from '@/server/actions/bills';
import { BILL_TYPES } from '@/lib/validations/bill';
import type { BillDTO } from '@/server/services/bills';
import type { ActionState } from '@/lib/forms';

function BillForm({ bill, onDone }: { bill?: BillDTO; onDone: () => void }) {
  const router = useRouter();
  const action = bill ? updateBill : createBill;
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
      {bill && <input type="hidden" name="id" value={bill.id} />}
      <FormError message={state?.formError} />

      <Field
        label="ชื่อบิล"
        name="name"
        placeholder="ชื่อบิล เช่น ค่าไฟ, ค่าเน็ต"
        defaultValue={bill?.name}
        errors={state?.fieldErrors?.name}
      />
      <SelectField
        label="ประเภทบิล"
        name="billType"
        options={BILL_TYPES}
        defaultValue={bill?.billType ?? BILL_TYPES[0]}
        errors={state?.fieldErrors?.billType}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="ยอดที่ต้องจ่าย"
          name="amount"
          inputMode="decimal"
          placeholder="ยอดที่ต้องจ่าย"
          defaultValue={bill?.amount}
          errors={state?.fieldErrors?.amount}
        />
        <Field
          label="วันครบกำหนด (1-31)"
          name="dueDay"
          type="number"
          inputMode="numeric"
          placeholder="วันครบกำหนด (1-31)"
          defaultValue={bill?.dueDay != null ? String(bill.dueDay) : ''}
          errors={state?.fieldErrors?.dueDay}
        />
      </div>

      <Field
        label="หมายเหตุ (ไม่บังคับ)"
        name="note"
        defaultValue={bill?.note ?? ''}
        errors={state?.fieldErrors?.note}
      />
      <SubmitButton pendingText="กำลังบันทึก...">
        {bill ? 'บันทึกการแก้ไข' : 'บันทึก'}
      </SubmitButton>
    </form>
  );
}

export function BillModal({ bill }: { bill?: BillDTO }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {bill ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="แก้ไขบิล"
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
          เพิ่มบิล
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={bill ? 'แก้ไขบิล' : 'เพิ่มบิล'}
      >
        <BillForm bill={bill} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
