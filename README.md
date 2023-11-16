# Ink Masters

Somos una nueva tienda de tatuadores, en la cual podrás registrarte en nuestra web y podrás agendar una cita con uno de nuestros talentosos tatuadores, ¡pero no solo hacemos tatuajes!, también hacemos piercings!

## Construido con 🛠️

* [MONGODB](https://www.mongodb.com/es) - Usado para la base de datos  
* [TYPESCRIPT](https://www.typescriptlang.org/) 
* [BCRYPT](https://www.npmjs.com/package/bcrypt)  - Usado para la encriptación de las contraseñas
* [AXIOS](https://axios-http.com/es/docs/intro)  - Usado para la peticiones HTTP
* [EXPRESS](https://expressjs.com/es/) 
* [JWT](https://jwt.io/) - Usado para generar tokens a los usuarios logueados
* [MONGOOSE](https://mongoosejs.com/) 




## Wiki 📖

Ahora te explicaremos como funciona nuestro backend.

###Estructura:
La aplicación está dividida en un archivo principal (app.js) responsable del lanzamiento de la aplicación y dos entidades modularizadas (users y meetings), cada una con su modelo, su router y su controlador asociados dentro de su carpeta, de modo que resulte fácil encontrar y editar las partes del código necesarias sin que se vean afectadas otras secciones no relacionadas.

###Model:
Contiene toda la estructura del modelo Mongoose que se usará para cada usuario, tanto usuario como tatuador en el caso de los usuarios, y cada cita en el caso de las citas

###Router:
Aquí están todos los servicios disponibles en la API. Importan la lógica de los controladores y se exportan a App.ts

###Controller:
Toda la lógica se gestiona aquí. Es donde están todas las funciones, que reciben los parámetros pertinentes desde el router, gestionan la petición, y le devuelven la información que se deba retornar al usuario. Importa el Model, y exporta las funciones al Router.

###Tabla de endpoints
| Endpoint                    | Método | Descripción                              | Entrada esperada                                    | Salida esperada                              |
|-----------------------------|--------|------------------------------------------|-----------------------------------------------------|---------------------------------------------|
| `/create-meeting`           | POST   | Crear una nueva cita                     | Datos de la cita (ver controlador `createMeeting`)  | Mensaje de éxito o error                     |
| `/`                         | GET    | Obtener todas las citas del usuario      | Token de autenticación                              | Lista de citas del usuario                  |
| `/:meetingId`               | GET    | Obtener detalles de una cita específica | Token de autenticación                              | Detalles de la cita especificada             |
| `/meeting/:meetingId`       | DELETE | Borrar una cita                          | Token de autenticación                              | Mensaje de éxito o error                     |
| `/edit-meeting/:meetingId`  | PUT    | Editar una cita                          | Token de autenticación y datos de la cita           | Mensaje de éxito o error                     |
| `/signup`                   | POST   | Registro de usuario                     | Datos del nuevo usuario                            | Mensaje de éxito o error                     |
| `/login`                    | POST   | Inicio de sesión                         | Credenciales de inicio de sesión                   | Token de autenticación                       |
| `/updateProfile`            | PUT    | Actualizar perfil de usuario            | Token de autenticación y datos actualizados        | Mensaje de éxito o error                     |
| `/profile`                  | GET    | Obtener perfil de usuario               | Token de autenticación                              | Perfil del usuario                           |
| `/tattooArtists`            | GET    | Obtener lista de tatuadores             | Token de autenticación                              | Lista de tatuadores                          |
| `/`                         | GET    | Obtener todos los usuarios              | Token de autenticación                              | Lista de todos los usuarios                 |
| `/change-rol`               | PUT    | Cambiar el rol de un usuario            | Token de autenticación y datos del cambio de rol   | Mensaje de éxito o error                     |
| `/:userId`                  | DELETE | Borrar un usuario                       | Token de autenticación                              | Mensaje de éxito o error                     |


## Autores ✒️


* **Jorge Loza Guzmán** - *Trabajo Inicial* -  *Documentación* - [JorgeLozaDev](https://github.com/JorgeLozaDev)


## Licencia 📄

Este proyecto está bajo la Licencia (LICENSE) - mira el archivo [LICENSE](LICENSE) para detalles

---
⌨️ por [JorgeLozaDev](https://github.com/JorgeLozaDev) 