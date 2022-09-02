const express = require('express');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const moment = require('moment');
const { isLoggedIn} = require('../lib/sesiones');

// GET: tipoProceso
router.get('/tipoProceso', async (req, res) => {
    res.render('ordenProduccion/tipoProceso');    

});

// POST: tipoProceso
router.post('/tipoProceso', async (req, res) => {
    const { tipoProceso } = req.body;
    if(tipoProceso == '1'){
        res.redirect('/ordenProduccion/tejido');
    }else if(tipoProceso == '4'){
        res.redirect('/ordenProduccion/garras');
    }else{
        res.redirect('/ordenProduccion/crear');
    }
    
});

//GET: tejido
router.get('/tejido', isLoggedIn, async (req, res) => {
    const fecha = moment().format('YYYY-MM-DD');
    res.render('ordenProduccion/tejido', {fecha});
});

//GET: garras
router.get('/garras', isLoggedIn, async (req, res) => {
    const fecha = moment().format('YYYY-MM-DD');
    res.render('ordenProduccion/garras', {fecha});
});

//GET: crear
router.get('/crear', (req, res) => {
    const fecha = moment().format('YYYY-MM-DD');
    res.render('ordenProduccion/crear', { fecha });
});

//POST: crear
router.post('/crear', isLoggedIn, async (req, res) => {
    // mostrar por consola fecha, hora y usuario;
    console.log('usuario: ', req.user.username, ' ', moment().format('YYYY-MM-DD HH:mm:ss'));
    const datosOP = {
        nombreOP: req.body.nombreOP,
        consecutivo: req.body.consecutivo,
        cantidadPedida: req.body.cantidadPedida,
        cantidadProgramada: req.body.cantidadProgramada,
        fecha: req.body.fecha,
        tipoProceso: req.body.tipoProceso,
        estadoOP: 'Pendiente',
    };
    if(datosOP.tipoProceso == '1'){
        datosOP.reportes = req.body.reportes;
        datosOP.largo = req.body.largo;
    }

    if(datosOP.tipoProceso == '4'){
        datosOP.tamaños = req.body.tamaños;
        datosOP.corte = req.body.corte;
        datosOP.unidadesXTamaño = req.body.unidadesXTamaño
    }

    
    // buscamos si existe el consucutivo
    const op = await pool.query('SELECT * FROM ordenProduccion WHERE consecutivo = ?', [datosOP.consecutivo]);

    if (op.length > 0) { //ya existe el consecutivo
        req.flash('message', 'El consecutivo ya existe');
        res.redirect('/ordenProduccion/tipoProceso');
    } else { //no existe consecutivo
        if (datosOP.tipoProceso != '') {
            const tejido = ['diseño', 'ordenProduccion', 'preProduccion', 'telar1', 'telar2', 'telar4', 'telar5', 'telar6',
                'enrrollado', 'planchado', 'corte', 'inspeccion', 'despacho'];
            const flexo = ['preprensa', 'preProduccion', 'impresion', 'corte'];
            const transfer = ['preprensa', 'preProduccion', 'impresion', 'screen', 'revision', 'corteLineal', 'corteUnitario', 'rollos', 'empaque'];
            const garras = ['diseño', 'ordenProduccion', 'preProduccion', 'cutex', 'guillotina', 'screen', 'repujado', 'troquelado', 'empaque',
             'inspeccion', 'despacho'];

            // creamos array de procesosOP

            function agregarProcesos(proceso){
                procesosOP = [];
                var ordenRuta = 0;
                for (let i = 0; i < proceso.length; i++) {
                    if (req.body[proceso[i]]) {
                        ordenRuta++;
                        cantidad = 0;
                        procesosOP.push({ 
                            nombreProceso: proceso[i],
                            ordenRuta: ordenRuta,
                            medidaIN: helpers.unidadesMedida(datosOP.tipoProceso, proceso[i]).in,
                            cantidadIN: cantidad,
                            medidaOUT: helpers.unidadesMedida(datosOP.tipoProceso, proceso[i]).out,
                            cantidadOUT: cantidad,
                            estadoProceso: 'Pendiente',
                            observacionesProceso: ''
                        });
                    }
                }

            }

            switch (datosOP.tipoProceso) {
                case '1': // tejido
                    agregarProcesos(tejido);    
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
                    agregarProcesos(garras);
                    break;

                default:
                    break;

            };

            // insertamos datosOP en ordenProduccion
            const resultadoOP = await pool.query('INSERT INTO ordenProduccion SET ?', [datosOP]);

            // agregamos a procesosOP el id 
            for (let i = 0; i < procesosOP.length; i++) {
                procesosOP[i].idOP = resultadoOP.insertId;
            }

            // insertamos procesosOP en procesos
            for (let i = 0; i < procesosOP.length; i++) {
                await pool.query('INSERT INTO procesos SET ?', [procesosOP[i]]);

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
        } else { /* sin proceso seleccionado */
            req.flash('message', 'Debe seleccionar un tipo de proceso');
            res.redirect('/ordenProduccion/tipoProceso');
        }
    }
});

//GET: listarOP con estado diferente a 'Terminado'
router.get('/listarOP', async (req, res) => {
    const ordenesProduccion = await pool.query('SELECT * FROM ordenProduccion');
    const llamante = 'ordenProduccion';
    res.render('ordenProduccion/listarOP', { ordenesProduccion, llamante });
});

module.exports = router;