import mongoose from "../../config/mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, required: true, select:false },
    birthday: { type: Date }, 
    role: {
      type: String,
      enum: ["user", "tatooArtist", "superadmin"],
      required: true,
    },
    // Otros campos de información personal del usuario (nombre, correo, etc.).
    isDeleted: { type: Boolean, default: false }, // Nuevo campo para el borrado lógico.
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const user = mongoose.model("user", userSchema);

export = user;
