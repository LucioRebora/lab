Tengo un archivo CSV ubicado en:

tmps\healthinsuranse\ObrasSociales.csv

Necesito cargar su contenido en la tabla ObrasSociales de la base de datos realizando las siguientes transformaciones:

Eliminar la columna codigo, ya que no se utiliza y no debe insertarse en la tabla.

La columna codigoexterno del CSV debe mapearse al campo codigo_externo en la tabla ObrasSociales.

El campo nombre debe convertirse completamente a MAYÚSCULAS antes de insertarse.

El resto de las columnas deben insertarse respetando sus nombres originales.

Ignorar filas vacías si existen.

El script debe ser idempotente si es posible (evitar duplicados si codigo_externo ya existe).

Generar el script de carga de datos (puede ser SQL o Node.js) que:

Lea el CSV desde tmps\healthinsuranse\ObrasSociales.csv

Realice las transformaciones indicadas

Inserte los datos en la tabla ObrasSociales.