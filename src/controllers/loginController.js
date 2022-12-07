// Controlador que se utiliza para el procesamiento de las credenciales.
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const conn = require("../config/dbConn");
const secret = require("../config/jwtSecret");
const TABLENAME = "TablaUsuarios";

// Ingresar.
exports.login = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).send({ message: "Revise el CI o la contraseña." });
  }
  try {
    const [row] = await conn.execute(
      `SELECT id_usuario, cedula, clave, nombre, rol_usuario, bloqueado FROM ${TABLENAME} WHERE cedula = ? AND bloqueado = 0`,
      [req.body.cedula]
    );
    if (row.length === 0) {
      console.log("ACCESO, no existe CI, o se encuentra bloqueado.");
      return res.status(422).send({
        message: `No existe el usuario con el CI ${req.body.cedula}, o se encuentra bloqueado.`,
      });
    }
    const passMatch = await bcrypt.compare(req.body.clave, row[0].clave);
    if (!passMatch) {
      console.log("ACCESO, contraseña incorrecta.");
      return res.status(422).send({
        message:
          "Contraseña incorrecta, verifique si las mayúsculas estan activadas.",
      });
    }
    // Si no existen problemas, se genera el Token con el id y el rol del usuario.
    const jwtToken = jwt.sign(
      {
        role: row[0].rol_usuario,
        id: row[0].id_usuario,
      },
      secret.word,
      {
        expiresIn: "60m",
      }
    );
    console.log("ACCESO, token generado.");
    // Si no existen problemas, se envia el Token y alguna informacion del usuario.
    return res.status(201).send({
      token: jwtToken,
      rol_usuario: row[0].rol_usuario,
      nombre: row[0].nombre,
    });
  } catch (error) {
    if (error.code == "ECONNREFUSED") {
      console.log(error);
      next(new Error("Sin conexion a la Base de Datos."));
    }
    next(error);
  }
};
// Si existen errores no controlados, se los pasa a Express: next(error)
