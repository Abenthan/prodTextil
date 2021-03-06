const express = require('express');
const morgan = require('morgan');
const { engine } = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session');
const passport = require('passport');
const { database } = require('./keys'); 


// inicializaciones
const app = express();
require('./lib/passport');

//configuraciones
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));
app.set('view engine', '.hbs');

//middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(flash());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
}));
app.use(passport.initialize());
app.use(passport.session());


// variable globales
app.use((req, res, next) => {
    app.locals.user =  req.user;
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    next();
});

// rutas
app.use(require('./routes/'));
app.use('/home', require('./routes/home'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/operadores', require('./routes/operadores'));
app.use('/ordenProduccion', require('./routes/ordenProduccion'));
app.use('/procesos', require('./routes/procesos'));
app.use('/produccion', require('./routes/produccion'));

// public
app.use(express.static(path.join(__dirname, 'public')));

//iniciar servidor
app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});
