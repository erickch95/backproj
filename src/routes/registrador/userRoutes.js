// Rutas para el usuario con el Rol de Registrador para los usuarios.
// Controla las entradas.
const router = require("express").Router();
const { body } = require("express-validator");
const {
  registerUser,
  getUsers,
  getAllUsers,
  getUserById,
  statusUser,
  updateUser,
  deleteUser,
} = require("../../controllers/registrador/userController");
router.post(
  "/users/register",
  [
    body("cedula", "CI es requerido.")
      .notEmpty()
      .trim()
      .custom((value) => value.replace(/\s\s+/g, " ")),
    body("clave", "Minimo 8 caracteres.")
      .notEmpty()
      .trim()
      .isAlphanumeric()
      .isLength({ min: 8 }),
    body("nombre", "Nombre es requerido, sin numeros.")
      .notEmpty()
      .trim()
      .isLength({ min: 6 })
      .isAlpha("es-ES", { ignore: " " })
      .custom((value) => value.replace(/\s\s+/g, " ")),
    body("telefono")
      .optional()
      .trim()
      .isAlphanumeric("es-ES", { ignore: " ." }),
  ],
  registerUser
);

router.get("/users/get", getUsers);
router.get("/users/getall", getAllUsers);
router.get("/users/get/:id", getUserById);
router.patch(
  "/users/update/:id",
  [
    body("cedula", "CI es requerido.")
      .notEmpty()
      .trim()
      .custom((value) => value.replace(/\s\s+/g, " ")),
    body("clave", "Minimo 6 caracteres.")
      .optional()
      .notEmpty()
      .trim()
      .isLength({ min: 6 }),
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
  updateUser
);
router.put("/users/status/:id", statusUser);
router.delete("/users/delete/:id", deleteUser);

module.exports = router;
