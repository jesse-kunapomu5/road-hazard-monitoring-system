import { Router, type IRouter } from "express";
import healthRouter from "./health";
import detectionsRouter from "./detections";
import potholesRouter from "./potholes";
import roadsRouter from "./roads";
import feedRouter from "./feed";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/detections", detectionsRouter);
router.use("/potholes", potholesRouter);
router.use("/roads", roadsRouter);
router.use("/feed", feedRouter);
router.use("/summary", summaryRouter);

export default router;
