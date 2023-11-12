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
