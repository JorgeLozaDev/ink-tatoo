import express, { Request, Response } from "express";
import CONF from "../../core/config";
import { singUp } from "./controller";
const router = express.Router();

router.post("/singup", singUp );

export = router;
 