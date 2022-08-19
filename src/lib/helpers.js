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
    unidadesDeMedida = { in: '', out: '' };
    switch (tipoProceso) {
        case '1':
            switch (nombreProceso) {
                case 'preProduccion':
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'indefinido';
                    break;
                case 'telar1':
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'telar2':
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'telar4':
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'telar5':
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'metros';
                    break;
                case 'telar6':
                    unidadesDeMedida.in = 'indefinido';
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

        case '4':
            switch (nombreProceso) {
                case 'diseño':                    
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'indefinido';
                    break;
                case 'ordenProduccion':
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'indefinido';
                    break;
                case 'preProduccion':
                    unidadesDeMedida.in = 'indefinido';
                    unidadesDeMedida.out = 'indefinido';
                    break;
                case 'cutex':
                    unidadesDeMedida.in = 'metros';
                    unidadesDeMedida.out = 'tamaños';
                    break;
                case 'guillotina':
                    unidadesDeMedida.in = 'metros';
                    unidadesDeMedida.out = 'tamaños';
                    break;
                case 'screen':
                    unidadesDeMedida.in = 'tamaños';
                    unidadesDeMedida.out = 'tamaños';
                    break;
                case 'repujado':
                    unidadesDeMedida.in = 'tamaños';
                    unidadesDeMedida.out = 'tamaños';
                    break;
                case 'troquelado':
                    unidadesDeMedida.in = 'tamaños';
                    unidadesDeMedida.out = 'unidades';
                    break;
                case 'empaque':
                    unidadesDeMedida.in = 'unidades';
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

        default:
    };





    return unidadesDeMedida;

};




module.exports = helpers;