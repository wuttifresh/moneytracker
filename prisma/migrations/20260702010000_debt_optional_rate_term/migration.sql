-- AlterTable: interest rate and installment count are not always known up front
-- (e.g. credit cards have no fixed term, and some statements omit the rate).
ALTER TABLE "Debt" ALTER COLUMN "annualRate" DROP NOT NULL;
ALTER TABLE "Debt" ALTER COLUMN "termMonths" DROP NOT NULL;
