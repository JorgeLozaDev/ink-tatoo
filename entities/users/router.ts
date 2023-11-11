import express, { Request, Response } from "express";
import CONF from "../../core/config";
import { loginUser, singUp } from "./controller";
const router = express.Router();

router.post("/singup", singUp );
router.post("/login", loginUser );

export = router;
 