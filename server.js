const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Aggiungi questa riga
const serverAbou = express();

// Esempio di database di profili
var controller = require('./Controller/SQLDB');
controller.creaDB(); 

// Impostare pug come motore di template
serverAbou.set('view engine', 'pug');

// Generare una chiave segreta randomizzata di 10 caratteri
const secretKey = crypto.randomBytes(10).toString('hex');

// Middleware per analizzare i dati dal form
serverAbou.use(express.urlencoded({extended:true}));

// Aggiungi il middleware cookie-parser
serverAbou.use(cookieParser());

// Middleware: log delle richieste
serverAbou.use((req, res, next) => {
    console.log('Time:', `${new Date().toISOString()} - ${req.method} - ${req.url}`);
    next();
});

// Middleware per verificare il token JWT
function authenticateToken(req, res, next) {
    const token = req.cookies.jwt;
    if (!token) return res.redirect('/login');

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            res.clearCookie('jwt');
            return res.redirect('/login');
        }
        req.user = user;
        next();
    });
}

serverAbou.get('/', (req, res) => {
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

        if (profili.some(profilo => profilo.email === nuovoProfilo.email)) {
            res.redirect('/errregister');
            return;
        }

        await controller.inserisciProfilo(nuovoProfilo.email, nuovoProfilo.password, nuovoProfilo.nominativo, nuovoProfilo.genere);
        const token = jwt.sign({ email: nuovoProfilo.email }, secretKey, { expiresIn: '1h' });
        res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 }); // 1 ora
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
        const { GMLInoltrato: email, PSWRDInoltrato: password } = req.body;
        const profili = await controller.listaProfili();

        const profilo = profili.find(profilo => profilo.email === email);

        if (profilo && profilo.password === password) {
            const token = jwt.sign({ email: email }, secretKey, { expiresIn: '1h' });
            res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 }); // 1 ora
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
});

serverAbou.post('/adminLogin', async (req, res) => {
    try {
        const { nome, password } = req.body;
        const admin = await controller.cercaAmministratore(nome, password);

        if (admin) {
            const token = jwt.sign({ admin: admin.nome }, secretKey, { expiresIn: '1h' });
            res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 }); // 1 ora
            res.redirect('/sala');
        } else {
            res.status(401).send('Nome o password non validi');
        }
    } catch (err) {
        console.error('Errore durante il login admin:', err.message);
        res.status(500).send('Errore interno del server');
    }
});

serverAbou.get('/adminReg', authenticateToken, async (req, res) => {
    if (req.user.admin) {
        res.sendFile(__dirname + '/Public/adminReg.html');
    } else {
        res.redirect('/sala');
    }
});

serverAbou.post('/registerAdmin', authenticateToken, async (req, res) => {
    if (!req.user.admin) {
        return res.status(403).send('Non autorizzato');
    }

    try {
        const { nome, password } = req.body;
        await controller.registraAdmin(nome, password);
        res.redirect('/sala');
    } catch (err) {
        console.error('Errore durante la registrazione admin:', err.message);
        res.status(500).send('Errore durante la registrazione admin');
    }
});

serverAbou.get('/sala', authenticateToken, async (req, res) => {
    try {
        let profilo;
        if (req.user.email) {
            profilo = (await controller.cercaProfiloEmail(req.user.email))[0];
        } else if (req.user.admin) {
            profilo = { nominativo: req.user.admin, isAdmin: true };
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

serverAbou.post('/prenota', authenticateToken, async (req, res) => {
    try {
        let id_profilo;
        let nome_admin;

        if (req.user.email) {
            const profili = await controller.cercaProfiloEmail(req.user.email);
            id_profilo = profili[0].id;
        } else if (req.user.admin) {
            nome_admin = req.user.admin;
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

serverAbou.post('/eliminaPrenotazione', authenticateToken, async (req, res) => {
    try {
        const id_posto = req.body.id_posto;
        let profilo;

        if (req.user.email) {
            const profili = await controller.cercaProfiloEmail(req.user.email);
            profilo = profili[0];
        } else if (req.user.admin) {
            profilo = { isAdmin: true };
        }
        const nome_admin = req.user.admin;
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

// Aggiungi una route per il logout
serverAbou.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/login');
});

// Middleware per gestire errore 404 (rotta non trovata)
serverAbou.use((req, res) => {
    res.status(404).send('Rotta non trovata');
});

// Avvio del server
serverAbou.listen(3000, () => {
    console.log(`Server avviato su http://localhost:3000`);
});
