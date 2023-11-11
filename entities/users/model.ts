import mongoose from "../../config/mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["cliente", "tatuador", "superadmin"],
    required: true,
  },
  // Otros campos de información personal del usuario (nombre, correo, etc.).
  isDeleted: { type: Boolean, default: false }, // Nuevo campo para el borrado lógico.
});

const user = mongoose.model("user", userSchema);

export = user;
