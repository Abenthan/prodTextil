const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET: nuevoOperador
router.get('/nuevoOperador', async(req, res) => {
    //contar cuantos registros hay en la tabla operadores
    const [count] = await pool.query('SELECT COUNT(*) AS count FROM operadores');
    console.log(count);
    codigoSugerido = count.count + 1;
    res.render('operadores/nuevoOperador', {codigoSugerido});
});

// POST: nuevoOperador
router.post('/nuevoOperador', async(req, res) => {
    const nuevoOperador = {
        nombreOperador: req.body.nombreOperador,
        codigoOperador: req.body.codigoOperador,
        estadoOperador: req.body.estadoOperador
    };
    // validar si existe codigoOperador
    const resultadoBusqueda = await pool.query('SELECT * FROM operadores WHERE codigoOperador = ?', [nuevoOperador.codigoOperador]);
    if (resultadoBusqueda.length > 0) {
        req.flash('message', 'El codigo de operador ya existe, intente con otro codigo');
        res.redirect('/operadores/nuevoOperador');
    } else {
        await pool.query('INSERT INTO operadores SET ?', [nuevoOperador]);
        req.flash('success', 'Operador guardado con exito');
        res.redirect('/operadores/operadoresActivos');
    }

});

//GET: editarOperador
router.get('/editarOperador/:id', async(req, res) => {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM operadores WHERE idOperador = ?', [id]);
    const operador = resultado[0];
    res.render('operadores/editarOperador', { operador });
});

// POST: editarOperador
router.post('/editarOperador/:id', async(req, res) => {
    const { id } = req.params;
    const operador = {
        nombreOperador: req.body.nombreOperador,
        codigoOperador: req.body.codigoOperador,
        estadoOperador: req.body.estadoOperador
    };
    await pool.query('UPDATE operadores SET ? WHERE idOperador = ?', [operador, id]);
    req.flash('success', 'Operador actualizado con exito');
    res.redirect('/operadores/operadoresActivos');
});


// GET: operadoresActivos
router.get('/operadoresActivos', async(req, res) => {
    // OPERADORES ACTIVOS
    const operadoresActivos = await pool.query('SELECT * FROM operadores WHERE estadoOperador =' + "'" + 'Activo' + "'");
    res.render('operadores/operadoresActivos', {operadoresActivos});
});

//GET informeProduccion
router.get('/informeProduccion', async(req, res) => {
    // SELECCIONAR OPERARIOS
    const operadores = await pool.query('SELECT * FROM operadores WHERE estadoOperador =' + "'" + 'Activo' + "'");
    res.render('operadores/seleccionar', {operadores});

});

//GET: informeProduccion/:idOperador
router.get('/informeProduccion/:idOperador', async(req, res) => {
    const { idOperador } = req.params;
    // CONSULTAMOS EL OPERADOR
    const operador = await pool.query('SELECT * FROM operadores WHERE idOperador = ?', [idOperador]);

    // CONSULTAMOS LOS REGISTROS DEL OPERADOR EN LA TABLA PRODUCCION
    const consultaProduccion = 'SELECT * FROM produccion' + 
    ' INNER JOIN ordenproduccion ON produccion.idOP = ordenproduccion.idOP' +
    ' INNER JOIN procesos ON produccion.idProceso = procesos.idProceso' +
    ' WHERE idOperador = ' + idOperador + 
    ' ORDER BY inicio DESC';
    const produccion = await pool.query(consultaProduccion);
    res.render('operadores/informeProduccion', { operador: operador[0], produccion });
});


module.exports = router;