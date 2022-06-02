const express = require('express');
const router = express.Router();
const pool = require('../database');

//GET: procesos de una ordenProduccion
router.get('/procesosOP/:idOP', async (req, res) => {
    const { idOP } = req.params;
    const resultadoOP = await pool.query('SELECT nombreOP, consecutivo FROM ordenProduccion WHERE idOP = ?', [idOP]);
    OP = resultadoOP[0];
    const procesos = await pool.query('SELECT * FROM procesos WHERE idOP = ?', [idOP]);
    res.render('procesos/procesosOP', { OP, procesos });
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

//GET: preProduccion
router.get('/preProduccion/:idProceso', async (req, res) => {
    const { idProceso } = req.params;
    const resultadoProceso = await pool.query('SELECT * FROM procesos INNER JOIN ordenproduccion ON procesos.idOP = ordenproduccion.idOP WHERE idProceso = ?', [idProceso]);
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

    const resultadoProceso = await pool.query('SELECT * FROM procesos WHERE idProceso = ?', [idProceso]);

    // Actualizamos el estado en telares
    if(proceso.estadoProceso == "Terminado"){ 
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


    req.flash('success', 'Proceso actualizado correctamente');

    res.redirect('/procesos/preProduccion/' + idProceso);

});
module.exports = router;