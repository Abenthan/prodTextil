const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('home/home');
});

// GET: produccion
router.get('/produccion', (req, res) => {
    res.render('home/produccion');
});

//GET: operarios
router.get('/operarios', (req, res) => {
    res.render('home/operarios');
});

//GET: Usuarios
router.get('/usuarios', (req, res) => {
    res.render('home/usuarios');
});

module.exports = router;