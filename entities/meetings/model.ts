import { Double } from "mongodb";
import mongoose from "../../config/mongoose";

const meetingsSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tattooArtist: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dateMetting: { type: Date, required: true },
    dateMettingEnd: { type: Date, required: true },
    typeIntervention: {
      type: String,
      enum: ["tattoo", "piercing"],
      required: true,
    },
    // Otros campos relacionados con la cita.
    isDeleted: { type: Boolean, default: false }, // Nuevo campo para el borrado lógico.
    price: { type: Number },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const meetings = mongoose.model("meetings", meetingsSchema);

export = meetings;
