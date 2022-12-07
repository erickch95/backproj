// Iniciamos y exportamos la conexion a la Base de Datos.
const mysql = require("mysql2/promise");
const conf = require("./dbConf");
const db_connection = mysql.createPool({
  host: conf.HOST,
  user: conf.USER,
  password: conf.PASSWORD,
  database: conf.DATABASE,
  connectionLimit: conf.LIMIT,
  dateStrings: true,
});
module.exports = db_connection;
