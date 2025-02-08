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

        for (const profilo of profili) {
            if (profilo.email === nuovoProfilo.email) {
                res.redirect('/errregister');
                return;
            }
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
});

serverAbou.post('/login', async (req, res) => {
    try {
        const nuovoProfilo = {
            email: req.body.GMLInoltrato,
            password: req.body.PSWRDInoltrato,
        };

        const profili = await controller.listaProfili();

        for (const profilo of profili) {
            if (profilo.email === nuovoProfilo.email) {
                if (profilo.password === nuovoProfilo.password) {
                    req.session.user = nuovoProfilo.email;
                    res.redirect('/sala');
                    return;
                } else {
                    res.redirect('/errlogin');
                    return;
                }
            }
        }
        res.redirect('/errlogin');
    } catch (err) {
        console.error('Errore durante il login:', err.message);
        res.redirect('/errlogin');
    }
});

// Si crea l'endpoint della pagina renderizzata
serverAbou.get('/sala', async (req, res) => {
    try {
        const titolo_1 = 'Sala principale';
        const subtitolo_1 = 'Informazioni sulla nostra app';
        const subtitolo_2 = 'Posti';
        const profili = await controller.cercaProfiloEmail(req.session.user);
        const posti = await controller.listaPosti();

        const prenotazioni = await controller.listaPrenotazioni();
        const postiPrenotati = prenotazioni.map(p => p.id_posto);

        const postiConPrenotazione = posti.map(posto => ({
            ...posto,
            prenotato: postiPrenotati.includes(posto.id)
        }));

        if (profili.length > 0) {
            const profilo = profili[0];
            res.render('sala', {
                titolo1: titolo_1,
                subtitolo1: subtitolo_1,
                subtitolo2: subtitolo_2,
                profilo: profilo,
                posti: postiConPrenotazione
            });
        } else {
            res.status(404).send('Profilo non trovato');
        }
    } catch (err) {
        console.error('Errore durante il rendering della sala:', err.message);
        res.status(500).send('Errore interno del server');
    }
});

serverAbou.post('/prenota', async (req, res) => {
    try {
        const id_profilo = req.session.user;
        const id_posto = req.body.id_posto;

        await controller.prenotaPosto(id_profilo, id_posto);
        res.redirect('/sala');
    } catch (err) {
        console.error('Errore durante la prenotazione:', err.message);
        res.status(500).send('Errore durante la prenotazione');
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
