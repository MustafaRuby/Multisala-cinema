//USO LIBRERIA SQLite3

const sqlite3 = require('sqlite3').verbose();
// Crea un nuovo database su file
const db = new sqlite3.Database('profiliDB.db', (err) => {
    if (err) {
        console.error('Errore durante la connessione al database:', err.message);
    } else {
        console.log('Connessione al database riuscita.');
    }
});

function creaDB() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS profili(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                password TEXT(32) NOT NULL,
                nominativo TEXT NOT NULL,
                genere TEXT CHECK(genere IN ('M', 'F'))
            );`, (err) => {
                if (err) {
                    console.log(err.message);
                    reject(err);
                } else {
                    console.log("Tabella 'profili' creata.");
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS posti(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero TEXT NOT NULL
            );`, (err) => {
                if (err) {
                    console.log(err.message);
                    reject(err);
                } else {
                    console.log("Tabella 'posti' creata.");
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS prenotazioni(
                id_profilo INTEGER,
                id_posto INTEGER,
                FOREIGN KEY(id_profilo) REFERENCES profili(id),
                FOREIGN KEY(id_posto) REFERENCES posti(id),
                PRIMARY KEY (id_profilo, id_posto)
            );`, (err) => {
                if (err) {
                    console.log(err.message);
                    reject(err);
                } else {
                    console.log("Tabella 'prenotazioni' creata.");
                }
            });

            const posti = [];
            ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(row => {
                [1, 2, 3, 4, 5, 6, 7, 8].forEach(col => {
                    posti.push(`('${row}${col}')`);
                });
            });

            db.run(`INSERT INTO posti (numero) VALUES ${posti.join(', ')};`, (err) => {
                if (err) {
                    console.log(err.message);
                    reject(err);
                } else {
                    console.log("Posti inseriti.");
                    resolve();
                }
            });
        });
    });
}

function inserisciProfilo(email, password, nominativo, genere) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO profili (email, password, genere, nominativo) VALUES (?, ?, ?, ?);`,
            [email, password, genere, nominativo],
            function (err) {
                if (err) {
                    console.log(err.message);
                    reject(err);
                } else {
                    console.log(`Record inserito con ID ${this.lastID}`);
                    resolve(this.lastID);
                }
            });
    });
}

function listaProfili() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM profili;`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function cercaProfiloEmail(email) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM profili WHERE profili.email = ?;`, [email], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function eliminaProfilo(idEliminare) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM profili WHERE id = ?;`, [idEliminare], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function listaPosti() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM posti;`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function prenotaPosto(id_profilo, id_posto) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM prenotazioni WHERE id_posto = ?;`, [id_posto], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                reject(new Error('Posto già prenotato'));
            } else {
                db.run(`INSERT INTO prenotazioni (id_profilo, id_posto) VALUES (?, ?);`, [id_profilo, id_posto], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

function listaPrenotazioni() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM prenotazioni;`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Elimina il database
function eliminaDB () {
    return new Promise((resolve, reject) => {
        db.run(`DROP TABLE IF EXISTS profili;`, (err) => {
            if (err) {
                console.error('Errore durante la cancellazione del DB:', err.message);
            } else {
                console.log('DB eliminato');
            }
        });
    });
};

// Chiude il database
function chiudiDB () {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                console.error('Errore durante la chiusura del database:', err.message);
            } else {
                console.log('Connessione al database chiusa.');
            }
        });
    });
};

// Esportare le funzioni
module.exports = {
    creaDB,
    inserisciProfilo,
    listaProfili,
    cercaProfiloEmail,
    eliminaProfilo,
    eliminaDB,
    chiudiDB,
    listaPosti,
    prenotaPosto,
    listaPrenotazioni
};