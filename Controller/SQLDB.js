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

            db.run(`CREATE TABLE IF NOT EXISTS amministratori(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                password TEXT NOT NULL
            );`, (err) => {
                if (err) {
                    console.log(err.message);
                    reject(err);
                } else {
                    console.log("Tabella 'amministratori' creata.");
                    db.run(`INSERT INTO amministratori (nome, password) VALUES ('Mostafa', 'passw0rd');`, (err) => {
                        if (err) {
                            console.log(err.message);
                            reject(err);
                        } else {
                            console.log("Record amministratore inserito.");
                            resolve();
                        }
                    });
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

function prenotaPosto(id_profilo, id_posto, nome_admin) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM prenotazioni WHERE id_posto = ?;`, [id_posto], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                reject(new Error('Posto già prenotato'));
            } else {
                if (id_profilo) {
                    db.run(`INSERT INTO prenotazioni (id_profilo, id_posto) VALUES (?, ?);`, [id_profilo, id_posto], (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                } else if (nome_admin) {
                    db.run(`INSERT INTO prenotazioni (id_profilo, id_posto) VALUES ((SELECT nome FROM amministratori WHERE nome = ?), ?);`, [nome_admin, id_posto], (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
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

function eliminaPrenotazione(id_profilo, id_posto, nome_admin) {
    return new Promise((resolve, reject) => {
        if(!nome_admin){
            console.log(id_profilo, id_posto);
            db.run(`DELETE FROM prenotazioni WHERE id_profilo = ? AND id_posto = ?;`, [id_profilo, id_posto], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }
        else{
            db.run(`DELETE FROM prenotazioni WHERE id_posto = ? AND ? IN (SELECT amministratori.nome FROM amministratori);`, [id_posto, nome_admin], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }
        
    });
}

function cercaAmministratore(nome, password) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM amministratori WHERE nome = ? AND password = ?`, [nome, password], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Esportare le funzioni
module.exports = {
    creaDB,
    inserisciProfilo,
    listaProfili,
    cercaProfiloEmail,
    listaPosti,
    prenotaPosto,
    listaPrenotazioni,
    cercaAmministratore,
    eliminaPrenotazione
};