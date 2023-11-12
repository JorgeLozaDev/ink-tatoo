import express, { Request, Response } from "express";
import CONF from "../../core/config";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { createMeeting, editMeeting } from "./controller";
const router = express.Router();

router.post("/create-meeting", authMiddleware, createMeeting);

router.put('/edit-meeting/:meetingId', authMiddleware, editMeeting);


export = router;
