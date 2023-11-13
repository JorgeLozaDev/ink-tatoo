import mongoose from "mongoose";
import CONF from "../core/config";

mongoose
  .connect(CONF.DDBB_URL + CONF.DDBB_NAME, {})

  .then(() => console.log("Conectado correctamente a la BBDD"))
  .catch((e) => console.log(e));

export = mongoose;
