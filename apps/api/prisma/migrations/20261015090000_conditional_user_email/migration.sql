UPDATE "User"
SET "email" = NULL
WHERE "status" IN ('DISABLED', 'REJECTED');

DROP INDEX IF EXISTS "User_email_key";

ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "User"
  ADD CONSTRAINT "User_email_status_check"
  CHECK (
    ("status" IN ('ACTIVE', 'PENDING') AND "email" IS NOT NULL)
    OR ("status" IN ('DISABLED', 'REJECTED') AND "email" IS NULL)
  );

CREATE UNIQUE INDEX "User_active_pending_email_key"
  ON "User" ("email")
  WHERE "email" IS NOT NULL AND "status" IN ('ACTIVE', 'PENDING');
