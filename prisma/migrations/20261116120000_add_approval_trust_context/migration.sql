-- Persist the end-user and cross-organization context of an approval so the
-- final decision can mirror trust.outbound_call and keep attribution.

-- AlterTable
ALTER TABLE "ApprovalRequest" ADD COLUMN     "endUserId" TEXT,
ADD COLUMN     "endUserExternalId" TEXT,
ADD COLUMN     "trustRelationshipId" TEXT;

-- AlterTable
ALTER TABLE "AgentEvent" ADD COLUMN     "endUserExternalId" TEXT;
