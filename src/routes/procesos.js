const express = require('express');
const router = express.Router();
const pool = require('../database');
const moment = require('moment');
const { isLoggedIn } = require('../lib/sesiones');

//GET: procesos de una ordenProduccion
router.get('/procesosOP/:idOP', async (req, res) => {
    const { idOP } = req.params;
    const resultadoOP = await pool.query('SELECT nombreOP, consecutivo FROM ordenProduccion WHERE idOP = ?', [idOP]);
    OP = resultadoOP[0];
    const procesos = await pool.query('SELECT * FROM procesos WHERE idOP = ?', [idOP]);
    res.render('procesos/procesosOP', { OP, procesos });
});

//GET: produccion x proceso
router.get('/produccionXProceso/:idProceso', async (req, res) => {
    const { idProceso } = req.params;
    const resultadoProceso = await pool.query('SELECT * FROM procesos INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP WHERE idProceso = ?', [idProceso]);
    const proceso = resultadoProceso[0];
    const producciones = await pool.query('SELECT * FROM produccion INNER JOIN operadores ON produccion.idOperador = operadores.idOperador WHERE idProceso = ?', [idProceso]);
    for (let i = 0; i < producciones.length; i++) {
        producciones[i].inicio = moment(producciones[i].inicio).format('DD/MM/YYYY HH:mm');
        producciones[i].fin = moment(producciones[i].fin).format('DD/MM/YYYY HH:mm');
    }
    res.render('procesos/produccionXProceso', { proceso, producciones });
});

//GET: preProduccion
router.get('/preProduccion', isLoggedIn, async (req, res) => {
    const ordenesProduccion = await pool.query('SELECT * FROM ordenProduccion WHERE estadoOP != ?', ['Terminado']);
    const llamante = 'preProduccion';
    res.render('ordenProduccion/listarOP', { ordenesProduccion, llamante });
});

//GET: preProduccion/:idProceso
router.get('/preProduccion/:idOP', isLoggedIn ,async (req, res) => {
    const { idOP } = req.params;
    consulta = ('SELECT * FROM procesos' +
    ' INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP' +
    ' WHERE procesos.idOP = ' + idOP + 
    ' AND nombreProceso = "preProduccion"');
    const resultadoProceso = await pool.query(consulta);
    
    const proceso = resultadoProceso[0];
    res.render('procesos/preProduccion', { proceso });
});

// POST: preProduccion
router.post('/preProduccion/:idProceso', async (req, res) => {

    const { idProceso } = req.params;
    const proceso = {
        estadoProceso: req.body.estado,
        observacionesProceso: req.body.observaciones
    };

    //actualizamos el proceso
    await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [proceso, idProceso]);

    const consultaProceso = 'SELECT procesos.idOP, procesos.ordenRuta, procesos.estadoProceso FROM procesos' +
    ' INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP' +
    ' WHERE procesos.idProceso = ' + idProceso;
    const resultadoProceso = await pool.query(consultaProceso);
    const procesoActualizado = resultadoProceso[0];

    if (procesoActualizado.tipoProceso == '1') {
        // Actualizamos el estado en telares
        if(procesoActualizado.estadoProceso == "Terminado"){ 
            //actualizar estado de telares a "en cola"
            await pool.query('UPDATE procesos SET estadoProceso = "en Cola" WHERE idOP = ? AND nombreProceso LIKE ?', [resultadoProceso[0].idOP, '%telar%']);
    
            // actualizamos el estado de la OP
            await pool.query('UPDATE ordenproduccion SET estadoOP = "en Proceso" WHERE idOP = ?', [resultadoProceso[0].idOP]);
    
        }else{
            //actualizar estado de telares a "pendiente" 
            await pool.query('UPDATE procesos SET estadoProceso = "Pendiente" WHERE idOP = ? AND nombreProceso LIKE ?', [resultadoProceso[0].idOP, '%telar%']);
    
            // actualizamos el estado de la OP
            await pool.query('UPDATE ordenproduccion SET estadoOP = "Pendiente" WHERE idOP = ?', [resultadoProceso[0].idOP]);
        }
    } else {
        //cual es el siguiente proceso?
        const siguienteProceso = Number(procesoActualizado.ordenRuta) + 1;

        // si estadoProceso = terminado
        console.log(procesoActualizado.estadoProceso);
        if (procesoActualizado.estadoProceso == "Terminado") {
            //actualizar estado del siguiente proceso a "en cola"
            const consultaUpdateSiguienteProceso = 'UPDATE procesos' +
            ' SET estadoProceso = "en Cola"' +
            ' WHERE idOP = ' + procesoActualizado.idOP +
            ' AND ordenRuta = ' + siguienteProceso;
            await pool.query(consultaUpdateSiguienteProceso);

            // actualizamos el estado de la OP
            await pool.query('UPDATE ordenproduccion SET estadoOP = "en Proceso" WHERE idOP = ?', [procesoActualizado.idOP]);
        } else {
            //actualizar estado del siguiente proceso a "pendiente"
            const consultaUpdateSiguienteProceso = 'UPDATE procesos' +
            ' SET estadoProceso = "Pendiente"' +
            ' WHERE idOP = ' + procesoActualizado.idOP +
            ' AND ordenRuta = ' + siguienteProceso;
            await pool.query(consultaUpdateSiguienteProceso);

            // actualizamos el estado de la OP
            await pool.query('UPDATE ordenproduccion SET estadoOP = "Pendiente" WHERE idOP = ?', [procesoActualizado.idOP]);
        }


    }

    req.flash('success', 'Proceso actualizado correctamente');

    res.redirect('/procesos/preProduccion/' + resultadoProceso[0].idOP);

});

// GET: editar proceso
router.get('/editarProceso/:idProceso', async (req, res) => {
    const { idProceso } = req.params;
    const proceso = await pool.query('SELECT * FROM procesos INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP WHERE idProceso = ?', [idProceso]);
    res.render('procesos/editarProceso', { proceso: proceso[0] });

});

// POST: editar proceso
router.post('/editarProceso/:idProceso', async (req, res) => {

    const { idProceso } = req.params;
    const proceso = {
        medidaOUT: req.body.medidaOUT,
        cantidadOUT: req.body.cantidadOUT,
        estadoProceso: req.body.estado,
        observacionesProceso: req.body.observaciones
    };

    // si proceso es mayor igual a 0, actualizamos
    if (proceso.cantidadOUT >= 0) {
        await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [proceso, idProceso]);

        const resultadoOP = await pool.query('SELECT * FROM procesos INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP WHERE idProceso = ?', [idProceso]);
        // SI tipoproceso = 1 y nombreProceso= "preProduccion" y estadoProceso = "Terminado"
        if (resultadoOP[0].tipoProceso == 1 && resultadoOP[0].nombreProceso == "preProduccion" && resultadoOP[0].estadoProceso == "Terminado") {
            //actualizar estado de telares a "en cola"
            await pool.query('UPDATE procesos SET estadoProceso = "en Cola", cantidadEnCola = ? WHERE idOP = ? AND nombreProceso LIKE ?', [proceso.cantidadOUT, resultadoOP[0].idOP, '%telar%']);
        } else {
            if (resultadoOP[0].tipoProceso == 1 && resultadoOP[0].nombreProceso == "preProduccion" && resultadoOP[0].estadoProceso != "Terminado") {
                //actualizar estado de telares a "pendiente" 
                await pool.query('UPDATE procesos SET estadoProceso = "Pendiente", cantidadEnCola = "0" WHERE idOP = ? AND nombreProceso LIKE ?', [resultadoOP[0].idOP, '%telar%']);
            }
        };

        req.flash('success', 'Proceso actualizado correctamente');
    } else {
        req.flash('message', 'La cantidad debe ser mayor o igual a 0');
    };
    res.redirect('/procesos/editarProceso/' + idProceso);

});


module.exports = router;