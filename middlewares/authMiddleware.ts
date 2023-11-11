import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    // Verificar el token JWT en la cabecera de la solicitud
    const token = req.header('Authorization');

    if (!token) {
      throw new Error('Token no proporcionado');
    }

    const decoded = jwt.verify(token, 'secret-key'); // Reemplaza 'secret-key' con tu clave secreta real

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
