//La idea es obtener todos los enlaces a los productos y luego uno a uno ir haciendoles webScrapping, se guardaran los resultados en
//ResultadosScrap/productos.json.
//Este script en lineas generales:
// 1.Ingresa a la página principal.
// 2.Obtiene un id de cada categoría para luego enviarlo como valor del parámetro "nl"
//   en la url https://www.lareinaonline.com.ar/productosnl.asp?nl=parametro para que nos devuelva todos los productos de dicha categoría.
// 3.Para la paginación utilizan una cookie con el nombre de "cantP" la cual determina cuantos productos nos
//   va a devolver la paginación por consulta, la establecemos en un valor alto para que no exista paginación.
// 4.Una vez con los enlaces a cada uno de los productos se hace un scrap a cada uno de los productos individuales.
// 5.Cada 50 productos obtenidos se guardan en el json por si hay algún problema.
// 6.Recordar usar una VPN por las dudas.
import puppeteer from "puppeteer";
import {
	obtenerURLCategorias,
	obtenerURLDeProductosPorCategoria,
	scrapProducto,
} from "./funcionesScrappingConsolaNav.js";
import fs from "fs";
const urlHome = "https://www.lareinaonline.com.ar";
const navegador = await puppeteer.launch({ headless: "new" }); //slowMo: 100 -> demora //headless:false -> ver | new -> no ver ... Al ser global podría llegar a traer problemas de concurrencia.
let urlTodosLosProductos = [];
let TodosLosProductos = [];
let contadorProductosScrapeados = 0; //Para ir guardando cada 100 o 50 productos en un json los productos.
async function urlCategorias() {
	//Esta función abrirá la pagina principal y armará las URL hacia cada categoria,
	//al ingresar a cada url se podrá encontrar todos los productos de dicha categoría.
	console.log("Obteniendo URL de categorias...");
	const pagina = await navegador.newPage();
	pagina.setDefaultNavigationTimeout(120000); // Se establece el tiempo de espera a 120 segundos ya que tardan las consultas
	await pagina.setRequestInterception(true);
	pagina.on("request", (request) => {
		if (
			request.resourceType() === "image" ||
			request.resourceType() === "stylesheet" ||
			request.resourceType() === "font" ||
			request.resourceType() === "script"
		) {
			request.abort(); // Cancela la carga de la imagen y del archivo css. (font y script, ver si no generan problemas)
		} else {
			request.continue(); // Continúa con la solicitud de otros recursos
		}
	});
	await pagina.goto(urlHome);
	await pagina.setViewport({ width: 1600, height: 900 });
	await pagina.waitForSelector(".Mdir");
	const URLCategorias = await pagina.evaluate(obtenerURLCategorias);
	await pagina.close();
	console.log("URL de categorias obtenidos...");
	return URLCategorias;
}

async function scrapDeProductosPorCategoria(urlCategoria) {
	//Esta funcion recibe el URL de una categoria y extrae las url de cada uno de los productos en
	//esa categoria.
	//Antes de ingresar a la categoría seteamos en 3000 la cookie "cantP" para que nos muestre
	//todos los productos de dicha categoría sin paginar, luego de cada uno de estos productos extraeremos su url.
	const pagina = await navegador.newPage();
	pagina.setDefaultNavigationTimeout(240000); // Se establece el tiempo de espera a 240 segundos ya que tardan las consultas
	await pagina.setRequestInterception(true);
	pagina.on("request", (request) => {
		if (
			request.resourceType() === "image" ||
			request.resourceType() === "stylesheet" ||
			request.resourceType() === "font" ||
			request.resourceType() === "script"
		) {
			request.abort(); // Cancela la carga de la imagen y del archivo css (font y script, ver si no generan problemas)
		} else {
			request.continue(); // Continúa con la solicitud de otros recursos
		}
	});
	await pagina.setCookie({
		name: "cantP",
		value: "3000",
		domain: "www.lareinaonline.com.ar",
	});
	await pagina.setViewport({ width: 1600, height: 900 });
	await pagina.goto(urlCategoria);
	let listaProd = await pagina.$(".listaProds");
	if (!listaProd) {
		console.log(`Categoria ${urlCategoria} sin productos`);
		return;
	} else {
		let urlProductosEnCategoria = await pagina.evaluate(
			obtenerURLDeProductosPorCategoria
		);
		urlTodosLosProductos.push(...urlProductosEnCategoria);
	}
	await pagina.close();
	console.log(`URLs de productos de la categoría : ${urlCategoria} obtenidos`);
}

async function scrapDeProductosIndividual(urlProducto) {
	//Esta funcion recibe la url del producto y extrae los datos necesarios,
	//luego se guarda el producto en un array con todos los demás productos.
	console.log(`|---> Intentando recuperar producto desde ${urlProducto}`);
	const pagina = await navegador.newPage();
	pagina.setDefaultNavigationTimeout(240000); // Se establece el tiempo de espera maximo a 240 segundos
	await pagina.setRequestInterception(true);
	pagina.on("request", (request) => {
		if (
			request.resourceType() === "image" ||
			request.resourceType() === "stylesheet" ||
			request.resourceType() === "font" ||
			request.resourceType() === "script"
		) {
			request.abort(); // Cancela la carga de la imagen y del archivo css (font y script, ver si no generan problemas)
		} else {
			request.continue(); // Continúa con la solicitud de otros recursos
		}
	});
	await pagina.setViewport({ width: 1600, height: 900 });
	await pagina.goto(urlProducto); //Se podría manejar en un bloque try y en el caso de error retomar desde la URL.
	await pagina.waitForSelector(".DetallIzq");
	await pagina.waitForSelector(".DetallDer");
	let producto = await pagina.evaluate(scrapProducto);
	if (contadorProductosScrapeados % 50 === 0) {
		let productosJSON = JSON.stringify(TodosLosProductos, null, 2);
		fs.writeFile("./ResultadosScrap/productos.json", productosJSON, (err) => {
			// Escribe el JSON en el archivo
			if (err) {
				console.error("Error al escribir el archivo:", err);
				return;
			}
			console.log(
				'Archivo guardado correctamente como "productos.json" en ./ResultadosScrap/productos.json.'
			);
		});
	}
	TodosLosProductos.push(producto);
	console.log(`||---> OK <---||`);
	contadorProductosScrapeados++;
	console.log(
		`Productos obtenidos hasta el momento :${contadorProductosScrapeados} de ${urlTodosLosProductos.length}`
	);
	await pagina.close();
}

async function obtenerURLTodosLosProductos() {
	//En esta función llamará a urlCategorias para obtener las url a cada categoria y luego con un
	//bucle pasarlos a una función que hará el scrapping obteniendo todos las url de los productos de dicha
	//categoria, esta ultima función también irá acumulando en un array todos los enlaces de los productos (en urlTodosLosProductos).
	//Al finalizar esto en urlTodosLosProductos estarán todas las url de todos los productos los cuales iremos scrapeando 1 a 1.
	let URLCategorias = await urlCategorias();
	for (let categoria of URLCategorias) {
		await scrapDeProductosPorCategoria(categoria);
	}
	for (let urlProducto of urlTodosLosProductos) {
		let intentos = 0;
		while (intentos < 3) {
			// Intenta máximo 3 veces antes de pasar al siguiente producto
			try {
				await scrapDeProductosIndividual(urlProducto);
				break; // Sale del while si no hay error
			} catch (error) {
				console.error(`Error al procesar el producto ${urlProducto}:`, error);
				intentos++;
				if (intentos < 3) {
					console.log(`Reintentando en 10 segundos... Intento ${intentos}`);
					await new Promise((resolve) => setTimeout(resolve, 10000)); // Espera 10 segundos antes de reintentar
				} else {
					console.log(
						`Se excedió el número máximo de intentos para el producto ${urlProducto}`
					);
					break; // Sale del while si se excedió 3 intentos
				}
			}
		}
	}
	await navegador.close();
	//Ejecutamos de nuevo el guardado por si la última vuelta no llega a multiplo de 50.
	let productosJSON = JSON.stringify(TodosLosProductos, null, 2);
	fs.writeFile("./ResultadosScrap/productos.json", productosJSON, (err) => {
		// Escribe el JSON en el archivo
		if (err) {
			console.error("Error al escribir el archivo:", err);
			return;
		}
		console.log(
			'Archivo con los productos guardado correctamente como "productos.json" en ./ResultadosScrap/productos.json.'
		);
	});
	console.log("+---+ SCRAPPING DE PRODUCTOS TERMINADO +---+");
}
export { obtenerURLTodosLosProductos };
