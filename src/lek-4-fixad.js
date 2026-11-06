// Fixad version av lek-4.js.
// Varje fix har samma nummer som sårbarheten i lek-4.js.

// fix nr 4: läser hemligheter från filen .env i stället för att skriva dem i koden
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
// fix nr 2 och 3: paket som gör om specialtecken (< > " ' &) till vanlig text
const escapeHtml = require('escape-html');
// fix nr 6 och 7: paket som lägger till säkerhetsrubriker (headers) i varje svar
const helmet = require('helmet');

// fix nr 4: process.env hämtar värdena från .env, lösenordet syns inte i koden
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const app = express();
// fix nr 6 och 7: helmet slår på säkerhetsrubrikerna och tar bort rubriken X-Powered-By: Express
app.use(helmet());
// fix nr 7: stänger av rubriken X-Powered-By uttryckligen, så att verktygen ser det
app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // validering: kontrollerar att indata är text och inte för långt, annars stoppas förfrågan direkt
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    username.length > 50 ||
    password.length > 100
  ) {
    return res.status(400).send('Ogiltiga användaruppgifter.');
  }

  // fix nr 1: frågetecknen är platshållare, värdena skickas separat i en lista
  // databasen behandlar då username och password som text, aldrig som SQL-kod
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';

  db.query(query, [username, password], (err, rows) => {
    if (err) {
      // fix nr 5: bara felkoden skrivs i serverns terminal, inte hela felet med känsliga detaljer
      console.error('Databasfel:', err.code);
      // användaren får ett allmänt meddelande utan detaljer om databasen
      return res.status(500).send('Något gick fel. Försök igen senare.');
    }

    if (rows.length > 0) {
      // fix nr 2: escapeHtml gör om <script> till &lt;script&gt;, webbläsaren visar det som text
      res.send('Välkommen <b>' + escapeHtml(username) + '</b>, du är inloggad!');
    } else {
      res.status(401).send('Ogiltiga användaruppgifter.');
    }
  });
});

app.get('/messages', (req, res) => {
  const msg = req.query.msg || 'Inget meddelande';
  // fix nr 3: samma fix som nr 2, texten från länken blir vanlig text
  res.send('<h1>Dina meddelanden</h1><p>' + escapeHtml(msg) + '</p>');
});

// Starta servern (lokalt)
app.listen(3000, () => {
  console.log('Server kör på http://localhost:3000');
});

// nästa steg: lösenord ska sparas hashade med bcrypt, inte i klartext i databasen
