const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const serverAbou = express();

// Esempio di database di profili
var controller = require('./Controller/SQLDB');
controller.creaDB(); 

// Impostare pug come motore di template
serverAbou.set('view engine', 'pug');

// Generare una chiave segreta randomizzata di 10 caratteri
const secretKey = crypto.randomBytes(10).toString('hex');

// Middleware per la gestione delle sessioni
serverAbou.use(session({
    secret: secretKey,  // Una chiave segreta randomizzata
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Impostare 'true' se usi HTTPS
}));

// Impostare la cartella dove si trova il file da renderizzare
serverAbou.set('views', __dirname + '/Views');

// Middleware: log delle richieste
serverAbou.use((req, res, next) => {
    console.log('Time:', `${new Date().toISOString()} - ${req.method} - ${req.url}`);
    next();
});

// Middleware per analizzare i dati dal form
serverAbou.use(express.urlencoded({extended:true}));

serverAbou.get('/', (req, res) => {
    req.session.user = "";
    res.sendFile(__dirname + '/Public/register.html');
});

serverAbou.get('/register', (req, res) => {
    res.sendFile(__dirname + '/Public/register.html');
    req.session.user = "";
});

serverAbou.get('/errlogin', (req, res) => {
    res.status(404).send('Errore nel login');
});

serverAbou.get('/errregister', (req, res) => {
    res.status(404).send('Errore nella registrazione');
});

serverAbou.post('/register', async (req, res) => {
    try {
        const nuovoProfilo = {
            email: req.body.GMLInoltrato,
            password: req.body.PSWRDInoltrato,
            nominativo: req.body.NMTVInoltrato,
            genere: req.body.GNREInoltrato
        };

        const profili = await controller.listaProfili();

        if (profili.some(profilo => profilo.email === nuovoProfilo.email)) {
            res.redirect('/errregister');
            return;
        }

        await controller.inserisciProfilo(nuovoProfilo.email, nuovoProfilo.password, nuovoProfilo.nominativo, nuovoProfilo.genere);
        req.session.user = nuovoProfilo.email;
        res.redirect('/sala');
    } catch (err) {
        console.error('Errore durante la registrazione:', err.message);
        res.redirect('/errregister');
    }
});

serverAbou.get('/login', (req, res) => {
    res.sendFile(__dirname + '/Public/login.html');
    req.session.user = "";
});

serverAbou.post('/login', async (req, res) => {
    try {
        const { GMLInoltrato: email, PSWRDInoltrato: password } = req.body;
        const profili = await controller.listaProfili();

        const profilo = profili.find(profilo => profilo.email === email);

        if (profilo && profilo.password === password) {
            req.session.user = email;
            res.redirect('/sala');
        } else {
            res.redirect('/errlogin');
        }
    } catch (err) {
        console.error('Errore durante il login:', err.message);
        res.redirect('/errlogin');
    }
});

serverAbou.get('/napafini', (req, res) => {
    res.sendFile(__dirname + '/Public/adminLog.html');
    req.session.user = "";
});

serverAbou.post('/adminLogin', async (req, res) => {
    try {
        const { nome, password } = req.body;
        const admin = await controller.cercaAmministratore(nome, password);

        if (admin) {
            req.session.admin = admin.nome;
            res.redirect('/sala');
        } else {
            res.status(401).send('Nome o password non validi');
        }
    } catch (err) {
        console.error('Errore durante il login admin:', err.message);
        res.status(500).send('Errore interno del server');
    }
});

serverAbou.get('/sala', async (req, res) => {
    try {
        let profilo;
        if (req.session.user) {
            profilo = (await controller.cercaProfiloEmail(req.session.user))[0];
        } else if (req.session.admin) {
            profilo = { nominativo: req.session.admin, isAdmin: true };
        }

        if (!profilo) {
            return res.status(404).send('Profilo non trovato');
        }

        const posti = await controller.listaPosti();
        const prenotazioni = await controller.listaPrenotazioni();

        const postiConPrenotazione = posti.map(posto => {
            const prenotazione = prenotazioni.find(p => p.id_posto === posto.id);
            return {
                ...posto,
                prenotato: !!prenotazione,
                id_profilo: prenotazione ? prenotazione.id_profilo : null,
            };
        });

        res.render('sala', {
            titolo1: 'Sala principale',
            subtitolo1: 'Informazioni sulla nostra app',
            subtitolo2: 'Posti',
            profilo,
            posti: postiConPrenotazione
        });
    } catch (err) {
        console.error('Errore durante il rendering della sala:', err.message);
        res.status(500).send('Errore interno del server');
    }
});

serverAbou.post('/prenota', async (req, res) => {
    try {
        let id_profilo;
        let nome_admin;

        if (req.session.user) {
            const profili = await controller.cercaProfiloEmail(req.session.user);
            id_profilo = profili[0].id;
        } else if (req.session.admin) {
            nome_admin = req.session.admin;
        }

        const id_posto = req.body.id_posto;

        if (id_profilo) {
            await controller.prenotaPosto(id_profilo, id_posto);
        } else if (nome_admin) {
            await controller.prenotaPosto(null, id_posto, nome_admin);
        }

        res.redirect('/sala');
    } catch (err) {
        console.error('Errore durante la prenotazione:', err.message);
        res.status(500).send('Errore durante la prenotazione');
    }
});

serverAbou.post('/eliminaPrenotazione', async (req, res) => {
    try {
        const id_posto = req.body.id_posto;
        let profilo;

        if (req.session.user) {
            const profili = await controller.cercaProfiloEmail(req.session.user);
            profilo = profili[0];
        } else if (req.session.admin) {
            profilo = { isAdmin: true };
        }
        const nome_admin = req.session.admin;
        if (profilo.isAdmin) {
            await controller.eliminaPrenotazione(null, id_posto, nome_admin);
            res.redirect('/sala');
        } else if (profilo) {
            await controller.eliminaPrenotazione(profilo.id, id_posto, null);
            res.redirect('/sala');
        } else {
            res.status(404).send('Profilo non trovato');
        }
    } catch (err) {
        console.error('Errore durante l\'eliminazione della prenotazione:', err.message);
        res.status(500).send('Errore interno del server');
    }
});

// Middleware per gestire errore 404 (rotta non trovata)
serverAbou.use((req, res) => {
    res.status(404).send('Rotta non trovata');
});

// Avvio del server
serverAbou.listen(3000, () => {
    console.log(`Server avviato su http://localhost:3000`);
});
