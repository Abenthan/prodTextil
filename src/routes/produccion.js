const express = require('express');
const router = express.Router();
const pool = require('../database');
const moment = require('moment');
const helpers = require('../lib/helpers');
const { sesionOperador, sesionOP } = require('../lib/sesiones');

async function actualizarEstadoProcesos(idOP, cantidadOP) {
    console.log('ingreso a actualizarEstadoProcesos: idOP->', idOP, ' cantidadOP -> ', cantidadOP);
    const resultadoProcesos = await pool.query('SELECT * FROM procesos WHERE idOP = ?', [idOP]);
    for (let i = 0; i < resultadoProcesos.length; i++) {
        const proceso = resultadoProcesos[i];
        var cantidadAcumulada = 0;
        // busco en produccion el proceso
        const resultadoProduccion = await pool.query('SELECT * FROM produccion WHERE idproceso = ?', [proceso.idProceso]);
        for (let j = 0; j < resultadoProduccion.length; j++) {
            const produccion = resultadoProduccion[j];

            if (produccion.inicio != null && produccion.fin != null) {
                // el proceso ha finalizado
                cantidadAcumulada = cantidadAcumulada + produccion.cantidad;

                if (cantidadAcumulada == cantidadOP) {
                    //proceso Terminado totalmente, actualizamos el estado en procesos a Terminado y cantidad = 0
                    await pool.query('UPDATE procesos SET estadoProceso = ?, cantidadProceso = ? WHERE idProceso = ?', ['Terminado', 0, proceso.idProceso]);

                    // i es el ultimo
                    if (i == resultadoProcesos.length - 1) {
                        // actualizamos el estado de la orden de produccion a Terminada
                        await pool.query('UPDATE ordenproduccion SET estadoOP = ? WHERE idOP = ?', ['Terminado', idOP]);
                    }

                }
            } else {
                if (produccion.inicio == null && produccion.fin == null) {
                    // el proceso esta en Cola
                    cantidadAcumulada = cantidadAcumulada + produccion.cantidad;

                    if (cantidadAcumulada == cantidadOP) {
                        await pool.query('UPDATE procesos SET estadoProceso = ?, cantidadProceso = ? WHERE idProceso = ?', ['en Cola', cantidadAcumulada, proceso.idProceso]);
                    }
                } else {
                    if (produccion.inicio != null && produccion.fin == null) {
                        // el proceso esta en Proceso
                        cantidadAcumulada = cantidadAcumulada + produccion.cantidad;
                        await pool.query('UPDATE procesos SET estadoProceso = ?, cantidadProceso = ? WHERE idProceso = ?', ['en Proceso', cantidadAcumulada, proceso.idProceso]);

                    }
                }
            }
        }
    }
}

//GET Inicio
router.get('/inicio', (req, res) => {
    req.session.operador = {};
    res.render('produccion/inicio');
});

//POST inicio
router.post('/inicio', async (req, res) => {
    const codigoOperador = req.body.codigoOperador;
    //buscar codigoOperador en operadores
    const resultadoOperador = await pool.query('SELECT * FROM operadores WHERE codigoOperador = ?', [codigoOperador]);
    if (resultadoOperador.length > 0) {
        const operador = resultadoOperador[0];
        req.session.operador = operador;
        res.redirect('/produccion/panelOperador');

    } else {
        req.flash('message', 'Operador no encontrado');
        res.redirect('/produccion/inicio');
    }
});

// GET panelOperador
router.get('/panelOperador', sesionOperador, async (req, res) => {
    const operador = req.session.operador;
    // consulta anterior: SELECT * FROM produccion INNER JOIN procesos ON produccion.idProceso = procesos.idProceso INNER JOIN ordenProduccion ON produccion.idOP = ordenProduccion.idOP WHERE idOperador = ? AND inicio IS NOT NULL AND fin IS NULL'
    const consultaSQL = 'SELECT ordenProduccion.consecutivo, procesos.nombreProceso, produccion.idProduccion, produccion.cantidadIN, produccion.medidaIN ' +
        'FROM produccion ' +
        'INNER JOIN procesos ON produccion.idProceso = procesos.idProceso ' +
        'INNER JOIN ordenProduccion ON produccion.idOP = ordenProduccion.idOP ' +
        'WHERE idOperador = ? AND inicio IS NOT NULL AND fin IS NULL';

    // buscamos en produccion idOperador, con columna inicio != null y con columna fin=null, con inner join idOP y idProceso
    const produccionEnProceso = await pool.query(consultaSQL, [operador.idOperador]);
    if (produccionEnProceso.length > 0) {
        // hay produccion en proceso
        res.render('produccion/panelOperador', { produccionEnProceso, operador });
    }else{
        // no hay produccion en proceso
        res.redirect('/produccion/buscarOP');
    }

    
});

// GET buscarOP
router.get('/buscarOP', sesionOperador, async (req, res) => {
    const operador = req.session.operador;
    req.session.ordenProduccion = {};
    res.render('produccion/buscarOP', { operador });
});

//POST buscarOP
router.post('/buscarOP', async (req, res) => {
    const operador = req.session.operador;
    const consecutivoOP = req.body.consecutivoOP;
    //buscar consecutivoOP en ordenesProduccion
    const resultadoOrdenProduccion = await pool.query('SELECT * FROM ordenProduccion WHERE consecutivo = ?', [consecutivoOP]);
    if (resultadoOrdenProduccion.length > 0) {
        req.session.ordenProduccion = resultadoOrdenProduccion[0];
        res.redirect('/produccion/panelProcesos');

    } else {
        req.flash('message', 'Orden de producción no encontrada');
        res.redirect('/produccion/panelOperador');
    }
});

// GET panelProcesos
router.get('/panelProcesos', sesionOperador, sesionOP, async (req, res) => {
    const operador = req.session.operador;
    const OP = req.session.ordenProduccion;
    const idOP = OP.idOP;

    // buscamos en procesos idOP
    const procesos = await pool.query('SELECT * FROM procesos WHERE idOP = ?', [idOP]);

    res.render('produccion/panelProcesos', { procesos, OP });
});

//GET iniciarProduccion
router.get('/iniciarProduccion/:idProceso', sesionOperador, sesionOP, async (req, res) => {
    const idProceso = req.params.idProceso;
    const operador = req.session.operador;
    const ordenProduccion = req.session.ordenProduccion;
    //buscar idProceso en procesos
    const resultadoProceso = await pool.query('SELECT * FROM procesos WHERE idProceso = ?', [idProceso]);
    if (resultadoProceso.length > 0) {
        const proceso = resultadoProceso[0];
        res.render('produccion/iniciarProduccion', { operador, ordenProduccion, proceso });
    } else {
        req.flash('message', 'ERROR FATAL: No se encontro el proceso, porfavor intente nuevamente');
        res.redirect('/produccion/inicio');
    }

});

//POST iniciarProduccion
router.post('/iniciarProduccion/:idProceso', sesionOperador, sesionOP, async (req, res) => {
    const idProceso = req.params.idProceso;
    const operador = req.session.operador;
    const ordenProduccion = req.session.ordenProduccion;
    const medida = helpers.unidadesMedida(ordenProduccion.tipoProceso, req.body.nombreProceso)
    const datosProduccion = {
        inicio: moment().format('YYYY-MM-DD HH:mm:ss'),
        medidaIN: medida.in,
        cantidadIN: req.body.cantidad,
        idOP: ordenProduccion.idOP,
        idProceso: idProceso,
        idOperador: operador.idOperador
    };
    //insertamos en produccion el nuevo registro
    const produccionInsertada = await pool.query('INSERT INTO produccion SET ?', [datosProduccion]);

    //consultamos la cantidadIN del proceso
    //const cantidadActual = await pool.query('SELECT cantidadIN FROM procesos WHERE idProceso = ?', [idProceso]);

    const proceso = {
        medidaIN: medida.in,
        cantidadIN: req.body.cantidad,
        estadoProceso: 'en Proceso'
    };

    const updateProceso = await pool.query('UPDATE procesos SET medidaIN = ?, cantidadIN = cantidadIN + ?, estadoProceso = "en Proceso" WHERE idProceso = ?', [proceso.medidaIN, proceso.cantidadIN, idProceso]);
    req.flash('success', 'La produccion se inicio correctamente');
    res.redirect('/produccion/inicio');
});

// GET confirmarFinalizacion
router.get('/confirmarFinalizacion/:idProduccion', sesionOperador, async (req, res) => {
    const idProduccion = req.params.idProduccion;
    const operador = req.session.operador;


    // buscamos en produccion idOperador, con columna inicio != null y con columna fin=null, con inner join idOP y idProceso
    const resultadoProduccion = await pool.query('SELECT * FROM produccion WHERE idProduccion = ?', [idProduccion]);
    const produccion = resultadoProduccion[0];

    console.log('Datos produccion: ' + produccion);
    const consultaSQLProceso = 'SELECT * FROM procesos' + 
    ' INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP' +
    ' WHERE idProceso = ' + produccion.idProceso;
    const resultadoProceso = await pool.query(consultaSQLProceso);
    const proceso = resultadoProceso[0];
    
    res.render('produccion/confirmarFinalizacion', { operador, produccion, proceso });

});

// POST confirmarFinalizacion
router.post('/confirmarFinalizacion', async (req, res) => {
    const {idProduccion, idProceso, idOP, ordenRuta, cantidadEnCola, cantidadIN_Proceso, cantidadIN_Produccion, cantidadOUT} = req.body;
    const operador = req.session.operador;
    const medida = helpers.unidadesMedida(req.body.tipoProceso, req.body.nombreProceso)
    datosProduccion = {
        fin: moment().format('YYYY-MM-DD HH:mm:ss'),
        medidaOUT: medida.out,
        cantidadOUT: req.body.cantidad
    }
    // actualizar produccion
    await pool.query('UPDATE produccion SET ? WHERE idProduccion = ?', [datosProduccion, idProduccion]);

    if (req.body.nombreProceso.substring(0, 5) === 'telar') { // si es telar

        // Actualizamos el proceso 
        consultaUpdteProceso = 'UPDATE procesos' +
        ' SET procesos.cantidadOUT = procesos.cantidadOUT + ' + parseInt(req.body.cantidad) + ', procesos.estadoProceso = "en Cola"' + 
        ' WHERE procesos.idProceso = ' + idProceso;
        await pool.query(consultaUpdteProceso);

        // consulto el valor de ordenRuta del siguiente proceso
        const consultaSiguinteProceso = 'SELECT * FROM procesos' +
            ' WHERE idOP = ' + idOP + 
            ' AND nombreProceso NOT LIKE "%telar%" ' +
            ' AND ordenRuta > ' + ordenRuta +
            ' ORDER BY ordenRuta ASC LIMIT 1';
        const siguienteProceso = await pool.query(consultaSiguinteProceso);
        
        if (siguienteProceso.length > 0) { // si existe siguiente proceso
            const datosProceso2 = {
                cantidadEnCola: parseInt(siguienteProceso[0].cantidadEnCola) + parseInt(req.body.cantidad)
            };
            // si estadoProceso es 'Pendiente' entonces cambio a 'en Cola'
            if (siguienteProceso[0].estadoProceso === 'Pendiente') {
                datosProceso2.estadoProceso = 'en Cola';
            }
            // actualizar el siguiente proceso
            await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [datosProceso2, siguienteProceso[0].idProceso]);
        }else{
            console.log('No hay siguiente proceso despues de los telares, esto se presenta en finalizar produccion de telares con idProduccion: ' + idProduccion);
        }
    }else{ // != telar

        // definimos el estado del proceso
        const estadoProceso = parseInt(cantidadEnCola) <= parseInt(cantidadIN_Proceso) ? 'Finalizado' : 'en Cola'; 

        // Actualizamos el proceso 
        consultaUpdteProceso = 'UPDATE procesos' +
        ' SET procesos.cantidadOUT = procesos.cantidadOUT + ' + parseInt(req.body.cantidad) +
        ', procesos.estadoProceso =  "' + estadoProceso + '"' +
        ' WHERE procesos.idProceso = ' + idProceso;
        await pool.query(consultaUpdteProceso);

        // consultamos el idProceso del siguiente proceso
        const ordenRuta2 = parseInt(ordenRuta) + 1;

        // Actualizamos el diguiente proceso
        const UpdateSiguinteProceso = 'UPDATE procesos' +
        ' SET procesos.cantidadEnCola = procesos.cantidadEnCola + ' + parseInt(req.body.cantidad) +
        ', procesos.estadoProceso = "en Cola"' +
        ' WHERE idOP = ' + idOP +
        ' AND ordenRuta = ' + ordenRuta2;
        await pool.query(UpdateSiguinteProceso);

    }

    req.flash('success', 'Producción finalizada');    
    res.redirect('/produccion/inicio');

});


module.exports = router;

/* PROCESOS QUE YA NO SE UTILIZAN
//POST confirmarProduccion
router.post('/confirmarProduccion', async (req, res) => {
    const operador = req.session.operador;
    // validar que si hay operador
    if (operador.idOperador) {
        //actualizamos idOperador e inicio en produccion con idProduccion
        const body = req.body;
        const resultadoProduccion = await pool.query('UPDATE produccion SET idOperador = ?, inicio = NOW() WHERE idProduccion = ?', [operador.idOperador, body.idProduccion]);

        // actualizamos estadoProceso="en Proceso" en procesos 
        const resultadoProceso = await pool.query('UPDATE procesos SET estadoProceso = "en Proceso" WHERE idProceso = ?', [body.idProceso]);

        // actualizamos estadoOP="en Proceso" en ordenProduccion
        const resultadoOP = await pool.query('UPDATE ordenProduccion SET estadoOP = "en Proceso" WHERE idOP = ?', [body.idOP]);

        await actualizarEstadoProcesos(body.idOP, body.cantidadOP);

        req.flash('success', 'Producción iniciada');

    } else {
        req.flash('message', 'Operador no encontrado');
    }
    res.redirect('/produccion/inicio');

});

//GET preProduccion
router.get('/preProduccion', async (req, res) => {
    res.render('produccion/preProduccion');
});

//POST preProduccion
router.post('/preProduccion', async (req, res) => {
    const operador = req.session.operador;
    const body = req.body;
    res.send(body);
});

 */
