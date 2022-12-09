// Controlador que utilizan los usuarios con rol de Registrador o de Fiscal.
// Devuelve informacion del usuario con sesion iniciada.
const jwt = require("jsonwebtoken");
const conn = require("../config/dbConn");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const TABLEUSUARIOS = "TablaUsuarios";
const env = require("dotenv");
env.config();
// Funcion para verificar el rol.

isAnyUser = (req, res) => {
  console.log("---VERIFICAR CUALQUIER USUARIO---");

  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer") ||
    !req.headers.authorization.split(" ")[1]
  ) {
    console.log("API usuarios, no token.");
    return res.status(401).send({
      message: "No existe token de autenticacion.",
    });
  }
  const jwtToken = req.headers.authorization.split(" ")[1];
  console.log("token", jwtToken);
  try {
    var decodedUser = jwt.verify(jwtToken, process.env.WORD_JWT);
  } catch (jwtError) {
    console.log("Sesion JWT expirada.");
    return res.status(401).send({
      message:
        "Sesion expirada o no esta autorizado, cierre e inicie sesion nuevamente.",
    });
  }
  if (decodedUser.role != "Registrador" && decodedUser.role != "Fiscal") {
    console.log("API current, no autorizado.");
    return res.status(401).send({
      message: "No autorizado .",
    });
  } else {
    res = decodedUser.id;
  }
};

// Obtener usuario por su ID.
exports.getCurrentById = async (req, res, next) => {
  console.log("---OBTENER CUALQUIER USUARIO POR ID---");
  try {
    const noUser = await isAnyUser(req, res);
    if (noUser) {
      return noUser;
    }
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedUser = jwt.verify(jwtToken, process.env.WORD_JWT);
    const [row] = await conn.execute(
      `SELECT id_usuario, cedula, nombre, telefono, rol_usuario, usuario_modificado, rol_usuario_modificado_por FROM ${TABLEUSUARIOS} WHERE id_usuario = ? AND rol_usuario = ? AND bloqueado = 0`,
      [decodedUser.id, decodedUser.role]
    );
    if (row.length > 0) {
      console.log("API, usuarios id g.");
      return res.status(200).send(row[0]);
    } else {
      console.log(`No existe el usuario con el id ${req.params.id}`);
      res.status(422).send({
        message: `No existe el usuario con el id ${req.params.id}`,
      });
    }
  } catch (error) {
    if (error.code == "ECONNREFUSED") {
      console.log(error);
      next(new Error("Sin conexion a la Base de Datos."));
    }
    next(error);
  }
};
// Si existen errores no controlados, se los pasa a Express: next(error)
