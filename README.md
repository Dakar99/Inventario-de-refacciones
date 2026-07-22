# Refaccionaria Backend + Frontend — PostgreSQL

Versión ligera corregida para usar **PostgreSQL** y servir frontend + backend desde el mismo servidor Express.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar `.env`

Copia `.env.example` como `.env` y cambia tus datos:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=refaccionaria
DB_SSL=false
JWT_SECRET=cambia_este_secreto_en_produccion
```

Si tu PostgreSQL está en servidor externo y requiere SSL, usa:

```env
DB_SSL=true
```

## 3. Crear base de datos e importar tablas

```bash
createdb refaccionaria
psql -U postgres -d refaccionaria -f database.sql
```

También puedes importar `database.sql` desde pgAdmin.

## 4. Ejecutar

```bash
npm start
```

Abre:

```text
http://localhost:3000
```

## Usuarios iniciales

- Usuario: `bodega` / Contraseña: `1234`
- Usuario: `juan` / Contraseña: `1234`
- Usuario: `maria` / Contraseña: `1234`

Al iniciar sesión, las contraseñas en texto plano se migran automáticamente a bcrypt.

## Cambios principales incluidos

- Se conserva PostgreSQL (`pg`).
- `database.sql` convertido de MySQL a PostgreSQL.
- Frontend y backend quedan juntos en `public/` + Express.
- Logos e imágenes se conservan dentro de `public/` y `public/uploads/`.
- Dashboard e inventario ahora consultan la API/PostgreSQL.
- Eliminación de refacciones corregida para consultar la API, no `localStorage`.
- Sesión con JWT restaurable desde `localStorage`.
