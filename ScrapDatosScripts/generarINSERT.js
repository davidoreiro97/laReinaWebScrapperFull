import fs from "fs";
let queryDatabase = `DROP DATABASE IF EXISTS scrappingReinaDatabase;CREATE DATABASE scrappingReinaDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;use scrappingReinaDatabase;CREATE TABLE IF NOT EXISTS scrappingReinaDatabase.tabla_para_normalizar(id mediumint unsigned auto_increment,titulo varchar(150),marca varchar(150),cantidad smallint unsigned,unidad varchar(10),precio float,categoria varchar(254),subCategoria varchar(254),subSubCategoria varchar(254),pathImagenDisco varchar(2048),urlImagenOnline varchar(1024),urlProductoOriginal varchar(1024),PRIMARY KEY (id))CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
let queryINSERT =
	queryDatabase +
	"\n/*INSERTS*/\nINSERT INTO scrappingReinaDatabase.tabla_para_normalizar (titulo,marca,cantidad,unidad,precio,categoria,subCategoria,subSubCategoria,pathImagenDisco,urlImagenOnline,urlProductoOriginal) VALUES";
let queryNormalizacion = `/*\nARREGLAR NULLS*/UPDATE scrappingReinaDatabase.tabla_para_normalizar set subSubCategoria = NULL WHERE subSubCategoria = "" AND id>0;UPDATE scrappingReinaDatabase.tabla_para_normalizar set subCategoria = NULL WHERE subCategoria = "" AND id>0;UPDATE scrappingReinaDatabase.tabla_para_normalizar set unidad = NULL WHERE unidad = "" AND id>0;/*CREAR TABLA MARCAS*/CREATE TABLE scrappingReinaDatabase.marcas (    id mediumint AUTO_INCREMENT PRIMARY KEY,    nombre varchar(100));INSERT INTO marcas (nombre) SELECT DISTINCT marca from tabla_para_normalizar;/*CREAR Y NORMALIZAR TABLA CATEGORIAS*/CREATE TABLE scrappingReinaDatabase.categorias (	id INT auto_increment PRIMARY KEY ,    categoria varchar(254) not null,    categoriaPadre varchar(254)    );INSERT INTO categorias(categoria) SELECT DISTINCT categoria from tabla_para_normalizar;INSERT INTO categorias(categoria,categoriaPadre) SELECT DISTINCT subCategoria as "categoria", categoria as "categoriaPadre" from tabla_para_normalizar where subCategoria!="";INSERT INTO categorias(categoria,categoriaPadre) SELECT DISTINCT subSubCategoria as "categoria" ,subCategoria as "categoriaPadre" from tabla_para_normalizar where subSubCategoria!="";UPDATE categorias c1	JOIN categorias c2 ON c1.categoriaPadre = c2.categoria	SET c1.categoriaPadre = c2.id where c1.id>0;    /*NORMALIZAR TABLA PRODUCTOS*/ALTER TABLE tabla_para_normalizar ADD COLUMN idCat int not null AFTER precio;UPDATE tabla_para_normalizar,(SELECT id FROM categorias) ct 	SET tabla_para_normalizar.idCat = ct.id    WHERE subSubCategoria IS NULL AND subCategoria IS NULL AND tabla_para_normalizar.id > 0;UPDATE tabla_para_normalizar t,(SELECT id,categoria FROM categorias) ct 	SET t.idCat = ct.id    WHERE t.categoria IS NOT NULL and t.subCategoria IS NOT NULL AND t.subSubCategoria IS NULL AND t.id > 0		AND t.subCategoria = ct.categoria;UPDATE tabla_para_normalizar t,(SELECT id,categoria FROM categorias) ct 	SET t.idCat = ct.id    WHERE t.categoria  IS NOT NULL AND t.subCategoria  IS NOT NULL AND t.subSubCategoria IS NOT NULL AND t.id > 0		AND t.subSubCategoria = ct.categoria;ALTER TABLE tabla_para_normalizar DROP COLUMN categoria; ALTER TABLE tabla_para_normalizar DROP COLUMN subCategoria;ALTER TABLE tabla_para_normalizar DROP COLUMN subSubCategoria;UPDATE tabla_para_normalizar t, (SELECT id, nombre FROM marcas) as m	SET t.marca = m.id    WHERE t.marca = m.nombre AND t.id>0;`;

async function generarINSERT(producto) {
	//Esta funcion agrega a la consulta sql los valores que se van a insertar uno a uno.
	let titulo = producto.titulo;
	let marca = producto.marca;
	let cantidad = producto.cantidad === "" ? 0 : parseInt(producto.cantidad);
	let unidad = producto.unidad;
	let precio = producto.precio;
	let categoria = producto.categoria;
	let subCategoria = producto.subCategoria;
	let subSubCategoria = producto.subSubCategoria;
	let pathImagenDisco = producto.urlImagen.substring(
		producto.urlImagen.lastIndexOf("/") + 1
	); //Esta ruta se debe modificar luego en la base de datos y agregarle la ruta a donde movamos la carpeta imagenes del scrap.
	let urlImagenOnline = producto.urlImagen;
	let urlProductoOriginal = producto.urlProductoOriginal;
	let valorINSERT = `("${titulo}","${marca}",${cantidad},"${unidad}",${precio},"${categoria}","${subCategoria}","${subSubCategoria}","${pathImagenDisco}","${urlImagenOnline}","${urlProductoOriginal}"),`;
	queryINSERT = queryINSERT + "\n" + valorINSERT;
}
async function leerJsonYGenerarINSERT() {
	//Esta funcion recupera del JSON los productos y los envía uno a uno a insertBDD que irá generando la consulta SQL.
	return new Promise((resolve, reject) => {
		fs.readFile("./ResultadosScrap/productos.json", "utf8", (error, data) => {
			if (error) {
				console.log("Error leyendo el archivo JSON", error);
				reject();
				return;
			}
			try {
				const ProductosJSON = JSON.parse(data);
				ProductosJSON.forEach((producto) => {
					generarINSERT(producto);
				});
				queryINSERT = queryINSERT.slice(0, -1) + ";"; //Excluye la última , y al resultado le concatena un ;
				queryINSERT = queryINSERT + queryNormalizacion;
				console.log(
					`${
						Object.keys(ProductosJSON).length
					} Productos agregados a la consulta insert.`
				);
				try {
					fs.writeFileSync("./ResultadosScrap/insertSQLScrap.sql", queryINSERT);
					console.log(
						"Consulta SQL guardada en /ResultadosScrap/insertScrap.sql"
					);
				} catch (errorGuardado) {
					console.log("Error guardando la consulta", errorGuardado);
				}
				resolve();
			} catch (errorr) {
				console.log("Error al generar la consulta.", errorr);
				reject();
			}
		});
	});
}
//leerJsonYGenerarINSERT(); revisar los ../ResultadosScrap
export { leerJsonYGenerarINSERT };
