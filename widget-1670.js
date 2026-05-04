// ╔══════════════════════════════════════════════════════════════╗
// ║   WIDGET "1670" — CYTAT DNIA                                 ║
// ║   Wersja: 2.0                                                ║
// ║   Repo: github.com/dany2289/cytaty-1670                      ║
// ║   Platforma: Scriptable (iOS)                                ║
// ╚══════════════════════════════════════════════════════════════╝
//
// Widget automatycznie pobiera najnowszą bazę cytatów z internetu.
// Wystarczy raz zainstalować — aktualizacje przychodzą same.

// ═══════════════════════════════════════════════════════════════
// KONFIGURACJA
// ═══════════════════════════════════════════════════════════════

const WERSJA = "2.0";

// URL do bazy cytatów (raw plik z GitHub repo)
const CYTATY_URL = "https://raw.githubusercontent.com/dany2289/cytaty-1670/main/cytaty-1670.json";

// Co ile godzin sprawdzać aktualizacje (domyślnie 6h)
const INTERWAL_AKTUALIZACJI_H = 6;

// ═══════════════════════════════════════════════════════════════
// FALLBACK — minimalna baza wbudowana w skrypt
// ═══════════════════════════════════════════════════════════════
// Używana jeśli nie ma internetu i nie ma cache'a.

const CYTATY_FALLBACK = [
  {
    quote: "Jestem szlachcic. A szlachcic to brzmi dumnie.",
    character: "Jan Paweł",
    season: 1, episode: 1, minute: "--:--"
  },
  {
    quote: "Demokracja to jest to, kiedy wszyscy się ze mną zgadzają.",
    character: "Jan Paweł",
    season: 1, episode: 6, minute: "--:--"
  },
  {
    quote: "Polska to najlepszy kraj na świecie. Wszyscy o tym wiedzą.",
    character: "Jan Paweł",
    season: 1, episode: 1, minute: "--:--"
  }
];

// ═══════════════════════════════════════════════════════════════
// POBIERANIE CYTATÓW + CACHE
// ═══════════════════════════════════════════════════════════════

const fm = FileManager.iCloud();
const sciezkaCache = fm.joinPath(fm.documentsDirectory(), "cytaty-1670-cache.json");
const sciezkaMeta  = fm.joinPath(fm.documentsDirectory(), "cytaty-1670-meta.json");

async function pobierzCytaty() {
  const teraz = new Date().getTime();
  let meta = { ostatniaAktualizacja: 0 };

  try {
    if (fm.fileExists(sciezkaMeta)) {
      meta = JSON.parse(fm.readString(sciezkaMeta));
    }
  } catch (e) {
    console.log("Błąd odczytu meta: " + e);
  }

  const minelo_h = (teraz - meta.ostatniaAktualizacja) / (1000 * 60 * 60);
  const trzebaAktualizowac = minelo_h >= INTERWAL_AKTUALIZACJI_H;

  if (trzebaAktualizowac) {
    try {
      const req = new Request(CYTATY_URL);
      req.timeoutInterval = 10;
      const noweCytaty = await req.loadJSON();

      if (Array.isArray(noweCytaty) && noweCytaty.length > 0 && noweCytaty[0].quote) {
        fm.writeString(sciezkaCache, JSON.stringify(noweCytaty));
        fm.writeString(sciezkaMeta, JSON.stringify({
          ostatniaAktualizacja: teraz,
          liczbaCytatow: noweCytaty.length
        }));
        console.log(`✓ Zaktualizowano: ${noweCytaty.length} cytatów`);
        return noweCytaty;
      }
    } catch (e) {
      console.log("✗ Nie udało się pobrać: " + e);
    }
  }

  try {
    if (fm.fileExists(sciezkaCache)) {
      if (!fm.isFileDownloaded(sciezkaCache)) {
        await fm.downloadFileFromiCloud(sciezkaCache);
      }
      const cache = JSON.parse(fm.readString(sciezkaCache));
      if (Array.isArray(cache) && cache.length > 0) {
        return cache;
      }
    }
  } catch (e) {
    console.log("Błąd odczytu cache: " + e);
  }

  console.log("⚠ Używam fallback (wbudowana baza)");
  return CYTATY_FALLBACK;
}

// ═══════════════════════════════════════════════════════════════
// WYBÓR CYTATU DNIA (deterministyczna rotacja)
// ═══════════════════════════════════════════════════════════════

function getCytatDnia(cytaty) {
  const teraz = new Date();
  const poczatekRoku = new Date(teraz.getFullYear(), 0, 0);
  const dzienRoku = Math.floor((teraz - poczatekRoku) / (1000 * 60 * 60 * 24));
  const indeks = dzienRoku % cytaty.length;
  return cytaty[indeks];
}

// ═══════════════════════════════════════════════════════════════
// PALETA KOLORÓW — vintage/sarmacka
// ═══════════════════════════════════════════════════════════════

const KOLORY = {
  tloCiemne:  new Color("#2a1f15"),
  tloJasne:   new Color("#3d2817"),
  zloto:      new Color("#c9a961"),
  zlotoJasne: new Color("#d4af37"),
  tekst:      new Color("#f0e6d2"),
  tekstPrzyt: new Color("#a89878")
};

// ═══════════════════════════════════════════════════════════════
// BUDOWA WIDGETU
// ═══════════════════════════════════════════════════════════════

function utworzWidget(cytat) {
  const widget = new ListWidget();
  const rozmiar = config.widgetFamily || "medium";

  const gradient = new LinearGradient();
  gradient.colors = [KOLORY.tloJasne, KOLORY.tloCiemne];
  gradient.locations = [0, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(1, 1);
  widget.backgroundGradient = gradient;

  widget.url = "nflx://";

  if (rozmiar === "small") {
    budujMaly(widget, cytat);
  } else if (rozmiar === "large") {
    budujDuzy(widget, cytat);
  } else {
    budujSredni(widget, cytat);
  }

  return widget;
}

function budujMaly(widget, cytat) {
  widget.setPadding(12, 12, 12, 12);

  const ozdobnik = widget.addText("❦");
  ozdobnik.font = Font.regularSystemFont(10);
  ozdobnik.textColor = KOLORY.zloto;
  ozdobnik.centerAlignText();

  widget.addSpacer(4);

  let tekstCytatu = cytat.quote;
  if (tekstCytatu.length > 80) {
    tekstCytatu = tekstCytatu.substring(0, 77) + "…";
  }

  const cytatTxt = widget.addText("„" + tekstCytatu + "”");
  cytatTxt.font = new Font("Georgia-Italic", 11);
  cytatTxt.textColor = KOLORY.tekst;
  cytatTxt.minimumScaleFactor = 0.7;

  widget.addSpacer();

  const sygnatura = widget.addText(`S${cytat.season}E${cytat.episode} · ${cytat.minute}`);
  sygnatura.font = new Font("Georgia", 9);
  sygnatura.textColor = KOLORY.zloto;
  sygnatura.centerAlignText();
}

function budujSredni(widget, cytat) {
  widget.setPadding(16, 18, 16, 18);

  const gora = widget.addStack();
  gora.layoutHorizontally();
  const ozdobnikGora = gora.addText("❦");
  ozdobnikGora.font = Font.regularSystemFont(12);
  ozdobnikGora.textColor = KOLORY.zloto;

  widget.addSpacer(6);

  const cytatTxt = widget.addText("„" + cytat.quote + "”");
  cytatTxt.font = new Font("Georgia-Italic", 14);
  cytatTxt.textColor = KOLORY.tekst;
  cytatTxt.minimumScaleFactor = 0.6;

  widget.addSpacer(6);

  const postac = widget.addText("— " + cytat.character.toUpperCase());
  postac.font = new Font("Georgia-Bold", 10);
  postac.textColor = KOLORY.zlotoJasne;

  widget.addSpacer();

  const stopka = widget.addStack();
  stopka.layoutHorizontally();

  const sygnatura = stopka.addText(`S${cytat.season}E${cytat.episode} · ${cytat.minute}`);
  sygnatura.font = new Font("Georgia", 10);
  sygnatura.textColor = KOLORY.tekstPrzyt;

  stopka.addSpacer();

  const ozdobnikStopka = stopka.addText("❦");
  ozdobnikStopka.font = Font.regularSystemFont(12);
  ozdobnikStopka.textColor = KOLORY.zloto;
}

function budujDuzy(widget, cytat) {
  widget.setPadding(24, 24, 24, 24);

  const goraStack = widget.addStack();
  goraStack.layoutHorizontally();
  goraStack.addSpacer();
  const ozdobnikGora = goraStack.addText("✦ ❦ ✦");
  ozdobnikGora.font = Font.regularSystemFont(14);
  ozdobnikGora.textColor = KOLORY.zloto;
  goraStack.addSpacer();

  widget.addSpacer(12);

  const tytul = widget.addText("CYTAT DNIA");
  tytul.font = new Font("Georgia-Bold", 11);
  tytul.textColor = KOLORY.tekstPrzyt;
  tytul.centerAlignText();

  widget.addSpacer(4);

  const podtytul = widget.addText("z serialu „1670”");
  podtytul.font = new Font("Georgia-Italic", 10);
  podtytul.textColor = KOLORY.tekstPrzyt;
  podtytul.centerAlignText();

  widget.addSpacer(20);

  const cytatTxt = widget.addText("„" + cytat.quote + "”");
  cytatTxt.font = new Font("Georgia-Italic", 18);
  cytatTxt.textColor = KOLORY.tekst;
  cytatTxt.centerAlignText();
  cytatTxt.minimumScaleFactor = 0.6;

  widget.addSpacer(16);

  const postac = widget.addText("— " + cytat.character.toUpperCase() + " —");
  postac.font = new Font("Georgia-Bold", 12);
  postac.textColor = KOLORY.zlotoJasne;
  postac.centerAlignText();

  widget.addSpacer();

  const stopka = widget.addStack();
  stopka.layoutHorizontally();
  stopka.addSpacer();

  const sygnatura = stopka.addText(`Sezon ${cytat.season} · Odcinek ${cytat.episode} · ${cytat.minute}`);
  sygnatura.font = new Font("Georgia", 11);
  sygnatura.textColor = KOLORY.zloto;

  stopka.addSpacer();

  widget.addSpacer(8);

  const dolStack = widget.addStack();
  dolStack.layoutHorizontally();
  dolStack.addSpacer();
  const ozdobnikDol = dolStack.addText("✦ ❦ ✦");
  ozdobnikDol.font = Font.regularSystemFont(14);
  ozdobnikDol.textColor = KOLORY.zloto;
  dolStack.addSpacer();
}

// ═══════════════════════════════════════════════════════════════
// URUCHOMIENIE
// ═══════════════════════════════════════════════════════════════

console.log(`Widget 1670 v${WERSJA} — startuje...`);

const cytaty = await pobierzCytaty();
console.log(`Załadowano ${cytaty.length} cytatów`);

const cytat = getCytatDnia(cytaty);
console.log(`Cytat dnia: ${cytat.character} (S${cytat.season}E${cytat.episode})`);

const widget = utworzWidget(cytat);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}

Script.complete();
