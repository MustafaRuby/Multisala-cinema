# Multisala Cinema
*Nota: consiglio di vedere la versione di [Flask](https://github.com/MustafaRuby/multisala-moz-flask), poiché è l'evoluzione di questo*
## Descrizione
Questo progetto è un'applicazione web per la gestione di una multisala cinematografica. Gli utenti possono registrarsi, effettuare il login e prenotare posti per le proiezioni.

## Requisiti
- Node.js (versione 14 o superiore)
- npm (Node Package Manager)

## Installazione
1. Clona il repository:
    ```bash
    git clone https://github.com/MustafaRuby/Multisala-cinema.git
    ```
2. Naviga nella directory del progetto:
    ```bash
    cd Multisala-cinema
    ```
3. Installa le dipendenze:
    ```bash
    npm install
    ```

## Moduli da installare
- express
- jsonwebtoken
- pug
- crypto
- sqlite3
- cookie-parser

Questi moduli possono essere installati eseguendo il seguente comando:
```bash
npm install express jsonwebtoken pug crypto sqlite3 cookie-parser
```

## Avvio del progetto
Per avviare il server, esegui il seguente comando:
```bash
node server.js
```

Il server sarà avviato su `http://localhost:3000`.

## Struttura del progetto
- `server.js`: Il file principale del server.
- `Controller/SQLDB.js`: Il controller per la gestione del database.
- `Views/`: La cartella contenente i file Pug per il rendering delle pagine.
- `Public/`: La cartella contenente i file statici (HTML, CSS, JS).

## Note
- Assicurati di avere un database configurato e funzionante.
- Modifica i file di configurazione del database secondo le tue necessità.

## Gestione degli amministratori
Gli amministratori possono accedere a funzionalità aggiuntive come la registrazione di nuovi amministratori. Per accedere come amministratore, utilizza le credenziali predefinite o registrati come nuovo amministratore.

## Accesso Admin
Per accedere come amministratore, visita la pagina /napafini e inserisci le credenziali di amministratore.

## Registrazione Admin
Gli amministratori possono registrare nuovi amministratori visitando la pagina /adminReg dopo aver effettuato l'accesso come amministratore.

### Note
Assicurati di avere un database configurato e funzionante.
Modifica i file di configurazione del database secondo le tue necessità.
