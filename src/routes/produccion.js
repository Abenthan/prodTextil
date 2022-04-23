const express = require('express');
const { get } = require('express/lib/response');
const router = express.Router();
const pool = require('../database');


async function actualizarEstadoProcesos(idOP, cantidadOP){
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
            }else{
                if (produccion.inicio == null && produccion.fin == null) {
                    // el proceso esta en Cola
                    cantidadAcumulada = cantidadAcumulada + produccion.cantidad;

                    if (cantidadAcumulada == cantidadOP) {
                        await pool.query('UPDATE procesos SET estadoProceso = ?, cantidadProceso = ? WHERE idProceso = ?', ['en Cola', cantidadAcumulada, proceso.idProceso]);
                    }
                }else{
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
router.get('/panelOperador', async (req, res) => {
    const operador = req.session.operador;

    //validamos si hay operador en sesion
    if (operador.idOperador) {

        // buscamos en produccion idOperador, con columna inicio != null y con columna fin=null, con inner join idOP y idProceso
        const produccionEnProceso = await pool.query('SELECT * FROM produccion INNER JOIN procesos ON produccion.idProceso = procesos.idProceso INNER JOIN ordenProduccion ON produccion.idOP = ordenProduccion.idOP WHERE idOperador = ? AND inicio IS NOT NULL AND fin IS NULL', [operador.idOperador]);

        if (produccionEnProceso.length > 0) {
            res.render('produccion/panelOperador', { operador, produccionEnProceso });

        } else {
            res.redirect('/produccion/buscarProceso');
        }
    } else {
        req.flash('message', 'Operador no encontrado');
        res.redirect('/produccion/inicio');
    }

});

// GET confirmarFinalizacion
router.get('/confirmarFinalizacion/:idProduccion', async (req, res) => {
    const idProduccion = req.params.idProduccion;
    const operador = req.session.operador;
    if (operador.idOperador) {
        const resultadoProduccion = await pool.query('SELECT * FROM produccion INNER JOIN ordenProduccion ON produccion.idOP = ordenProduccion.idOP INNER JOIN procesos ON produccion.idproceso = procesos.idProceso WHERE idProduccion = ?', [idProduccion]);
        const produccion = resultadoProduccion[0];
        console.log(produccion);
        res.render('produccion/confirmarFinalizacion', { operador, produccion });
    } else {
        req.flash('message', 'Operador no encontradoLa produccion NO finalizo correctamente, porfavor intente nuevamente');
        res.redirect('/produccion/inicio');
    }
});

// POST confirmarFinalizacion
router.post('/confirmarFinalizacion', async (req, res) => {
    const body = req.body;

    // funcion para actualizar la produccion con fin = now()
    async function actualizarProduccion(idProceso, cantidadRestante, idOP) {
        // buscamos en producccion idProceso, con columna inicio = null
        console.log('idProceso: ' + idProceso);
        console.log('cantidadRestante: ' + cantidadRestante);
        console.log('idOP: ' + idOP);

        const resultadoProduccionNoIniciada = await pool.query('SELECT * FROM produccion WHERE idProceso = ? AND inicio IS NULL', [idProceso]);

        console.log('resultadoProduccionNoIniciada' + resultadoProduccionNoIniciada);

        if (resultadoProduccionNoIniciada.length > 0) {
            const produccionNoIniciada = resultadoProduccionNoIniciada[0];

            //actualizamos la produccion con la cantidad + cantidadRestante
            const producccionActualizada = await pool.query('UPDATE produccion SET cantidad = ? WHERE idProduccion = ?', [produccionNoIniciada.cantidad + cantidadRestante, produccionNoIniciada.idProduccion]);

        } else {
            //insertamos en produccion nuevo registro con idOP, idProceso y cantidad = cantidadRestante
            const produccionInsertada = await pool.query('INSERT INTO produccion (idOP, idProceso, cantidad) VALUES (?, ?, ?)', [idOP, idProceso, cantidadRestante]);

        }

    }

    //obtenemos la informacion de la produccion con proceso y ordenProduccion
    const resultadoProduccion = await pool.query('SELECT * FROM produccion INNER JOIN ordenProduccion ON produccion.idOP = ordenProduccion.idOP INNER JOIN procesos ON produccion.idproceso = procesos.idProceso WHERE idProduccion = ?', [body.idProduccion]);
    const produccion = resultadoProduccion[0];

    //comparamos bodi.cantidad y produccion.cantidad
    if (body.cantidad == produccion.cantidad) {

        //actualizamos la produccion con fin = now()
        const produccionFin = await pool.query('UPDATE produccion SET fin = now() WHERE idProduccion = ?', [body.idProduccion]);
        var siguienteOrdenRuta = produccion.ordenRuta + 1;

        //buscamos en proceso el idProcesos con ordenRuta = siguienteOrdenRuta y idOP = produccion.idOP
        const resultadoProcesoSiguiente = await pool.query('SELECT * FROM procesos WHERE ordenRuta = ? AND idOP = ?', [siguienteOrdenRuta, produccion.idOP]);

        //si hay proceso siguiente
        if (resultadoProcesoSiguiente.length > 0) {
            const procesoSiguiente = resultadoProcesoSiguiente[0];


            await actualizarProduccion(procesoSiguiente.idProceso, produccion.cantidad, produccion.idOP);
        }
        req.flash('success', 'La produccion finalizo correctamente');

    } else {
        if (body.cantidad < produccion.cantidad) {
            //actualizamos la produccion con fin = now() y cantidad = body.cantidad
            const produccionFin = await pool.query('UPDATE produccion SET fin = now(), cantidad = ? WHERE idProduccion = ?', [body.cantidad, body.idProduccion]);
            const cantidadRestante = produccion.cantidad - body.cantidad;
            await actualizarProduccion(produccion.idProceso, cantidadRestante, produccion.idOP);

            var siguienteOrdenRuta = produccion.ordenRuta + 1;

            //buscamos en proceso el idProcesos con ordenRuta = siguienteOrdenRuta y idOP = produccion.idOP
            const resultadoProcesoSiguiente = await pool.query('SELECT * FROM procesos WHERE ordenRuta = ? AND idOP = ?', [siguienteOrdenRuta, produccion.idOP]);

            //si hay proceso siguiente
            if (resultadoProcesoSiguiente.length > 0) {
                const procesoSiguiente = resultadoProcesoSiguiente[0];

                await actualizarProduccion(procesoSiguiente.idProceso, body.cantidad, produccion.idOP);
            }

            req.flash('success', 'La produccion finalizo correctamente');
        } else {
            req.flash('message', 'ERROR FATAL: La cantidad ingresada es mayor a la cantidad de la produccion, porfavor intente nuevamente');
        }
    }
    await actualizarEstadoProcesos(produccion.idOP, produccion.cantidadOP);
    res.redirect('/produccion/inicio');

});

// GET buscarProceso
router.get('/buscarProceso', async (req, res) => {
    const operador = req.session.operador;
    req.session.ordenProduccion = {};
    res.render('produccion/buscarProceso', { operador });
});

//POST buscarProceso
router.post('/buscarProceso', async (req, res) => {
    const operador = req.session.operador;
    const consecutivoOP = req.body.consecutivoOP;
    //buscar consecutivoOP en ordenesProduccion
    const resultadoOrdenProduccion = await pool.query('SELECT * FROM ordenProduccion WHERE consecutivo = ?', [consecutivoOP]);
    if (resultadoOrdenProduccion.length > 0) {
        req.session.ordenProduccion = resultadoOrdenProduccion[0];
        res.redirect('/produccion/seleccionarProceso');

    } else {
        req.flash('message', 'Orden de producción no encontrada');
        res.redirect('/produccion/panelOperador/' + operador.idOperador);
    }
});

//GET seleccionarProceso
router.get('/seleccionarProceso', async (req, res) => {
    const operador = req.session.operador;
    const ordenProduccion = req.session.ordenProduccion;
    const idOP = ordenProduccion.idOP;

    // buscamos en produccion idOP y con columna inicio = null inner join procesos
    const procesosParaIniciar = await pool.query('SELECT * FROM produccion INNER JOIN procesos ON produccion.idProceso = procesos.idProceso WHERE produccion.idOP = ? AND inicio IS NULL', [idOP]);

    if (procesosParaIniciar.length > 0) {
        res.render('produccion/seleccionarProceso', { operador, ordenProduccion, procesosParaIniciar });

    } else {
        req.flash('message', 'La orden de producción no tiene procesos para iniciar');
        res.redirect('/produccion/panelOperador/' + operador.idOperador);
    }

});

// POST seleccionarProceso
router.post('/seleccionarProceso/', async (req, res) => {
    const produccionParaConfirmar = {
        idOperador: req.session.operador.idOperador,
        idProduccion: req.body.idProduccion,
        cantidad: req.body.cantidad
    }
    res.redirect('/produccion/confirmarProduccion/' + produccionParaConfirmar.idProduccion);
});

//GET confirmarProduccion
router.get('/confirmarProduccion/:idProduccion', async (req, res) => {
    const idProduccion = req.params.idProduccion;
    const operador = req.session.operador;
    const ordenProduccion = req.session.ordenProduccion;
    //buscar produccion con idProduccion con inner join procesos
    const resultadoProduccion = await pool.query('SELECT * FROM produccion INNER JOIN procesos ON produccion.idProceso = procesos.idProceso WHERE produccion.idProduccion = ?', [idProduccion]);
    const produccion = resultadoProduccion[0];
    res.render('produccion/confirmarProduccion', { operador, ordenProduccion, produccion });
});

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



module.exports = router;