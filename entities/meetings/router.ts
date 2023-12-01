import express, { Request, Response } from "express";
import CONF from "../../core/config";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  checkArtistAvilablityDates,
  createMeeting,
  deleteMeeting,
  editMeeting,
  filterMettings,
  getMeetingDetails,
  getUserMeetings,
} from "./controller";
const router = express.Router();

router.post("/create-meeting", authMiddleware, createMeeting);
router.get("/", authMiddleware, getUserMeetings);
router.post("/checkavailability", authMiddleware, checkArtistAvilablityDates);
router.post("/filter", authMiddleware, filterMettings);
router.get("/:meetingId", authMiddleware, getMeetingDetails);
router.delete("/meeting/:meetingId", authMiddleware, deleteMeeting);
router.put("/edit-meeting/:meetingId", authMiddleware, editMeeting);

export = router;
