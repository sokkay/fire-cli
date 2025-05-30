# Fire CLI

CLI tool para ejecutar scripts de Firebase usando Commander.js

## Instalación

```bash
npm install

# Instalar globalmente (opcional)
npm install -g .
```

## Configuración

### Configuración automática
```bash
# Generar archivo de configuración de ejemplo
fire-cli init-config

# O si instalaste localmente
node bin/fire-cli.js init-config
```

### Configuración manual
El CLI busca archivos de configuración en este orden:
1. `./fire-cli.json` (directorio actual)
2. `~/.fire-cli.json` (directorio home)
3. `~/.config/fire-cli.json` (directorio config)

Ejemplo de `.fire-cli.json`:
```json
{
  "scriptsDirectory": "./firebase-scripts",
  "firebaseKeyPath": "./firebase-key.json"
}
```

### Credenciales de Firebase
1. Coloca tu archivo de credenciales de Firebase en `firebase-key.json` en la raíz del proyecto
2. O especifica la ruta con el flag `-c`
3. O configúralo en el archivo `.fire-cli.json`

## Cómo obtener el Service Account de Firebase

### 1. Acceder a la Consola de Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto o crea uno nuevo

### 2. Generar Service Account Key
1. En la consola de Firebase, haz clic en el ícono de **configuración** (⚙️) junto a "Project Overview"
2. Selecciona **"Project settings"**
3. Ve a la pestaña **"Service accounts"**
4. En la sección **"Firebase Admin SDK"**, selecciona **"Node.js"**
5. Haz clic en **"Generate new private key"**
6. Confirma haciendo clic en **"Generate key"**
7. Se descargará un archivo JSON automáticamente

### 3. Configurar el archivo
1. Renombra el archivo descargado a `firebase-key.json`
2. Colócalo en la raíz de tu proyecto
3. **¡IMPORTANTE!** Agrega `firebase-key.json` a tu `.gitignore` para no subirlo al repositorio

```bash
# .gitignore
firebase-key.json
!firebase-key.example.json
```

### 4. Estructura del Service Account
El archivo `firebase-key.json` debe tener esta estructura:
```json
{
  "type": "service_account",
  "project_id": "tu-proyecto-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tu-proyecto-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40tu-proyecto-id.iam.gserviceaccount.com"
}
```

### 5. Permisos del Service Account
El Service Account generado automáticamente tiene los permisos necesarios para:
- ✅ Leer/escribir en Firestore
- ✅ Leer/escribir en Realtime Database
- ✅ Acceder a Firebase Storage
- ✅ Enviar notificaciones push
- ✅ Gestionar usuarios de Authentication

### 6. Configuración alternativa con variables de entorno
También puedes usar variables de entorno en lugar del archivo:

```bash
# .env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-key.json
```

O configurar directamente las credenciales:
```bash
export FIREBASE_PROJECT_ID="tu-proyecto-id"
export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@tu-proyecto-id.iam.gserviceaccount.com"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 7. Verificar la configuración
```bash
# Probar que las credenciales funcionan
fire-cli -s ./firebase-scripts -e "getUsers"
```

Si ves un error como `Error: Could not load the default credentials`, verifica:
- ✅ El archivo `firebase-key.json` existe y está en la ruta correcta
- ✅ El JSON tiene formato válido
- ✅ El proyecto de Firebase está activo
- ✅ Firestore está habilitado en tu proyecto

## Uso

### Comando global (si se instaló globalmente)
```bash
fire-cli [opciones]
```

### Comando local
```bash
node bin/fire-cli.js [opciones]
# O usando npm
npm start -- [opciones]
```

### Selección interactiva (comportamiento por defecto)
```bash
# Seleccionar función interactivamente
fire-cli -s ./firebase-scripts

# Con configuración por defecto
fire-cli
```

### Listar funciones disponibles
```bash
# Solo listar funciones (muestra parámetros)
fire-cli -s ./firebase-scripts -l

# Formato: archivo.js:nombreFuncion(parametros)
```

### Ejecutar función específica
```bash
# Función sin parámetros (formato JSON por defecto)
fire-cli -s ./firebase-scripts -e "getUsers"

# Función con parámetros (se pedirán interactivamente)
fire-cli -s ./firebase-scripts -e "getUserById"

# Función con argumentos desde línea de comandos
fire-cli -s ./firebase-scripts -e "getUserById" -a "user123"

# Múltiples argumentos
fire-cli -s ./firebase-scripts -e "getUsersByAge" -a 18 65

# Con formato de tabla
fire-cli -s ./firebase-scripts -e "getUsers" --table

# Especificar archivo:función
fire-cli -s ./firebase-scripts -e "users.js:getUserById" -a "user123"
```

### Opciones disponibles

- `-s, --load-script <path>`: Ruta al directorio de scripts (default: ./firebase-scripts)
- `-l, --list`: Solo listar funciones disponibles (sin selección interactiva)
- `-e, --execute <function>`: Ejecutar función específica
- `-c, --config <path>`: Ruta al archivo de credenciales de Firebase (default: ./firebase-key.json)
- `-t, --table`: Mostrar resultados en formato tabla (default: JSON)
- `-a, --args <args...>`: Argumentos para pasar a la función

### Comandos especiales

```bash
# Generar archivo de configuración de ejemplo
fire-cli init-config
```

## Manejo de Argumentos

### Detección automática
El CLI detecta automáticamente los parámetros de las funciones:

```javascript
// Se muestra como: users.js:getUserById(userId)
export const getUserById = async (userId = 'test-user') => { ... }

// Se muestra como: users.js:createUser(name, email, age)
export const createUser = async (name, email, age) => { ... }
```

### Tipos de argumentos soportados

- **Strings**: `"texto"` o `texto`
- **Numbers**: `123`, `45.67`
- **Booleans**: `true`, `false`
- **Null**: `null`
- **Objects**: `{"key":"value"}`
- **Arrays**: `[1,2,3]`

### Formas de proporcionar argumentos

1. **Interactivo** (sin -a):
```bash
fire-cli -s ./firebase-scripts -e "getUserById"
# Te preguntará: Enter value for parameter "userId":
```

2. **Línea de comandos** (con -a):
```bash
fire-cli -s ./firebase-scripts -e "createUser" -a "Juan Pérez" "juan@email.com" 25
```

3. **Argumentos complejos**:
```bash
# Objeto JSON
fire-cli -s ./firebase-scripts -e "updateUser" -a "user123" '{"name":"Juan","age":30}'

# Boolean
fire-cli -s ./firebase-scripts -e "updateUserStatus" -a "user123" true
```

## Funciones Destructivas

El CLI detecta automáticamente funciones que pueden modificar datos y pide confirmación:

**Palabras clave detectadas**: `delete`, `remove`, `destroy`, `drop`, `clear`, `purge`, `wipe`, `update`, `edit`, `modify`, `change`, `set`, `patch`, `create`, `add`, `insert`, `save`, `write`, `post`, `put`

```bash
# Ejemplo: función destructiva
fire-cli -e "deleteUser"
# ⚠️  WARNING: This function may modify or delete data!
# Function: deleteUser
# ? Are you sure you want to execute this function? (y/N)
```

## Formatos de Salida

### JSON (Por defecto)
- Muestra todos los campos y datos completos
- Mejor para documentos con muchos campos
- Formato legible y completo

### Tabla (--table)
- Vista tabular organizada
- Limita a 6 columnas máximo
- Trunca textos largos
- Ideal para datos simples

## Estructura de Scripts

Los scripts deben exportar funciones async que usen la variable global `db` para acceder a Firestore:

```javascript
// firebase-scripts/users.js

// Función sin parámetros
export const getUsers = async () => {
  const snap = await db.collection('Usuarios').get();
  return snap;
};

// Función con parámetros opcionales
export const getUserById = async (userId = 'test-user') => {
  const doc = await db.collection('Usuarios').doc(userId).get();
  
  if (!doc.exists) {
    return { error: 'User not found' };
  }
  
  return {
    id: doc.id,
    ...doc.data()
  };
};

// Función con múltiples parámetros
export const createUser = async (name, email, age) => {
  const docRef = await db.collection('Usuarios').add({
    name,
    email,
    age: parseInt(age),
    createdAt: new Date(),
    active: true
  });
  
  return {
    id: docRef.id,
    message: `User created successfully with ID: ${docRef.id}`
  };
};
```

## Ejemplos

```bash
# Instalar dependencias
npm install

# Generar configuración
fire-cli init-config

# Listar funciones (muestra parámetros)
fire-cli -s ./firebase-scripts -l

# Selección interactiva (comportamiento por defecto)
fire-cli -s ./firebase-scripts

# Ejecutar sin parámetros
fire-cli -s ./firebase-scripts -e "getUsers"

# Ejecutar con parámetros interactivos
fire-cli -s ./firebase-scripts -e "getUserById"

# Ejecutar con argumentos desde CLI
fire-cli -s ./firebase-scripts -e "getUserById" -a "user123"

# Crear usuario con múltiples argumentos
fire-cli -s ./firebase-scripts -e "createUser" -a "Juan Pérez" "juan@email.com" 25

# Usar formato tabla
fire-cli -s ./firebase-scripts -e "getUsers" --table

# Especificar archivo específico
fire-cli -s ./firebase-scripts -e "users.js:getUserById" -a "user123"
```

## Instalación Global

```bash
# Instalar globalmente
npm install -g .

# Usar desde cualquier lugar
fire-cli --help
fire-cli init-config
fire-cli -s /path/to/scripts -e "myFunction"
```

## Características

- ✅ Carga dinámica de scripts JavaScript con Babel
- ✅ **Detección automática de parámetros**
- ✅ **Prompt interactivo para argumentos**
- ✅ **Argumentos desde línea de comandos**
- ✅ **Parsing inteligente de tipos**
- ✅ **Sistema de configuración flexible**
- ✅ **Comando init-config**
- ✅ **Detección de funciones destructivas**
- ✅ **Confirmación de seguridad**
- ✅ Listado interactivo de funciones
- ✅ Ejecución directa por nombre
- ✅ **Formato JSON por defecto** (mejor para datos complejos)
- ✅ **Formato tabla opcional** (--table flag)
- ✅ Soporte para QuerySnapshot de Firestore
- ✅ Manejo de errores
- ✅ Colores y emojis en la salida
- ✅ Truncado inteligente en tablas
- ✅ Límite de columnas en tablas
- ✅ **Binario global disponible**
- ✅ **Soporte ES modules con transformación Babel** 