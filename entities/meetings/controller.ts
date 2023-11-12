import express, { NextFunction, Request, Response } from "express";
import Meetings from "./model";
import CONF from "../../core/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AuthenticatedRequest from "../../core/customInterfaces";

// Controlador para crear una cita entre un usuario y un tatuador
export const createMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { client, tattooArtist, dateMetting, typeIntervention } = req.body;

    // Crear un objeto para almacenar los campos faltantes
    const missingFields: string[] = [];

    if (!client || client.trim() === "") {
      missingFields.push("client");
    }
    if (!tattooArtist || tattooArtist.trim() === "") {
      missingFields.push("tattooArtist");
    }
    if (!dateMetting || dateMetting.trim() === "") {
      missingFields.push("dateMetting");
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
    const today = new Date();
    if (dateMeet <= today) {
      const error = new Error("La fecha de la cita debe ser a partir de hoy");
      (error as any).status = 400;
      throw error;
    }

    // Verificar que el tatuador no tenga otra cita en la misma fecha y hora
    const dateExist = await Meetings.findOne({
      tattooArtist,
      dateMetting,
    });

    if (dateExist) {
      const error = new Error(
        "El tatuador ya tiene una cita en esa fecha y hora"
      );
      (error as any).status = 409; // 409 Conflict
      throw error;
    }

    // Crea la nueva cita
    const newMeeting = new Meetings({
      client,
      tattooArtist,
      dateMetting,
      typeIntervention,
    });

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

    console.log(currentUser.role);
    // Verificar permisos de edición
    if (
      (currentUser.role === "user" && meeting.client.toString() !== currentUser.id) ||
        (currentUser.role === "tatooArtist" &&  meeting.tattooArtist && meeting.tattooArtist.toString() !== currentUser.id) ||
      currentUser.role === "superadmin"
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
