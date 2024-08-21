function obtenerURLCategorias() {
	// Script para obtener la url de cada categoria desde la consola del navegador.
	let $categorias = document.querySelectorAll(".Mdir");
	let urlCategorias = [];
	$categorias.forEach((categoria) => {
		console.log(categoria.innerText);
		if (
			!(
				categoria.innerText === "IMPERDIBLES" ||
				categoria.innerText === "GENERAL"
			)
		) {
			let nlCategoria = categoria.id.replace("Mdir-", "");
			let urlCategoria =
				"https://www.lareinaonline.com.ar/productosnl.asp?nl=" + nlCategoria;
			urlCategorias.push(urlCategoria);
		}
	});
	return urlCategorias;
}

function obtenerURLDeProductosPorCategoria() {
	let enlacesAProductos = [];
	let cuadrosProductos = document.querySelectorAll(".cuadProd");
	cuadrosProductos.forEach((cuadro) => {
		enlacesAProductos.push(
			cuadro.querySelector(".FotoProd").querySelector("a").href
		);
	});
	return enlacesAProductos;
}

function scrapProducto() {
	let urlProductoOriginal = window.location.href;
	let categoria = document.querySelector(".categ1");
	let subCategoria = categoria ? categoria.nextElementSibling : null;
	let subSubCategoria = subCategoria ? subCategoria.nextElementSibling : null;
	let categoriaFixed = categoria ? categoria.innerText : "";
	let subCategoriaFixed = subCategoria
		? subCategoria.innerText.replace(">", " ").trim()
		: "";
	let subSubCategoriaFixed = subSubCategoria
		? subSubCategoria.innerText.replace(">", " ").trim()
		: "";
	let urlImagen = document.querySelector(".tile")
		? "https://www.lareinaonline.com.ar/" +
		  document.querySelector(".tile").dataset.image
		: "";
	let precio = document.querySelector(".DetallPrec .izq b")
		? parseFloat(
				document
					.querySelector(".DetallPrec .izq b")
					.innerText.replace("$", "")
					.replace(".", "")
		  )
		: parseFloat(
				document
					.querySelector(".DetallPrec .der b")
					.innerText.replace("$", "")
					.replace(".", "")
		  );
	let titulo = document.querySelector(".DetallDesc b")
		? document.querySelector(".DetallDesc b").innerText.toLowerCase()
		: "";
	let cantidad = "";
	let unidad = "";
	const regex =
		/(\d+)\s*(gr|Gr|kg|Kg|ml|L|Lt|lt|La|ML|cc|Un|UN|un|Unid|unid|cm)\b/i;
	const match = titulo.match(regex);
	if (match) {
		cantidad = match[1];
		unidad = match[2];
	}
	let marca = document.querySelector(".DetallMarc")
		? document.querySelector(".DetallMarc").innerText
		: "";
	return {
		titulo: titulo,
		marca: marca,
		cantidad: cantidad,
		unidad: unidad,
		precio: precio,
		urlImagen: urlImagen,
		categoria: categoriaFixed,
		subCategoria: subCategoriaFixed,
		subSubCategoria: subSubCategoriaFixed,
		urlProductoOriginal: urlProductoOriginal,
	};
}

export {
	obtenerURLCategorias,
	obtenerURLDeProductosPorCategoria,
	scrapProducto,
};
