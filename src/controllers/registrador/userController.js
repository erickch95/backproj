// Controlador que utiliza el usuario con rol de Registrador.
// Puede crear, editar, eliminar usuarios.
const jwt = require("jsonwebtoken");
const conn = require("../../config/dbConn");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const TABLEUSUARIOS = "TablaUsuarios";
const env = require("dotenv");
env.config();
// Funcion para verificar si es Registrador y si tiene el Token

isRegistradorUsers = async (req, res) => {
  console.log("---VERIFICAR USUARIO REGISTRADOR USUARIOS---");
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
    var decodedUsers = jwt.verify(jwtToken, process.env.WORD_JWT);
  } catch (jwtError) {
    console.log("Sesion JWT expirada.");
    return res.status(401).send({
      message: "Sesion expirada, cierre e inicie sesion nuevamente.",
    });
  }
  const [row] = await conn.execute(
    `SELECT id_usuario, rol_usuario, bloqueado FROM ${TABLEUSUARIOS} WHERE id_usuario = ? AND rol_usuario = "Registrador" AND bloqueado = 0`,
    [decodedUsers.id]
  );
  if (row.length === 0) {
    console.log(
      "API registrador usuarios, no registrador, ID y ROLE no coinciden."
    );
    return res.status(401).send({
      message: `No, autorizado. ID y ROLE no coinciden.`,
    });
  }
  console.log("---FIN VERIFICAR REGISTRADOR USUARIOS---");
};

// Crear usuario.
exports.registerUser = async (req, res, next) => {
  console.log("---REGISTRAR NUEVO USUARIO REGISTRADOR USUARIOS---");
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("Registro usuario, error:", errors.array());
    return res
      .status(422)
      .send({ message: errors.array({ onlyFirstError: true })[0].msg });
  }
  try {
    const noRegistradorUsers = await isRegistradorUsers(req, res);
    if (noRegistradorUsers) {
      return noRegistradorUsers;
    }
    const [row] = await conn.execute(
      `SELECT cedula FROM ${TABLEUSUARIOS} WHERE cedula = ? OR nombre = ? `,
      [req.body.cedula, req.body.nombre]
    );

    if (row.length > 0) {
      console.log(
        `REGISTRO, usuario ${req.body.nombre} encontrado en BD, posible nombre duplicado.`
      );
      return res.status(422).json({
        message: "El usuario ya esta registrado, revise el CI o el nombre.",
      });
    }
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedUsers = jwt.verify(jwtToken, process.env.WORD_JWT);
    const hashPass = await bcrypt.hash(req.body.clave, 12);
    const [rows] = await conn.execute(
      `INSERT INTO ${TABLEUSUARIOS}(cedula,
        clave,
        nombre,
        telefono,
        id_usuario_modificado_por,
        rol_usuario_modificado_por)
        VALUES(?, ?, ?, ?, ?, ?)`,
      [
        req.body.cedula,
        hashPass,
        req.body.nombre,
        req.body.telefono || "No registrado.",
        decodedUsers.id,
        decodedUsers.role,
      ]
    );
    if (rows.affectedRows === 1) {
      console.log(`REGISTRO, usuario ${req.body.nombre} registrado en BD.`);
      return res.status(201).send({
        message: `Usuario ${req.body.nombre} registrado.`,
      });
    }
  } catch (error) {
    if (error.code == "ECONNREFUSED") {
      console.log(error);
      next(new Error("Sin conexion a la Base de Datos."));
    }
    if (error.code == "ER_DUP_ENTRY") {
      console.log(error);
      next(new Error(`Ya existe un usuario con el C.I.: ${req.body.cedula}`));
    }
    next(error);
  }
};

// Obtener usuarios habilitados.
exports.getUsers = async (req, res, next) => {
  console.log("---OBTENER USUARIOS REGISTRADOR USUARIOS---");
  try {
    var noRegistradorUsers = await isRegistradorUsers(req, res);
    if (noRegistradorUsers) {
      return noRegistradorUsers;
    }
    const [row] = await conn.execute(
      `SELECT id_usuario, 
      cedula, 
      nombre, 
      telefono, 
      bloqueado, 
      usuario_creado, 
      usuario_modificado,
      rol_usuario_modificado_por
      FROM ${TABLEUSUARIOS} WHERE rol_usuario = "Fiscal" ORDER BY bloqueado ASC, id_usuario DESC`
    );
    if (row.length > 0) {
      console.log("API, lista usuarios.");
      return res.status(200).send(row);
    }
    res.status(422).send({
      message: "No existen usuarios registrados.",
    });
  } catch (error) {
    if (error.code == "ECONNREFUSED") {
      console.log(error);
      next(new Error("Sin conexion a la Base de Datos."));
    }
    next(error);
  }
};

// Obtener todos los usuarios.
exports.getAllUsers = async (req, res, next) => {
  console.log("---OBTENER TODOS LOS USUARIOS REGISTRADOR USUARIOS---");
  try {
    const noRegistradorUsers = await isRegistradorUsers(req, res);
    if (noRegistradorUsers) {
      return noRegistradorUsers;
    }
    const [row] = await conn.execute(
      `SELECT * FROM ${TABLEUSUARIOS} WHERE rol_usuario = "Fiscal" ORDER BY id_usuario DESC`
    );
    if (row.length > 0) {
      console.log("API, lista todos usuarios.");
      return res.status(200).send(row);
    }
    res.status(422).send({
      message: "No existe ningun usuario.",
    });
  } catch (error) {
    if (error.code == "ECONNREFUSED") {
      console.log(error);
      next(new Error("Sin conexion a la Base de Datos."));
    }
    next(error);
  }
};

// Obtener usuario por su ID.
exports.getUserById = async (req, res, next) => {
  console.log("---OBTENER USUARIO POR ID REGISTRADOR USUARIOS---");
  try {
    const noRegistradorUsers = await isRegistradorUsers(req, res);
    if (noRegistradorUsers) {
      return noRegistradorUsers;
    }
    const [row] = await conn.execute(
      `SELECT id_usuario, cedula, nombre, telefono FROM ${TABLEUSUARIOS} WHERE id_usuario = ?`,
      [req.params.id]
    );
    if (row.length > 0) {
      console.log("API, usuarios id r.");
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

// Actualizar usuario por su ID.
exports.updateUser = async (req, res, next) => {
  console.log("---ACTUALIZAR USUARIO REGISTRADOR USUARIOS---");
  console.log("ID USER", req.body.id_usuario);
  console.log("CEDULA", req.body.cedula);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("Registro usuario, error:", errors.array());
    return res
      .status(422)
      .send.send({ message: errors.array({ onlyFirstError: true })[0].msg });
  }
  try {
    const noRegistradorUsers = await isRegistradorUsers(req, res);
    if (noRegistradorUsers) {
      return noRegistradorUsers;
    }
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
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedUsers = jwt.verify(jwtToken, process.env.WORD_JWT);
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
      `UPDATE ${TABLEUSUARIOS} SET
    cedula = ?, 
    clave = ?, 
    nombre = ?,
    telefono = ?,
    id_usuario_modificado_por = ?,
    rol_usuario_modificado_por = ?,
    usuario_modificado = NOW()
    WHERE id_usuario = ?`,
      [
        row[0].cedula,
        row[0].clave,
        row[0].nombre,
        row[0].telefono,
        decodedUsers.id,
        decodedUsers.role,
        req.body.id_usuario,
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
  } catch (error) {
    if (error.code == "ECONNREFUSED") {
      console.log(error);
      next(new Error("Sin conexion a la Base de Datos."));
    }
    if (error.code == "ER_DUP_ENTRY") {
      console.log(error);
      next(new Error(`Ya existe un usuario con el C.I.: ${req.body.cedula}`));
    }
    next(error);
  }
};

// Mostrar/ocultar usuario por su ID.
exports.statusUser = async (req, res, next) => {
  console.log("---CAMBIAR ESTADO USUARIO REGISTRADOR USUARIOS---");
  console.log(req);
  try {
    const noRegistradorUsers = await isRegistradorUsers(req, res);
    if (noRegistradorUsers) {
      return noRegistradorUsers;
    }
    const [row] = await conn.execute(
      `SELECT nombre as nombre,
      IF(bloqueado = false,"1","0") as estado
      FROM ${TABLEUSUARIOS} WHERE id_usuario = ?`,
      [req.params.id]
    );
    if (row.length === 0) {
      res.status(422).send({
        message: `No existe el usuario con el id ${req.params.id}`,
      });
    }
    let onOff = row[0].estado;
    let nombre = row[0].nombre;
    let estado;
    if (onOff == 1) {
      onOff = true;
      estado = "bloqueado";
    } else {
      onOff = false;
      estado = "desbloqueado";
    }
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedUsers = jwt.verify(jwtToken, process.env.WORD_JWT);
    const [status] = await conn.execute(
      `UPDATE ${TABLEUSUARIOS} SET bloqueado = ${onOff},
      id_usuario_modificado_por = ?,
      rol_usuario_modificado_por = ?,
    usuario_modificado = NOW()
    WHERE id_usuario = ?`,
      [decodedUsers.id, decodedUsers.role, req.params.id]
    );
    if (status.affectedRows === 1) {
      console.log(`${nombre} ${estado}.`);
      return res.status(200).send({
        message: `${nombre} ${estado}.`,
      });
    }
  } catch (error) {
    if (error.code == "ECONNREFUSED") {
      console.log(error);
      next(new Error("Sin conexion a la Base de Datos."));
    }
    if (error.code == "ER_DUP_ENTRY") {
      console.log(error);
      next(new Error(`Ya existe un usuario con el C.I.: ${req.body.cedula}`));
    }
    next(error);
  }
};

// Eliminar usuario por su ID.
exports.deleteUser = async (req, res, next) => {
  console.log("---ELIMINAR USUARIO REGISTRADOR USUARIOS---");
  try {
    const noRegistradorUsers = await isRegistradorUsers(req, res);
    if (noRegistradorUsers) {
      return noRegistradorUsers;
    }
    const [row] = await conn.execute(
      `SELECT * FROM ${TABLEUSUARIOS} WHERE id_usuario = ?`,
      [req.params.id]
    );
    if (row.length === 0) {
      console.log(
        `API, eliminar usuarios, no existe el usuario con el id ${req.params.id}`
      );
      return res.status(422).send({
        message: `No existe el usuario con el id ${req.params.id}`,
      });
    }

    var nombre = row[0].nombre;

    const [delet] = await conn.execute(
      `DELETE FROM ${TABLEUSUARIOS} WHERE id_usuario = ?`,
      [req.params.id]
    );

    if (delet.affectedRows === 1) {
      console.log(`API, eliminar usuario, ${row[0].nombre} eliminado.`, delet);
      return res.status(201).send({
        message: `Usuario ${nombre} eliminado.`,
      });
    } else {
      console.log(`API, eliminar usuario, error al eliminar usuario.`, delet);
      return res.status(422).send({
        message: `Error en la BD.`,
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
