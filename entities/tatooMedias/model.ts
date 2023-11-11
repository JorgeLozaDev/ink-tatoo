import mongoose from "../../config/mongoose";

const tattooMediaSchema = new mongoose.Schema({
  tattoArtist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: { type: String }, // Puedes almacenar la URL de la imagen o el archivo de la imagen.
  description: { type: String },
  // Otros campos relacionados con el tatuaje, como estilo, tamaño, etc.
  isDeleted: { type: Boolean, default: false }, // Nuevo campo para el borrado lógico.
});

const tattoMedia = mongoose.model("tattoMedia", tattooMediaSchema);

export = tattoMedia;
