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
    const { name, lastname, email, username, password, role, birthday } =
      req.body;

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

    let userBirthday: Date | null = null; // Valor predeterminado

    if (birthday && birthday.trim() != "") {
      // Verificar que la fecha sea válida (a partir de today)
      userBirthday = new Date(birthday);
      const today = new Date();

      const age = today.getFullYear() - userBirthday.getFullYear();
      if (age < 16) {
        const error = new Error(
          "Debes tener al menos 16 años para registrarte"
        );
        (error as any).status = 400;
        throw error;
      }
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
      birthday: userBirthday,
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
    const user = await User.findOne({ email }).select("+password");

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
    const { name, lastname, email, username, password, birthday } = req.body;
    const userIdFromToken = req.user.id; // Obtén el ID del usuario autenticado desde el middleware
    const userRole = req.user.role; // Obtén el rol del usuario autenticado

    // Buscar al usuario por los campos proporcionados (name, lastname, email, username)
    const userFound = await User.findOne({ email });

    if (!userFound) {
      const error = new Error("Usuario no encontrado");
      (error as any).status = 404;
      throw error;
    }

    // Verificar si el usuario actual es el propietario del perfil o es un superadmin
    if (
      userRole !== "superadmin" &&
      userFound._id.toString() !== userIdFromToken
    ) {
      const error = new Error("No tienes permiso para modificar este perfil");
      (error as any).status = 403;
      throw error;
    }

    // Crear un objeto para almacenar los campos faltantes
    const missingFields: string[] = [];

    if (!name || name.trim() === "") {
      missingFields.push("name");
    }
    if (!lastname || lastname.trim() === "") {
      missingFields.push("lastname");
    }
    // if (!email || email.trim() === "") {
    //   missingFields.push("email");
    // }
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

    if (birthday && birthday.trim() != "") {
      // Verificar que la fecha sea válida (a partir de today)
      let userBirthday = new Date(birthday);
      const today = new Date();

      const age = today.getFullYear() - userBirthday.getFullYear();
      if (age < 16) {
        const error = new Error(
          "Debes tener al menos 16 años para registrarte"
        );
        (error as any).status = 400;
        throw error;
      }
      userFound.birthday = userBirthday;
    }
    // Actualiza los datos personales del usuario
    userFound.name = name;
    userFound.lastname = lastname;
    // user.email = email;
    userFound.username = username;
    // Si la contraseña cambia, puedes volver a generar el token
    if (password && password.trim() != "") {
      // Encripta la nueva contraseña antes de almacenarla en la base de datos
      const hashedPassword = await bcrypt.hash(password, CONF.BCRYTP_LOOP);
      userFound.password = hashedPassword;

      // Genera y firma un nuevo token JWT
      const token = jwt.sign(
        {
          id: userFound._id,
          username: userFound.username,
          role: userFound.role,
        },
        CONF.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res
        .status(200)
        .json({ message: "Datos personales actualizados con éxito", token });
    } else {
      await userFound.save();
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

// Controlador para obtener todos los tatuadores
export const getAllTattooArtists = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar si el usuario autenticado es un superadmin
    const currentUser = req.user;

    if (currentUser.role !== "superadmin") {
      const error = new Error(
        "No tienes permisos para acceder a esta información"
      );
      (error as any).status = 403; // 403 Forbidden
      throw error;
    }

    // Obtener todos los usuarios con rol de tatuador
    const tattooArtists = await User.find({ role: "tatooArtist" }).exec();

    res.status(200).json({ tattooArtists });
  } catch (error) {
    next(error);
  }
};

// Controlador para obtener todos los usuarios con rol "user"
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar si el usuario autenticado es un superadmin
    const currentUser = req.user;

    if (currentUser.role !== 'superadmin') {
      const error = new Error('No tienes permisos para acceder a esta información');
      (error as any).status = 403; // 403 Forbidden
      throw error;
    }

    // Obtener todos los usuarios con rol de usuario
    const users = await User.find({ role: 'user' }).exec();

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

// Controlador para borrar un usuario (borrado lógico)
export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar si el usuario autenticado es un superadmin
    const currentUser = req.user;

    if (currentUser.role !== 'superadmin') {
      const error = new Error('No tienes permisos para borrar usuarios');
      (error as any).status = 403; // 403 Forbidden
      throw error;
    }

    // Obtener el ID del usuario a borrar desde los parámetros de la solicitud
    const userIdToDelete = req.params.userId;

    // Buscar al usuario en la base de datos
    const userToDelete = await User.findById(userIdToDelete);

    // Verificar si el usuario existe
    if (!userToDelete) {
      const error = new Error('Usuario no encontrado');
      (error as any).status = 404; // 404 Not Found
      throw error;
    }

    // Realizar el borrado lógico actualizando el campo isDeleted a true
    userToDelete.isDeleted = true;

    // Guardar los cambios en la base de datos
    await userToDelete.save();

    res.status(200).json({ message: 'Usuario borrado con éxito' });
  } catch (error) {
    next(error);
  }
};
