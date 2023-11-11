import express, { NextFunction, Request, Response } from "express";
import User from "./model";
import CONF from "../../core/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import errorHandler from '../middlewares/errorHandler';

export const singUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener datos del cuerpo de la solicitud
    const { name, lastname, email, username, password, role } = req.body;

    // Crear un objeto para almacenar los campos faltantes
    const missingFields: string[] = [];

    if (!name || name.trim() === "") {
      missingFields.push("name");
    }
    if (!lastname || lastname.trim() === "") {
      missingFields.push("lastname");
    }
    if (!email || email.trim() === "") {
      missingFields.push("email");
    }
    if (!username || username.trim() === "") {
      missingFields.push("username");
    }
    if (!password || password.trim() === "") {
      missingFields.push("password");
    }

    // Asignar el rol por defecto si "role" viene vacío
    const userRole = role || "user";

    // Encriptar la contraseña antes de almacenarla en la base de datos
    const hashedPassword = await bcrypt.hash(password,  CONF.BCRYTP_LOOP);

    if (missingFields.length > 0) {
      // Lanza un error con un código de estado HTTP personalizado
      const error = new Error("Campos requeridos faltantes");
      (error as any).status = 400;
      (error as any).missingFields = missingFields;
      throw error;
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Lanza un error con un código de estado HTTP personalizado
      const error = new Error("El usuario ya existe");
      (error as any).status = 409;
      throw error;
    }

    // Crear un nuevo usuario con el rol asignado
    const newUser = new User({
      name,
      lastname,
      email,
      username,
      password: hashedPassword,
      role: userRole,
    });
    await newUser.save();

    res.status(201).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    next(error);
  }
};
