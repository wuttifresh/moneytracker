-- CreateTable: monthly statement history for revolving-credit debts (credit cards)
CREATE TABLE IF NOT EXISTS "DebtStatement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "statementMonth" TIMESTAMP(3) NOT NULL,
    "fullBalance" DECIMAL(14,2) NOT NULL,
    "minPayment" DECIMAL(14,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtStatement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DebtStatement_debtId_statementMonth_key" ON "DebtStatement"("debtId", "statementMonth");
CREATE INDEX IF NOT EXISTS "DebtStatement_userId_idx" ON "DebtStatement"("userId");
CREATE INDEX IF NOT EXISTS "DebtStatement_debtId_statementMonth_idx" ON "DebtStatement"("debtId", "statementMonth");

DO $$ BEGIN
  ALTER TABLE "DebtStatement" ADD CONSTRAINT "DebtStatement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DebtStatement" ADD CONSTRAINT "DebtStatement_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
