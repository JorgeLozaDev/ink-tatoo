import express, { Request, Response } from "express";
import "dotenv/config";

const app = express();
app.use(express.json());

// ROUTES
// import userRouter from "./entities/user/routes";
// import tatoRouter from "./entities/tatuador/routes";

// app.use("/user/", userRouter);
// app.use("/tatoo/", tatoRouter);

app.listen(3000, () => console.log("Servidor levantado en 3000"));

