import express, { Request, Response } from "express";
import "dotenv/config";
import errorHandler from "./middlewares/errorHandler";
import cors from "cors";

const app = express();
app.use(express.json());

// ROUTER
import userRouter from "./entities/users/router";
import meetingsRouter from "./entities/meetings/router";


app.use(cors());
// app.get("/",Response.send("heal: OK"))
app.get("/", (Request, Response) => {
    Response.send("Healcheck: ok");
  });
app.use("/user/", userRouter);
app.use("/meetings/", meetingsRouter);
app.use(errorHandler);

app.listen(3000, () => console.log("Servidor levantado en 3000"));
