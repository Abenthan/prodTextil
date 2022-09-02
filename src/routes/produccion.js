const express = require('express');
const router = express.Router();
const pool = require('../database');
const moment = require('moment');
const helpers = require('../lib/helpers');
const { isLoggedIn, sesionOperador, sesionOP } = require('../lib/sesiones');

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
        if (proceso.nombreProceso.includes('preProduccion')) {
            res.redirect('/procesos/preProduccion/' + ordenProduccion.idOP);
        } else {
            if (proceso.nombreProceso.includes('telar')
                || proceso.nombreProceso.includes('enrrollado')
                || proceso.nombreProceso.includes('inspeccion')) {
                validaciones.ingresarCantidad = false;
            } else if (proceso.nombreProceso.includes('corte')) {
                validaciones.corte = true;
            }

            res.render('produccion/iniciarProduccion', { operador, ordenProduccion, proceso, validaciones });
        }
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
    const proceso = {
        nombreProceso: req.body.nombreProceso
    }
    const medida = helpers.unidadesMedida(ordenProduccion.tipoProceso, req.body.nombreProceso);
    const datosProduccion = {
        inicio: moment().format('YYYY-MM-DD HH:mm:ss'),
        medidaIN: medida.in,
        cantidadIN: Number(req.body.cantidadIN),
        idOP: ordenProduccion.idOP,
        idProceso: idProceso,
        idOperador: operador.idOperador
    };

    if (proceso.nombreProceso == 'corte') {
        datosProduccion.especificaciones = req.body.maquinaCorte;
    }
    console.log("datos produccion: ", datosProduccion);


    //insertamos en produccion el nuevo registro
    const produccionInsertada = await pool.query('INSERT INTO produccion SET ?', [datosProduccion]);
    console.log("cantidad en cola del body: ", Number(req.body.cantidadEnCola));
    console.log("cantidadIN del proceso: ", Number(req.body.cantidadIN_proceso));

    //Update procesos
    const procesoActualizado = {
        medidaIN: medida.in,
        cantidadIN: Number(req.body.cantidadIN_proceso) + datosProduccion.cantidadIN,
        estadoProceso: 'en Proceso'
    };

    // validamos si requiere calcular cantidadEnCola

    if ((ordenProduccion.tipoProceso = 4)&&(proceso.nombreProceso == 'cutex' || proceso.nombreProceso == 'guillotina')){
        procesoActualizado.cantidadEnCola = 0;
    }else{
        procesoActualizado.cantidadEnCola = Number(req.body.cantidadEnCola) - datosProduccion.cantidadIN;
    };

    console.log("proceso: ", procesoActualizado);

    await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [procesoActualizado, idProceso]);

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

    const validaciones = {
        observaciones: false,
        especificaciones: false
    }

    if (proceso.tipoProceso == '1') {
        if ((proceso.nombreProceso == 'corte')
            || (proceso.nombreProceso == 'inspeccion')) {
            validaciones.observaciones = true;
        }
        if (proceso.nombreProceso == 'corte') {
            validaciones.especificaciones = true;
        }
    }
    res.render('produccion/confirmarFinalizacion', { operador, produccion, proceso, validaciones });

});

// POST confirmarFinalizacion
router.post('/confirmarFinalizacion', async (req, res) => {
    const { idProduccion, idProceso, idOP, ordenRuta, cantidadOUT_Proceso, tipoProceso, nombreProceso } = req.body;
    const cantidadEnCola = Number(req.body.cantidadEnCola)
    const cantidadIN_Proceso = Number(req.body.cantidadIN_Proceso);
    const cantidadIniciada = Number(req.body.cantidadIN_Produccion);
    const cantidadTerminada = Number(req.body.cantidad);
    var cantidadSobrante = 0; //es la cantidad que sobra y no se alcanzo a procesar en la producción actual, sus calculos dependen del proceso

    const medida = helpers.unidadesMedida(tipoProceso, nombreProceso)

    // funcion updateSiguienteProceso
    async function updateSiguienteProceso(siguienteProceso, cantidad) {
        const datosProceso2 = {
            cantidadEnCola: parseInt(siguienteProceso.cantidadEnCola) + parseInt(cantidad)
        };
        // si estadoProceso es 'Pendiente' o 'Terminado' entonces cambio a 'en Cola'
        if (siguienteProceso.estadoProceso === 'Pendiente' || siguienteProceso.estadoProceso === 'Terminado') {
            datosProceso2.estadoProceso = 'en Cola';
        }
        // actualizar el siguiente proceso
        await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [datosProceso2, siguienteProceso.idProceso]);

    };

    // ACTUALIZAR PRODUCCION
    const datosProduccion = {
        fin: moment().format('YYYY-MM-DD HH:mm:ss'),
        medidaOUT: medida.out,
        cantidadOUT: req.body.cantidad
    }

    if (req.body.observaciones) {
        datosProduccion.observaciones = req.body.observaciones;
    }

    // consulta para actualizar la produccion
    await pool.query('UPDATE produccion SET ? WHERE idProduccion = ?', [datosProduccion, idProduccion]);

    // consultar ordenProduccion
    const resultadoOrdenProduccion = await pool.query('SELECT * FROM ordenproduccion WHERE idOP = ?', [idOP]);
    const ordenProduccion = resultadoOrdenProduccion[0];

    const cantidadPedida = Number(ordenProduccion.cantidadPedida);
    const cantidadProgramada = Number(ordenProduccion.cantidadProgramada);

    switch (tipoProceso) {
        case '1': //Tejido

            // Calculamos la cantidad programada en metros

            const largo = Number(ordenProduccion.largo);
            var cantidadProgramadaMTS = (cantidadProgramada * largo) / 1000;
            var cantidadPedidaMTS = (cantidadPedida * largo) / 1000;

            function convertirEnMetros(unidades) {
                var metros = unidades * largo / 1000;
                return metros;
            }


            if (nombreProceso.includes('telar')) {

                // Actualizamos el proceso 
                consultaUpdteProceso = 'UPDATE procesos' +
                    ' SET procesos.cantidadOUT = procesos.cantidadOUT + ' + parseInt(req.body.cantidad) + ', procesos.estadoProceso = "en Cola"' +
                    ' WHERE procesos.idProceso = ' + idProceso;
                await pool.query(consultaUpdteProceso);

                // Consultamos cantidad producida por los telares
                const consultaSumaCantidadTerminada = 'SELECT SUM(cantidadOUT) AS cantidad FROM procesos' +
                    ' WHERE idOP = ' + idOP + ' AND nombreProceso LIKE "%telar%"';
                const sumaCantidadTerminada = await pool.query(consultaSumaCantidadTerminada);

                // terminamos los proceso de telares si sumaCantidadTerminada >= cantidasPedidaMTS
                if (sumaCantidadTerminada[0].cantidad >= cantidadPedidaMTS) {
                    console.log('terminamos los proceso de telares');
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

                if (siguienteProceso.length > 0) {// si existe siguiente proceso
                    updateSiguienteProceso(siguienteProceso[0], req.body.cantidad);
                } else {
                    console.log('No hay siguiente proceso despues de los telares, esto se presenta en finalizar produccion de telares con idProduccion: ' + idProduccion);
                }

            } else {
                // actualizamos el estado del proceso
                if ((nombreProceso === 'enrrollado')
                    || (nombreProceso === 'planchado')
                    || (nombreProceso === 'inspeccion')) {

                    // ACTUALIZACION PROCESO

                    const datosProceso = {
                        cantidadEnCola: parseInt(cantidadEnCola) - parseInt(req.body.cantidad),
                        cantidadOUT: parseInt(cantidadOUT_Proceso) + parseInt(req.body.cantidad)
                    };

                    // obtengo el dato cantidadIN_enProceso para datosProceso.cantidadIN
                    consultaCantidadIN_enProceso = 'SELECT sum(cantidadIN) as cantidadIN_enProceso FROM produccion' +
                        ' WHERE fin IS NULL AND idProceso = ' + idProceso;
                    const resultadoCantidadIN_enProceso = await pool.query(consultaCantidadIN_enProceso);
                    const cantidadIN_enProceso = resultadoCantidadIN_enProceso[0].cantidadIN_enProceso;

                    datosProceso.cantidadIN = datosProceso.cantidadOUT + cantidadIN_enProceso;

                    // actualizar el proceso
                    await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [datosProceso, idProceso]);
                    console.log('cantidadOUT: ' + datosProceso.cantidadOUT);
                    console.log('cantidadPedidaMTS: ' + cantidadPedidaMTS);
                    if (datosProceso.cantidadOUT > cantidadPedidaMTS) {
                        // actualizamos el estadoProceso a 'Terminado'
                        pool.query('UPDATE procesos SET estadoProceso = "Terminado" WHERE idProceso = ' + idProceso);
                    } else {
                        //consulta en Produccion
                        const consultaEnProduccion = 'SELECT * FROM produccion WHERE fin IS NULL AND idProceso = ' + idProceso;
                        const resultadoEnProduccion = await pool.query(consultaEnProduccion);
                        console.log('resultadoEnProduccion: ' + resultadoEnProduccion.length);
                        if (resultadoEnProduccion.length > 0) {
                            // actualizamos el estadoProceso a 'en Proceso'
                            pool.query('UPDATE procesos SET estadoProceso = "en Proceso" WHERE idProceso = ' + idProceso);
                        } else {
                            // actualizamos el estadoProceso a 'en Cola'
                            pool.query('UPDATE procesos SET estadoProceso = "en Cola" WHERE idProceso = ' + idProceso);
                        }
                    }

                } else if (nombreProceso === 'corte') {
                    // ACTUALIZACION PROCESO

                    const datosProceso = {
                        cantidadEnCola: parseInt(cantidadEnCola) - convertirEnMetros(parseInt(req.body.cantidad)),
                        cantidadOUT: parseInt(cantidadOUT_Proceso) + parseInt(req.body.cantidad)
                    };

                    // obtengo el dato cantidadIN_enProceso para datosProceso.cantidadIN
                    consultaCantidadIN_enProceso = 'SELECT sum(cantidadIN) as cantidadIN_enProceso FROM produccion' +
                        ' WHERE fin IS NULL AND idProceso = ' + idProceso;
                    const resultadoCantidadIN_enProceso = await pool.query(consultaCantidadIN_enProceso);
                    const cantidadIN_enProceso = resultadoCantidadIN_enProceso[0].cantidadIN_enProceso;

                    datosProceso.cantidadIN = convertirEnMetros(datosProceso.cantidadOUT) + cantidadIN_enProceso;

                    // actualizar el proceso
                    await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [datosProceso, idProceso]);

                    if (datosProceso.cantidadOUT > cantidadPedida) {
                        // actualizamos el estadoProceso a 'Terminado'
                        pool.query('UPDATE procesos SET estadoProceso = "Terminado" WHERE idProceso = ' + idProceso);
                    }
                } else if (nombreProceso === 'despacho') {


                }

                // consultamos el idProceso del siguiente proceso
                const ordenRuta2 = parseInt(ordenRuta) + 1;
                const consultaSiguinteProceso = 'SELECT * FROM procesos' +
                    ' WHERE idOP = ' + idOP +
                    ' AND ordenRuta = ' + ordenRuta2;
                const siguienteProceso = await pool.query(consultaSiguinteProceso);
                if (siguienteProceso.length > 0) {// si existe siguiente proceso
                    updateSiguienteProceso(siguienteProceso[0], req.body.cantidad);
                } else {
                    console.log('No hay siguiente proceso, idProduccion: ' + idProduccion + ' idOP: ' + idOP);
                }

            }
            break;

        case '2': //Flexo
        case '3': //Transfer
        case '4': //Garras
            // ACTUALIZAR PROCESO
            const corte = Number(ordenProduccion.corte);
            const unidadesXTamaño = Number(ordenProduccion.unidadesXTamaño);
            function convertirTamañosEnMetros(tamaños) {
                var metros = 0;
                if (corte > 0) {
                    metros = tamaños * corte / 1000;
                }

                return metros;
            }

            function convertirUnidadesEnTamaños(unidades) {
                var tamaños = unidades / unidadesXTamaño;
                return tamaños;
            }

            const cantidadPedidaEnTamaños = convertirUnidadesEnTamaños(cantidadPedida);

            //obtengo datosProceso: cantidadEnCola, cantidadOUT, cantidadIn y estadoProceso
            const datosProceso = {
                cantidadOUT: parseInt(cantidadOUT_Proceso) + parseInt(req.body.cantidad)
            };
            console.log("cantidad iniciada: ", cantidadIniciada);
            console.log("cantidad terminada: ", cantidadTerminada);
            console.log("cantidad terminada en metros: ", convertirTamañosEnMetros(cantidadTerminada));
            if (nombreProceso == 'cutex' || nombreProceso == 'guillotina') {
                console.log("cantidad terminada en metros: ", convertirTamañosEnMetros(cantidadTerminada));
                cantidadSobrante = cantidadIniciada - convertirTamañosEnMetros(cantidadTerminada);
            } else if(nombreProceso == 'troquelado') {
                console.log("cantidad terminada en tamaños: ", convertirUnidadesEnTamaños(cantidadTerminada));
                cantidadSobrante = cantidadIniciada - convertirUnidadesEnTamaños(cantidadTerminada);                
            }else{
                cantidadSobrante = cantidadIniciada - cantidadTerminada;
            }
            console.log("cantidad sobrante: ", cantidadSobrante);
            console.log("cantidad en cola: ", cantidadEnCola);
            datosProceso.cantidadIN = cantidadIN_Proceso - cantidadIniciada;
            datosProceso.cantidadEnCola = cantidadEnCola + cantidadSobrante;

            // obtenemos estadoProceso
            if (datosProceso.cantidadOUT > cantidadPedidaEnTamaños) {
                datosProceso.estadoProceso = 'Terminado';
            } else if(datosProceso.cantidadIN > 0) {
                datosProceso.estadoProceso = 'en Proceso';
            } else {
                datosProceso.estadoProceso = 'en Cola';
            }

            // actualizar el proceso
            console.log("datosProceso: ", datosProceso);
            await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [datosProceso, idProceso]);

            // ACTUALIZAR SIGUIENTE PROCESO

            // consultamos el idProceso del siguiente proceso
            const ordenRuta2 = parseInt(ordenRuta) + 1;
            const consultaSiguinteProceso = 'SELECT * FROM procesos' +
                ' WHERE idOP = ' + idOP +
                ' AND ordenRuta = ' + ordenRuta2;
            const siguienteProceso = await pool.query(consultaSiguinteProceso);
            if (siguienteProceso.length > 0) {// si existe siguiente proceso
                updateSiguienteProceso(siguienteProceso[0], req.body.cantidad);
            } else {
                console.log('No hay siguiente proceso, idProduccion: ' + idProduccion + ' idOP: ' + idOP);
            }

            break;


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
        observaciones: req.body.observaciones,
        idOP: proceso.idOP,
        idProceso: proceso.idProceso,
        idOperador: req.session.operador.idOperador
    };
    await pool.query('INSERT INTO produccion SET ?', [datosProduccion]);

    const datosProceso = {
        cantidadEnCola: Number(proceso.cantidadEnCola) - Number(req.body.cantidad),
        cantidadIN: Number(proceso.cantidadIN) + Number(req.body.cantidad),
        cantidadOUT: Number(proceso.cantidadOUT) + Number(req.body.cantidad)
    };

    // evaluo si se termino el proceso
    if (datosProceso.cantidadOUT >= proceso.cantidadPedida) {
        datosProceso.estadoProceso = 'Terminado';
    }
    // actualizo el proceso

    await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [datosProceso, req.body.idProceso]);

    await pool.query('UPDATE ordenproduccion SET ? WHERE idOP = ?', [{ estadoOP: 'Terminado' }, proceso.idOP]);

    req.flash('success', 'Despacho Registrado');

    res.redirect('/produccion/inicio');

});

// GET produccion
router.get('/:idProduccion', async (req, res) => {
    const idProduccion = req.params.idProduccion;
    consultaProduccion = 'SELECT * FROM produccion' +
        ' INNER JOIN operadores ON produccion.idOperador = operadores.idOperador' +
        ' INNER JOIN procesos ON produccion.idProceso = procesos.idProceso' +
        ' INNER JOIN ordenproduccion ON produccion.idOP = ordenproduccion.idOP' +
        ' WHERE idProduccion = ' + idProduccion;
    const resultadoProduccion = await pool.query(consultaProduccion);
    const produccion = resultadoProduccion[0];
    produccion.inicio = moment(produccion.inicio).format('DD/MM/YYYY HH:mm:ss');
    produccion.fin = moment(produccion.fin).format('DD/MM/YYYY HH:mm:ss');

    const validaciones = {};
    if (produccion.especificaciones) {
        validaciones.especificaciones = true;
    }

    res.render('produccion/produccion', { produccion });
});


module.exports = router;

