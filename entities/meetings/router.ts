import express, { Request, Response } from "express";
import CONF from "../../core/config";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { createMeeting } from "./controller";
const router = express.Router();

router.post("/create-meeting", authMiddleware, createMeeting);

export = router;
