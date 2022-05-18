const pool = require('../database');
const bcrypt = require('bcryptjs'); // bcryptjs es un modulo para manejar contraseñas encrptadas
const helpers = {};

helpers.encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10); //genSalt(10) es para crear un hash 10 veces, entre mas veces mas segura pero mas demorada.
    const hash = await bcrypt.hash(password, salt);
    return hash;
};

helpers.matchPassword = async (password, savedPassword) => { // el metodo matchPassword compara dos contraseñas encriptadas
    try {
        return await bcrypt.compare(password, savedPassword);
    } catch (e) {
        console.log(e);
    }

};

helpers.unidadesMedida = (tipoProceso, nombreProceso) => {
    console.log('Ingreso al helper con tipoProceso: ' + tipoProceso + ' y nombreProceso: ' + nombreProceso);
    unidadesDeMedida = { in: '', out: '' };
    switch (tipoProceso) {
        case '1':
            switch (nombreProceso) {
                case 'preProduccion':
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'matrices';
                    break;
                case 'telar1':
                    unidadesDeMedida.in = 'matrices';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'telar2':
                    unidadesDeMedida.in = 'matrices';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'telar4':
                    unidadesDeMedida.in = 'matrices';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'telar5':
                    unidadesDeMedida.in = 'matrices';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'telar6':
                    unidadesDeMedida.in = 'matrices';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'enrrollado':
                    unidadesDeMedida.in = 'metros';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'planchado':
                    unidadesDeMedida.in = 'metros';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'corte':
                    unidadesDeMedida.in = 'metros';
                    unidadesDeMedida.out = 'unidades';
                    break;
                case 'inspeccion':
                    unidadesDeMedida.in = 'unidades';
                    unidadesDeMedida.out = 'unidades';
                    break;
                case 'despacho':
                    unidadesDeMedida.in = 'unidades';
                    unidadesDeMedida.out = 'unidades';
                    break;
                default:
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'indefinido';
            };

            break;
        
        case '2':
            break;
        case '3':
            break;
        default:
    };





    return unidadesDeMedida;

};




module.exports = helpers;