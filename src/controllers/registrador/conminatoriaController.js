// Controlador que utiliza el usuario con rol de Registrador.
// Puede crear, editar, eliminar conminatorias.
const jwt = require("jsonwebtoken");
const conn = require("../../config/dbConn");
const { validationResult } = require("express-validator");
const fs = require("fs"); // Conexion con el filesystem host.

const TABLECONMINATORIAS = "TablaConminatorias";
const TABLEUSUARIOS = "TablaUsuarios";
const IP_API = "192.168.166.66:4000";
const env = require("dotenv");
env.config();
// Funcion para eliminar un archivo subido si hay problemas en la validadcion.
function deleteDocument(req) {
  console.log("delete", req);
  if (req.file == undefined) {
    console.log("SI");
    console.log(req);
    fs.unlink(req, (error) => {
      if (error) {
        console.log(error);
      }
      console.log(`Documento reemplazado: ${req}`);
    });
  } else {
    console.log("NO");
    fs.unlink(req.file.path, (error) => {
      if (error) {
        console.log(error);
      }
      console.log(
        `Documento eliminado por errores de validacion: ${req.file.path}`
      );
    });
  }
}

// Funcion para verificar si es Registrador y si tiene el Token.
// "identifier" es enviado por Frontend, verifica si el id del usuario y el id del token coinciden
isRegistradorConminatorias = async (req, res) => {
  console.log("--- VERIFICAR REGISTRADOR CONMINATORIAS---");
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer") ||
    !req.headers.authorization.split(" ")[1]
  ) {
    console.log("API conminatorias, no token.");
    return res.status(401).send({
      message: "No existe token de autenticacion.",
    });
  }
  const jwtToken = req.headers.authorization.split(" ")[1];
  try {
    var decodedConminatorias = jwt.verify(jwtToken, process.env.WORD_JWT);
  } catch (jwtError) {
    console.log("Sesion JWT expirada.");
    return res.status(401).send({
      message: "Sesion expirada, cierre e inicie sesion nuevamente.",
    });
  }
  const [row] = await conn.execute(
    `SELECT id_usuario, rol_usuario, bloqueado FROM ${TABLEUSUARIOS} WHERE id_usuario = ? AND rol_usuario = "Registrador" AND bloqueado = 0`,
    [decodedConminatorias.id]
  );
  if (row.length === 0) {
    console.log("API conminatorias, no registrador, ID y ROLE no coinciden.");
    return res.status(401).send({
      message: `No, autorizado. ID y ROLE no coinciden.`,
    });
  }
  console.log("---FIN VERIFICAR REGISTRADOR CONMINATORIAS---");
};
// Insertar Conminatoria.
exports.insertConmminatoria = async (req, res, next) => {
  console.log("---INSERTAR CONMINATORIA---");
  const errors = validationResult(req);
  console.log(
    "INSERTAR",
    req.body.codigo,
    req.body.denunciados,
    req.body.denunciantes,
    req.body.delitos,
    req.body.fecha_cd,
    req.body.fecha_fiscal,
    req.body.fecha_limite,
    req.body.id_usuario_conminatoria,
    req.file
  );
  if (!errors.isEmpty()) {
    deleteDocument(req);
    console.log("Crear conminatoria, error:", errors.array());
    return res
      .status(422)
      .send({ message: errors.array({ onlyFirstError: true })[0].msg });
  }
  try {
    const noRegistradorConminatorias = await isRegistradorConminatorias(
      req,
      res
    );
    if (noRegistradorConminatorias) {
      return noRegistradorConminatorias;
    }
    const [verif] = await conn.execute(
      `SELECT nombre FROM ${TABLEUSUARIOS} WHERE id_usuario = ?`,
      [req.body.id_usuario_conminatoria]
    );
    if (verif.length === 0) {
      console.log(
        `Crear conminatoria, fiscal ${req.body.nombre} NO encontrado en BD.`
      );

      return res.status(422).send({
        message: `El fiscal ${req.body.nombre}, NO esta registrado, verifique los datos.`,
      });
    }

    //
    console.log(req.body);
    //
    if (req.file == undefined) {
      return res.status(422).send({
        message: `No hay archivo pdf.`,
      });
    }
    const filePath = `http://${IP_API}/upload/${req.file.filename}`;
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedConminatorias = jwt.verify(jwtToken, process.env.WORD_JWT);
    const [rows] = await conn.execute(
      `INSERT INTO ${TABLECONMINATORIAS}(codigo,\
        denunciados,\
        denunciantes,\
        delitos,\
        fecha_cd,\
        fecha_fiscal,\
        fecha_limite,\
        id_usuario_conminatoria,\
        directorio_pdf,\
        id_usuario_conminatoria_modificado_por,\
        rol_usuario_conminatoria_modificado_por)\
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        req.body.codigo,
        req.body.denunciados || "No se registraron denunciados.",
        req.body.denunciantes || "No se registraron denunciantes.",
        req.body.delitos || "No se registro el delito.",
        req.body.fecha_cd,
        req.body.fecha_fiscal,
        req.body.fecha_limite,
        req.body.id_usuario_conminatoria,
        filePath || "ERROR AL SUBIR",
        decodedConminatorias.id,
        decodedConminatorias.role,
      ]
    );
    if (rows.affectedRows === 1) {
      console.log(
        `REGISTRAR, conminatoria ${req.body.codigo} registrado en BD.`
      );
      return res.status(201).send({
        message: `Conminatoria ${req.body.codigo} registrado.`,
      });
    }
  } catch (err) {
    deleteDocument(req);
    next(err);
  }
};

// Obtener Conminatorias habilitadas.
exports.getConminatorias = async (req, res, next) => {
  console.log("---OBTENER CONMINATORIAS---");
  try {
    const noRegistradorConminatorias = await isRegistradorConminatorias(
      req,
      res
    );
    if (noRegistradorConminatorias) {
      return noRegistradorConminatorias;
    }
    console.log("MARCADO " + req.query.option);
    console.log("ID USUARIO " + req.query.userId);
    if (req.query.userId && req.query.option != "") {
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
        realizado, 
        directorio_pdf, 
        fecha_realizado, 
        rol_usuario_marcado_por 
        FROM ${TABLEUSUARIOS} 
        RIGHT JOIN ${TABLECONMINATORIAS}
        ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria
        WHERE oculto = 0 AND rol_usuario = "Fiscal" AND realizado = ${req.query.option} AND id_usuario_conminatoria = ${req.query.userId} ORDER BY realizado asc, fecha_limite asc`
      );
      if (row.length > 0) {
        console.log("API, lista conminatorias.");
        return res.status(200).send(row);
      }
      let word = "";
      if (req.query.option == "1") {
        word = "Realizadas";
      } else {
        word = "No realizadas";
      }
      res.status(422).send({
        message: `El usuario no tiene conminatorias ${word}.`,
      });
    }
    if (req.query.option && req.query.userId == "") {
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
        realizado, 
        directorio_pdf, 
        fecha_realizado, 
        rol_usuario_marcado_por  
        FROM ${TABLEUSUARIOS} 
        RIGHT JOIN ${TABLECONMINATORIAS}
        ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria
        WHERE oculto = 0 AND rol_usuario = "Fiscal" AND realizado = ${req.query.option} ORDER BY realizado asc, fecha_limite asc`
      );
      if (row.length > 0) {
        console.log("API, lista conminatorias.");
        return res.status(200).send(row);
      }
      res.status(422).send({
        message: "No existen conminatorias registradas.",
      });
    }
    if (req.query.option == "" && req.query.userId != "") {
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
        realizado, 
        directorio_pdf, 
        fecha_realizado, 
        rol_usuario_marcado_por 
        FROM ${TABLEUSUARIOS} 
        RIGHT JOIN ${TABLECONMINATORIAS}
        ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria
        WHERE oculto = 0 AND rol_usuario = "Fiscal" AND id_usuario_conminatoria = ${req.query.userId} ORDER BY realizado asc, fecha_limite asc`
      );
      if (row.length > 0) {
        console.log("API, lista conminatorias.");
        return res.status(200).send(row);
      }
      res.status(422).send({
        message: "No existen conminatorias registradas.",
      });
    }
    if (!req.query.option && !req.query.userId) {
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
      realizado, 
      directorio_pdf, 
      fecha_realizado, 
      rol_usuario_marcado_por  
      FROM ${TABLEUSUARIOS} 
      RIGHT JOIN ${TABLECONMINATORIAS}
      ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria
      WHERE oculto = 0 AND rol_usuario = "Fiscal" ORDER BY realizado asc, fecha_limite asc`
      );
      if (row.length > 0) {
        console.log("API, lista conminatorias.");
        return res.status(200).send(row);
      }
      res.status(422).send({
        message: "No existen conminatorias registradas.",
      });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// Obtener todas las Conminatorias.
exports.getAllConminatorias = async (req, res, next) => {
  console.log("---OBTENER CONMINATORIAS---");
  try {
    const noRegistradorConminatorias = await isRegistradorConminatorias(
      req,
      res
    );
    if (noRegistradorConminatorias) {
      return noRegistradorConminatorias;
    }
    console.log("MARCADO " + req.query.option);
    console.log("ID USUARIO " + req.query.userId);
    if (req.query.userId && req.query.option != "") {
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
      realizado, 
      directorio_pdf, 
      fecha_realizado, 
      rol_usuario_marcado_por ,
      conminatoria_creado,
      conminatoria_modificado,
      rol_usuario_conminatoria_modificado_por
        FROM ${TABLEUSUARIOS} 
        RIGHT JOIN ${TABLECONMINATORIAS}
        ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria
        WHERE oculto = 0 AND rol_usuario = "Fiscal" AND realizado = ${req.query.option} AND id_usuario_conminatoria = ${req.query.userId} ORDER BY realizado asc, fecha_limite asc`
      );
      if (row.length > 0) {
        console.log("API, lista conminatorias.");
        return res.status(200).send(row);
      }
      let word = "";
      if (req.query.option == "1") {
        word = "Realizadas";
      } else {
        word = "No realizadas";
      }
      res.status(422).send({
        message: `El usuario no tiene conminatorias ${word}.`,
      });
    }
    if (req.query.option && req.query.userId == "") {
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
      realizado, 
      directorio_pdf, 
      fecha_realizado, 
      rol_usuario_marcado_por ,
      conminatoria_creado,
      conminatoria_modificado,
      rol_usuario_conminatoria_modificado_por  
        FROM ${TABLEUSUARIOS} 
        RIGHT JOIN ${TABLECONMINATORIAS}
        ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria
        WHERE oculto = 0 AND rol_usuario = "Fiscal" AND realizado = ${req.query.option} ORDER BY realizado asc, fecha_limite asc`
      );
      if (row.length > 0) {
        console.log("API, lista conminatorias.");
        return res.status(200).send(row);
      }
      res.status(422).send({
        message: "No existen conminatorias registradas.",
      });
    }
    if (req.query.option == "" && req.query.userId != "") {
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
      realizado, 
      directorio_pdf, 
      fecha_realizado, 
      rol_usuario_marcado_por ,
      conminatoria_creado,
      conminatoria_modificado,
      rol_usuario_conminatoria_modificado_por
        FROM ${TABLEUSUARIOS} 
        RIGHT JOIN ${TABLECONMINATORIAS}
        ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria
        WHERE oculto = 0 AND rol_usuario = "Fiscal" AND id_usuario_conminatoria = ${req.query.userId} ORDER BY realizado asc, fecha_limite asc`
      );
      if (row.length > 0) {
        console.log("API, lista conminatorias.");
        return res.status(200).send(row);
      }
      res.status(422).send({
        message: "No existen conminatorias registradas.",
      });
    }
    if (!req.query.option && !req.query.userId) {
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
        realizado, 
        directorio_pdf, 
        fecha_realizado, 
        rol_usuario_marcado_por ,
        conminatoria_creado,
        conminatoria_modificado,
        rol_usuario_conminatoria_modificado_por 
      FROM ${TABLEUSUARIOS} 
      RIGHT JOIN ${TABLECONMINATORIAS}
      ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria
      WHERE oculto = 0 AND rol_usuario = "Fiscal" ORDER BY realizado asc, fecha_limite asc`
      );
      if (row.length > 0) {
        console.log("API, lista conminatorias.");
        return res.status(200).send(row);
      }
      res.status(422).send({
        message: "No existen conminatorias registradas.",
      });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// Obtener conminatoria por su id.
exports.getConminatoriaById = async (req, res, next) => {
  console.log("---OBTENER CONMINATORIA POR ID---");
  try {
    const noRegistradorConminatorias = await isRegistradorConminatorias(
      req,
      res
    );
    if (noRegistradorConminatorias) {
      return noRegistradorConminatorias;
    }
    const [row] = await conn.execute(
      `SELECT
      codigo,
      nombre,
      denunciados,
      denunciantes,
      delitos,
      fecha_cd,
      fecha_fiscal,
      fecha_limite,
      directorio_pdf,
      id_usuario_conminatoria
      FROM ${TABLEUSUARIOS} 
      RIGHT JOIN ${TABLECONMINATORIAS}
      ON ${TABLEUSUARIOS}.id_usuario = ${TABLECONMINATORIAS}.id_usuario_conminatoria WHERE id_conminatoria = ?`,
      [req.params.id]
    );
    if (row.length > 0) {
      console.log("API, conminatorias id.");
      return res.status(200).send(row[0]);
    } else {
      console.log(`No existe conminatoria con el id ${req.params.id}`);
      res.status(422).send({
        message: `No existe conminatoria con el id ${req.params.id}`,
      });
    }
  } catch (err) {
    next(err);
  }
};

// Actualizar conminatoria por su id.
exports.updateConminatoria = async (req, res, next) => {
  console.log("---ACTUALIZAR CONMINATORIA---");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Actualizar conminatoria, error:", errors.array());
    return res
      .status(422)
      .send({ message: errors.array({ onlyFirstError: true })[0].msg });
  }
  try {
    const noRegistradorConminatorias = await isRegistradorConminatorias(
      req,
      res
    );
    if (noRegistradorConminatorias) {
      return noRegistradorConminatorias;
    }
    const [row] = await conn.execute(
      `SELECT * FROM ${TABLECONMINATORIAS} WHERE id_conminatoria = ?`,
      [req.params.id]
    );
    if (row.length === 0) {
      console.log(
        `API, actualizar conminatorias, no existe conminatoria con id ${req.params.id}`
      );
      return res.status(422).send({
        message: `No existe conminatoria con id ${req.params.id}`,
      });
    }
    console.log(
      "ACTUA",
      req.body.codigo,
      req.body.denunciados,
      req.body.denunciantes,
      req.body.delitos,
      req.body.fecha_cd,
      req.body.fecha_fiscal,
      req.body.fecha_limite,
      req.body.id_usuario_conminatoria,
      req.params.id,
      req.file,
      req.body.directorio_pdf
    );
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedConminatorias = jwt.verify(jwtToken, process.env.WORD_JWT);
    if (req.body.codigo) {
      row[0].codigo = req.body.codigo;
    }
    if (req.body.denunciados) {
      row[0].denunciados = req.body.denunciados;
    }
    if (req.body.denunciantes) {
      row[0].denunciantes = req.body.denunciantes;
    }
    if (req.body.delitos) {
      row[0].delito = req.body.delitos;
    }
    if (req.body.fecha_cd) {
      row[0].fecha_cd = req.body.fecha_cd;
    }
    if (req.body.fecha_fiscal) {
      row[0].fecha_fiscal = req.body.fecha_fiscal;
    }
    if (req.body.fecha_limite) {
      row[0].fecha_limite = req.body.fecha_limite;
    }
    if (req.body.id_usuario_conminatoria) {
      row[0].id_usuario_conminatoria = req.body.id_usuario_conminatoria;
    }
    var filePath = "";
    if (req.file) {
      let old = req.body.directorio_pdf;
      let oldPath = "../uploadPDF/" + old.slice(34);
      deleteDocument(oldPath);
      filePath = `http://${IP_API}/upload/${req.file.filename}`;
    } else {
      filePath = req.body.directorio_pdf;
    }
    console.log("LOCATION", filePath);
    const [update] = await conn.execute(
      `UPDATE ${TABLECONMINATORIAS} SET
      codigo = ?,
      denunciados = ?,
      denunciantes = ?,
      delitos = ?,
      fecha_cd = ?,
      fecha_fiscal = ?,
      fecha_limite = ?,
      id_usuario_conminatoria = ?,
      directorio_pdf = ?,
      id_usuario_conminatoria_modificado_por = ?,
      rol_usuario_conminatoria_modificado_por = ?,
      conminatoria_modificado = NOW()
    WHERE id_conminatoria = ?`,
      [
        row[0].codigo,
        row[0].denunciados,
        row[0].denunciantes,
        row[0].delitos,
        row[0].fecha_cd,
        row[0].fecha_fiscal,
        row[0].fecha_limite,
        row[0].id_usuario_conminatoria,
        filePath,
        decodedConminatorias.id,
        decodedConminatorias.role,
        req.params.id,
      ]
    );
    if (update.affectedRows === 1) {
      console.log(
        `API, actualizar conminatoria, ${row[0].codigo} actualizado.`,
        update
      );
      return res.status(201).send({
        message: `Conminatoria ${row[0].codigo} actualizado.`,
      });
    } else {
      console.log(
        `API, actualizar conminatoria, error al actualizar conminatoria.`,
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

// Ocultar/mostrar conminatoria por ID.
exports.statusConminatoria = async (req, res, next) => {
  console.log("---ESTADO DE CONMINATORIA---");
  try {
    const noRegistradorConminatorias = await isRegistradorConminatorias(
      req,
      res
    );
    if (noRegistradorConminatorias) {
      return noRegistradorConminatorias;
    }
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedConminatorias = jwt.verify(jwtToken, process.env.WORD_JWT);
    const [row] = await conn.execute(
      `SELECT codigo as codigo,\
      IF(oculto = false,"1","0") as estado\
      FROM ${TABLECONMINATORIAS} WHERE id_conminatoria = ?`,
      [req.params.id]
    );
    if (row.length === 0) {
      res.status(422).send({
        message: `No existe conminatoria con el id ${req.params.id}`,
      });
    }
    let onOff = row[0].estado;
    let codigo = row[0].codigo;
    let estado;
    if (onOff == 1) {
      onOff = true;
      estado = "bloqueado";
    } else {
      onOff = false;
      estado = "desbloqueado";
    }
    const [status] = await conn.execute(
      `UPDATE ${TABLECONMINATORIAS} SET oculto = ${onOff},
    id_usuario_conminatoria_modificado_por = ${decodedConminatorias.id},
    rol_usuario_conminatoria_modificado_por = ${decodedConminatorias.role}, 
    modificado = NOW()\ 
    WHERE id_conminatoria = ?`,
      [req.params.id]
    );
    if (status.affectedRows === 1) {
      console.log(`${codigo} ${estado}.`);
      return res.status(200).send({
        message: `${codigo} ${estado}.`,
      });
    }
  } catch (err) {
    next(err);
  }
};

// Marcar conminatoria como realizado por ID.
exports.doneConminatoria = async (req, res, next) => {
  console.log("---MARCAR CONMINATORIA---");
  console.log("DONE", req.params.id);
  try {
    const noRegistradorConminatorias = await isRegistradorConminatorias(
      req,
      res
    );
    if (noRegistradorConminatorias) {
      return noRegistradorConminatorias;
    }
    const jwtToken = req.headers.authorization.split(" ")[1];
    var decodedConminatorias = jwt.verify(jwtToken, process.env.WORD_JWT);

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
    const [hecho] = await conn.execute(
      `UPDATE ${TABLECONMINATORIAS} SET realizado = true,
    fecha_realizado = NOW(),
    id_usuario_marcado_por = ?,
    rol_usuario_marcado_por = ?
    WHERE id_conminatoria = ?`,
      [decodedConminatorias.id, decodedConminatorias.role, req.params.id]
    );
    if (hecho.affectedRows === 1) {
      console.log(`${row[0].codigo} marcado por ${decodedConminatorias.id}.`);
      return res.status(200).send({
        message: `${row[0].codigo} marcado por ${decodedConminatorias.id}.`,
      });
    }
  } catch (err) {
    next(err);
  }
};

// Eliminar conminatoria por su id.
exports.deleteConminatoria = async (req, res, next) => {
  console.log("---OCULTAR CONMINATORIA---");
  try {
    const noRegistradorConminatorias = await isRegistradorConminatorias(
      req,
      res
    );
    if (noRegistradorConminatorias) {
      return noRegistradorConminatorias;
    }
    const [row] = await conn.execute(
      `SELECT * FROM ${TABLECONMINATORIAS} WHERE id_conminatoria = ?`,
      [req.params.id]
    );
    if (row.length === 0) {
      console.log(
        `API, eliminar conminatoria, no existe conminatoria con id ${req.params.id}.`
      );
      return res.status(422).send({
        message: `No existe conminatoria con el id ${req.params.id}.`,
      });
    }

    var codigo = row[0].codigo;

    const [delet] = await conn.execute(
      `DELETE FROM ${TABLECONMINATORIAS} WHERE id_conminatoria = ?`,
      [req.params.id]
    );

    if (delet.affectedRows === 1) {
      console.log(
        `API, eliminar conminatoria, ${row[0].codigo} eliminado.`,
        delet
      );
      return res.status(201).send({
        message: `Conminatoria ${codigo} eliminado.`,
      });
    } else {
      console.log(
        `API, eliminar conminatoria, error al eliminar conminatoria.`,
        delet
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
    deleteDocument(req);
    next(error);
  }
};
// Si existen errores no controlados, se los pasa a Express: next(error)
