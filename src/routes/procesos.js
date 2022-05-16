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
        medidaIN: req.body.medidaIN,
        cantidadIN: req.body.cantidadIN,
        medidaOUT: req.body.medidaOUT,
        cantidadOUT: req.body.cantidadOUT,
        estadoProceso: req.body.estado,
        observacionesProceso: req.body.observaciones
    };
    const resultado = await pool.query('UPDATE procesos SET ? WHERE idProceso = ?', [proceso, idProceso]);
    
    req.flash('success', 'Proceso actualizado correctamente');
    res.redirect('/procesos/editarProceso/' + idProceso);
});


module.exports = router;