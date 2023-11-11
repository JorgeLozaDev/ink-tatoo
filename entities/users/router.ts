import express, { Request, Response } from "express";
import CONF from "../../core/config";
import { loginUser, singUp } from "./controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
const router = express.Router();

router.post("/singup", singUp);
router.post("/login", loginUser);
router.get("/protected", authMiddleware, (req, res) => {
  // El middleware de autenticación ya ha verificado el token, así que el usuario es válido
  return res.status(200).json({ message: "Token JWT válido" });
});

export = router;
