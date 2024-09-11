//En este script se tratará de obtener todas las imagenes de los productos y guardarlas en la carpeta ResultadosScrap
//con el nombre igual al código con el que vienen, por ejemplo (7794870000040.jpg).
import fs from "fs";
import axios from "axios";
let imagenesURL = [];
let contadorImgDescargadas = 0;
async function recuperarURLImagenes() {
	//Esta funcion recupera del JSON las url de cada imagen de cada uno de los productos y los carga en la variable imagenesURL.
	//Esta envuelto dentro de una promesa ya que fs.readFile no devuelve una promesa
	return new Promise((resolve, reject) => {
		const rutaJSON = "./ResultadosScrap/productos.json";
		fs.readFile(rutaJSON, "utf8", (error, data) => {
			if (error) {
				reject(error);
				return;
			}
			try {
				const ProductosJSON = JSON.parse(data);
				imagenesURL = ProductosJSON.map((producto) => {
					return producto.urlImagen;
				});
				resolve();
			} catch (errorr) {
				reject(errorr);
			}
		});
	});
}

async function bajarYGuardarImagen(url, nombreArchivoConExtension) {
	//Con cada url descarga la imagen y la guarda con su nombre en la carpeta imagenes dentro de ResultadosScrap
	const rutaArchivo = `./ResultadosScrap/imagenesProductos/${nombreArchivoConExtension}`;
	const respuesta = await axios({
		method: "GET",
		url: url,
		responseType: "stream",
	});
	const writer = fs.createWriteStream(rutaArchivo); // Creamos un stream de escritura para guardar la imagen
	respuesta.data.pipe(writer);
	return new Promise((resolve, reject) => {
		writer.on("finish", resolve);
		writer.on("error", reject);
	});
}

async function bajarYGuardarImagenes() {
	//Esta funciond invoca las otras 2, recupera las URL desde el JSON, se las pasa una a una a la otra
	//funcion que baja y guarda, se espera 10s si hay un error ya que el servidor nos podría bloquear por un rato.
	await recuperarURLImagenes();
	for (const urlImagen of imagenesURL) {
		let nombreArchivo = urlImagen.substring(urlImagen.lastIndexOf("/") + 1);
		let intentos = 0;
		while (intentos < 3) {
			try {
				console.log(urlImagen);
				await bajarYGuardarImagen(urlImagen, nombreArchivo);
				//await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo.
				contadorImgDescargadas++;
				console.log(
					`Imagen ${nombreArchivo} descargada correctamente.(${contadorImgDescargadas} de ${imagenesURL.length})`
				);
				break;
			} catch (error) {
				console.error(
					`Error al descargar o guardar la imagen ${nombreArchivo}`,
					error
				);
				intentos++;
				if (intentos < 3) {
					console.log(`Reintentando en 10 segundos... Intento ${intentos}`);
					await new Promise((resolve) => setTimeout(resolve, 10000)); //10s
				} else {
					console.log(
						`Se excedió el número máximo de intentos para el producto ${nombreArchivo}`
					);
					break;
				}
			}
		}
	}
	console.log("+---+ SCRAPPING DE IMAGENES TERMINADO +---+");
}
//bajarYGuardarImagenes(); // Revisar la ruta de ../Resultados...
export { bajarYGuardarImagenes };
