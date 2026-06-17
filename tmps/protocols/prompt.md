- si llegas a este punto, no hacerlo, lo haremos mas adelante -
insertar este csv 
tmps\protocols\Protocolos.csv
en Protocols, realizando:
crear en la tabla una columna codigoExterno para guardar el codigo externo
IDProtocolo es el codigoExterno
NumProtocolo es numeroSecuencial
IDPaciente es ptient.codigoExterno
IDPortada (omitir esta campo y sus valores)
IDDoctor es doctor.codigoExterno
IDBioquimicoFirmante es Biochemist.codigoExterno
IDUsuarioPublicado es NotifiedUser.codigoExterno
IDUsuarioPortadaPublicado es NotifiedUser.codigoExterno
en laboratoryId = 'cmm58sbbt0000xw4pp6ynzgyi'
createdAt y updatedAt se forman con el dato del excel tomando fechaingreso (mm/dd/yy) y horaIngreso (HH:MM:SS)