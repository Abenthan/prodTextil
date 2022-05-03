const express = require('express');
const router = express.Router();
const pool = require('../database');

//GET: crear
router.get('/crear', (req, res) => {
    res.render('ordenProduccion/crear');
});

//POST: crear
router.post('/crear', async(req, res) => {
    const datosOP = {
        nombreOP: req.body.nombreOP,
        consecutivo: req.body.consecutivo,
        cantidadOP: req.body.cantidadOP,
        fecha: req.body.fecha,
        tipoProceso: req.body.tipoProceso,
        estadoOP: 'Pendiente',
    };

    const tejido = ['diseño', 'ordenProduccion', 'telar1', 'telar2', 'telar4', 'telar5', 'telar6',
     'enrrollado', 'planchado', 'corte', 'inspeccion', 'despacho'];
    const flexo = ['preprensa', 'preproduccion', 'impresion', 'corte'];
    const transfer = ['preprensa', 'preproduccion', 'impresion', 'screen', 'revision', 'corteLineal', 'corteUnitario', 'rollos', 'empaque'];
    const garras = ['preprensa', 'preproduccion', 'screen', 'repujado', 'troquelado', 'empaque', 'despacho'];

    const procesosOP = [];

    var ordenRuta = 0;
    var primerProceso = 0;

    // creamos array de procesosOP
    switch (datosOP.tipoProceso) {
        case '1': // tejido
            for (let i = 0; i < tejido.length; i++) {
                if (req.body[tejido[i]]) {
                    ordenRuta++;
                    cantidad = 0;
                    procesosOP.push({ nombreProceso: tejido[i], ordenRuta: ordenRuta, cantidadProceso: cantidad, estadoProceso: 'Pendiente' });
                }
            }
            break;

        case '2': //Flexo
            for (let i = 0; i < flexo.length; i++) {
                if (req.body[flexo[i]]) {
                    ordenRuta++;
                    cantidad = 0;
                    procesosOP.push({ nombreProceso: flexo[i], ordenRuta: ordenRuta, cantidadProceso: cantidad, estadoProceso: 'Pendiente' });
                }
            }
            break;

        case '3': //Transfer
            for (let i = 0; i < transfer.length; i++) {
                if (req.body[transfer[i]]) {
                    ordenRuta++;
                    cantidad = 0;
                    procesosOP.push({ nombreProceso: transfer[i], ordenRuta: ordenRuta, cantidadProceso: cantidad, estadoProceso: 'Pendiente' });
                }
            }

            break;

        case '4': //Garras
            for (let i = 0; i < garras.length; i++) {
                if (req.body[garras[i]]) {
                    ordenRuta++;
                    cantidad = 0;
                    procesosOP.push({ nombreProceso: garras[i], ordenRuta: ordenRuta, cantidadProceso: cantidad, estadoProceso: 'Pendiente' });
                }
            }
            break;

        default:
            break;

    };
    
    // insertamos datosOP en ordenProduccion
    const resultadoOP = await pool.query('INSERT INTO ordenProduccion SET ?', [datosOP]);

    // agregamos a procesosOP el id insertado en la tabla ordenProduccion
    for (let i = 0; i < procesosOP.length; i++) {
        procesosOP[i].idOP = resultadoOP.insertId;
    }
    
    // insertamos procesosOP en procesos
    for (let i = 0; i < procesosOP.length; i++) {
        const resultadoProceso = await pool.query('INSERT INTO procesos SET ?', [procesosOP[i]]);

    }
    console.log('(out for) primer proceso: ' + primerProceso);

    // asignamos cantidad al primer proceso y cambiamos el estado a 'En Cola'
    const resultadoCantidad = await pool.query('UPDATE procesos SET cantidadProceso = ?, estadoProceso = ? WHERE idOP = ? AND ordenRuta = ?', [datosOP.cantidadOP, 'En Cola', resultadoOP.insertId, 1]);
    
    //buscamos idProceso del primer proceso

    const produccion = {
        idOP: resultadoOP.insertId,
        idProceso: primerProceso,
        cantidad: datosOP.cantidadOP
    };
    //insertamos en la tabla produccion 
    const resultadoProduccion = await pool.query('INSERT INTO produccion SET ?', [produccion]);

    req.flash('success', 'Orden de Producción creada correctamente');
    res.redirect('/ordenProduccion/listarOP');
});

//GET: listarOP con estado diferente a 'Terminado'
router.get('/listarOP', async(req, res) => {
    const ordenesProduccion = await pool.query('SELECT * FROM ordenProduccion WHERE estadoOP != ?', ['Terminado']);
    res.render('ordenProduccion/listarOP', { ordenesProduccion });
});

//GET: procesosOP de una ordenProduccion
router.get('/ProcesosOP/:idOP', async(req, res) => {
    const { idOP } = req.params;
    const resultadoOP = await pool.query('SELECT nombreOP, consecutivo FROM ordenProduccion WHERE idOP = ?', [idOP]);
    OP = resultadoOP[0];
    const procesosOP = await pool.query('SELECT * FROM procesos WHERE idOP = ?', [idOP]);
    res.render('ordenProduccion/procesosOP', { OP, procesosOP });
});


module.exports = router;