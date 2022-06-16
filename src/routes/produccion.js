const express = require('express');
const router = express.Router();
const pool = require('../database');
const moment = require('moment');
const helpers = require('../lib/helpers');
const { sesionOperador, sesionOP } = require('../lib/sesiones');

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
    } else {
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
        res.redirect('/produccion/buscarOP');
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
    const validaciones = {
        ingresarCantidad: true,
        corte: false
    }
    //buscar idProceso en procesos
    const resultadoProceso = await pool.query('SELECT * FROM procesos WHERE idProceso = ?', [idProceso]);
    if (resultadoProceso.length > 0) {
        const proceso = resultadoProceso[0];

        //validaciones
        if (proceso.nombreProceso.includes('telar') || proceso.nombreProceso.includes('enrrollado'))
        {
            validaciones.ingresarCantidad = false;
        }
        if (proceso.nombreProceso == 'corte') {
            validaciones.corte = true;
        }

        res.render('produccion/iniciarProduccion', { operador, ordenProduccion, proceso, validaciones });
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
    const medida = helpers.unidadesMedida(ordenProduccion.tipoProceso, req.body.nombreProceso);
    const datosProduccion = {
        inicio: moment().format('YYYY-MM-DD HH:mm:ss'),
        medidaIN: medida.in,
        cantidadIN: req.body.cantidadIN,
        idOP: ordenProduccion.idOP,
        idProceso: idProceso,
        idOperador: operador.idOperador
    };

    if (req.body.nombreProceso == 'corte') {
        datosProduccion.observaciones = req.body.maquinaCorte;
    }

    //insertamos en produccion el nuevo registro
    const produccionInsertada = await pool.query('INSERT INTO produccion SET ?', [datosProduccion]);

    //consultamos la cantidadIN del proceso

    const proceso = {
        medidaIN: medida.in,
        cantidadIN: datosProduccion.cantidadIN,
        estadoProceso: 'en Proceso'
    };

    await pool.query('UPDATE procesos SET medidaIN = ?, cantidadIN = cantidadIN + ?, estadoProceso = "en Proceso" WHERE idProceso = ?', [proceso.medidaIN, proceso.cantidadIN, idProceso]);
    req.flash('success', 'La produccion se inicio correctamente');
    res.redirect('/produccion/inicio');
});

// GET confirmarFinalizacion
router.get('/confirmarFinalizacion/:idProduccion', sesionOperador, async (req, res) => {
    const idProduccion = req.params.idProduccion;
    const operador = req.session.operador;
   
    const resultadoProduccion = await pool.query('SELECT * FROM produccion WHERE idProduccion = ?', [idProduccion]);
    const produccion = resultadoProduccion[0];

    const consultaSQLProceso = 'SELECT * FROM procesos' +
        ' INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP' +
        ' WHERE idProceso = ' + produccion.idProceso;
    const resultadoProceso = await pool.query(consultaSQLProceso);
    const proceso = resultadoProceso[0];

    res.render('produccion/confirmarFinalizacion', { operador, produccion, proceso });

});

// POST confirmarFinalizacion
router.post('/confirmarFinalizacion', async (req, res) => {
    const { idProduccion, idProceso, idOP, ordenRuta, cantidadEnCola, cantidadIN_Proceso, tipoProceso, nombreProceso } = req.body;
    //const operador = req.session.operador;
    const medida = helpers.unidadesMedida(tipoProceso, nombreProceso)
    const datosProduccion = {
        fin: moment().format('YYYY-MM-DD HH:mm:ss'),
        medidaOUT: medida.out,
        cantidadOUT: req.body.cantidad
    }
    // actualizar produccion
    await pool.query('UPDATE produccion SET ? WHERE idProduccion = ?', [datosProduccion, idProduccion]);

    // consultar ordenProduccion
    const resultadoOrdenProduccion = await pool.query('SELECT * FROM ordenproduccion WHERE idOP = ?', [idOP]);
    const ordenProduccion = resultadoOrdenProduccion[0];

    switch (tipoProceso) {
        case '1': //Tejido

            // Calculamos la cantidad programada en metros
            const cantidadPedida = Number(ordenProduccion.cantidadPedida);
            const cantidadProgramada = Number(ordenProduccion.cantidadProgramada);
            const largo = Number(ordenProduccion.largo);
            var cantidadProgramadaMTS = (cantidadProgramada * largo) / 1000;
            var cantidadPedidaMTS = (cantidadPedida * largo) / 1000;

            if (nombreProceso.includes('telar')) {

                // Actualizamos el proceso 
                consultaUpdteProceso = 'UPDATE procesos' +
                    ' SET procesos.cantidadOUT = procesos.cantidadOUT + ' + parseInt(req.body.cantidad) + ', procesos.estadoProceso = "en Cola"' +
                    ' WHERE procesos.idProceso = ' + idProceso;
                pool.query(consultaUpdteProceso);

                // Consultamos cantidad producida por los telares
                const consultaSumaCantidadTerminada = 'SELECT SUM(cantidadOUT) AS cantidad FROM procesos' +
                    ' WHERE idOP = ' + idOP + ' AND nombreProceso LIKE "%telar%"';
                const sumaCantidadTerminada = await pool.query(consultaSumaCantidadTerminada);

                // terminamos los proceso de telares si sumaCantidadTerminada >= cantidasPedidaMTS
                if (sumaCantidadTerminada[0].cantidad >= cantidadPedidaMTS) {
                    const consultaUpdateOrden = 'UPDATE procesos SET estadoProceso = "Terminado"' +
                        ' WHERE idOP = ' + idOP + ' AND nombreProceso LIKE "%telar%" AND estadoProceso = "en Cola"';
                    pool.query(consultaUpdateOrden);
                }

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
                    // si estadoProceso es 'Pendiente' o 'Terminado' entonces cambio a 'en Cola'
                    if (siguienteProceso[0].estadoProceso === 'Pendiente' || siguienteProceso[0].estadoProceso === 'Terminado') {
                        datosProceso2.estadoProceso = 'en Cola';
                    }
                    // actualizar el siguiente proceso
                    await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [datosProceso2, siguienteProceso[0].idProceso]);
                } else {
                    console.log('No hay siguiente proceso despues de los telares, esto se presenta en finalizar produccion de telares con idProduccion: ' + idProduccion);
                }

            }else{

                // ACTUALIZACION PROCESO
                consultaUpdateProceso = 'UPDATE procesos' +
                    ' SET procesos.cantidadOUT = procesos.cantidadOUT + ' + parseInt(req.body.cantidad) +
                    ' WHERE procesos.idProceso = ' + idProceso;
                pool.query(consultaUpdateProceso);

                // actualizamos el estado del proceso

                if(req.body.cantidad > cantidadPedidaMTS){
                    // actualizamos el estadoProceso a 'Terminado'
                    pool.query('UPDATE procesos SET estadoProceso = "Terminado" WHERE idProceso = ' + idProceso);
                }

                // consultamos el idProceso del siguiente proceso
                const ordenRuta2 = parseInt(ordenRuta) + 1;
                const consultaSiguinteProceso = 'SELECT * FROM procesos' +
                    ' WHERE idOP = ' + idOP +
                    ' AND ordenRuta = ' + ordenRuta2;
                const siguienteProceso = await pool.query(consultaSiguinteProceso);
                if (siguienteProceso.length > 0) {// si existe siguiente proceso
                    const datosProceso2 = {
                        cantidadEnCola: parseInt(siguienteProceso[0].cantidadEnCola) + parseInt(req.body.cantidad)
                    };
                    // si estadoProceso es 'Pendiente' o 'Terminado' entonces cambio a 'en Cola'
                    if (siguienteProceso[0].estadoProceso === 'Pendiente' || siguienteProceso[0].estadoProceso === 'Terminado') {
                        datosProceso2.estadoProceso = 'en Cola';
                    }
                    // actualizar el siguiente proceso
                    await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [datosProceso2, siguienteProceso[0].idProceso]);
                } else {
                    console.log('No hay siguiente proceso, idProduccion: ' + idProduccion + ' idOP: ' + idOP);
                }

            };

            break;

        case '2': //Flexo
        case '3': //Transfer
        case '4': //Garras
        default:
    };

    req.flash('success', 'Producción finalizada');
    res.redirect('/produccion/inicio');

});

// GET despacho
router.get('/despacho/:idProceso', sesionOperador, sesionOP, async (req, res) => {
    const operador = req.session.operador;
    const idProceso = req.params.idProceso;
    const resultadoProceso = await pool.query('SELECT * FROM procesos INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP WHERE idProceso = ?', [idProceso]);
    const proceso = resultadoProceso[0];
    res.render('produccion/despacho', { operador, proceso });
});

// POST despacho
router.post('/despacho', sesionOperador, sesionOP, async (req, res) => {
    // consulto el proceso:
    const resultadoProceso = await pool.query('SELECT * FROM procesos INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP WHERE idProceso = ?', [req.body.idProceso]);
    const proceso = resultadoProceso[0];

    // Insertar registro en produccion
    const medida = helpers.unidadesMedida(proceso.tipoProceso, proceso.nombreProceso)

    const datosProduccion = {
        inicio: moment().format('YYYY-MM-DD HH:mm:ss'),
        fin: moment().format('YYYY-MM-DD HH:mm:ss'),
        medidaIN: medida.in,
        cantidadIN: proceso.cantidadEnCola,
        medidaOUT: medida.out,
        cantidadOUT: req.body.cantidad,
        idOP: proceso.idOP,
        idProceso: proceso.idProceso,
        idOperador: req.session.operador.idOperador
    };
    await pool.query('INSERT INTO produccion SET ?', [datosProduccion]);

    const datosProceso = {
        cantidadIN: proceso.cantidadEnCola,
        cantidadOUT: req.body.cantidad,
        estadoProceso: 'Terminado',
        observacionesProceso: req.body.observaciones
    };
    await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [datosProceso, req.body.idProceso]);

    await pool.query('UPDATE ordenproduccion SET ? WHERE idOP = ?', [{ estadoOP: 'Terminado' }, proceso.idOP]);

    res.send('Datos Produccion: ' + datosProduccion[0] + '<br> Datos Proceso: ' + datosProceso[0]);

});



module.exports = router;

