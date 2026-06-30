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
import { createDebt, updateDebt } from '@/server/actions/debts';
import { DEBT_TYPES } from '@/lib/validations/debt';
import type { DebtDTO } from '@/server/services/debts';
import type { ActionState } from '@/lib/forms';

function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function DebtForm({ debt, onDone }: { debt?: DebtDTO; onDone: () => void }) {
  const router = useRouter();
  const action = debt ? updateDebt : createDebt;
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
      {debt && <input type="hidden" name="id" value={debt.id} />}
      <FormError message={state?.formError} />

      <Field
        label="ชื่อหนี้"
        name="name"
        placeholder="ชื่อหนี้ เช่น สินเชื่อรถ"
        defaultValue={debt?.name}
        errors={state?.fieldErrors?.name}
      />
      <SelectField
        label="ประเภทหนี้"
        name="debtType"
        options={DEBT_TYPES}
        defaultValue={debt?.debtType ?? DEBT_TYPES[0]}
        errors={state?.fieldErrors?.debtType}
      />
      <Field
        label="ผู้ให้กู้/ธนาคาร"
        name="lender"
        placeholder="ผู้ให้กู้/ธนาคาร"
        defaultValue={debt?.lender ?? ''}
        errors={state?.fieldErrors?.lender}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="ยอดเริ่มต้น"
          name="principal"
          inputMode="decimal"
          placeholder="ยอดเริ่มต้น"
          defaultValue={debt?.principal}
          errors={state?.fieldErrors?.principal}
        />
        <Field
          label="ยอดคงเหลือ"
          name="balance"
          inputMode="decimal"
          placeholder="ยอดคงเหลือ"
          defaultValue={debt?.balance ?? ''}
          errors={state?.fieldErrors?.balance}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="ดอกเบี้ย (%/ปี)"
          name="annualRate"
          inputMode="decimal"
          placeholder="ดอกเบี้ย (%/ปี)"
          defaultValue={debt?.annualRate}
          errors={state?.fieldErrors?.annualRate}
        />
        <Field
          label="ยอดชำระขั้นต่ำ/เดือน"
          name="minPayment"
          inputMode="decimal"
          placeholder="ยอดชำระขั้นต่ำ/เดือน"
          defaultValue={debt?.minPayment ?? ''}
          errors={state?.fieldErrors?.minPayment}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="วันครบกำหนด (1-31)"
          name="dueDay"
          type="number"
          inputMode="numeric"
          placeholder="วันครบกำหนด (1-31)"
          defaultValue={debt?.dueDay != null ? String(debt.dueDay) : ''}
          errors={state?.fieldErrors?.dueDay}
        />
        <Field
          label="จำนวนงวดทั้งหมด"
          name="termMonths"
          type="number"
          inputMode="numeric"
          placeholder="จำนวนงวดทั้งหมด"
          defaultValue={debt ? String(debt.termMonths) : ''}
          errors={state?.fieldErrors?.termMonths}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="วันเริ่มต้นสัญญา"
          name="startDate"
          type="date"
          defaultValue={debt ? debt.startDate.slice(0, 10) : todayISO()}
          errors={state?.fieldErrors?.startDate}
        />
        <Field
          label="วันสิ้นสุดสัญญา"
          name="endDate"
          type="date"
          defaultValue={debt?.endDate ? debt.endDate.slice(0, 10) : ''}
          errors={state?.fieldErrors?.endDate}
        />
      </div>

      <Field
        label="หมายเหตุ (ไม่บังคับ)"
        name="note"
        defaultValue={debt?.note ?? ''}
        errors={state?.fieldErrors?.note}
      />
      <SubmitButton pendingText="กำลังบันทึก...">
        {debt ? 'บันทึกการแก้ไข' : 'บันทึก'}
      </SubmitButton>
    </form>
  );
}

export function DebtModal({ debt }: { debt?: DebtDTO }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {debt ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="แก้ไขหนี้"
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
          เพิ่มหนี้
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={debt ? 'แก้ไขหนี้' : 'เพิ่มหนี้'}
      >
        <DebtForm debt={debt} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
