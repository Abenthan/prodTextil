module.exports = {
    isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('message', 'Debes iniciar sesión');
        return res.redirect('/home');
    },

    isNotLoggedIn(req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/home');
    },

    sesionOperador(req, res, next) {
        const operador = req.session.operador;
        if (typeof operador !== 'undefined') {
            return next();
        } else {
            req.flash('message', 'Debe ingresar el codigo del operador');
            return res.redirect('/produccion/inicio');
        }

    },

    sesionOP(req, res, next) {
        const ordenProduccion = req.session.ordenProduccion;
        if (typeof ordenProduccion !== 'undefined') {
            return next();
        } else {
            req.flash('message', 'Debe ingresar la orden de produccion');
            return res.redirect('/produccion/buscarProceso');
        }

    }

}