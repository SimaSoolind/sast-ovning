/*Lektionsuppgift: Granska kod och kör ett SAST-verktyg
Utgångspunkt:
Kolla på koden i nästa slide
Uppgift :
Manuell kodgranskning: klart
Leta efter ställen där användarinmatning stoppas rakt in i SQL-strängar (SQL Injection).
Hitta risker för XSS ( Cross-Site Scripting ) i t.ex. res.send-anropet.
Köra SAST-verktyg:
Lägg in denna fil i ett SAST-verktyg (ex. SonarQube, Snyk CLI, Checkmarx demo).
Se om verktyget varnar för SQL Injection och XSS.
Förslag på fixar (frivilligt):
Byt ut dynamiska SQL-strängar till parametriserade queries (ex. db.query("SELECT * FROM users WHERE
username = ? AND password = ?", [username, password], ...)).
Rena/escapa utdata innan den skickas tillbaka i HTML, eller använd en templating-motor med inbyggd escaping.
……………………………………………………………………………………………………………………………………………………………………………………………
•*/

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
//sårbarhet nr 4: hårdkodade hemligheter , lösenordet syns i koden.
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'SalonBooking',
});
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  //sårbarhet nr 1: SQL-injektion , saknar paramateserade frågor.
  const query =
    "SELECT * FROM users WHERE username = '" +
    username +
    "' AND password = '" +
    password +
    "'";
  db.query(query, (err, rows) => {
    if (err) {
      //sårbarhet nr 5: felet från databasen visas för användaren.
      return res.send('Fel inträffade vid databasfråga: ' + err);
    }
    // saknar de tillåtna värden och längd i användernamnet
    // ingen buffertoverflow  exempel max antal tecken.

    if (rows.length > 0) {
      //sårbarhet nr 2: xss , användarnamnet visas utan output encoding.
      res.send('Välkommen <b>' + username + '</b>, du är inloggad!');
    } else {
      res.send('Ogiltiga användaruppgifter.');
    }
  });
});
// xss attack i url:en genom att lägga script i en länk
app.get('/messages', (req, res) => {
  const msg = req.query.msg || 'Inget meddelande';
  res.send('<h1>Dina meddelanden</h1><p>' + msg + '</p>');
});
// Starta servern (lokalt)
app.listen(3000, () => {
  console.log('Server kör på http://localhost:3000');
});

// Lösningar:
//1. validering av koden exempel : zode
//2. oramatiserade frågor och ORM som Prisma.
//3 använda etablerade bibliotek som som tar hand om kryptering av känslig data
//4. gör om special tecken  till text innan det skickas ut och tolkas som kod.
//5. inga hårdkodade hemligheter
