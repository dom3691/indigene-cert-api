import { db, auditLogsTable } from "@workspace/db";

export interface AuditEntry {
  tenantId?: number | null;
  actorName: string;
  actorRole?: string | null;
  action: string;
  recordType?: string | null;
  recordId?: string | number | null;
  outcome?: string | null;
  detail?: string | null;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  await db.insert(auditLogsTable).values({
    tenantId: entry.tenantId ?? null,
    actorName: entry.actorName,
    actorRole: entry.actorRole ?? null,
    action: entry.action,
    recordType: entry.recordType ?? null,
    recordId: entry.recordId != null ? String(entry.recordId) : null,
    outcome: entry.outcome ?? null,
    detail: entry.detail ?? null,
  });
}
