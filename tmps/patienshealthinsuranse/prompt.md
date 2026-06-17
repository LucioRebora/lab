Tengo un archivo CSV ubicado en:

tmps\patienshealthinsuranse\patienshealthinsur.csv

Necesito cargar su contenido en la tabla PatientHealthInsurance de la base de datos.

Estructura y reglas de carga

Se deben tener en cuenta las siguientes correspondencias entre columnas del CSV y los datos del sistema:

external_code → corresponde al campo external_code en la tabla PatientHealthInsurance.

IDPaciente_external_code → corresponde al campo external_code de la tabla Patients.

ObraSocial_external_code → corresponde al campo external_code de la tabla HealthInsurance.

NumAfiliado → corresponde al campo nroAfiliado en PatientHealthInsurance.

Regla importante de relaciones

La tabla PatientHealthInsurance debe relacionar:

patients

healthInsurance

usando los IDs internos de las tablas, no los external_code.

Por lo tanto, para cada fila del CSV se debe:

Buscar el id del paciente en la tabla Patients usando
Patients.external_code = IDPaciente_external_code.

Buscar el id de la obra social en la tabla HealthInsurance usando
HealthInsurance.external_code = ObraSocial_external_code.

Insertar un registro en PatientHealthInsurance con:

external_code

patient_id (id obtenido de Patients)

healthInsurance_id (id obtenido de HealthInsurance)

nroAfiliado (valor de NumAfiliado)

Reglas adicionales

Si no existe el paciente o la obra social, no insertar el registro y registrar el error.

Ignorar filas vacías.

Evitar duplicados si external_code ya existe.

Leer el CSV desde tmps\patienshealthinsuranse\patienshealthinsur.csv.

Resultado esperado

Generar un script en Node.js usando Prisma (o SQL si se prefiere) que:

lea el CSV

resuelva las relaciones usando external_code

inserte los datos en PatientHealthInsurance utilizando los IDs internos.