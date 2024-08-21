-> Este es un scrapper que obtiene los productos del supermercado "La Reina" de la ciudad de Rosario.
-> Genera como salida los resultados en la carpeta "ResultadosScrap" los cuales son un archivo JSON datos reelevantes
de los productos, descarga todas las imagenes de esos productos en la carpeta "imagenesProductos" y también genera 
una consulta SQL del tipo insert con los mismos valores del JSON, se agrega un atributo que es el path con los nombres
de las imagenes de cada uno de los producto para despues poder asociarlos a su imagen.
-> El proceso 
- obtenerURLTodosLosProductos() lo que hace es generar un archivo llamado "productos.json" dentro de ResultadosScrap con la
  información de todos los productos, lo que hace primero es ir a la home, obtener los enlaces a cada categoría y luego entrar
  a cada una de esas categorías para obtener las url a cada uno de los productos individuales, luego entra a cada producto y 
  extrae información reelevante de cada uno de ellos.
- bajarYGuardarImagenes() consulta cada una de las url de las imagenes de los productos en productos.json y baja y guarda las imagenes
  mediante axios en el archivo ResultadosScrap/imagenesProductos.
- leerJsonYGenerarINSERT() por último esta función toma todos los datos de productos.json y los transforma en una query SQL que luego
  podemos insertar en una base de datos relacional, genera el archivo /ResultadosScrap/insertSQLScrap.sql .

--> Usar siempre un proxy. , para iniciar ir a la carpeta LaReinaScrapping y ejecutar npm start o node main.js;