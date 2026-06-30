'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Field, FormError, SubmitButton } from '@/components/auth/form-controls';
import { updateAvatar } from '@/server/actions/profile';
import type { ActionState } from '@/lib/forms';

function AvatarForm({
  currentImage,
  onDone,
}: {
  currentImage: string | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, action] = useFormState<ActionState, FormData>(
    updateAvatar,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onDone();
    }
  }, [state, router, onDone]);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.formError} />
      <Field
        label="ลิงก์รูปภาพ (URL)"
        name="image"
        type="url"
        defaultValue={currentImage ?? ''}
        errors={state?.fieldErrors?.image}
      />
      <p className="text-xs text-muted-foreground">
        เว้นว่างไว้เพื่อใช้ตัวอักษรย่อแทนรูป
      </p>
      <SubmitButton pendingText="กำลังบันทึก...">บันทึกรูปโปรไฟล์</SubmitButton>
    </form>
  );
}

export function ChangeAvatar({ currentImage }: { currentImage: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="เปลี่ยนรูปโปรไฟล์"
        className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground ring-4 ring-card transition-transform hover:scale-105"
      >
        <Camera className="h-4 w-4" />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="เปลี่ยนรูปโปรไฟล์"
      >
        <AvatarForm currentImage={currentImage} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
