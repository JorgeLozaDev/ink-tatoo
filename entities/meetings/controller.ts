import express, { NextFunction, Request, Response } from "express";
import Meetings from "./model";
import User from "../users/model";
import AuthenticatedRequest from "../../core/customInterfaces";
import {
  isValidMeetingDateRange,
  validateMeetingDates,
  validateRequiredFields,
} from "../../core/helpers/comun";

// Controlador para crear una cita entre un usuario y un tatuador
export const createMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      dateMetting,
      dateMettingEnd,
      typeIntervention,
      price,
      isUp,
      isPaid,
    } = req.body;

    // Extraer el ID del usuario y su rol del token JWT
    const { id: userIdFromToken, role: userRole } = req.user;

    // Definir campos requeridos
    const camposRequeridos = [
      "dateMetting",
      "dateMettingEnd",
      "typeIntervention",
    ];

    // Verificar campos requeridos utilizando la función de validación
    validateRequiredFields(req.body, camposRequeridos);

    // Obtener fechas válidas utilizando el helper
    const { dateMeet, dateMeetEnd } = validateMeetingDates(
      dateMetting,
      dateMettingEnd
    );

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
    const isTattooArtistAvailable = await isValidMeetingDateRange(
      tattooArtist,
      dateMetting,
      dateMettingEnd
    );

    if (!isTattooArtistAvailable) {
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
      dateMetting: dateMeet,
      dateMettingEnd: dateMeetEnd,
      typeIntervention,
      price,
      isUp: isUp !== undefined ? isUp : true, // Verificar y asignar el valor o usar el valor por defecto
      isPaid: isPaid !== undefined ? isPaid : false, // Verificar y asignar el valor o usar el valor por defecto
    };

    // Agregar el cliente y el tatuador según el rol del usuario que realiza la solicitud
    if (userRole === "user") {
      meetingFields.client = userIdFromToken; // ID del usuario desde el token
      meetingFields.tattooArtist = tattooArtist; // ID del tatuador desde la búsqueda
    } else if (userRole === "tatooArtist") {
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
    const {
      client,
      tattooArtist,
      dateMetting,
      dateMettingEnd,
      typeIntervention,
      price,
      isUp,
      isPaid,
      isDeleted,
    } = req.body;
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

    // Verificar si la fecha y la hora han cambiado
    const isDateChanged =
      dateMetting !== undefined &&
      dateMettingEnd !== undefined &&
      (meeting.dateMetting.toISOString() !==
        new Date(dateMetting).toISOString() ||
        meeting.dateMettingEnd.toISOString() !==
          new Date(dateMettingEnd).toISOString());

    // Si la fecha ha cambiado, realizar comprobaciones adicionales
    if (isDateChanged) {
      // Verificar que la fecha sea válida (a partir de today)
      const dateMeet = new Date(dateMetting);
      const today = new Date();
      if (dateMeet <= today) {
        const error = new Error("La fecha de la cita debe ser a partir de hoy");
        (error as any).status = 400;
        throw error;
      }

      // Verificar que dateMettingEnd no sea inferior a dateMetting
      if (dateMettingEnd && new Date(dateMettingEnd) < dateMeet) {
        const error = new Error(
          "La fecha de finalización no puede ser anterior a la fecha de inicio"
        );
        (error as any).status = 400;
        throw error;
      }

      // Verificar si se ha cambiado la fecha y el tatuador no tiene otra cita en ese rango de fechas
      if (
        dateMetting &&
        dateMettingEnd &&
        (dateMetting !== meeting.dateMetting.toString() ||
          dateMettingEnd !== meeting.dateMettingEnd.toString())
      ) {
        // Verificar que el tatuador no tenga otra cita en el mismo rango de fechas
        const isTattooArtistAvailable = await isValidMeetingDateRange(
          meeting.tattooArtist?.toString()!,
          dateMetting,
          dateMettingEnd
        );

        if (!isTattooArtistAvailable) {
          const error = new Error(
            "El tatuador ya tiene una cita en esa fecha y hora"
          );
          (error as any).status = 409; // 409 Conflict
          throw error;
        }
      }
    }

    // Realizar la actualización de los campos según el rol del usuario
    if (currentUser.role === "user") {
      // Si el cliente proporciona el id del tatuador, verificar y cambiar si es necesario
      if (
        tattooArtist &&
        meeting.tattooArtist &&
        meeting.tattooArtist.toString() !== tattooArtist
      ) {
        meeting.tattooArtist = tattooArtist;
      }
    } else if (currentUser.role === "tatooArtist") {
      // Si el tatuador proporciona el id del cliente, verificar y cambiar si es necesario
      if (client && meeting.client.toString() !== client) {
        meeting.client = client;
      }
    } else if (currentUser.role === "superadmin") {
      // Si el admin proporciona ambos ids, verificar y cambiar si es necesario
      if (
        tattooArtist &&
        meeting.tattooArtist &&
        meeting.tattooArtist.toString() !== tattooArtist
      ) {
        meeting.tattooArtist = tattooArtist;
      }

      if (client && meeting.client.toString() !== client) {
        meeting.client = client;
      }
    }

    // Realizar la actualización de los campos según el rol del usuario
    meeting.dateMetting =
      dateMetting !== undefined ? new Date(dateMetting) : meeting.dateMetting;
    meeting.dateMettingEnd =
      dateMettingEnd !== undefined
        ? new Date(dateMettingEnd)
        : meeting.dateMettingEnd;
    meeting.typeIntervention = typeIntervention || meeting.typeIntervention;
    meeting.price = price !== undefined ? price : meeting.price;
    meeting.isUp = isUp !== undefined ? isUp : meeting.isUp;
    meeting.isPaid = isPaid !== undefined ? isPaid : meeting.isPaid;
    meeting.isDeleted = isDeleted !== undefined ? isDeleted : meeting.isDeleted;

    // Guardar los cambios en la base de datos
    await meeting.save();

    res.status(200).json({ message: "Cita actualizada con éxito" });
  } catch (error) {
    next(error);
  }
};

// Controlador para borrar una cita (borrado lógico)
export const deleteMeeting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const citaId = req.params.meetingId;
    const currentUser = req.user; // Usuario actual autenticado

    // Buscar la cita por su ID
    const meeting = await Meetings.findById(citaId);

    if (!meeting) {
      const error = new Error("Cita no encontrada");
      (error as any).status = 404;
      throw error;
    }

    // Verificar permisos para el borrado
    if (
      currentUser.role !== "superadmin" &&
      (!meeting.client || meeting.client.toString() !== currentUser.id) &&
      (!meeting.tattooArtist ||
        meeting.tattooArtist.toString() !== currentUser.id)
    ) {
      const error = new Error("No tienes permiso para borrar esta cita");
      (error as any).status = 403; // 403 Forbidden
      throw error;
    }

    // Realizar el borrado lógico (marcar como eliminado)
    meeting.isDeleted = true;

    // Guardar los cambios en la base de datos
    await meeting.save();

    res
      .status(200)
      .json({ message: "Cita borrada con éxito (borrado lógico)" });
  } catch (error) {
    next(error);
  }
};

// Controlador para obtener las citas del usuario
export const getUserMeetings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentUser = req.user; // Usuario actual autenticado

    // Obtener citas del usuario según su rol
    let meetings: any[];

    if (currentUser.role === "user") {
      // Usuario: Obtener citas del cliente (pasadas y futuras)
      meetings = await Meetings.find({
        client: currentUser.id,
        isDeleted: false,
      })
        .sort({ dateMetting: 1 })
        .exec();
    } else if (currentUser.role === "tatooArtist") {
      // Tatuador: Obtener citas del tatuador (pasadas y futuras)
      meetings = await Meetings.find({
        tattooArtist: currentUser.id,
        isDeleted: false,
      })
        .sort({ dateMetting: 1 })
        .exec();
    } else if (currentUser.role === "superadmin") {
      // Superadmin: Obtener todas las citas (pasadas y futuras)
      meetings = await Meetings.find({}).sort({ dateMetting: 1 }).exec();
    } else {
      const error = new Error("Rol de usuario no válido");
      (error as any).status = 400;
      throw error;
    }

    // Mapear las reuniones para obtener los detalles del tatuador
    const meetingsWithTattooArtistDetails = await Promise.all(
      meetings.map(async (meeting) => {
        // Obtener detalles del tatuador por su ID
        const tattooArtistDetails = await User.findById(
          meeting.tattooArtist,
          "name"
        );

        // Crear un nuevo objeto de reunión con los detalles del tatuador
        return {
          ...meeting.toJSON(),
          tattooArtist: tattooArtistDetails ? tattooArtistDetails.name : null,
        };
      })
    );

    // Separar citas pasadas y futuras
    const currentDate = new Date();

    const upcomingMeetings = meetingsWithTattooArtistDetails.filter(
      (meeting) => new Date(meeting.dateMetting) >= currentDate
    );

    const pastMeetings = meetingsWithTattooArtistDetails.filter(
      (meeting) => new Date(meeting.dateMetting) < currentDate
    );

    res.status(200).json({ upcomingMeetings, pastMeetings });
  } catch (error) {
    next(error);
  }
};

// Controlador para ver una cita en detalle
export const getMeetingDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const meetingId = req.params.meetingId;

    // Obtener la cita por su ID
    const meeting = await Meetings.findById(meetingId);

    if (!meeting) {
      const error = new Error("Cita no encontrada");
      (error as any).status = 404;
      throw error;
    }

    // Obtener detalles del cliente por su ID
    const clientDetails = await User.findById(
      meeting.client,
      "name lastname email"
    );

    // Obtener detalles del tatuador por su ID
    const tattooArtistDetails = await User.findById(
      meeting.tattooArtist,
      "_id name lastname email"
    );

    // Construir la respuesta
    const citaDetallada = {
      client: {
        name: clientDetails?.name,
        lastname: clientDetails?.lastname,
        email: clientDetails?.email,
      },
      tattooArtist: {
        _id: tattooArtistDetails?._id,
        name: tattooArtistDetails?.name,
        lastname: tattooArtistDetails?.lastname,
        email: tattooArtistDetails?.email,
      },
      dateMetting: meeting.dateMetting,
      dateMettingEnd: meeting.dateMettingEnd,
      typeIntervention: meeting.typeIntervention,
      isDeleted: meeting.isDeleted,
      isUp: meeting.isUp,
      isPaid: meeting.isPaid,
      price: meeting.price,
    };

    res.status(200).json(citaDetallada);
  } catch (error) {
    next(error);
  }
};

// Controlador para ver una cita en detalle
export const checkArtistAvilablityDates = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tattooArtist, dateMetting, dateMettingEnd, typeIntervention } =
      req.body;
    const currentUser = req.user; // Usuario actual autenticado

    // Definir campos requeridos
    const camposRequeridos = [
      "tattooArtist",
      "dateMetting",
      "dateMettingEnd",
      "typeIntervention",
    ];

    // Verificar campos requeridos utilizando la función de validación
    validateRequiredFields(req.body, camposRequeridos);

    // Verificar que el tatuador no tenga otra cita en el mismo rango de fechas
    const isTattooArtistAvailable = await isValidMeetingDateRange(
      tattooArtist,
      dateMetting,
      dateMettingEnd
    );

    if (!isTattooArtistAvailable) {
      const error = new Error(
        "El tatuador ya tiene una cita en esa fecha y hora"
      );
      (error as any).status = 409; // 409 Conflict
      throw error;
    }
    const tattooArtistExists = await User.findById(tattooArtist);

    if (!tattooArtistExists) {
      const error = new Error("IDs de cliente o tatuador inválidos");
      (error as any).status = 400;
      throw error;
    }
    res.status(201).json({ message: "El tatuador esta disponible" });
  } catch (error) {
    next(error);
  }
};

export const filterMettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener los campos del cuerpo de la solicitud
    const { tattooArtist, dateMetting, dateMettingEnd, typeIntervention } =
      req.body;

    const currentUser = req.user; // Usuario actual autenticado
    // Construir el objeto de filtro basado en los campos proporcionados
    const filter: any = {};

    // Verificar el rol del usuario actual
    if (currentUser.rol != "superadmin") {
      // Si es un usuario normal, solo ver sus propias citas
      filter.user = currentUser._id;
    }

    if (tattooArtist) {
      filter.tattooArtist = tattooArtist;
    }
    if (tattooArtist) {
      filter.tattooArtist = tattooArtist;
    }

    if (dateMetting && dateMettingEnd) {
      // Filtrar por un rango de fechas
      filter.$or = [
        {
          $and: [
            { dateMetting: { $gte: new Date(dateMetting) } },
            { dateMettingEnd: { $lte: new Date(dateMettingEnd) } },
          ],
        },
        {
          $and: [
            { dateMetting: { $gte: new Date(dateMetting) } },
            { dateMetting: { $lte: new Date(dateMettingEnd) } },
          ],
        },
        {
          $and: [
            { dateMettingEnd: { $gte: new Date(dateMetting) } },
            { dateMettingEnd: { $lte: new Date(dateMettingEnd) } },
          ],
        },
      ];
    } else if (dateMetting) {
      // Filtrar por fechas a partir de la fecha proporcionada
      filter.$or = [
        { dateMetting: { $gte: new Date(dateMetting) } },
        { dateMettingEnd: { $gte: new Date(dateMetting) } },
      ];
    } else if (dateMettingEnd) {
      // Filtrar por fechas hasta la fecha proporcionada
      filter.$or = [
        { dateMetting: { $lte: new Date(dateMettingEnd) } },
        { dateMettingEnd: { $lte: new Date(dateMettingEnd) } },
      ];
    }

    if (typeIntervention) {
      filter.typeIntervention = typeIntervention;
    }

    // Realizar la consulta en la base de datos utilizando los filtros y ordenar por fecha de inicio
    const meetings = await Meetings.find(filter).sort({ dateMetting: 1 });

    // Mapear las reuniones para obtener los detalles del tatuador
    const meetingsWithTattooArtistDetails = await Promise.all(
      meetings.map(async (meeting) => {
        // Obtener detalles del tatuador por su ID
        const tattooArtistDetails = await User.findById(
          meeting.tattooArtist,
          "name lastname email"
        );

        // Crear un nuevo objeto de reunión con los detalles del tatuador
        return {
          ...meeting.toJSON(),
          tattooArtist: tattooArtistDetails ? tattooArtistDetails.name : null,
        };
      })
    );

    // Devolver las citas encontradas con los nombres de los tatuadores
    res.status(200).json({ meetings: meetingsWithTattooArtistDetails });
  } catch (error) {
    next(error);
  }
};
