import express, { NextFunction, Request, Response } from "express";
import User from "./model";
import CONF from "../../core/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AuthenticatedRequest from "../../core/customInterfaces";


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
    const hashedPassword = await bcrypt.hash(password, CONF.BCRYTP_LOOP);

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

// Inicio de sesión de usuarios
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Buscar al usuario por nombre de usuario
    const user = await User.findOne({ email });

    if (!user) {
      // Lanza un error con un código de estado HTTP personalizado
      const error = new Error("El usuario no existe");
      (error as any).status = 404;
      throw error;
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Lanza un error con un código de estado HTTP personalizado
      const error = new Error("Usuario o contraseña incorrectas");
      (error as any).status = 409;
      throw error;
    }

    // Generar y firmar un token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      CONF.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Crear un objeto con los datos del usuario y el token
    // const userData = {
    //   id: user._id,
    //   name: user.name,
    //   lastname: user.lastname,
    //   email: user.email,
    //   username: user.username,
    //   role: user.role,
    //   // Agrega aquí otros campos del usuario que desees incluir en la respuesta
    // };

    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};

// Controlador para actualizar datos personales del usuario
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, lastname, email, username, password } = req.body;
    const userId = req.user.id; // Obtén el ID del usuario autenticado desde el middleware

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

    if (missingFields.length > 0) {
      // Lanza un error con un código de estado HTTP personalizado
      const error = new Error("Campos requeridos faltantes");
      (error as any).status = 400;
      (error as any).missingFields = missingFields;
      throw error;
    }

    // Busca al usuario por ID
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("Usuario no encontrado");
      (error as any).status = 404;
      throw error;
    }

    // Actualiza los datos personales del usuario
    user.name = name;
    user.lastname = lastname;
    user.email = email;
    user.username = username;
    // Si la contraseña cambia, puedes volver a generar el token
    if (password && password.trim() != "") {
      // Encripta la nueva contraseña antes de almacenarla en la base de datos
      const hashedPassword = await bcrypt.hash(password, CONF.BCRYTP_LOOP);
      user.password = hashedPassword;

      // Genera y firma un nuevo token JWT
      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        CONF.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res
        .status(200)
        .json({ message: "Datos personales actualizados con éxito", token });
    } else {
      await user.save();
      res
        .status(200)
        .json({ message: "Datos personales actualizados con éxito" });
    }
  } catch (error) {
    next(error);
  }
};

// Controlador para obtener el perfil del usuario
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id; // Obtén el ID del usuario autenticado desde el middleware

    // Busca al usuario por ID
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("Usuario no encontrado");
      (error as any).status = 404;
      throw error;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
