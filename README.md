# Nuestro Espacio 💖

Una aplicación privada y exclusiva para dos personas (una pareja), diseñada para ser un rincón íntimo, moderno y seguro donde compartir fotos, videos y pensamientos.

## Características Principales
- **Autenticación Segura**: JWT en cookies con encriptación robusta. Solo 2 usuarios permitidos (sin registro público).
- **Contador de Días**: Seguimiento de los días compartidos juntos desde una fecha inicial.
- **Galería Dual**: Soporte completo para subir, visualizar fotos y videos.
- **Diario Compartido**: Un espacio para dejarse notas, mensajes y recuerdos.
- **Personalización Dinámica**: Cambia el color de acento y modo claro/oscuro en tiempo real para tu sesión.
- **Diseño Emocional**: Animaciones fluidas con Framer Motion y una interfaz cuidada y elegante.

## Stack Tecnológico
- **Frontend/Backend**: Next.js 16 (App Router) + TypeScript
- **Estilos**: Tailwind CSS + Framer Motion
- **Base de Datos**: Prisma ORM + SQLite (Para desarrollo local)
- **Autenticación**: `jose` (JWT en Edge/Middleware) + `bcrypt`

## Requisitos Previos
- Node.js v18+
- npm o yarn

## Guía de Configuración Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Variables de Entorno:**
   Crea un archivo `.env` en la raíz del proyecto.
   ```env
   # .env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="tu-secreto-ultra-seguro-aqui"
   ```

3. **Configurar Base de Datos:**
   Si es la primera vez, empuja el esquema a la base de datos:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **Sembrar (Seed) la base de datos:**
   Asegúrate de ejecutar el seed para crear las cuentas (`kenny` y `ashley`) y configurar la fecha de inicio (04/10/2025):
   ```bash
   npx tsx prisma/seed.ts
   ```
   > **Nota:** Las contraseñas por defecto son iguales a los nombres de usuario (ej. usuario: `kenny`, contraseña: `kenny`).

5. **Iniciar Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

## Guía para Despliegue en Producción (Cloud)

Actualmente las fotos y videos se guardan localmente en `/public/uploads/` y la base de datos es SQLite. Para desplegar a Vercel, deberás hacer dos cambios principales:

1. **Migrar la Base de Datos:**
   Cambia `provider = "sqlite"` a `provider = "postgresql"` en `prisma/schema.prisma` y usa una base de datos en la nube (como Supabase o Neon).
   
2. **Almacenamiento de Multimedia:**
   Cambia la implementación en `lib/uploadService.ts` para que suba los archivos a un servicio como Cloudinary o Amazon S3, ya que Vercel no soporta escritura persistente en disco (es Serverless).

## Estructura del Proyecto
- `/app`: Rutas de Next.js (Pages, APIs, Middleware).
- `/components`: Componentes reutilizables de UI.
- `/lib`: Utilidades como Auth (JWT) y el servicio de Uploads.
- `/prisma`: Esquema de la base de datos y script de seed.
- `/store`: Manejo de estado global con Zustand (Theme, Auth State).
- `/public/uploads`: Carpeta donde se guardan temporalmente (en dev) los archivos subidos.
