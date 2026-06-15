-- Add companyName column to Signal table (nullable, no default needed)
ALTER TABLE "Signal" ADD COLUMN "companyName" TEXT;
