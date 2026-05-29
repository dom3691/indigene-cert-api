import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountsRouter from "./accounts";
import tenantsRouter from "./tenants";
import applicationsRouter from "./applications";
import certificatesRouter from "./certificates";
import platformRouter from "./platform";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountsRouter);
router.use(tenantsRouter);
router.use(applicationsRouter);
router.use(certificatesRouter);
router.use(platformRouter);

export default router;
