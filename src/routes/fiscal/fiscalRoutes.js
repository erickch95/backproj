// Rutas para el usuario con el Rol de Fiscal.
// Controla las entradas.
const router = require("express").Router();
const { body } = require("express-validator");
const {
  getFiscalById,
  updateFiscal,
  getFiscalConminatorias,
  doneFiscalConminatoria,
} = require("../../controllers/fiscal/fiscalController");

router.get("/users/fiscal/get/:id", getFiscalById);
router.patch(
  "/users/fiscal/update/:id",
  [
    body("cedula", "CI es requerido.")
      .notEmpty()
      .trim()
      .custom((value) => value.replace(/\s\s+/g, " ")),
    body("clave", "Minimo 8 caracteres.")
      .optional()
      .notEmpty()
      .trim()
      .isLength({ min: 8 }),
    body("nombre", "Nombre es requerido, sin numeros.")
      .notEmpty()
      .trim()
      .isLength({ min: 6 })
      .isAlpha("es-ES", { ignore: " " })
      .custom((value) => value.replace(/\s\s+/g, " ")),
    body("telefono", "Revise el telefono.")
      .trim()
      .isAlphanumeric("es-ES", { ignore: " ." }),
  ],
  updateFiscal
);
router.get("/conminatorias/fiscal/get", getFiscalConminatorias);
router.put("/conminatorias/fiscal/done/:id", doneFiscalConminatoria);

module.exports = router;
