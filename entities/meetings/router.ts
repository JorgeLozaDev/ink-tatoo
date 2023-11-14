import express, { Request, Response } from "express";
import CONF from "../../core/config";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  createMeeting,
  deleteMeeting,
  editMeeting,
  getUserMeetings,
} from "./controller";
const router = express.Router();

router.post("/create-meeting", authMiddleware, createMeeting);
router.get("/", authMiddleware, getUserMeetings);
router.delete("/meeting/:meetingId", authMiddleware, deleteMeeting);
router.put("/edit-meeting/:meetingId", authMiddleware, editMeeting);

export = router;
