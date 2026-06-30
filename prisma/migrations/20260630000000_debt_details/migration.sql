-- AlterTable: add extended debt fields (type, lender, balance, min payment, due day, end date)
ALTER TABLE "Debt" ADD COLUMN IF NOT EXISTS "debtType" TEXT;
ALTER TABLE "Debt" ADD COLUMN IF NOT EXISTS "lender" TEXT;
ALTER TABLE "Debt" ADD COLUMN IF NOT EXISTS "balance" DECIMAL(14,2);
ALTER TABLE "Debt" ADD COLUMN IF NOT EXISTS "minPayment" DECIMAL(14,2);
ALTER TABLE "Debt" ADD COLUMN IF NOT EXISTS "dueDay" INTEGER;
ALTER TABLE "Debt" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);
