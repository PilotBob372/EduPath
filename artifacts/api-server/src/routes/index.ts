import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eduRouter from "./edu";
import anthropicRouter from "./anthropic";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eduRouter);
router.use(anthropicRouter);

export default router;
