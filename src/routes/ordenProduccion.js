const express = require('express');
const router = express.Router();
const pool = require('../database');
const moment = require('moment');

//GET: crear
router.get('/crear', (req, res) => {
    const fecha = moment().format('YYYY-MM-DD');
    res.render('ordenProduccion/crear', { fecha });
});

//POST: crear
router.post('/crear', async (req, res) => {
    const datosOP = {
        nombreOP: req.body.nombreOP,
        consecutivo: req.body.consecutivo,
        cantidadOP: req.body.cantidadOP,
        fecha: req.body.fecha,
        tipoProceso: req.body.tipoProceso,
        estadoOP: 'Pendiente',
    };
    // buscamos si existe el consucutivo
    const op = await pool.query('SELECT * FROM ordenProduccion WHERE consecutivo = ?', [datosOP.consecutivo]);
    if (op.length > 0) {
        req.flash('message', 'El consecutivo ya existe');
        res.redirect('/ordenProduccion/crear');
    } else {
        if (datosOP.tipoProceso != '') {
            const tejido = ['diseño', 'ordenProduccion', 'preProduccion', 'telar1', 'telar2', 'telar4', 'telar5', 'telar6',
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

            // en procesos cambiar los estados de diseño a terminada y ordenProduccion a terminada
            await pool.query('UPDATE procesos SET estadoProceso = ? WHERE idOP = ? AND nombreProceso = ?', ['Terminado', resultadoOP.insertId, 'diseño']);
            await pool.query('UPDATE procesos SET estadoProceso = ? WHERE idOP = ? AND nombreProceso = ?', ['Terminado', resultadoOP.insertId, 'ordenProduccion']);

            const procesoPreProduccion = {
                medidaIN: 'indefinido',
                medidaOUT: 'indefinido',
                estadoProceso: 'en Proceso',
                observacionesProceso: 'Pendiente por materia prima'
            };
            // actualizamos registro en procesos
            await pool.query('UPDATE procesos SET ? WHERE idOP = ? AND nombreProceso = ?', [procesoPreProduccion, resultadoOP.insertId, 'preProduccion']);


            req.flash('success', 'Orden de Producción creada correctamente');
            res.redirect('/ordenProduccion/listarOP');
        } else {
            req.flash('message', 'Debe seleccionar un tipo de proceso');
            res.redirect('/ordenProduccion/crear');
        }
    }
});

//GET: listarOP con estado diferente a 'Terminado'
router.get('/listarOP', async (req, res) => {
    const ordenesProduccion = await pool.query('SELECT * FROM ordenProduccion WHERE estadoOP != ?', ['Terminado']);
    res.render('ordenProduccion/listarOP', { ordenesProduccion });
});


module.exports = router;