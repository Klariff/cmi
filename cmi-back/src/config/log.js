module.exports = {
    authenticationError: {
        type: "ERROR",
        code: 401,
        message: "Error de autenticación",
    },
    notFound: {
        type: "ERROR",
        code: 404,
        message: "Entidad no encontrada",
    },
    internalServerError: {
        type: "ERROR",
        code: 500,
        message: "Error de servidor",
    },
    databaseConnected: {
        type: "INFO",
        code: 200,
        message: "Base de datos conectada",
    },
    invalidParameters: {
        type: "ERROR",
        code: 400,
        message: "Parámetros inválidos",
    },
    databaseNotReady: {
        type: "ERROR",
        code: 500,
        message: "Base de datos no lista",
    },
    duplicatedAction: {
        type: "ERROR",
        code: 406,
        message: "Acción duplicada",
    },
    expiratedAction: {
        type: "ERROR",
        code: 498,
        message: "Acción expirada",
    }
}