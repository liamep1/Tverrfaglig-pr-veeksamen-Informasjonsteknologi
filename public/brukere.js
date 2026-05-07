let innloggetBruker = null;

// ===== SJEKK OM BRUKER ER LOGGET INN =====
function sjekkOmBrukerErLoggetInn() {
  fetch("/er-logget-inn")
    .then(svar => svar.json())
    .then(data => {
      if (data.loggetInn) {
        innloggetBruker = data.bruker;
        document.body.classList.remove("skjult");
        document.getElementById("brukernavnVisning").textContent = innloggetBruker.navn;
        document.getElementById("rolleVisning").textContent = innloggetBruker.rollenavn;

        if (innloggetBruker.rolle_id === 4) {
          document.getElementById("adminPanel").classList.remove("skjult");
        }

        hentOgVisAlleBrukere();
      } else {
        window.location.href = "/login.html";
      }
    });
}

// ===== HENT OG VIS ALLE BRUKERE =====
let brukerSomRedigeres = null;

function hentOgVisAlleBrukere() {
  fetch("/brukere")
    .then(svar => svar.json())
    .then(brukere => {
      const brukerListe = document.getElementById("brukerListe");
      brukerListe.innerHTML = "";

      brukere.forEach(bruker => {
        let knapper = "";

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

// ===== KLARGJØR SKJEMA FOR REDIGERING =====
function klargjørRedigering(id) {
  brukerSomRedigeres = id;

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

// ===== SLETT BRUKER =====
function slettBruker(id) {
  fetch(`/brukere/${id}`, { method: "DELETE" })
    .then(() => hentOgVisAlleBrukere());
}

// ===== LOGG UT =====
function loggUt() {
  fetch("/logg-ut", { method: "POST" })
    .then(() => window.location.href = "/login.html");
}

// ===== OPPRETT ELLER OPPDATER BRUKER =====
document.getElementById("brukerSkjema").addEventListener("submit", (hendelse) => {
  hendelse.preventDefault();

  const brukerData = {
    navn: document.getElementById("navn").value,
    email: document.getElementById("email").value,
    passord: document.getElementById("passord").value,
    rolle_id: document.getElementById("rolle_id").value,
    klasse_id: document.getElementById("klasse_id").value
  };

  const adresse = brukerSomRedigeres ? `/brukere/${brukerSomRedigeres}` : "/brukere";
  const metode = brukerSomRedigeres ? "PUT" : "POST";

  fetch(adresse, {
    method: metode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brukerData)
  })
    .then(() => {
      hentOgVisAlleBrukere();
      document.getElementById("brukerSkjema").reset();
      document.getElementById("sendKnapp").textContent = "Opprett bruker";
      brukerSomRedigeres = null;
    });
});

sjekkOmBrukerErLoggetInn();