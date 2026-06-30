# MoneyPad

แอปบันทึกการเงินส่วนบุคคล (personal finance tracker) แรงบันดาลใจจาก
moneypadpro.com — responsive ทุกหน้าจอ, หลายธีม, ล็อกอินด้วย Google หรือ
อีเมล/รหัสผ่าน, ติดตั้งเป็นแอปบนมือถือได้ (PWA)

UI เป็นภาษาไทย จำนวนเงินเก็บเป็น `Decimal` เสมอ (ไม่ใช้ float), ลบแบบ soft delete,
และทุกการแก้ไขข้อมูลตรวจสิทธิ์เจ้าของ (ownership) ก่อนทุกครั้ง

## ฟีเจอร์

- **รายรับ–รายจ่าย** — บันทึกธุรกรรม, หมวดหมู่ (ไอคอน/สี), Dashboard สรุป + กราฟ
- **หนี้สิน** — ยอดต้น/ดอกเบี้ย/งวด พร้อม **ตารางตัดชำระ** และติ๊กงวดที่จ่ายแล้ว
- **การลงทุน** — พอร์ต, ต้นทุน, มูลค่าปัจจุบัน, กำไร/ขาดทุน + กราฟสัดส่วน
- **ทรัพย์สิน** — มูลค่าซื้อ + **ค่าเสื่อมแบบเส้นตรง** → มูลค่าปัจจุบัน
- **รายงาน** — สรุปข้ามเดือน/ปี, กราฟแนวโน้ม, **export CSV**
- **วางแผน** — งบประมาณต่อหมวด + **แจ้งเตือนเกินงบ**, เป้าหมายการออม
- **ระบบ** — 5 ธีม, Auth (Google + credentials), PWA, a11y, loading/error states

## Tech stack

| ส่วน       | เทคโนโลยี                                       |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js 14 (App Router) + TypeScript (strict)   |
| Styling    | Tailwind CSS + CSS variables (theming)          |
| Database   | PostgreSQL (Supabase)                            |
| ORM        | Prisma                                          |
| Auth       | NextAuth / Auth.js v5 — Google + Credentials    |
| Validation | Zod                                             |
| Charts     | Recharts                                        |
| Deploy     | Vercel (app) + Supabase (DB)                     |

## โครงโฟลเดอร์

```
app/             # App Router routes, layout, manifest, loading/error states
  api/           # route handlers (auth, CSV export)
components/      # UI: layout, theme, transactions, debts, investments, ...
lib/             # helpers (money, icons, amortization, depreciation, validations)
prisma/          # schema.prisma + migrations/
server/
  actions/       # Server Actions ('use server') — mutations
  services/      # data-access / business logic (queries, ownership checks)
types/           # shared + next-auth type augmentation
public/          # PWA icons + service worker
```

---

## คู่มือผู้ใช้ (โดยย่อ)

1. **สมัคร/เข้าสู่ระบบ** ที่ `/register` หรือ `/login` (Google หรืออีเมล/รหัสผ่าน)
   — เมื่อเข้าครั้งแรกระบบจะสร้างหมวดหมู่ไทยเริ่มต้นให้อัตโนมัติ
2. **ภาพรวม (`/`)** — การ์ดสรุปรายรับ/รายจ่าย/คงเหลือเดือนนี้, กราฟรายจ่ายตามหมวด,
   รายการล่าสุด, ปุ่ม **+ เพิ่ม** เปิดฟอร์มบันทึกธุรกรรม และแบนเนอร์เตือนเมื่อใช้เกินงบ
3. **รายรับ-รายจ่าย (`/transactions`)** — กรองตามเดือน/ประเภท/หมวด, แก้ไข/ลบรายการ,
   จัดการหมวดหมู่ที่ `/categories`
4. **หนี้สิน (`/debts`)** — เพิ่มหนี้ → กดเข้าไปดู **ตารางตัดชำระ** และติ๊กงวดที่จ่ายแล้ว
5. **การลงทุน (`/investments`)** — เพิ่มสินทรัพย์ (จำนวนหน่วย/ต้นทุน/ราคาปัจจุบัน) →
   เห็นกำไร-ขาดทุนและสัดส่วนพอร์ต
6. **ทรัพย์สิน (`/assets`)** — ใส่มูลค่าซื้อ + อายุการใช้งาน → ระบบคำนวณค่าเสื่อมและมูลค่าปัจจุบัน
7. **รายงาน (`/reports`)** — เลือกปี → กราฟแนวโน้มรายเดือน + ปุ่ม **ดาวน์โหลด CSV**
8. **วางแผน (`/planning`)** — ตั้งงบต่อหมวด (เกินงบจะเตือน) และตั้งเป้าหมายการออม
9. **โปรไฟล์ (`/profile`)** — เปลี่ยนธีม (ผูกกับบัญชี), เปลี่ยนรหัสผ่าน, ออกจากระบบ
10. **ติดตั้งเป็นแอป** — บนมือถือ/Chrome กด “ติดตั้งแอป” เพื่อเพิ่มลงหน้าจอ (PWA)

---

## เริ่มต้นใช้งาน (local dev)

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment

```bash
cp .env.example .env
```

### 3. ตั้งค่า Supabase (PostgreSQL)

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. **Project Settings → Database → Connection string** แล้วใส่ใน `.env`:
   - `DATABASE_URL` = **pooled** (PgBouncer, port `6543`, ต่อท้าย
     `?pgbouncer=true&connection_limit=1`) — ใช้ตอน runtime
   - `DIRECT_URL` = **direct** (port `5432`) — ใช้ตอน migrate
3. สร้างตาราง + Prisma client:
   ```bash
   npm run db:deploy      # apply migrations -> สร้างตารางทั้งหมด
   npm run db:generate    # generate Prisma client
   ```

### 4. ตั้งค่า Google OAuth (ไม่บังคับ — อีเมล/รหัสผ่านใช้ได้เลย)

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services →
   Credentials → Create Credentials → OAuth client ID** → Web application
2. Authorized redirect URI:
   - dev: `http://localhost:3000/api/auth/callback/google`
   - prod: `https://<your-domain>/api/auth/callback/google`
3. ใส่ `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` ใน `.env`
4. สร้าง `NEXTAUTH_SECRET`: `openssl rand -base64 32`

### 5. รัน dev server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # dev server
npm run build        # production build (prisma generate && next build)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (strict)
npm run format       # Prettier
npm run db:generate  # prisma generate
npm run db:migrate   # prisma migrate dev (สร้าง migration ใหม่ตอนแก้ schema)
npm run db:deploy    # prisma migrate deploy (apply migrations — ใช้ตอน deploy)
npm run db:studio    # Prisma Studio
```

---

## ฐานข้อมูล & Migrations

schema อยู่ที่ `prisma/schema.prisma` และมี migration history ที่
`prisma/migrations/` (เริ่มจาก `…_init`)

- **เพิ่ม/แก้ตาราง:** แก้ `schema.prisma` แล้ว `npm run db:migrate -- --name <ชื่อ>`
  จะสร้างไฟล์ migration ใหม่ + apply ลง dev DB
- **apply ขึ้น production:** `npm run db:deploy` (รัน migration ที่ยังไม่ถูก apply)

### DB ที่สร้างไว้แล้วด้วยวิธีอื่น (baseline)

ถ้า production DB ถูกสร้างตารางไว้แล้ว (เช่นวาง SQL เอง) ให้ทำ baseline ก่อน
ครั้งเดียว เพื่อบอก Prisma ว่า init migration ถูก apply แล้ว:

```bash
npx prisma migrate resolve --applied 20260101000000_init
```

จากนั้น `npm run db:deploy` จะ apply เฉพาะ migration ใหม่ ๆ ต่อไป

---

## Deploy (Vercel + Supabase)

1. Push repo ขึ้น GitHub
2. Import เข้า [Vercel](https://vercel.com) (deploy จาก `main`)
3. ใส่ environment variables ใน Vercel Project Settings:
   `DATABASE_URL` (pooled 6543), `DIRECT_URL` (direct 5432),
   `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (โดเมนจริง),
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
4. **สร้างตารางใน DB** (เลือกวิธีใดวิธีหนึ่ง):
   - แนะนำ: `npm run db:deploy` (ชี้ `DATABASE_URL`/`DIRECT_URL` ไป production)
   - หรือวาง SQL จาก migration (`prisma/migrations/…_init/migration.sql`) ใน
     **Supabase → SQL Editor**
5. Build อ่านจาก `vercel.json` — รัน `prisma generate && next build` ให้อัตโนมัติ
6. เพิ่ม production redirect URI ใน Google OAuth ให้ตรงโดเมน Vercel

> หมายเหตุ: build ไม่ได้รัน `migrate deploy` ให้อัตโนมัติ (กันบิลด์ล้มถ้า DB
> เข้าไม่ถึง) — รัน migration เองตามขั้นตอนที่ 4
