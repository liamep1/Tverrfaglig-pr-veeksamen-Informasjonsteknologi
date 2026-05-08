// fyller inn testbrukere så det går fort å teste innlogging
function fyllAdministrator() {
  document.getElementById("email").value = "per.admin@skole.no";
  document.getElementById("passord").value = "1234";
}

function fyllLærer() {
  document.getElementById("email").value = "kari.laerer@skole.no";
  document.getElementById("passord").value = "1234";
}

function fyllITAnsatt() {
  document.getElementById("email").value = "anne.it2@skole.no";
  document.getElementById("passord").value = "1234";
}

function fyllElev() {
  document.getElementById("email").value = "emma@skole.no";
  document.getElementById("passord").value = "1234";
}

function fyllMiljøarbeider() {
  document.getElementById("email").value = "morten.miljo@skole.no";
  document.getElementById("passord").value = "1234";
}

document.getElementById("loggInnSkjema").addEventListener("submit", (hendelse) => {
  hendelse.preventDefault();

  // henter email og passord fra skjemaet
  const email = document.getElementById("email").value;
  const passord = document.getElementById("passord").value;

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, passord })
  })
    .then(svar => svar.json())
    .then(data => {
      // hvis innloggingen funker sendes brukeren videre
      if (data.vellykket) {
        window.location.href = "/index.html";
      } else {
        document.getElementById("feilmelding").textContent = "Feil email eller passord";
      }
    });
});
