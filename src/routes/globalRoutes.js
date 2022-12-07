// Rutas para el usuario con el Rol de Registrador o Fiscal.
const router = require("express").Router();
const { body } = require("express-validator");
const { getCurrentById } = require("../controllers/globalController");

router.get("/users/current", getCurrentById);
module.exports = router;
