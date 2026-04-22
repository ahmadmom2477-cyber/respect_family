import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import streamersRouter from "./streamers";
import channelRequestsRouter from "./channelRequests";
import favoritesRouter from "./favorites";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(streamersRouter);
router.use(channelRequestsRouter);
router.use(favoritesRouter);
router.use(statsRouter);

export default router;
