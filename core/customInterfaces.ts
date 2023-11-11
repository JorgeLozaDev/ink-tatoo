import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: any; // Puedes utilizar el tipo adecuado para representar la información del usuario
}

export default AuthenticatedRequest;
