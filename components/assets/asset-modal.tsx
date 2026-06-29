'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Field, FormError, SubmitButton } from '@/components/auth/form-controls';
import { createAsset, updateAsset } from '@/server/actions/assets';
import { ASSET_KINDS } from '@/lib/validations/asset';
import type { AssetDTO } from '@/server/services/assets';
import type { ActionState } from '@/lib/forms';

function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function AssetForm({ asset, onDone }: { asset?: AssetDTO; onDone: () => void }) {
  const router = useRouter();
  const action = asset ? updateAsset : createAsset;
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
      {asset && <input type="hidden" name="id" value={asset.id} />}
      <FormError message={state?.formError} />
      <Field
        label="ชื่อทรัพย์สิน"
        name="name"
        defaultValue={asset?.name}
        errors={state?.fieldErrors?.name}
      />
      <div className="space-y-1.5">
        <label htmlFor="kind" className="text-sm font-medium">
          ประเภท
        </label>
        <select
          id="kind"
          name="kind"
          defaultValue={asset?.kind ?? ''}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        >
          <option value="">— ไม่ระบุ —</option>
          {ASSET_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="มูลค่าซื้อ (บาท)"
          name="purchaseValue"
          defaultValue={asset?.purchaseValue}
          errors={state?.fieldErrors?.purchaseValue}
        />
        <Field
          label="มูลค่าซาก (บาท)"
          name="salvageValue"
          defaultValue={asset?.salvageValue}
          errors={state?.fieldErrors?.salvageValue}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="วันที่ซื้อ"
          name="purchaseDate"
          type="date"
          defaultValue={asset ? asset.purchaseDate.slice(0, 10) : todayISO()}
          errors={state?.fieldErrors?.purchaseDate}
        />
        <Field
          label="อายุใช้งาน (ปี)"
          name="usefulLifeYears"
          type="number"
          defaultValue={asset?.usefulLifeYears?.toString() ?? ''}
          errors={state?.fieldErrors?.usefulLifeYears}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        เว้นว่าง “อายุใช้งาน” ไว้ถ้าไม่ต้องการคิดค่าเสื่อม
      </p>
      <Field
        label="หมายเหตุ (ไม่บังคับ)"
        name="note"
        defaultValue={asset?.note ?? ''}
        errors={state?.fieldErrors?.note}
      />
      <SubmitButton pendingText="กำลังบันทึก...">
        {asset ? 'บันทึกการแก้ไข' : 'เพิ่มทรัพย์สิน'}
      </SubmitButton>
    </form>
  );
}

export function AssetModal({ asset }: { asset?: AssetDTO }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {asset ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="แก้ไขทรัพย์สิน"
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
          เพิ่มทรัพย์สิน
        </button>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={asset ? 'แก้ไขทรัพย์สิน' : 'เพิ่มทรัพย์สิน'}
      >
        <AssetForm asset={asset} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
