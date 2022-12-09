// Iniciamos y exportamos la conexion a la Base de Datos.
const mysql = require("mysql2/promise");
const conf = require("./dbConf");
const env = require("dotenv");
env.config();
const db_connection = mysql.createPool({
  host: process.env.HOST_DB,
  user: process.env.USER_DB,
  password: process.env.PASSWORD_DB,
  database: process.env.DATABASE_NAME,
  connectionLimit: process.env.LIMIT_DB,
  dateStrings: true,
});
module.exports = db_connection;
