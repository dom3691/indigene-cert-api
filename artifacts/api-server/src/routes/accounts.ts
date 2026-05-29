import { Router, type IRouter } from "express";
import { db, usersTable, tenantsTable } from "@workspace/db";
import { ListAccountsResponse } from "@workspace/api-zod";
import { mapAccount } from "../lib/serialize";

const router: IRouter = Router();

router.get("/accounts", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  const tenants = await db.select().from(tenantsTable);
  const tenantNames = new Map(tenants.map((t) => [t.id, t.name]));
  const data = users.map((u) =>
    mapAccount(u, u.tenantId != null ? tenantNames.get(u.tenantId) ?? null : null),
  );
  res.json(ListAccountsResponse.parse(data));
});

export default router;
