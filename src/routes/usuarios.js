const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');

//GET: nuevoUsuario
router.get('/nuevoUsuario', (req, res) => {
    res.render('usuarios/nuevoUsuario');
});

//POST: nuevoUsuario
router.post('/nuevoUsuario', 
    passport.authenticate('local.nuevoUsuario', {
        successRedirect: '/home',
        failureRedirect: '/usuarios/nuevoUsuario',
        failureFlash: true
    })

);

module.exports = router;