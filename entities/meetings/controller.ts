import express, { NextFunction, Request, Response } from "express";
import Meetings from "./model";
import User from "../users/model";
import CONF from "../../core/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AuthenticatedRequest from "../../core/customInterfaces";

// Controlador para crear una cita entre un usuario y un tatuador
export const createMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dateMetting, dateMettingEnd, typeIntervention, price } = req.body;

    // Extraer el ID del usuario y su rol del token JWT
    const { id: userIdFromToken, role: userRole } = req.user;
    // Crear un objeto para almacenar los campos faltantes
    const missingFields: string[] = [];

    if (!dateMetting || dateMetting.trim() === "") {
      missingFields.push("dateMetting");
    }
    if (!dateMettingEnd || dateMettingEnd.trim() === "") {
      missingFields.push("dateMettingEnd");
    }
    if (!typeIntervention || typeIntervention.trim() === "") {
      missingFields.push("typeIntervention");
    }

    if (missingFields.length > 0) {
      // Lanza un error con un código de estado HTTP personalizado
      const error = new Error("Campos requeridos faltantes");
      (error as any).status = 400;
      (error as any).missingFields = missingFields;
      throw error;
    }

    // Verificar que la fecha sea válida (a partir de today)
    const dateMeet = new Date(dateMetting);
    const dateMeetEnd = new Date(dateMettingEnd);
    const today = new Date();
    if (dateMeet <= today) {
      const error = new Error("La fecha de la cita debe ser a partir de hoy");
      (error as any).status = 400;
      throw error;
    }

    // Verificar que dateMettingEnd no sea inferior a dateMetting
    if (dateMeetEnd < dateMeet) {
      const error = new Error(
        "La fecha de finalización no puede ser anterior a la fecha de inicio"
      );
      (error as any).status = 400;
      throw error;
    }

    let tattooArtist, client;

    if (userRole === "user" && req.body.tattooArtist) {
      // Si el usuario es un cliente y proporcionaron un tatuador, usa el ID proporcionado.
      tattooArtist = req.body.tattooArtist;
    } else if (userRole === "tatooArtist") {
      // Si el usuario es un tatuador, busca aleatoriamente un cliente y usa su ID.
      const randomClient = await User.findOne({ role: "user" });
      if (randomClient) {
        client = randomClient._id;
      } else {
        const error = new Error("No hay usuarios clientes disponibles");
        (error as any).status = 404;
        throw error;
      }
    }

    // Verificar que el tatuador no tenga otra cita en el mismo rango de fechas
    const dateExist = await Meetings.findOne({
      tattooArtist,
      $or: [
        {
          // Caso 1: La fecha de inicio de la cita está dentro del rango
          dateMetting: {
            $gte: dateMetting,
            $lt: dateMettingEnd,
          },
        },
        {
          // Caso 2: La fecha de finalización de la cita está dentro del rango
          dateMettingEnd: {
            $gt: dateMetting,
            $lte: dateMettingEnd,
          },
        },
        {
          // Caso 3: La cita abarca todo el rango
          dateMetting: {
            $lte: dateMetting,
          },
          dateMettingEnd: {
            $gte: dateMettingEnd,
          },
        },
      ],
    });

    if (dateExist) {
      const error = new Error(
        "El tatuador ya tiene una cita en esa fecha y hora"
      );
      (error as any).status = 409; // 409 Conflict
      throw error;
    }

    // Crear un objeto para almacenar los campos de la cita
    const meetingFields = {
      client,
      tattooArtist,
      dateMetting,
      dateMettingEnd,
      typeIntervention,
      price,
    };

    // Agregar el cliente y el tatuador según el rol del usuario que realiza la solicitud
    if (userRole === "user") {
      meetingFields.client = userIdFromToken; // ID del usuario desde el token
      meetingFields.tattooArtist = tattooArtist; // ID del tatuador desde la búsqueda
    } else if (userRole === "tattoo_artist") {
      meetingFields.client = client; // ID del cliente desde el body
      meetingFields.tattooArtist = userIdFromToken; // ID del tatuador desde el token
    } else if (userRole === "superadmin") {
      // Por ejemplo, supongamos que el cuerpo de la solicitud contiene los IDs del cliente y el tatuador
      const { client, tattooArtist } = req.body;

      // Verificar si los IDs proporcionados son válidos y existen en la base de datos
      const clientExists = await User.findById(client);
      const tattooArtistExists = await User.findById(tattooArtist);

      if (!clientExists || !tattooArtistExists) {
        const error = new Error("IDs de cliente o tatuador inválidos");
        (error as any).status = 400;
        throw error;
      }

      // Ahora podemos asignar los IDs proporcionados al cliente y al tatuador
      meetingFields.client = client;
      meetingFields.tattooArtist = tattooArtist;
    }

    // Crea la nueva cita con los campos definidos
    const newMeeting = new Meetings(meetingFields);

    // Guarda la cita en la base de datos
    await newMeeting.save();

    res.status(201).json({ message: "Cita creada con éxito" });
  } catch (error) {
    next(error);
  }
};

export const editMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const citaId = req.params.meetingId;
    const { fecha, tipoIntervencion, tatuador, client } = req.body;
    const currentUser = req.user; // Usuario actual autenticado

    // Buscar la cita por su ID
    const meeting = await Meetings.findById(citaId);

    if (!meeting) {
      const error = new Error("Cita no encontrada");
      (error as any).status = 404;
      throw error;
    }

    // Verificar permisos de edición
    if (
      (currentUser.role === "user" &&
        meeting.client.toString() !== currentUser.id) ||
      (currentUser.role === "tatooArtist" &&
        meeting.tattooArtist &&
        meeting.tattooArtist.toString() !== currentUser.id)
      // ||  currentUser.role === "superadmin"
    ) {
      const error = new Error("No tienes permiso para editar esta cita");
      (error as any).status = 403; // 403 Forbidden
      throw error;
    }

    // Verificar que la fecha sea válida (a partir de today)
    const dateMeet = new Date(fecha);
    const today = new Date();
    if (dateMeet <= today) {
      const error = new Error("La fecha de la cita debe ser a partir de hoy");
      (error as any).status = 400;
      throw error;
    }

    // Realizar la actualización de los campos según el rol del usuario
    if (currentUser.role === "user") {
      meeting.dateMetting = dateMeet || meeting.dateMetting;
      meeting.typeIntervention = tipoIntervencion || meeting.typeIntervention;
    } else if (currentUser.role === "tatooArtist") {
      meeting.dateMetting = dateMeet || meeting.dateMetting;
      meeting.typeIntervention = tipoIntervencion || meeting.typeIntervention;
      meeting.client = client || meeting.client;
    } else if (currentUser.role === "superadmin") {
      console.log("edicion super");
      meeting.dateMetting = dateMeet || meeting.dateMetting;
      meeting.typeIntervention = tipoIntervencion || meeting.typeIntervention;
      meeting.client = client || meeting.client;
      meeting.tattooArtist = tatuador || meeting.tattooArtist;
    }

    // Guardar los cambios en la base de datos
    await meeting.save();

    res.status(200).json({ message: "Cita actualizada con éxito" });
  } catch (error) {
    next(error);
  }
};
