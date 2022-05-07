const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');
const {isLoggedIn, isNotLoggedIn} = require('../lib/auth');

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

router.get('/logIn', isNotLoggedIn, (req, res) => {
    res.render('usuarios/logIn');
});

router.post('/logIn', isNotLoggedIn, (req, res, next) => {
    console.log('in');
    passport.authenticate('local.logIn', {
        successRedirect: '/home',
        failureRedirect: '/usuarios/logIn',
        failureFlash: true
    })(req, res, next)
});

router.get('/logout', isLoggedIn, (req, res) => { 
    req.logOut();
    res.redirect('/usuarios/logIn');
});

//GET: usuarios
router.get('/listarUsuarios', async(req, res) => {
    // consultar usuarios
    const usuarios = await pool.query('SELECT * FROM usuarios');
    res.render('usuarios/listarUsuarios', {usuarios});
  
});

// GET: editarUsuario
router.get('/editarUsuario/:id', async(req, res) => {
    const {id} = req.params;
    const usuario = await pool.query('SELECT * FROM usuarios WHERE idUsuario = ?', [id]);
    res.render('usuarios/editarUsuario', {usuario: usuario[0]});
});

// POST: editarUsuario
router.post('/editarUsuario/:id', async(req, res) => {
    const {id} = req.params;
    const {fullname, username, perfilUsuario} = req.body;
    const newUsuario = {
        fullname,
        username,
        perfilUsuario
    };
    await pool.query('UPDATE usuarios SET ? WHERE idUsuario = ?', [newUsuario, id]);
    req.flash('success', 'Usuario actualizado correctamente');
    res.redirect('/usuarios/listarUsuarios');   
});

module.exports = router;
