// Rutas para el ingreso de las credenciales.
// Controla las entradas.
const router = require("express").Router();
const { body } = require("express-validator");
const { login } = require("../controllers/loginController");
router.post(
  "/users/login",
  [
    body("cedula", "CI es requerido.")
      .notEmpty()
      .trim()
      .isAlphanumeric("es-ES", { ignore: "-" })
      .custom((value) => value.replace(/\s\s+/g, " ")),
    body("clave", "Minimo 8 caracteres.")
      .notEmpty()
      .trim()
      .isAlphanumeric()
      .isLength({ min: 4 }),
  ],
  login
);
module.exports = router;
