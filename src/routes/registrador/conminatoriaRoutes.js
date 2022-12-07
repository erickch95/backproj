// Rutas para el usuario con el Rol de Registrador para las conminatorias.
// Controla las entradas.
const router = require("express").Router();
const { body } = require("express-validator");
const {
  insertConmminatoria,
  getConminatorias,
  getAllConminatorias,
  getConminatoriaById,
  statusConminatoria,
  updateConminatoria,
  deleteConminatoria,
  doneConminatoria,
} = require("../../controllers/registrador/conminatoriaController");
const uploadPdf = require("../../controllers/registrador/pdfController");

router.post(
  "/conminatorias/insert",
  function (req, res, next) {
    uploadPdf(req, res, (error) => {
      if (error) {
        res.status(422).send({
          message: "Revise los campos requeridos, archivo PDF maximo 3 MB.",
        });
      }
      next(error);
    });
  },
  [
    body("codigo")
      .notEmpty()
      .withMessage("Código no puede estar vacío.")
      .trim()
      .isLength({ min: 6, max: 18 })
      .withMessage("Código de 6 a 15 cáracteres.")
      .isAlphanumeric("es-ES", { ignore: "-" })
      .withMessage("Código no puede contener carácteres especiales.")
      .custom((value) => value.replace(/\s\s+/g, " ")),
    body("id_usuario_conminatoria")
      .notEmpty()
      .withMessage("No se seleccionó un fiscal.")
      .isNumeric()
      .trim(),
    body("denunciados")
      .optional()
      .trim()
      .isLength({ min: 10, max: 255 })
      .withMessage(
        "Denunciados no puede estar vacío, mínimo 10 máximo 254 carácteres."
      )
      .custom((value) => value.replace(/\s\s+/g, " "))
      .isAlphanumeric("es-ES", { ignore: " ,.-" })
      .withMessage("Denunciados no puede contener carácteres especiales."),
    body("denunciantes")
      .optional()
      .trim()
      .isLength({ min: 10, max: 255 })
      .withMessage(
        "Denunciantes no puede estar vacío, mínimo 10 máximo 254 carácteres."
      )
      .custom((value) => value.replace(/\s\s+/g, " "))
      .isAlphanumeric("es-ES", { ignore: " ,.-" })
      .withMessage("Denunciantes no puede contener carácteres especiales."),
    body("delitos")
      .optional()
      .trim()
      .isLength({ min: 10, max: 128 })
      .withMessage(
        "Delitos no puede estar vacío, mínimo 10 máximo 127 carácteres."
      )
      .custom((value) => value.replace(/\s\s+/g, " "))
      .isAlphanumeric("es-ES", { ignore: " ,.-" })
      .withMessage("Delitos no puede contener carácteres especiales."),
    body("fecha_cd", "Revisar la fecha CD.").notEmpty().trim().isDate(),
    body("fecha_fiscal", "Revisar la fecha Fiscal.").notEmpty().trim().isDate(),
    body("fecha_limite", "Revisar la fecha limite.").notEmpty().trim().isDate(),
    body("id_usuario_conminatoria", "Revisar la fecha limite.")
      .notEmpty()
      .isNumeric(),
  ],
  insertConmminatoria
);

router.get("/conminatorias/get", getConminatorias);
router.get("/conminatorias/getall", getAllConminatorias);
router.get("/conminatorias/get/:id", getConminatoriaById);
router.patch(
  "/conminatorias/update/:id",
  function (req, res, next) {
    uploadPdf(req, res, (error) => {
      if (error) {
        res.status(422).send({
          message: "Revise los campos requeridos, archivo PDF maximo 3 MB.",
        });
      }
      next(error);
    });
  },
  [
    body("codigo")
      .notEmpty()
      .withMessage("Código no puede estar vacío.")
      .trim()
      .isLength({ min: 6, max: 18 })
      .withMessage("Código de 6 a 15 cáracteres.")
      .isAlphanumeric("es-ES", { ignore: "-" })
      .withMessage("Código no puede contener carácteres especiales.")
      .custom((value) => value.replace(/\s\s+/g, " ")),
    body("id_usuario_conminatoria")
      .notEmpty()
      .withMessage("No se seleccionó un fiscal.")
      .isNumeric()
      .trim(),
    body("denunciados")
      .optional()
      .trim()
      .isLength({ min: 10, max: 255 })
      .withMessage(
        "Denunciados no puede estar vacío, mínimo 10 máximo 254 carácteres."
      )
      .custom((value) => value.replace(/\s\s+/g, " "))
      .isAlphanumeric("es-ES", { ignore: " ,.-" })
      .withMessage("Denunciados no puede contener carácteres especiales."),
    body("denunciantes")
      .optional()
      .trim()
      .isLength({ min: 10, max: 255 })
      .withMessage(
        "Denunciantes no puede estar vacío, mínimo 10 máximo 254 carácteres."
      )
      .custom((value) => value.replace(/\s\s+/g, " "))
      .isAlphanumeric("es-ES", { ignore: " ,.-" })
      .withMessage("Denunciantes no puede contener carácteres especiales."),
    body("delitos")
      .optional()
      .trim()
      .isLength({ min: 10, max: 128 })
      .withMessage(
        "Delitos no puede estar vacío, mínimo 10 máximo 127 carácteres."
      )
      .custom((value) => value.replace(/\s\s+/g, " "))
      .isAlphanumeric("es-ES", { ignore: " ,.-" })
      .withMessage("Delitos no puede contener carácteres especiales."),
    body("fecha_cd", "Revisar la fecha CD.").notEmpty().trim().isDate(),
    body("fecha_fiscal", "Revisar la fecha Fiscal.").notEmpty().trim().isDate(),
    body("fecha_limite", "Revisar la fecha limite.").notEmpty().trim().isDate(),
    body("id_usuario_conminatoria", "Revisar la fecha limite.")
      .notEmpty()
      .isNumeric(),
  ],
  updateConminatoria
);
router.put("/conminatorias/hide/:id", statusConminatoria);
router.put("/conminatorias/done/:id", doneConminatoria);
router.delete("/conminatorias/delete/:id", deleteConminatoria);
module.exports = router;
