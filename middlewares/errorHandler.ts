import { Request, Response, NextFunction } from "express";

// Definir una interfaz personalizada para los errores
interface CustomError extends Error {
  status?: number;
  errors?: any;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
    
  if (err.name === "ValidationError") {
    // Utiliza type assertion para especificar el tipo de error
    const validationError = err as Error & { errors: Record<string, any> };

    if (validationError.errors) {
      const errorMessages = Object.values(validationError.errors).map(
        (error) => error.message
      );
      return res.status(400).json({ message: errorMessages.join(", ") });
    } else {
      // En caso contrario, simplemente mostrar el mensaje de error
      return res.status(400).json({ message: err.message });
    }
  }

  if (err.message === "Usuario no encontrado") return res.status(404).json({ message: "Usuario no encontrado" });

  if (err.message === "Credenciales incorrectas") return res.status(401).json({ message: "Credenciales incorrectas" });

  if (err.message === "Token no proporcionado") return res.status(401).json({ message: "Token no proporcionado" });

  if (err.name === "JsonWebTokenError")  return res.status(401).json({ message: "Token JWT no válido" });

  // Otros tipos de errores
  const statusCode = err.status || 500;
  res.status(statusCode).json({ message: err.message });
};

export = errorHandler;
