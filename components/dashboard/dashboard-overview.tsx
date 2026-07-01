'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';
import {
  Eye,
  EyeOff,
  Gem,
  TrendingUp,
  PiggyBank,
  LineChart,
  Landmark,
  CreditCard,
  RefreshCw,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { formatTHB } from '@/lib/money';
import { dueRelativeText } from '@/lib/debt-due';
import type { FinancialOverview } from '@/server/services/overview';

const MASK = '฿ ••••••';

function toneColor(tone: 'good' | 'warn' | 'bad'): string {
  if (tone === 'good') return '#2dd4bf';
  if (tone === 'warn') return '#fbbf24';
  return '#f87171';
}

function ScoreRing({
  score,
  grade,
  color,
}: {
  score: number;
  grade: string;
  color: string;
}) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-secondary"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {grade}
        </span>
        <span className="text-[11px] text-muted-foreground">{score}/100</span>
      </div>
    </div>
  );
}

export function DashboardOverview({ data }: { data: FinancialOverview }) {
  const [hidden, setHidden] = useState(false);
  const money = (n: number) => (hidden ? MASK : formatTHB(n));

  const dateLabel = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'full',
  }).format(new Date());

  const stats = [
    {
      label: 'รายได้เดือนนี้',
      value: data.incomeThisMonth,
      icon: TrendingUp,
      hint: 'เดือนนี้',
      tint: 'text-income',
    },
    {
      label: 'เงินออมทั้งหมด',
      value: data.savings,
      icon: PiggyBank,
      tint: 'text-primary',
    },
    {
      label: 'พอร์ตหุ้น',
      value: data.stocks,
      icon: LineChart,
      hint: '+' + formatTHB(0),
      tint: 'text-accent',
    },
    {
      label: 'กองทุนรวม',
      value: data.funds,
      icon: Landmark,
      hint: '+' + formatTHB(0),
      tint: 'text-primary',
    },
    {
      label: 'หนี้สินคงเหลือ',
      value: data.debtRemaining,
      icon: CreditCard,
      tint: 'text-expense',
    },
  ];

  const healthColor = toneColor(data.health.tone);
  const maxIncome = Math.max(1, ...data.monthlyIncome.map((m) => m.value));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">ภาพรวมการเงิน</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <RefreshCw className="h-3.5 w-3.5" />
          อัปเดตอัตโนมัติ
        </span>
      </div>

      {/* Hero — total assets */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-income" />
              สินทรัพย์รวม
            </p>
            <p className="mt-2 bg-gradient-to-r from-income to-primary bg-clip-text text-4xl font-bold text-transparent">
              {money(data.totalAssets)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              เงินออม + หุ้น + กองทุน + ทรัพย์สิน
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setHidden((h) => !h)}
              aria-label={hidden ? 'แสดงจำนวนเงิน' : 'ซ่อนจำนวนเงิน'}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
              {hidden ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/investments"
              aria-label="พอร์ตการลงทุน"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-accent transition-colors hover:bg-secondary/70"
            >
              <Gem className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <Icon className={`h-4 w-4 ${s.tint}`} />
              </div>
              <p className="mt-2 text-xl font-bold tabular-nums">
                {money(s.value)}
              </p>
              {s.hint && (
                <p className={`mt-0.5 text-xs ${s.tint}`}>{s.hint}</p>
              )}
            </div>
          );
        })}
      </section>

      {/* Net worth */}
      <section className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <Landmark className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold">มูลค่าสุทธิ</p>
            <p className="text-xs text-muted-foreground">
              สินทรัพย์รวม − หนี้สิน
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-xl font-bold tabular-nums ${
              data.netWorth >= 0 ? 'text-income' : 'text-expense'
            }`}
          >
            {money(data.netWorth)}
          </p>
          <p className="text-xs text-muted-foreground">
            {money(data.totalAssets)} − {money(data.debtRemaining)}
          </p>
        </div>
      </section>

      {/* AI financial health */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-accent" />
            AI วิเคราะห์สุขภาพทางการเงิน
          </p>
          <ScoreRing
            score={data.score}
            grade={data.grade}
            color={healthColor}
          />
        </div>
        <div
          className="flex items-start gap-3 rounded-lg border p-4"
          style={{
            borderColor: `${healthColor}55`,
            backgroundColor: `${healthColor}14`,
          }}
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0"
            style={{ color: healthColor }}
          />
          <div>
            <p className="font-semibold" style={{ color: healthColor }}>
              {data.health.title}
            </p>
            <p className="text-sm text-muted-foreground">{data.health.desc}</p>
          </div>
        </div>
      </section>

      {/* Bottom panels */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Monthly income */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 flex items-center gap-2 font-semibold">
            <span className="h-4 w-1 rounded bg-primary" />
            รายได้รายเดือน
          </p>
          {data.hasIncomeData ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyIncome}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                    formatter={(v) => [formatTHB(Number(v)), 'รายได้']}
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.monthlyIncome.map((m) => (
                      <Cell
                        key={m.month}
                        fill={m.value >= maxIncome ? '#2dd4bf' : '#34d399'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <BarChart3 className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium">ยังไม่มีข้อมูลรายได้</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                เพิ่มรายการที่เมนู “รายรับ–รายจ่าย”
              </p>
              <Link
                href="/transactions"
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                ไปเพิ่มรายรับ →
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming payments */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 flex items-center gap-2 font-semibold">
            <CalendarClock className="h-4 w-4 text-amber-500" />
            การชำระที่ใกล้ถึง
          </p>
          {data.upcoming.length > 0 ? (
            <ul className="space-y-2">
              {data.upcoming.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">{u.name}</span>
                  {u.amount != null && (
                    <span className="tabular-nums text-muted-foreground">
                      {money(u.amount)}
                    </span>
                  )}
                  <span className="shrink-0 font-medium text-amber-600 dark:text-amber-400">
                    {dueRelativeText(u.daysUntil)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-income/10 text-income">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium">ไม่มีการชำระที่ใกล้ถึง</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                ไม่มีหนี้ที่ต้องจ่ายเร็ว ๆ นี้
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
