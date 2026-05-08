const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const økt = require("express-session");

const app = express();
const database = new sqlite3.Database("database/eksamen.db");

// gjør at serveren kan bruke filene i public mappen
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// lager en økt så brukeren kan være logget inn
app.use(økt({
  secret: "hemmelig-nøkkel",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

function erAdmin(forespørsel) {
  return forespørsel.session.innloggetBruker?.rolle_id === 4;
}

// enkel sjekk av data før det sendes inn i databasen
function validerBruker(data, kreverPassord) {
  const { navn, email, passord, rolle_id, klasse_id } = data;
  const roller = ["1", "2", "3", "4", "8"];
  const klasser = ["", "2", "3", "4", "5"];

  if (!navn || !email || !rolle_id) return "Navn, email og rolle må fylles ut";
  if (!email.includes("@")) return "Email må være gyldig";
  if (kreverPassord && !passord) return "Passord må fylles ut";
  if (!roller.includes(String(rolle_id))) return "Ugyldig rolle";
  if (!klasser.includes(String(klasse_id ?? ""))) return "Ugyldig klasse";

  return null;
}

app.post("/login", (forespørsel, svar) => {
  const { email, passord } = forespørsel.body;

  // finner bruker med samme email og passord
  database.get(`
    SELECT Bruker.id, Bruker.navn, Bruker.email, Bruker.rolle_id, Rolle.navn AS rollenavn
    FROM Bruker
    JOIN Rolle ON Bruker.rolle_id = Rolle.id
    WHERE Bruker.email = ? AND Bruker.passord = ?
  `, [email, passord], (feil, bruker) => {
    if (feil || !bruker) return svar.json({ vellykket: false });

    forespørsel.session.innloggetBruker = bruker;
    svar.json({ vellykket: true });
  });
});

app.get("/er-logget-inn", (forespørsel, svar) => {
  // brukes av nettsiden for å se om brukeren kan være inne
  if (forespørsel.session.innloggetBruker) {
    svar.json({ loggetInn: true, bruker: forespørsel.session.innloggetBruker });
  } else {
    svar.json({ loggetInn: false });
  }
});

app.post("/logg-ut", (forespørsel, svar) => {
  forespørsel.session.destroy();
  svar.json({ vellykket: true });
});

app.get("/brukere", (forespørsel, svar) => {
  // henter brukere sammen med rolle og klasse
  database.all(`
    SELECT Bruker.id, Bruker.navn, Bruker.email,
      COALESCE(Klasse.navn, 'Ingen klasse') AS klassenavn,
      Rolle.navn AS rollenavn
    FROM Bruker
    LEFT JOIN Rolle ON Bruker.rolle_id = Rolle.id
    LEFT JOIN Klasse ON Bruker.klasse_id = Klasse.id
  `, (feil, brukere) => {
    svar.json(brukere);
  });
});

app.get("/brukere/:id", (forespørsel, svar) => {
  const id = forespørsel.params.id;
  database.get(`
    SELECT Bruker.id, Bruker.navn, Bruker.email, Bruker.rolle_id, Bruker.klasse_id
    FROM Bruker WHERE Bruker.id = ?
  `, [id], (feil, bruker) => {
    svar.json(bruker);
  });
});

app.post("/brukere", (forespørsel, svar) => {
  // bare admin skal kunne lage nye brukere
  if (!erAdmin(forespørsel)) return svar.status(403).json({ feil: "Bare admin kan opprette brukere" });

  const { navn, email, passord, rolle_id, klasse_id } = forespørsel.body;
  const feil = validerBruker(forespørsel.body, true);
  if (feil) return svar.status(400).json({ feil });

  database.run(`
    INSERT INTO Bruker (navn, email, passord, rolle_id, klasse_id)
    VALUES (?, ?, ?, ?, ?)
  `, [navn, email, passord, rolle_id, klasse_id], () => {
    svar.json({ melding: "Bruker opprettet" });
  });
});

app.put("/brukere/:id", (forespørsel, svar) => {
  // bare admin skal kunne endre brukere
  if (!erAdmin(forespørsel)) return svar.status(403).json({ feil: "Bare admin kan redigere brukere" });

  const id = forespørsel.params.id;
  const { navn, email, passord, rolle_id, klasse_id } = forespørsel.body;
  const feil = validerBruker(forespørsel.body, false);
  if (feil) return svar.status(400).json({ feil });

  if (passord) {
    database.run(`
      UPDATE Bruker SET navn = ?, email = ?, passord = ?, rolle_id = ?, klasse_id = ?
      WHERE id = ?
    `, [navn, email, passord, rolle_id, klasse_id, id], () => {
      svar.json({ melding: "Bruker oppdatert" });
    });
  } else {
    database.run(`
      UPDATE Bruker SET navn = ?, email = ?, rolle_id = ?, klasse_id = ?
      WHERE id = ?
    `, [navn, email, rolle_id, klasse_id, id], () => {
      svar.json({ melding: "Bruker oppdatert" });
    });
  }
});

app.delete("/brukere/:id", (forespørsel, svar) => {
  // bare admin skal kunne slette brukere
  if (!erAdmin(forespørsel)) return svar.status(403).json({ feil: "Bare admin kan slette brukere" });

  const id = forespørsel.params.id;
  database.run("DELETE FROM Bruker WHERE id = ?", [id], () => {
    svar.json({ melding: "Bruker slettet" });
  });
});

app.listen(3003, () => {
  console.log("App kjører på http://localhost:3003");
});
