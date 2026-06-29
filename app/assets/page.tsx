import { redirect } from 'next/navigation';
import { Boxes, Wallet, TrendingDown } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { DonutChart } from '@/components/charts/donut-chart';
import { AssetModal } from '@/components/assets/asset-modal';
import { DeleteAssetButton } from '@/components/assets/delete-asset-button';
import { auth } from '@/auth';
import { listAssets } from '@/server/services/assets';
import { formatTHB } from '@/lib/money';

const PALETTE = [
  '#5b8cff',
  '#34d399',
  '#f472b6',
  '#fbbf24',
  '#22d3ee',
  '#a78bfa',
  '#fb923c',
  '#94a3b8',
];

const dateFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default async function AssetsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { assets, totalPurchase, totalCurrent, totalDepreciation } =
    await listAssets(session.user.id);

  const allocation = assets
    .filter((a) => a.currentValue > 0)
    .map((a, i) => ({
      name: a.name,
      value: a.currentValue,
      color: PALETTE[i % PALETTE.length] as string,
    }));

  const cards = [
    { label: 'มูลค่าซื้อรวม', value: totalPurchase, icon: Wallet },
    { label: 'มูลค่าปัจจุบันรวม', value: totalCurrent, icon: Boxes },
    { label: 'ค่าเสื่อมสะสมรวม', value: totalDepreciation, icon: TrendingDown },
  ];

  return (
    <AppShell title="ทรัพย์สิน">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            ทรัพย์สินและมูลค่าหลังหักค่าเสื่อม
          </p>
          <AssetModal />
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {formatTHB(c.value)}
                </p>
              </div>
            );
          })}
        </section>

        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-14 text-center">
            <Boxes className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีทรัพย์สิน — เพิ่มได้จากปุ่ม “เพิ่มทรัพย์สิน”
            </p>
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5 lg:col-span-1">
              <h2 className="mb-3 font-semibold">สัดส่วนมูลค่าปัจจุบัน</h2>
              <DonutChart data={allocation} emptyText="ยังไม่มีมูลค่า" />
            </div>

            <ul className="space-y-3 lg:col-span-2">
              {assets.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{a.name}</span>
                        {a.kind && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                            {a.kind}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        ซื้อ {dateFmt.format(new Date(a.purchaseDate))}
                        {a.usefulLifeYears
                          ? ` · อายุใช้งาน ${a.usefulLifeYears} ปี`
                          : ' · ไม่คิดค่าเสื่อม'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <AssetModal asset={a} />
                      <DeleteAssetButton id={a.id} />
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">มูลค่าซื้อ</dt>
                      <dd className="font-medium tabular-nums">
                        {formatTHB(a.purchaseValue)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        ค่าเสื่อมสะสม
                      </dt>
                      <dd className="font-medium tabular-nums text-expense">
                        {formatTHB(a.accumulatedDepreciation)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        มูลค่าปัจจุบัน
                      </dt>
                      <dd className="font-semibold tabular-nums text-income">
                        {formatTHB(a.currentValue)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
