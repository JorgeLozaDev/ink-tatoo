import express, { Request, Response } from "express";
import "dotenv/config";
import errorHandler from "./middlewares/errorHandler";

const app = express();
app.use(express.json());

// ROUTER
import userRouter from "./entities/users/router";
// import tatoRouter from "./entities/tatuador/routes";

app.use("/user/", userRouter);
// app.use("/tatoo/", tatoRouter);
app.use(errorHandler);

app.listen(3000, () => console.log("Servidor levantado en 3000"));
