let innloggetBruker = null;

// sjekker om brukeren er logget inn når siden åpnes
function sjekkOmBrukerErLoggetInn() {
  fetch("/er-logget-inn")
    .then(svar => svar.json())
    .then(data => {
      if (data.loggetInn) {
        innloggetBruker = data.bruker;
        document.body.classList.remove("skjult");
        document.getElementById("brukernavnVisning").textContent = innloggetBruker.navn;
        document.getElementById("rolleVisning").textContent = innloggetBruker.rollenavn;

        // admin får se skjemaet for å lage og endre brukere
        if (innloggetBruker.rolle_id === 4) {
          document.getElementById("adminPanel").classList.remove("skjult");
        }

        hentOgVisAlleBrukere();
      } else {
        window.location.href = "/login.html";
      }
    });
}

let brukerSomRedigeres = null;

// henter alle brukere og legger de inn på siden
function hentOgVisAlleBrukere() {
  fetch("/brukere")
    .then(svar => svar.json())
    .then(brukere => {
      const brukerListe = document.getElementById("brukerListe");
      brukerListe.innerHTML = "";

      brukere.forEach(bruker => {
        let knapper = "";

        // rediger og slett knappene skal bare vises for admin
        if (innloggetBruker.rolle_id === 4) {
          knapper = `
            <button onclick="klargjørRedigering(${bruker.id})">Rediger</button>
            <button onclick="slettBruker(${bruker.id})">Slett</button>
          `;
        }

        brukerListe.innerHTML += `
          <div class="brukerkort">
            <p>${bruker.navn} - ${bruker.email} - ${bruker.rollenavn} - ${bruker.klassenavn}</p>
            ${knapper}
          </div>
        `;
      });
    });
}

function klargjørRedigering(id) {
  brukerSomRedigeres = id;

  // henter en bruker og fyller inn skjemaet med dataen
  fetch(`/brukere/${id}`)
    .then(svar => svar.json())
    .then(bruker => {
      document.getElementById("navn").value = bruker.navn;
      document.getElementById("email").value = bruker.email;
      document.getElementById("rolle_id").value = bruker.rolle_id;
      document.getElementById("klasse_id").value = bruker.klasse_id || "";
      document.getElementById("sendKnapp").textContent = "Oppdater bruker";
    });
}

function slettBruker(id) {
  // sletter brukeren og oppdaterer listen etterpå
  fetch(`/brukere/${id}`, { method: "DELETE" })
    .then(() => hentOgVisAlleBrukere());
}

function loggUt() {
  fetch("/logg-ut", { method: "POST" })
    .then(() => window.location.href = "/login.html");
}

document.getElementById("brukerSkjema").addEventListener("submit", (hendelse) => {
  hendelse.preventDefault();

  // samler verdiene fra skjemaet
  const brukerData = {
    navn: document.getElementById("navn").value,
    email: document.getElementById("email").value,
    passord: document.getElementById("passord").value,
    rolle_id: document.getElementById("rolle_id").value,
    klasse_id: document.getElementById("klasse_id").value
  };

  const adresse = brukerSomRedigeres ? `/brukere/${brukerSomRedigeres}` : "/brukere";
  const metode = brukerSomRedigeres ? "PUT" : "POST";

  // sender dataen til serveren
  fetch(adresse, {
    method: metode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brukerData)
  })
    .then(svar => svar.json().then(data => ({ ok: svar.ok, data })))
    .then(resultat => {
      // hvis serveren sender feil vises den under skjemaet
      if (!resultat.ok) {
        document.getElementById("skjemaFeil").textContent = resultat.data.feil;
        return;
      }

      hentOgVisAlleBrukere();
      document.getElementById("brukerSkjema").reset();
      document.getElementById("sendKnapp").textContent = "Opprett bruker";
      document.getElementById("skjemaFeil").textContent = "";
      brukerSomRedigeres = null;
    });
});

sjekkOmBrukerErLoggetInn();
