EL PROFE AUGUSTO — VERSIÓN CON SERVIDOR INTERMEDIARIO

¿Qué cambia?
- La página ya no muestra un campo para la clave API.
- El navegador envía la consulta y la foto a /api/solve.
- El servidor guarda la clave en una variable de entorno, nunca en index.html.
- Incluye un límite básico de consultas para reducir abusos.

REQUISITOS
- Node.js 20 o superior.
- Una clave de Gemini configurada SOLO en el servidor.
- Publicar tanto index.html como server.js en un servicio que permita ejecutar Node.js.

PRUEBA LOCAL
1. Descomprime esta carpeta.
2. Abre una terminal dentro de la carpeta.
3. Ejecuta: npm install
4. Copia .env.example a un archivo llamado .env.
5. Edita .env y coloca la clave real en GEMINI_API_KEY.
6. Ejecuta: npm start
7. Abre http://localhost:3000

IMPORTANTE
- La clave API no se introduce en la página web ni se envía al navegador.
- No subas el archivo .env a GitHub ni lo incluyas en una carpeta pública.
- Para publicar en un servicio de alojamiento, configura GEMINI_API_KEY como una
  variable de entorno privada desde el panel del servicio.
- Este paquete es el código preparado; no significa que ya esté publicado en Internet.
- Antes de usarlo con estudiantes, configura límites de uso/costos, HTTPS y políticas
  de privacidad apropiadas para el centro educativo.
- La clave que estaba en el HTML original debe revocarse/rotarse si todavía está activa.
