Necesito actualizar la tabla Patients para completar los receptores de notificaciones.

Archivos de origen

Los datos se encuentran en los siguientes archivos:

Receptores

tmps\usersnotif\receptores.csv

Archivo intermedio (relación paciente ↔ receptor)

tmps\usersnotif\pacientes-usuariosnotifica.csv
Lógica del proceso

La tabla Patients tiene el campo:

external_code (código externo del paciente)

El proceso debe realizar lo siguiente:

Leer el archivo pacientes-usuariosnotifica.csv.

De cada fila obtener:

external_code del paciente

id del receptor de notificación.

Con ese id del receptor, buscar en el archivo receptores.csv los datos correspondientes al receptor.

Buscar el paciente en la base de datos utilizando:

Patients.external_code

Actualizar el registro del paciente con los datos del receptor.

Campos que se deben completar en Patients

Actualizar los siguientes campos:

enviarNotificacionOtro → establecer en true

enviarInforme

receptorApellido

receptorEmail

receptorNombre

clave_informe → debe completarse con el valor de contraseña del receptor en receptores.csv

Reglas adicionales

Solo actualizar pacientes que estén en pacientes-usuariosnotifica.csv.

La relación con Patients debe hacerse por external_code.

Si no se encuentra el paciente en la base de datos, registrar el error y continuar.

Si no se encuentra el receptor en receptores.csv, registrar el error y continuar.

Ignorar filas vacías o inválidas.

Resultado esperado

Generar un script en Node.js usando Prisma que:

Lea ambos archivos CSV.

Relacione paciente → receptor usando el archivo intermedio.

Busque el paciente por external_code.

Actualice en la tabla Patients los campos:

enviarNotificacionOtro
enviarInforme
receptorApellido
receptorEmail
receptorNombre
clave_informe