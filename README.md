# MoneyPad Clone

แอปบันทึกรายรับ-รายจ่ายส่วนบุคคล (personal finance tracker) แรงบันดาลใจจาก
moneypadpro.com — responsive, หลายธีม, รองรับ Google OAuth + email/password

> **สถานะปัจจุบัน: Phase 0** — โครงโปรเจกต์, ระบบธีม, และ responsive shell
> ฟีเจอร์การเงินจริงจะทยอยมาในเฟสถัดไป

## Tech stack

| ส่วน         | เทคโนโลยี                                            |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 14 (App Router) + TypeScript (strict)       |
| Styling      | Tailwind CSS + CSS variables (theming)              |
| Database     | PostgreSQL (Supabase)                               |
| ORM          | Prisma                                              |
| Auth         | NextAuth (Auth.js) — Google + Credentials _(Phase 1)_ |
| Validation   | Zod _(Phase 2)_                                     |
| Charts       | Recharts _(Phase 2)_                                |
| Deploy       | Vercel (app) + Supabase (DB)                        |

## โครงโฟลเดอร์

```
app/         # App Router routes + layout
components/  # UI: layout shell, theme switcher, ...
lib/         # helpers (themes, cookie, utils)
prisma/      # schema.prisma
server/      # Server Actions + services (per phase)
types/       # shared types
```

## ระบบธีม (5 ธีม)

`dark`, `light`, `cute`, `hitech`, `soft-warm` — แต่ละธีมกำหนดชุด CSS variable
เดียวกันใน `app/globals.css` ส่วน Tailwind map สีไปยังตัวแปรเหล่านี้
(`tailwind.config.ts`) ธีมที่เลือกถูกเก็บใน cookie และอ่านฝั่ง server ใน
`app/layout.tsx` เพื่อ stamp `data-theme` ลง `<html>` ก่อน paint แรก —
จึงไม่มีอาการธีมกระพริบ (FOUC)

---

## เริ่มต้นใช้งาน (local dev)

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment

คัดลอกไฟล์ตัวอย่างแล้วเติมค่า:

```bash
cp .env.example .env
```

### 3. ตั้งค่า Supabase (PostgreSQL)

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. ไปที่ **Project Settings → Database → Connection string**
3. ใส่ค่าใน `.env`:
   - `DATABASE_URL` = connection แบบ **pooled** (PgBouncer, port `6543`,
     ต่อท้าย `?pgbouncer=true&connection_limit=1`) — ใช้ตอน runtime
   - `DIRECT_URL` = connection แบบ **direct** (port `5432`) — ใช้ตอน migrate
4. สร้าง Prisma client:
   ```bash
   npm run db:generate
   ```
   > schema ยังไม่มี model ใน Phase 0 — โมเดลจะถูกเพิ่ม (และ `db:push`/`migrate`)
   > ตั้งแต่ Phase 1 เป็นต้นไป

### 4. ตั้งค่า Google OAuth _(เตรียมไว้สำหรับ Phase 1)_

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services
   → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Authorized redirect URI:
   - dev: `http://localhost:3000/api/auth/callback/google`
   - prod: `https://<your-domain>/api/auth/callback/google`
4. ใส่ `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` ใน `.env`
5. สร้าง `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

### 5. รัน dev server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) — ควรเห็นหน้า shell
และสลับ 5 ธีมได้จากปุ่ม 🎨 มุมขวาบน

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (strict)
npm run format       # Prettier
npm run db:generate  # prisma generate
npm run db:push      # push schema → DB (Phase 1+)
npm run db:studio    # Prisma Studio
```

## Deploy (Vercel + Supabase)

1. Push repo ขึ้น GitHub
2. Import โปรเจกต์เข้า [Vercel](https://vercel.com)
3. ใส่ environment variables ทั้งหมดจาก `.env` ใน Vercel Project Settings
   (ตั้ง `NEXTAUTH_URL` เป็น domain จริง)
4. Build command/Output ใช้ค่า default ของ Next.js
5. เพิ่ม production redirect URI ใน Google OAuth ให้ตรงกับ domain ของ Vercel
