import Metings from "../../entities/meetings/model";
export const validateRequiredFields = (
  objeto: any,
  camposRequeridos: string[]
) => {
  const camposFaltantes: string[] = [];

  camposRequeridos.forEach((campo) => {
    if (!objeto[campo] || objeto[campo].trim() === "") {
      camposFaltantes.push(campo);
    }
  });

  if (camposFaltantes.length > 0) {
    const error = new Error("Campos requeridos faltantes");
    (error as any).status = 400;
    (error as any).missingFields = camposFaltantes;
    throw error;
  }
};

export const validateDateAndAge = (dateString: string): Date | null => {
  if (dateString && dateString.trim() !== "") {
    const userBirthday = new Date(dateString);
    const today = new Date();

    const age = today.getFullYear() - userBirthday.getFullYear();
    if (age < 16) {
      const error = new Error("Debes tener al menos 16 años para registrarte");
      (error as any).status = 400;
      throw error;
    }

    // Si la fecha y la edad son válidas, devolver la fecha
    return userBirthday;
  }

  return null; // Devolver null si no se proporciona una fecha
};

export const validateMeetingDates = (
  dateMetting: string,
  dateMettingEnd: string
): { dateMeet: Date; dateMeetEnd: Date } => {
  const dateMeet = new Date(dateMetting);
  const dateMeetEnd = new Date(dateMettingEnd);

  const today = new Date();

  if (dateMeet <= today) {
    const error = new Error("La fecha de la cita debe ser a partir de hoy");
    (error as any).status = 400;
    throw error;
  }

  if (dateMeetEnd < dateMeet) {
    const error = new Error(
      "La fecha de finalización no puede ser anterior a la fecha de inicio"
    );
    (error as any).status = 400;
    throw error;
  }

  return { dateMeet, dateMeetEnd };
};

export const isValidMeetingDateRange = async (
  tattooArtist: string, // Asegúrate de que sea del tipo correcto
  dateMetting: Date,
  dateMettingEnd: Date
): Promise<boolean> => {
  const existingMeeting = await Metings.findOne({
    tattooArtist,
    $or: [
      {
        dateMetting: {
          $gte: dateMetting,
          $lt: dateMettingEnd,
        },
      },
      {
        dateMettingEnd: {
          $gt: dateMetting,
          $lte: dateMettingEnd,
        },
      },
      {
        dateMetting: {
          $lte: dateMetting,
        },
        dateMettingEnd: {
          $gte: dateMettingEnd,
        },
      },
    ],
  });

  return !existingMeeting; // Devuelve true si no hay conflicto
};
