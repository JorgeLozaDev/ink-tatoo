import express, { Request, Response } from "express";
import CONF from "../../core/config";
import { loginUser, singUp, updateProfile } from "./controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
const router = express.Router();

// ======RUTAS DE USUARIO=========
router.post("/singup", singUp);
router.post("/login", loginUser);
router.put('/updateProfile', authMiddleware, updateProfile);
router.get("/profile", authMiddleware, (req, res) => {
  // El middleware de autenticación ya ha verificado el token, así que el usuario es válido
  return res.status(200).json({ message: "Token JWT válido" });
});
// ======FIN RUTAS DE USUARIO=========

export = router;
