const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const økt = require("express-session");

const tjener = express();
const database = new sqlite3.Database("database/eksamen.db");

// ===== OPPSETT =====
tjener.use(express.static("public"));
tjener.use(express.json());
tjener.use(express.urlencoded({ extended: true }));

tjener.use(økt({
  secret: "hemmelig-nøkkel",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ===== LOGG INN =====
tjener.post("/login", (forespørsel, svar) => {
  const { email, passord } = forespørsel.body;

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

// ===== SJEKK OM BRUKER ER LOGGET INN =====
tjener.get("/er-logget-inn", (forespørsel, svar) => {
  if (forespørsel.session.innloggetBruker) {
    svar.json({ loggetInn: true, bruker: forespørsel.session.innloggetBruker });
  } else {
    svar.json({ loggetInn: false });
  }
});

// ===== LOGG UT =====
tjener.post("/logg-ut", (forespørsel, svar) => {
  forespørsel.session.destroy();
  svar.json({ vellykket: true });
});

// ===== HENT ALLE BRUKERE =====
tjener.get("/brukere", (forespørsel, svar) => {
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

// ===== HENT EN BRUKER =====
tjener.get("/brukere/:id", (forespørsel, svar) => {
  const id = forespørsel.params.id;

  database.get(`
    SELECT Bruker.id, Bruker.navn, Bruker.email, Bruker.rolle_id, Bruker.klasse_id
    FROM Bruker
    WHERE Bruker.id = ?
  `, [id], (feil, bruker) => {
    svar.json(bruker);
  });
});

// ===== OPPRETT BRUKER =====
tjener.post("/brukere", (forespørsel, svar) => {
  const erAdmin = forespørsel.session.innloggetBruker?.rolle_id === 4;
  if (!erAdmin) return svar.status(403).json({ feil: "Bare admin kan opprette brukere" });

  const { navn, email, passord, rolle_id, klasse_id } = forespørsel.body;

  database.run(`
    INSERT INTO Bruker (navn, email, passord, rolle_id, klasse_id)
    VALUES (?, ?, ?, ?, ?)
  `, [navn, email, passord, rolle_id, klasse_id], () => {
    svar.json({ melding: "Bruker opprettet" });
  });
});

// ===== OPPDATER BRUKER =====
tjener.put("/brukere/:id", (forespørsel, svar) => {
  const erAdmin = forespørsel.session.innloggetBruker?.rolle_id === 4;
  if (!erAdmin) return svar.status(403).json({ feil: "Bare admin kan redigere brukere" });

  const id = forespørsel.params.id;
  const { navn, email, passord, rolle_id, klasse_id } = forespørsel.body;

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

// ===== SLETT BRUKER =====
tjener.delete("/brukere/:id", (forespørsel, svar) => {
  const erAdmin = forespørsel.session.innloggetBruker?.rolle_id === 4;
  if (!erAdmin) return svar.status(403).json({ feil: "Bare admin kan slette brukere" });

  const id = forespørsel.params.id;

  database.run("DELETE FROM Bruker WHERE id = ?", [id], () => {
    svar.json({ melding: "Bruker slettet" });
  });
});

// ===== START TJENER =====
tjener.listen(3003, () => {
  console.log("Tjener kjører på http://localhost:3003");
});