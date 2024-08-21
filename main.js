import { obtenerURLTodosLosProductos } from "./ScrapDatosScripts/scrapProductos.js";
import { bajarYGuardarImagenes } from "./ScrapImagenesScripts/ScrapImg.js";
import { leerJsonYGenerarINSERT } from "./ScrapDatosScripts/generarINSERT.js";
async function scrapReina() {
	await obtenerURLTodosLosProductos();
	await bajarYGuardarImagenes();
	await leerJsonYGenerarINSERT();
}
// Modificar donde se guardan los productos y agregarle la fecha del dia de hoy a la carpeta
// foramtear las / con _ .
// const today = new Date().toLocaleDateString();
// console.log(today);
scrapReina();
