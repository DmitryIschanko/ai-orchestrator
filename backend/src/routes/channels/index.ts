import { Router } from "express";
import telegramRoutes from "./telegram.routes.js";

const router = Router();

router.use("/telegram", telegramRoutes);

export default router;
