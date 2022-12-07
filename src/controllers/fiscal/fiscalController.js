// Controlador que utiliza el usuario con rol de Fiscal.
// Puede editar su perfil y realizar conminatorias.
const jwt = require("jsonwebtoken");
const conn = require("../../config/dbConn");
const secret = require("../../config/jwtSecret");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const TABLECONMINATORIAS = "TablaConminatorias";
const TABLEUSUARIOS = "TablaUsuarios";

let decodedFiscal = "";
// Funcion para verificar si es Fiscal y si tiene el Token
// "auth" es enviado por Frontend, verifica si el id del usuario y el id del token coinciden
isFiscalAuthorized = async (req, res) => {
  console.log("---VERIFICAR USUARIO FISCAL---");
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer") ||
    !req.headers.authorization.split(" ")[1]
  ) {
    console.log("API perfil regular, no token.");
    return res.status(422).send({
      message: "No existe token de autenticacion.",
    });
  }
  const jwtToken = req.headers.authorization.split(" ")[1];

  try {
    var decodedFiscal = jwt.verify(jwtToken, secret.word);
  } catch (jwtError) {
    console.log("Sesion JWT expirada.");
    return res.status(422).send({
      message: "Sesion expirada, cierre e inicie sesion nuevamente.",
    });
  }
  const [verif] = await conn.execute(
    `SELECT id_usuario, rol_usuario, bloqueado FROM ${TABLEUSUARIOS} WHERE id_usuario = ? AND rol_usuario = "Fiscal" AND bloqueado = 0`,
    [decodedFiscal.id]
  );
  if (verif.length === 0) {
    console.log("API conminatorias, no fiscal, ID y ROLE no coinciden.");
    return res.status(401).send({
      message: `No, autorizado. ID y ROLE no coinciden.`,
    });
  }
  console.log("---FIN VERIFICAR USUARIO FISCAL---");
};

exports.getFiscalById = async (req, res, next) => {
  console.log("---OBTENER USUARIO FISCAL POR ID---");
  try {
    const noFiscal = await isFiscalAuthorized(req, res);
    if (noFiscal) {
      return noFiscal;
    }
    const [row] = await conn.execute(
      `SELECT id_usuario, cedula, nombre, telefono FROM ${TABLEUSUARIOS} WHERE id_usuario = ? AND rol_usuario = 'Fiscal' AND bloqueado = 0`,
      [req.params.id]
    );
    if (row.length > 0) {
      console.log("API, usuarios id f.");
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

exports.updateFiscal = async (req, res, next) => {
  console.log("---ACTUALIZAR USUARIO FISCAL---");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).send({ message: errors.array() });
  }
  try {
    const noFiscal = await isFiscalAuthorized(req, res);
    if (noFiscal) {
      return noFiscal;
    }
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedFiscal = jwt.verify(jwtToken, secret.word);

    const [row] = await conn.execute(
      `SELECT * FROM ${TABLEUSUARIOS} WHERE id_usuario = ?`,
      [req.params.id]
    );
    if (row.length === 0) {
      console.log(
        `API, actualizar usuarios, no existe el usuario con el id ${req.params.id}`
      );
      return res.status(422).send({
        message: `No existe el usuario con el id ${req.params.id}`,
      });
    }
    if (req.body.cedula) {
      row[0].cedula = req.body.cedula;
    }
    if (req.body.clave) {
      row[0].clave = await bcrypt.hash(req.body.clave, 12);
    }
    if (req.body.nombre) {
      row[0].nombre = req.body.nombre;
    }
    if (req.body.telefono) {
      row[0].telefono = req.body.telefono;
    }
    const [update] = await conn.execute(
      `UPDATE ${TABLEUSUARIOS} SET\
    cedula = ?,\ 
    clave = ?,\ 
    nombre = ?,\ 
    telefono = ?,\
    id_usuario_modificado_por = ?,\ 
    rol_usuario_modificado_por = ?,
    usuario_modificado = NOW()\ 
    WHERE id_usuario = ?`,
      [
        row[0].cedula,
        row[0].clave,
        row[0].nombre,
        row[0].telefono,
        decodedFiscal.id,
        decodedFiscal.role,
        req.params.id,
      ]
    );
    if (update.affectedRows === 1) {
      console.log(
        `API, actualizar usuarios, ${row[0].nombre} actualizado.`,
        update
      );
      return res.status(201).send({
        message: `Usuario ${row[0].nombre} actualizado.`,
      });
    } else {
      console.log(
        `API, actualizar usuarios, error al actualizar usuarios.`,
        update
      );
      return res.status(422).send({
        message: `Error en la BD.`,
      });
    }
  } catch (err) {
    next(err);
  }
};
exports.getFiscalConminatorias = async (req, res, next) => {
  console.log("---OBTENER CONMINATORIAS USUARIO FISCAL---");
  console.log("CONMI USUARIO");
  try {
    const noFiscal = await isFiscalAuthorized(req, res);
    if (noFiscal) {
      return noFiscal;
    }
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedFiscal = jwt.verify(jwtToken, secret.word);
    console.log(decodedFiscal.id + " " + req.query.option);
    if (req.query.option) {
      const [row] = await conn.execute(
        `SELECT id_conminatoria,
        codigo,
        nombre,
        denunciados,
        denunciantes,
        delitos,
        fecha_cd,
        fecha_fiscal,
        fecha_limite,
        directorio_pdf,
        realizado,
        fecha_realizado,
        rol_usuario_marcado_por
        FROM ${TABLEUSUARIOS} 
        RIGHT JOIN ${TABLECONMINATORIAS}
        ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria WHERE id_usuario = ? AND realizado = ${req.query.option} ORDER BY realizado asc, fecha_limite asc`,
        [decodedFiscal.id]
      );
      if (row.length > 0) {
        console.log("API, conminatorias id.");
        return res.status(200).send(row);
      } else {
        console.log(`No existe conminatoria con el id ${decodedFiscal.id}`);
        res.status(422).send({
          message: `No existe conminatorias registradas.`,
        });
      }
    } else {
      const [row] = await conn.execute(
        `SELECT id_conminatoria,
      codigo,
      nombre,
      denunciados,
      denunciantes,
      delitos,
      fecha_cd,
      fecha_fiscal,
      fecha_limite,
      directorio_pdf,
      realizado,
      fecha_realizado,
      rol_usuario_marcado_por
      FROM ${TABLEUSUARIOS} 
      RIGHT JOIN ${TABLECONMINATORIAS}
      ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria WHERE id_usuario = ? ORDER BY realizado asc, fecha_limite asc`,
        [decodedFiscal.id]
      );
      if (row.length > 0) {
        console.log("API, conminatorias id.");
        return res.status(200).send(row);
      } else {
        console.log(`No existe conminatoria con el id ${decodedFiscal.id}`);
        res.status(422).send({
          message: `No existe conminatorias registradas.`,
        });
      }
    }
  } catch (err) {
    next(err);
  }
};
exports.doneFiscalConminatoria = async (req, res, next) => {
  console.log("---MARCAR CONMINATORIA USUARIO FISCAL---");
  console.log("DONE", req.params.id, req.body.current);
  try {
    const noFiscal = await isFiscalAuthorized(req, res);
    if (noFiscal) {
      return noFiscal;
    }
    const [row] = await conn.execute(
      `SELECT codigo
      FROM ${TABLECONMINATORIAS} WHERE id_conminatoria = ?`,
      [req.params.id]
    );
    if (row.length === 0) {
      res.status(422).send({
        message: `No existe conminatoria con el id ${req.params.id}`,
      });
    }
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedFiscal = jwt.verify(jwtToken, secret.word);
    const [hecho] = await conn.execute(
      `UPDATE ${TABLECONMINATORIAS} SET realizado = true, 
    fecha_realizado = NOW(),
    id_usuario_marcado_por = ?,
    rol_usuario_marcado_por = ?
    WHERE id_conminatoria = ?`,
      [decodedFiscal.id, decodedFiscal.role, req.params.id]
    );
    if (hecho.affectedRows === 1) {
      console.log(`${row[0].codigo} marcado por ${req.body.current}.`);
      return res.status(200).send({
        message: `${row[0].codigo} marcado por ${req.body.current}.`,
      });
    }
  } catch (err) {
    next(err);
  }
};

// Si existen errores no controlados, se los pasa a Express: next(error)
