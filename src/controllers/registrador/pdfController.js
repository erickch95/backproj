// Controlador que verifica el documento PDF.
const multer = require("multer");
// Se verifica que no hayan campos vacios antes de subir el archivo.
// Se verifica que el archivo sea PDF.
const pdfFilter = (req, file, cb) => {
  console.log("muterreq", req);
  console.log("muterfile", file);
  if (
    !req.body.codigo ||
    !req.body.fecha_cd ||
    !req.body.fecha_fiscal ||
    !req.body.fecha_limite ||
    !req.body.id_usuario_conminatoria
  ) {
    console.log("Existen campos vacios.");
    cb("Existen campos vacios.", false);
  } else {
    if (file.mimetype.startsWith("application/pdf")) {
      cb(null, true);
    } else {
      console.log("No es archivo PDF.");
      cb("No es archivo PDF.", false);
    }
  }
};
// Creamos una cadena aleatoria para el nombre del archivo.
const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function generateString(length) {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
// Se verifica la ruta y se otorga el nombre al archivo.
// Se verifica si es PDF y pesa menos de 3 MB.
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log("controller", req.body.codigo);
    callback(null, "../uploadPDF/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      req.body.id_usuario_conminatoria + "Z" + generateString(20) + ".pdf"
    );
  },
});
const uploadPdf = multer({
  storage: storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 3000000,
  },
}).single("documento"); // El nombre del input en el formulario.

module.exports = uploadPdf;
