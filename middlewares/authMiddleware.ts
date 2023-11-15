import jwt from "jsonwebtoken";
import CONF from "../core/config";
import { Request, Response, NextFunction } from "express";
import AuthenticatedRequest from "../core/customInterfaces";

const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar el token JWT en la cabecera de la solicitud
    const token = req.header("Authorization");

    if (!token) {
      throw new Error("Token no proporcionado");
    }

    // el token nos viene un string, un espacio y el token, con esto solamente recogemos el token y lo comprobamos
    const t = token.split(" ")[1];
    const decoded = jwt.verify(t, CONF.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      // Error relacionado con el token JWT
      const error = new Error("JsonWebTokenError");
      (error as any).status = 401;
      throw error;
    }
    next(error);
  }
};

export { authMiddleware };
