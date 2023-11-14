import express, { Request, Response } from "express";
import CONF from "../../core/config";
import {
  deleteUser,
  getAllTattooArtists,
  getAllUsers,
  getProfile,
  loginUser,
  singUp,
  updateProfile,
} from "./controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
const router = express.Router();

router.post("/singup", singUp);
router.post("/login", loginUser);
router.put("/updateProfile", authMiddleware, updateProfile);
router.get("/profile", authMiddleware, getProfile);
router.get("/tattooArtists", authMiddleware, getAllTattooArtists);
router.get("/", authMiddleware, getAllUsers);
router.delete("/:userId", authMiddleware, deleteUser);

export = router;
