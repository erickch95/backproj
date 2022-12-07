// Configuracion inicial del Servidor.
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const loginRoutes = require("./src/routes/loginRoutes");
const userRoutes = require("./src/routes/registrador/userRoutes");
const conminatoriaRoutes = require("./src/routes/registrador/conminatoriaRoutes");
const regularRoutes = require("./src/routes/fiscal/fiscalRoutes");
const globalRoutes = require("./src/routes/globalRoutes");

const app = express();
var corsOptions = {
  origin: "http://192.168.100.15:3000", // Controlamos la IP de las solicitudes.
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(loginRoutes);
app.use(userRoutes);
app.use(conminatoriaRoutes);
app.use(regularRoutes);
app.use(globalRoutes);
// Agregamos una ruta para acceder a los documentos.
app.use("/upload", express.static("../uploadPDF"));

// Respuesta para errores no controlados.
app.use((err, req, res, next) => {
  console.log(err);
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Error Interno en el Servidor.";
  res.status(err.statusCode).json({
    message: err.message,
  });
});
// Respuesta por defecto.
app.get("/", (req, res) => {
  res.json({ message: "API RUNNING" });
});
// Controlamos endpoints no existentes.
app.get("*", function (req, res) {
  res.status(404).send({
    message: "NOT FOUND",
  });
});
app.put("*", function (req, res) {
  res.status(404).send({
    message: "NOT FOUND",
  });
});
app.post("*", function (req, res) {
  res.status(404).send({
    message: "NOT FOUND",
  });
});
app.patch("*", function (req, res) {
  res.status(404).send({
    message: "NOT FOUND",
  });
});
// Iniciamos el servidor en el puerto 4000.
app.listen(4000, () => console.log("Servidor en el puerto 4000"));
