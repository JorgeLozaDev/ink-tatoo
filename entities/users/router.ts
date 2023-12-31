import express, { Request, Response } from "express";
import CONF from "../../core/config";
import {
  changeRolUser,
  deleteUser,
  getAllTattooArtists,
  getAllTattooArtistsActives,
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
router.get("/availabletattooArtists", authMiddleware, getAllTattooArtistsActives);
router.get("/", authMiddleware, getAllUsers);
router.post("/", authMiddleware, getAllUsers);
router.put("/change-rol",authMiddleware, changeRolUser);
router.delete("/:userId", authMiddleware, deleteUser);

export = router;
