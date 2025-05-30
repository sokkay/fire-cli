export const addCompanyGroup = async () => {
  const companyGroup = {
    nombre: "Grupo Empresarial Ejemplo",
    fechaCreacion: new Date(),
    eliminado: false,
    administradores: [
      db.collection("Usuarios").doc("NyHJ3Pbkc7W1kTY6j2Q3cV8FzYx2"),
    ],
    rut: "76543210-9",
    razonSocial: "Ejemplo S.A.",
    codigoInterno: "GE-EJEMPLO-001",
    giro: "Servicios Profesionales",
    direccionComercial: "Calle Ficticia 456, Ciudad",
    tamañoEmpresa: "Pequeña", // O "Mediana", "Grande"
    logo: null, // O una URL de string
    creadorPorRef: db.collection("Usuarios").doc("id-creador"), // Reemplazar con ID de usuario real
    numInstalaciones: 0,
    // eliminadoData se omite al crear, se añade al eliminar
    contactoComercial: {
      nombre: "Rodrigo",
      apellido: "Perez",
      email: "rodrigo@gmail.com",
      telefono: "+56987654567",
      rut: "12798502-2",
      cargo: "Gerente",
    },
    modulosDisponibles: ["C-Legal"], // Lista de módulos contratados
    planContratado: "Empresa", // O 'Profesional'
  };
  const docRef = await db.collection("GruposEmpresariales").add(companyGroup);
  return docRef.id;
};
