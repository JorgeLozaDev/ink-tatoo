import express, { Request, Response } from "express";
import CONF from "../../core/config";
import { getProfile, loginUser, singUp, updateProfile } from "./controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
const router = express.Router();

// ======RUTAS DE USUARIO=========
router.post("/singup", singUp);
router.post("/login", loginUser);
router.put("/updateProfile", authMiddleware, updateProfile);
router.get("/profile", authMiddleware, getProfile);
// ======FIN RUTAS DE USUARIO=========

export = router;
