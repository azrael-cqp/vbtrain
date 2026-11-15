const {
  useState,
  useEffect,
  useRef
} = React;

/* ═══════════════════════════════════════════════════
   ANTRENAMENT VASILE — acasa, cu benzi, text mare
   ═══════════════════════════════════════════════════ */

/* ─── SCARA DE FONTURI (totul mare, pentru citit fara ochelari) ─── */
const F = {
  xs: 16,
  sm: 18,
  md: 21,
  lg: 24,
  xl: 28,
  xxl: 34,
  huge: 46
};

/* ─── STOCARE INDEXEDDB ─── */
const DB_NAME = "AntrenamentVasile_DB";
const STORE = "gamedata";
const DATA_KEY = "save";
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveToIDB(data) {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(data, DATA_KEY);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  } catch (e) {
    console.error("Salvare esuata", e);
    return false;
  }
}
async function loadFromIDB() {
  try {
    const db = await openDB();
    return new Promise(res => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(DATA_KEY);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    });
  } catch (e) {
    return null;
  }
}
const SAVE_FIELDS = ["level", "xp", "stats", "done", "doneEx", "doneW", "totalXp", "qC", "streak", "weightLog", "muscleXp", "lastDailyReset", "lastWeeklyReset", "penaltyLog", "liftLog", "vacation", "sleepLog", "workoutCalendar", "exerciseSwaps", "targetWeight", "startDate", "v2"];
const DEFAULT_STATE = {
  level: 1,
  xp: 0,
  stats: {
    STR: 5,
    VIT: 3,
    AGI: 3,
    INT: 2,
    PER: 2
  },
  done: [],
  doneEx: [],
  doneW: [],
  totalXp: 0,
  qC: 0,
  streak: 0,
  weightLog: [],
  muscleXp: {
    piept: 0,
    spate: 0,
    umeri: 0,
    biceps: 0,
    triceps: 0,
    cvadriceps: 0,
    ischio: 0,
    fesieri: 0,
    gambe: 0,
    abdomen: 0,
    cardio: 0
  },
  lastDailyReset: null,
  lastWeeklyReset: null,
  penaltyLog: [],
  liftLog: {},
  vacation: false,
  sleepLog: [],
  workoutCalendar: {},
  exerciseSwaps: {},
  targetWeight: null,
  startDate: null,
  v2: true
};

/* ─── RANGURI ─── */
const RANKS = [{
  name: "RANG E",
  min: 1,
  max: 5,
  color: "#94a3b8",
  desc: "Inceput. Fiecare zi conteaza."
}, {
  name: "RANG D",
  min: 6,
  max: 15,
  color: "#22d3ee",
  desc: "Corpul incepe sa se obisnuiasca."
}, {
  name: "RANG C",
  min: 16,
  max: 30,
  color: "#34d399",
  desc: "Obiceiul e format. Se vede."
}, {
  name: "RANG B",
  min: 31,
  max: 50,
  color: "#a78bfa",
  desc: "Mai puternic si mai usor."
}, {
  name: "RANG A",
  min: 51,
  max: 75,
  color: "#f59e0b",
  desc: "Alt om fata de ziua 1."
}, {
  name: "RANG S",
  min: 76,
  max: 100,
  color: "#ef4444",
  desc: "Disciplina de fier."
}, {
  name: "LEGENDA",
  min: 101,
  max: 999,
  color: "#ec4899",
  desc: "Nimic nu te mai opreste."
}];
function getRank(l) {
  for (let i = RANKS.length - 1; i >= 0; i--) if (l >= RANKS[i].min) return RANKS[i];
  return RANKS[0];
}
function getXp(l) {
  return Math.floor(100 * Math.pow(1.15, l - 1));
}
function getRankMultiplier(level) {
  if (level >= 101) return 4.0;
  if (level >= 76) return 3.0;
  if (level >= 51) return 2.5;
  if (level >= 31) return 2.0;
  if (level >= 16) return 1.5;
  if (level >= 6) return 1.2;
  return 1.0;
}
function getStreakMultiplier(streak) {
  if (streak >= 90) return 3.0;
  if (streak >= 30) return 2.0;
  if (streak >= 7) return 1.5;
  return 1.0;
}

/* ─── RANGURI PE GRUPA MUSCULARA ─── */
const MUSCLE_RANKS = [{
  name: "BRONZ",
  min: 0,
  color: "#d97706"
}, {
  name: "ARGINT",
  min: 30,
  color: "#cbd5e1"
}, {
  name: "AUR",
  min: 75,
  color: "#fbbf24"
}, {
  name: "PLATINA",
  min: 150,
  color: "#22d3ee"
}, {
  name: "DIAMANT",
  min: 250,
  color: "#a78bfa"
}, {
  name: "MAESTRU",
  min: 400,
  color: "#f472b6"
}, {
  name: "LEGENDA",
  min: 600,
  color: "#ef4444"
}];
function getMuscleRank(xp) {
  for (let i = MUSCLE_RANKS.length - 1; i >= 0; i--) if (xp >= MUSCLE_RANKS[i].min) return MUSCLE_RANKS[i];
  return MUSCLE_RANKS[0];
}
function getNextMuscleRank(xp) {
  for (let i = 0; i < MUSCLE_RANKS.length; i++) if (xp < MUSCLE_RANKS[i].min) return MUSCLE_RANKS[i];
  return null;
}
const MUSCLE_GROUPS = [{
  key: "piept",
  name: "Piept",
  icon: "🫁"
}, {
  key: "spate",
  name: "Spate",
  icon: "🔙"
}, {
  key: "umeri",
  name: "Umeri",
  icon: "🔺"
}, {
  key: "biceps",
  name: "Biceps",
  icon: "💪"
}, {
  key: "triceps",
  name: "Triceps",
  icon: "🔱"
}, {
  key: "cvadriceps",
  name: "Cvadriceps",
  icon: "🦵"
}, {
  key: "ischio",
  name: "Ischiogambieri",
  icon: "🦿"
}, {
  key: "fesieri",
  name: "Fesieri",
  icon: "🍑"
}, {
  key: "gambe",
  name: "Gambe",
  icon: "🦶"
}, {
  key: "abdomen",
  name: "Abdomen",
  icon: "🔥"
}, {
  key: "cardio",
  name: "Inima / Cardio",
  icon: "🫀"
}];

/* ─── ZILE ─── */
const DOW_RO = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
const DOW_SHORT = ["D", "L", "Ma", "Mi", "J", "V", "S"];

/* ─── SUNETE ─── */
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur, vol, wave) => {
      const o = ctx.createOscillator();
      const gg = ctx.createGain();
      o.connect(gg);
      gg.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = wave || "sine";
      gg.gain.setValueAtTime(0, ctx.currentTime + start);
      gg.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.04);
      gg.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    };
    if (type === "bifa") beep(800, 0, 0.2, 0.15);else if (type === "gata") {
      [523, 659, 784].forEach((f, i) => beep(f, i * 0.09, 0.5, 0.13, "triangle"));
    } else if (type === "intarziat") {
      [600, 400].forEach((f, i) => beep(f, i * 0.16, 0.15, 0.11, "square"));
    } else if (type === "nivel") {
      [261, 329, 392, 523].forEach((f, i) => beep(f, i * 0.11, 0.45, 0.15, "triangle"));
    }
  } catch (e) {
    console.warn("Audio indisponibil", e);
  }
}
/* ═══════════════════════════════════════════════════
   PROGRAM VASILE — acasa, cu benzi elastice.
   3 zile de forta pe tot corpul (L, Mi, V) + 2 zile
   usoare (Ma, J). Incepator, 64 de ani, recuperare
   cardiaca. Efort moderat, fara epuizare, fara apnee.
   ═══════════════════════════════════════════════════ */

const BENZI = ["Galbena", "Albastra", "Verde", "Neagra", "Rosie"];
const BENZI_KG = {"Galbena": "4,5 kg", "Albastra": "9 kg", "Verde": "13,5 kg", "Neagra": "18 kg", "Rosie": "22,5 kg"};
const REGULI = [
  "Inainte de antrenament masoara tensiunea. Peste limita stabilita cu cardiologul, sau daca nu te simti bine: astazi doar plimbare usoara.",
  "Efortul corect este «putin greu»: poti vorbi in propozitii intregi. Pulsul nu e un ghid bun, medicamentul il tine jos.",
  "Nu tine NICIODATA respiratia. Expiri cand impingi sau tragi, inspiri cand revii.",
  "Opreste seria cand mai puteai face inca 3-4 repetari corecte. Niciodata pana la epuizare.",
  "Miscari lente: 2 secunde la efort, 3 secunde la revenire. Banda nu se lasa sa traga inapoi brusc.",
  "Progresia: intai repetari in plus, apoi a treia serie, abia la final banda mai tare.",
  "Ancora se pune pe partea pe care usa se inchide spre tine, cu usa inchisa bine. Verifica banda de crapaturi inainte de fiecare antrenament.",
  "Tratamentul pentru sange te face sa te invinetesti usor: nu da drumul la maner cu banda intinsa.",
  "Ridica-te incet de pe scaun si dupa ce te-ai aplecat. Bea apa intre exercitii.",
  "Tine nitroglicerina si telefonul la indemana. Antreneaza-te la 1-2 ore dupa masa, nu pe stomacul plin.",
  "Daca nu te simti bine, sari peste antrenament. Nu pierzi nimic: aplicatia nu penalizeaza."
];
const STOP_SEMNE = [
  "Durere, apasare sau arsura in piept",
  "Durere care coboara in brat, in spate sau in maxilar",
  "Ameteala, vedere in ceata, greata, transpiratii reci",
  "Respiratie grea care nu se linisteste in 2-3 minute de repaus",
  "Batai neregulate sau foarte rapide ale inimii",
  "Durerea in piept nu trece cu repaus si nitroglicerina: suna la 112"
];
const PPL = {
  "1": {
    "day": "Luni",
    "type": "FORTA A",
    "short": "TOT CORPUL · BENZI",
    "color": "#ef4444",
    "icon": "🔴",
    "nota": "Prima zi de forta a saptamanii. In primele 4 saptamani faci 2 serii la fiecare exercitiu. A treia serie o adaugi abia din saptamana 5.",
    "exercises": [
      {
        "name": "Ridicari de pe scaun",
        "sets": "2-3 seturi × 8-12 repetari",
        "muscle": "Picioare",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 90,
        "cum": "Stai pe un scaun stabil, lipit de perete ca sa nu alunece. Talpile pe podea, la latimea umerilor. Bratele incrucisate pe piept sau intinse in fata. Te apleci putin in fata si te ridici in picioare impingand in calcaie, expirand. Te asezi inapoi lent, numarand pana la 3, fara sa te lasi sa cazi.",
        "lucreaza": "Coapsele si fesierii. Este miscarea de care ai nevoie zilnic: ridicat din pat, de pe scaun, urcat scari.",
        "atentie": "Genunchii merg in directia varfurilor, nu se strang spre interior. Dupa ultima repetare ramai in picioare cateva secunde inainte sa pleci - sa nu ametesti.",
        "usor": "Sprijina-te cu mainile de coapse sau de bratele scaunului. Sau pune o perna pe scaun ca sa fie mai inalt.",
        "repsOnly": true
      },
      {
        "name": "Impins cu banda din picioare",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 90,
        "cum": "Ancora prinsa in usa la inaltimea pieptului. Stai cu SPATELE la usa, cate un maner in fiecare mana, un picior in fata pentru echilibru. Mainile pornesc de langa piept. Impingi inainte pana aproape de intinderea coatelor, expirand. Revii lent, 3 secunde.",
        "lucreaza": "Pieptul, fata umarului si tricepsul.",
        "atentie": "Nu bloca coatele la capat. Nu te apleca in fata ca sa impingi - corpul sta drept. Incepe cu banda galbena.",
        "usor": "Fa un pas inapoi spre usa: banda e mai putin intinsa si e mai usor.",
        "band": true
      },
      {
        "name": "Ramat cu banda la usa",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 90,
        "cum": "Ancora in usa la inaltimea pieptului. Stai cu FATA la usa, bratele intinse, banda usor intinsa. Tragi manerele spre coaste, cu coatele pe langa corp, si strangi omoplatii o secunda. Expiri cand tragi. Revii lent, 3 secunde.",
        "lucreaza": "Spatele si bicepsul. Indreapta postura.",
        "atentie": "Umerii raman jos, nu se ridica spre urechi. Nu te lasa pe spate ca sa tragi. Incepe cu banda galbena sau albastra.",
        "usor": "Fa exercitiul asezat pe un scaun, cu fata la usa. Sau apropie-te de usa.",
        "band": true
      },
      {
        "name": "Departare laterala a piciorului",
        "sets": "2-3 seturi × 10-12 repetari pe picior",
        "muscle": "Fesieri",
        "groups": [
          "fesieri"
        ],
        "rest": 60,
        "cum": "Ancora prinsa JOS, sub usa. Cureaua de glezna pe piciorul din exterior, banda prinsa de ea. Stai cu lateralul spre usa si te tii cu mana de un scaun. Duci piciorul cu cureaua in lateral, cat poti fara sa apleci trunchiul, apoi revii lent.",
        "lucreaza": "Partea laterala a soldului. Stabilizeaza mersul si genunchii.",
        "atentie": "Trunchiul ramane drept, nu se inclina in partea opusa. Miscare mica si controlata. Banda galbena.",
        "usor": "Fa miscarea fara banda, doar cu greutatea piciorului.",
        "band": true
      },
      {
        "name": "Flexii de biceps cu banda",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Biceps",
        "groups": [
          "biceps"
        ],
        "rest": 75,
        "cum": "Calci pe mijlocul benzii cu UN picior, celalalt putin in spate. Cate un maner in fiecare mana, palmele in sus, coatele lipite de corp. Indoi coatele si aduci manerele spre umeri, expirand. Cobori lent, 3 secunde.",
        "lucreaza": "Bicepsul - fata bratului.",
        "atentie": "Coatele nu pleaca de langa corp. Fara balans din spate. Verifica sa fie banda bine sub talpa, incaltat, ca sa nu scape.",
        "usor": "Daca banda e prea scurta si trage tare de jos, foloseste un singur brat pe rand si tine manerul liber cu cealalta mana, mai sus.",
        "band": true
      },
      {
        "name": "Presa Pallof cu banda",
        "sets": "2-3 seturi × 8-10 repetari pe parte",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "cum": "Ancora in usa la inaltimea pieptului. Stai cu LATERALUL spre usa, la un pas distanta. Tii un singur maner cu ambele maini, lipit de piept. Impingi mainile drept in fata, tii 2 secunde fara sa lasi banda sa te roteasca spre usa, apoi revii la piept. Respiri normal tot timpul. Dupa ce termini repetarile, te intorci cu cealalta parte.",
        "lucreaza": "Abdomenul si muschii care tin coloana dreapta. Se face in picioare, fara nimic pe jos.",
        "atentie": "Nu tine respiratia in cele 2 secunde. Soldurile si umerii raman cu fata inainte. Banda galbena e de ajuns.",
        "usor": "Stai mai aproape de usa sau impinge mainile doar pana la jumatate.",
        "band": true
      },
      {
        "name": "Plimbare alerta 20 de minute",
        "sets": "1 serie × 20 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 10 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      }
    ]
  },
  "2": {
    "day": "Marti",
    "type": "MISCARE",
    "short": "MERS · MOBILITATE · ECHILIBRU",
    "color": "#22d3ee",
    "icon": "🔵",
    "nota": "Zi usoara. Muschii se refac dupa ziua de ieri, inima lucreaza.",
    "exercises": [
      {
        "name": "Plimbare alerta 30 de minute",
        "sets": "1 serie × 30 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 15 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      },
      {
        "name": "Mobilitate 8 minute",
        "sets": "1 serie × 8 minute",
        "muscle": "Mobilitate",
        "groups": [
          "umeri",
          "spate"
        ],
        "rest": 0,
        "cum": "Fiecare miscare lent, de 10 ori: 1) rotatii de umeri in fata si in spate; 2) asezat pe scaun, rotesti trunchiul stanga-dreapta cu mainile pe piept; 3) asezat, rotunjesti spatele si apoi il indrepti cu pieptul in fata; 4) in picioare, tinut de scaun, cercuri cu soldurile; 5) asezat, intinzi un genunchi si tragi varful spre tine, pe rand; 6) cercuri din glezne.",
        "lucreaza": "Articulatiile: umeri, coloana, solduri, glezne.",
        "atentie": "Nimic nu trebuie sa doara. Capul nu se da pe spate si nu se roteste repede - poate ameti.",
        "usor": "Fa doar primele trei miscari.",
        "repsOnly": true,
        "stat": "AGI"
      },
      {
        "name": "Echilibru intr-un picior",
        "sets": "3 seturi × 20-30 secunde",
        "muscle": "Echilibru",
        "groups": [
          "gambe",
          "fesieri"
        ],
        "rest": 45,
        "cum": "In picioare, langa un scaun sau langa blatul din bucatarie, cu o mana aproape de sprijin. Ridici un picior putin de la podea si stai asa, respirand normal. O serie inseamna ambele picioare, pe rand.",
        "lucreaza": "Echilibrul, glezna si soldul. Previne cazaturile.",
        "atentie": "Tine mana la cativa centimetri de sprijin, gata sa te prinzi. Nu inchide ochii.",
        "usor": "Tine doua degete pe scaun tot timpul.",
        "repsOnly": true,
        "stat": "AGI"
      },
      {
        "name": "Mers calcai-varf",
        "sets": "3 seturi × 10 pasi",
        "muscle": "Echilibru",
        "groups": [
          "gambe"
        ],
        "rest": 45,
        "cum": "De-a lungul unui perete sau al blatului din bucatarie. Mergi in linie dreapta punand calcaiul unui picior exact in fata varfului celuilalt, ca pe o sarma. 10 pasi dus, te intorci, 10 pasi inapoi.",
        "lucreaza": "Echilibrul in mers.",
        "atentie": "Mana aproape de perete. Priveste inainte, nu la picioare.",
        "usor": "Lasa un spatiu mic intre calcai si varf.",
        "repsOnly": true,
        "stat": "AGI"
      }
    ]
  },
  "3": {
    "day": "Miercuri",
    "type": "FORTA B",
    "short": "TOT CORPUL · BENZI",
    "color": "#f59e0b",
    "icon": "🟠",
    "nota": "A doua zi de forta. Exercitii diferite fata de luni, aceiasi muschi. In primele 4 saptamani faci 2 serii la fiecare exercitiu. A treia serie o adaugi abia din saptamana 5.",
    "exercises": [
      {
        "name": "Urcari pe treapta",
        "sets": "2-3 seturi × 8-10 repetari pe picior",
        "muscle": "Picioare",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 90,
        "cum": "La prima treapta a unei scari, cu mana pe balustrada. Pui tot piciorul drept pe treapta, te ridici impingand in calcai pana stai drept, apoi cobori lent cu acelasi picior ramas sus. Faci toate repetarile pe un picior, apoi schimbi.",
        "lucreaza": "Coapsele si fesierii, cate un picior pe rand. Ajuta direct la urcatul scarilor.",
        "atentie": "Tine mana pe balustrada tot timpul. Nu te impinge cu piciorul de jos. Genunchiul nu cade spre interior.",
        "usor": "Daca nu ai treapta sau e prea greu, fa ridicari de pe scaun.",
        "repsOnly": true
      },
      {
        "name": "Tras de sus cu banda, asezat",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 90,
        "cum": "Ancora prinsa SUS, deasupra usii. Te asezi pe un scaun cu fata la usa, la un pas distanta. Prinzi manerele cu bratele intinse in sus si in fata. Tragi coatele in jos si spre coaste, strangi omoplatii, expirand. Revii lent.",
        "lucreaza": "Spatele lat si bicepsul.",
        "atentie": "Nu te lasa pe spate. Bratele nu stau mult timp ridicate deasupra capului - intre serii le lasi jos. Banda galbena sau albastra.",
        "usor": "Apropie scaunul de usa.",
        "band": true
      },
      {
        "name": "Flotari la perete",
        "sets": "2-3 seturi × 8-12 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 90,
        "cum": "In picioare, la un pas mare de perete. Palmele pe perete la inaltimea umerilor, putin mai late decat umerii. Indoi coatele si apropii pieptul de perete in 3 secunde, apoi impingi inapoi expirand. Corpul ramane drept ca o scandura.",
        "lucreaza": "Pieptul, umerii si tricepsul.",
        "atentie": "Fundul nu ramane in urma si salele nu se lasa. Talpile nu aluneca - fa-le incaltat sau descult, nu in sosete.",
        "usor": "Stai mai aproape de perete.",
        "repsOnly": true
      },
      {
        "name": "Extensie de sold in picioare",
        "sets": "2-3 seturi × 10-12 repetari pe picior",
        "muscle": "Fesieri",
        "groups": [
          "fesieri",
          "ischio"
        ],
        "rest": 60,
        "cum": "Ancora prinsa JOS, sub usa. Cureaua pe glezna, banda prinsa de ea. Stai cu FATA la usa si te tii cu mainile de un scaun. Duci piciorul cu cureaua drept in spate, cu genunchiul aproape intins, strangi fesa o secunda, revii lent.",
        "lucreaza": "Fesierii si spatele coapsei.",
        "atentie": "Nu arcui salele si nu te apleca in fata. Miscarea e mica: vine din sold, nu din spate. Banda galbena.",
        "usor": "Fa miscarea fara banda.",
        "band": true
      },
      {
        "name": "Tragere spre fata cu banda",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Umeri spate",
        "groups": [
          "umeri",
          "spate"
        ],
        "rest": 75,
        "cum": "Ancora in usa la inaltimea fetei. Stai cu fata la usa, cate un maner in fiecare mana, bratele intinse. Tragi manerele spre fata, cu coatele sus si in lateral, pana mainile ajung langa urechi. Strangi omoplatii o secunda, revii lent.",
        "lucreaza": "Spatele umarului si muschii dintre omoplati. Cel mai bun exercitiu pentru postura.",
        "atentie": "Banda galbena. Nu impinge capul in fata. Nu trage cu smucitura.",
        "usor": "Apropie-te de usa.",
        "band": true
      },
      {
        "name": "Extensii de triceps cu banda",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Triceps",
        "groups": [
          "triceps"
        ],
        "rest": 75,
        "cum": "Ancora prinsa SUS, deasupra usii. Stai cu fata la usa, cate un maner in fiecare mana, coatele indoite si lipite de corp. Impingi mainile in jos pana intinzi bratele, strangi o secunda, revii lent pana la nivelul pieptului.",
        "lucreaza": "Tricepsul - spatele bratului.",
        "atentie": "Coatele stau lipite de corp si nu se misca. Nu te apleca peste banda.",
        "usor": "Apropie-te de usa sau foloseste banda galbena.",
        "band": true
      },
      {
        "name": "Ridicari pe varfuri",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Gambe",
        "groups": [
          "gambe"
        ],
        "rest": 60,
        "cum": "In picioare, cu mainile pe spatarul unui scaun. Te ridici lent pe varfuri, tii o secunda sus, cobori lent, 3 secunde.",
        "lucreaza": "Gambele. Ajuta la mers si la circulatia din picioare.",
        "atentie": "Nu te lasa in fata peste scaun. Miscare lenta, fara saltat.",
        "usor": "Fa-le asezat pe scaun, ridicand doar calcaiele.",
        "repsOnly": true
      },
      {
        "name": "Plimbare alerta 20 de minute",
        "sets": "1 serie × 20 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 10 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      }
    ]
  },
  "4": {
    "day": "Joi",
    "type": "MISCARE",
    "short": "MERS · IZOMETRIE · ECHILIBRU",
    "color": "#22d3ee",
    "icon": "🔵",
    "nota": "Zi usoara, cu exercitiile de izometrie pe care le stii deja.",
    "exercises": [
      {
        "name": "Plimbare alerta 30 de minute",
        "sets": "1 serie × 30 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 15 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      },
      {
        "name": "Presiunea palmelor",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun, spatele drept. Unesti palmele in fata pieptului, coatele in lateral. Impingi o palma in cealalta cu forta moderata si numeri secundele CU VOCE TARE.",
        "lucreaza": "Pieptul si bratele. Exercitiu pe care il stii deja.",
        "atentie": "Daca numeri cu voce tare, nu poti tine respiratia. Fara incordat gatul si fara rosit la fata.",
        "usor": "Impinge mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Carligul",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun. Indoi degetele ambelor maini si le prinzi una in alta, ca doua carlige, in fata pieptului. Tragi in directii opuse, fara sa cedeze, numarand CU VOCE TARE.",
        "lucreaza": "Spatele si bicepsul. Exercitiu pe care il stii deja.",
        "atentie": "Umerii jos, nu ridicati spre urechi. Forta moderata, nu maxima.",
        "usor": "Trage mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Sezut la perete",
        "sets": "3 seturi × 15-20 secunde",
        "muscle": "Picioare",
        "groups": [
          "cvadriceps"
        ],
        "rest": 60,
        "cum": "Cu spatele lipit de perete, talpile la un pas in fata. Aluneci in jos pana cand genunchii sunt indoiti putin - NU pana la unghi drept. Stai asa si numeri CU VOCE TARE. Te ridici impingand in calcaie.",
        "lucreaza": "Coapsele, fara miscare in genunchi.",
        "atentie": "Numara cu voce tare ca sa nu tii respiratia. Cu cat cobori mai putin, cu atat e mai usor. Opresti daca te dor genunchii.",
        "usor": "Coboara doar cativa centimetri si tine 10 secunde.",
        "repsOnly": true
      },
      {
        "name": "Echilibru intr-un picior",
        "sets": "3 seturi × 20-30 secunde",
        "muscle": "Echilibru",
        "groups": [
          "gambe",
          "fesieri"
        ],
        "rest": 45,
        "cum": "In picioare, langa un scaun sau langa blatul din bucatarie, cu o mana aproape de sprijin. Ridici un picior putin de la podea si stai asa, respirand normal. O serie inseamna ambele picioare, pe rand.",
        "lucreaza": "Echilibrul, glezna si soldul. Previne cazaturile.",
        "atentie": "Tine mana la cativa centimetri de sprijin, gata sa te prinzi. Nu inchide ochii.",
        "usor": "Tine doua degete pe scaun tot timpul.",
        "repsOnly": true,
        "stat": "AGI"
      }
    ]
  },
  "5": {
    "day": "Vineri",
    "type": "FORTA C",
    "short": "TOT CORPUL · BENZI",
    "color": "#22c55e",
    "icon": "🟢",
    "nota": "Ultima zi de forta. Dupa ea urmeaza doua zile libere. In primele 4 saptamani faci 2 serii la fiecare exercitiu. A treia serie o adaugi abia din saptamana 5.",
    "exercises": [
      {
        "name": "Ridicari de pe scaun",
        "sets": "2-3 seturi × 8-12 repetari",
        "muscle": "Picioare",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 90,
        "cum": "Stai pe un scaun stabil, lipit de perete ca sa nu alunece. Talpile pe podea, la latimea umerilor. Bratele incrucisate pe piept sau intinse in fata. Te apleci putin in fata si te ridici in picioare impingand in calcaie, expirand. Te asezi inapoi lent, numarand pana la 3, fara sa te lasi sa cazi.",
        "lucreaza": "Coapsele si fesierii. Este miscarea de care ai nevoie zilnic: ridicat din pat, de pe scaun, urcat scari.",
        "atentie": "Genunchii merg in directia varfurilor, nu se strang spre interior. Dupa ultima repetare ramai in picioare cateva secunde inainte sa pleci - sa nu ametesti.",
        "usor": "Sprijina-te cu mainile de coapse sau de bratele scaunului. Sau pune o perna pe scaun ca sa fie mai inalt.",
        "repsOnly": true
      },
      {
        "name": "Ramat cu banda la usa",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 90,
        "cum": "Ancora in usa la inaltimea pieptului. Stai cu FATA la usa, bratele intinse, banda usor intinsa. Tragi manerele spre coaste, cu coatele pe langa corp, si strangi omoplatii o secunda. Expiri cand tragi. Revii lent, 3 secunde.",
        "lucreaza": "Spatele si bicepsul. Indreapta postura.",
        "atentie": "Umerii raman jos, nu se ridica spre urechi. Nu te lasa pe spate ca sa tragi. Incepe cu banda galbena sau albastra.",
        "usor": "Fa exercitiul asezat pe un scaun, cu fata la usa. Sau apropie-te de usa.",
        "band": true
      },
      {
        "name": "Impins cu banda din picioare",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 90,
        "cum": "Ancora prinsa in usa la inaltimea pieptului. Stai cu SPATELE la usa, cate un maner in fiecare mana, un picior in fata pentru echilibru. Mainile pornesc de langa piept. Impingi inainte pana aproape de intinderea coatelor, expirand. Revii lent, 3 secunde.",
        "lucreaza": "Pieptul, fata umarului si tricepsul.",
        "atentie": "Nu bloca coatele la capat. Nu te apleca in fata ca sa impingi - corpul sta drept. Incepe cu banda galbena.",
        "usor": "Fa un pas inapoi spre usa: banda e mai putin intinsa si e mai usor.",
        "band": true
      },
      {
        "name": "Flexie de genunchi in picioare",
        "sets": "2-3 seturi × 10-12 repetari pe picior",
        "muscle": "Spate coapsa",
        "groups": [
          "ischio"
        ],
        "rest": 60,
        "cum": "Ancora prinsa JOS, sub usa. Cureaua pe glezna, banda prinsa de ea. Stai cu FATA la usa si te tii de un scaun. Indoi genunchiul si duci calcaiul spre fesa, fara sa misti coapsa. Revii lent.",
        "lucreaza": "Spatele coapsei.",
        "atentie": "Coapsa ramane pe loc, lucreaza doar genunchiul. Daca apare carcel, te opresti si intinzi piciorul. Banda galbena.",
        "usor": "Fa miscarea fara banda.",
        "band": true
      },
      {
        "name": "Ridicari laterale cu banda",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Umeri",
        "groups": [
          "umeri"
        ],
        "rest": 75,
        "cum": "Calci pe mijlocul benzii cu un picior. Cate un maner in fiecare mana, bratele pe langa corp. Ridici bratele in lateral, cu coatele putin indoite, DOAR pana la nivelul umerilor. Cobori lent, 3 secunde.",
        "lucreaza": "Partea laterala a umarului.",
        "atentie": "Niciodata mai sus de umeri. Fara balans din corp. Doar banda galbena - aici e de ajuns pentru multa vreme.",
        "usor": "Ridica un singur brat pe rand, sau doar pana la jumatate.",
        "band": true
      },
      {
        "name": "Presa Pallof cu banda",
        "sets": "2-3 seturi × 8-10 repetari pe parte",
        "muscle": "Abdomen",
        "groups": [
          "abdomen"
        ],
        "rest": 60,
        "cum": "Ancora in usa la inaltimea pieptului. Stai cu LATERALUL spre usa, la un pas distanta. Tii un singur maner cu ambele maini, lipit de piept. Impingi mainile drept in fata, tii 2 secunde fara sa lasi banda sa te roteasca spre usa, apoi revii la piept. Respiri normal tot timpul. Dupa ce termini repetarile, te intorci cu cealalta parte.",
        "lucreaza": "Abdomenul si muschii care tin coloana dreapta. Se face in picioare, fara nimic pe jos.",
        "atentie": "Nu tine respiratia in cele 2 secunde. Soldurile si umerii raman cu fata inainte. Banda galbena e de ajuns.",
        "usor": "Stai mai aproape de usa sau impinge mainile doar pana la jumatate.",
        "band": true
      },
      {
        "name": "Plimbare alerta 20 de minute",
        "sets": "1 serie × 20 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 10 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      }
    ]
  },
  "6": {
    "day": "Sambata",
    "type": "ODIHNA",
    "short": "ZI LIBERA",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera. Fara exercitii. O plimbare linistita e binevenita. Odihna e parte din program.",
    "exercises": []
  },
  "0": {
    "day": "Duminica",
    "type": "ODIHNA",
    "short": "ZI LIBERA",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera. Fara exercitii. O plimbare linistita e binevenita. Odihna e parte din program.",
    "exercises": []
  }
};
const ALT = {
  "Ridicari de pe scaun": [
    "Urcari pe treapta",
    "Sezut la perete",
    "Ridicari de pe scaun cu sprijin pe maini"
  ],
  "Impins cu banda din picioare": [
    "Flotari la perete",
    "Impins cu banda, asezat pe scaun",
    "Presiunea palmelor"
  ],
  "Ramat cu banda la usa": [
    "Ramat cu banda, asezat pe scaun",
    "Tras de sus cu banda, asezat",
    "Carligul"
  ],
  "Departare laterala a piciorului": [
    "Departare laterala fara banda",
    "Extensie de sold in picioare"
  ],
  "Flexii de biceps cu banda": [
    "Flexii cu un singur brat",
    "Carligul"
  ],
  "Presa Pallof cu banda": [
    "Mers pe loc cu genunchii ridicati, tinut de scaun",
    "Echilibru intr-un picior"
  ],
  "Urcari pe treapta": [
    "Ridicari de pe scaun",
    "Sezut la perete"
  ],
  "Tras de sus cu banda, asezat": [
    "Ramat cu banda la usa",
    "Carligul"
  ],
  "Flotari la perete": [
    "Impins cu banda din picioare",
    "Flotari cu mainile pe blatul din bucatarie",
    "Presiunea palmelor"
  ],
  "Extensie de sold in picioare": [
    "Extensie de sold fara banda",
    "Departare laterala a piciorului"
  ],
  "Tragere spre fata cu banda": [
    "Ramat cu banda la usa",
    "Desfacerea bratelor in lateral, fara banda"
  ],
  "Extensii de triceps cu banda": [
    "Flotari la perete cu mainile apropiate",
    "Presiunea palmelor"
  ],
  "Ridicari pe varfuri": [
    "Ridicari pe varfuri asezat",
    "Mers pe varfuri 20 de pasi, langa perete"
  ],
  "Flexie de genunchi in picioare": [
    "Flexie de genunchi fara banda",
    "Extensie de sold in picioare"
  ],
  "Ridicari laterale cu banda": [
    "Ridicari laterale fara banda",
    "Tragere spre fata cu banda"
  ],
  "Plimbare alerta 20 de minute": [
    "Doua plimbari de cate 10 minute",
    "Mers pe loc in casa, 15 minute",
    "Bicicleta de camera, usor, 20 de minute"
  ],
  "Plimbare alerta 30 de minute": [
    "Doua plimbari de cate 15 minute",
    "Bicicleta de camera, usor, 25 de minute"
  ],
  "Mobilitate 8 minute": [
    "Plimbare lenta 10 minute"
  ],
  "Echilibru intr-un picior": [
    "Mers calcai-varf",
    "Stat cu picioarele unul in fata celuilalt, 30 de secunde"
  ],
  "Mers calcai-varf": [
    "Echilibru intr-un picior"
  ],
  "Presiunea palmelor": [
    "Flotari la perete"
  ],
  "Carligul": [
    "Ramat cu banda la usa"
  ],
  "Sezut la perete": [
    "Ridicari de pe scaun"
  ]
};
const INCALZIRE = {
  "FORTA A": {
    "titlu": "Incalzire 6-8 minute — zi de forta",
    "pasi": [
      "Masoara tensiunea. Daca e peste limita stabilita cu cardiologul sau nu te simti bine, astazi faci doar o plimbare usoara.",
      "3-4 minute mers prin casa sau mers pe loc, in ritm lejer",
      "10 rotatii lente de umeri in fata, 10 in spate",
      "10 cercuri cu soldurile, tinut de scaun",
      "8 ridicari de pe scaun, lent, fara graba",
      "Verifica banda (fara crapaturi), carabinele si ancora din usa. Usa inchisa bine, de preferat incuiata."
    ]
  },
  "FORTA B": {
    "titlu": "Incalzire 6-8 minute — zi de forta",
    "pasi": [
      "Masoara tensiunea. Daca e peste limita stabilita cu cardiologul sau nu te simti bine, astazi faci doar o plimbare usoara.",
      "3-4 minute mers prin casa sau mers pe loc, in ritm lejer",
      "10 rotatii lente de umeri in fata, 10 in spate",
      "10 cercuri cu soldurile, tinut de scaun",
      "8 ridicari de pe scaun, lent, fara graba",
      "Verifica banda (fara crapaturi), carabinele si ancora din usa. Usa inchisa bine, de preferat incuiata."
    ]
  },
  "FORTA C": {
    "titlu": "Incalzire 6-8 minute — zi de forta",
    "pasi": [
      "Masoara tensiunea. Daca e peste limita stabilita cu cardiologul sau nu te simti bine, astazi faci doar o plimbare usoara.",
      "3-4 minute mers prin casa sau mers pe loc, in ritm lejer",
      "10 rotatii lente de umeri in fata, 10 in spate",
      "10 cercuri cu soldurile, tinut de scaun",
      "8 ridicari de pe scaun, lent, fara graba",
      "Verifica banda (fara crapaturi), carabinele si ancora din usa. Usa inchisa bine, de preferat incuiata."
    ]
  },
  "FARA BENZI": {
    "titlu": "Incalzire 6-8 minute — zi de forta",
    "pasi": [
      "Masoara tensiunea. Daca e peste limita stabilita cu cardiologul sau nu te simti bine, astazi faci doar o plimbare usoara.",
      "3-4 minute mers prin casa sau mers pe loc, in ritm lejer",
      "10 rotatii lente de umeri in fata, 10 in spate",
      "10 cercuri cu soldurile, tinut de scaun",
      "8 ridicari de pe scaun, lent, fara graba",
      "Verifica banda (fara crapaturi), carabinele si ancora din usa. Usa inchisa bine, de preferat incuiata."
    ]
  },
  "MISCARE": {
    "titlu": "Inainte de plimbare",
    "pasi": [
      "Masoara tensiunea. Daca e peste limita stabilita cu cardiologul sau nu te simti bine, astazi stai linistit.",
      "Incaltaminte comoda, apa la tine, telefonul in buzunar",
      "Primele 3 minute mergi incet, apoi cresti ritmul"
    ]
  }
};
const RELAXARE = {
  "titlu": "Relaxare 5 minute — dupa fiecare antrenament",
  "pasi": [
    "2-3 minute mers lent prin casa, pana se linisteste respiratia",
    "Intindere piept la tocul usii: 20-30 de secunde pe fiecare parte",
    "Intindere gamba la perete: 20-30 de secunde pe picior",
    "Asezat pe scaun, intinzi un picior in fata si te apleci usor spre el: 20-30 de secunde pe picior",
    "10 respiratii adanci, pe nas, cu expiratie lunga",
    "Bea un pahar cu apa. Ridica-te incet de pe scaun."
  ]
};
const ACASA = {
  "1": {
    "day": "Luni",
    "type": "FARA BENZI",
    "short": "TOT CORPUL · FARA BENZI",
    "color": "#ef4444",
    "icon": "🔴",
    "nota": "Fara benzi: doar greutatea corpului si izometrie. Acelasi ritm, intensitate mai mica.",
    "exercises": [
      {
        "name": "Ridicari de pe scaun",
        "sets": "2-3 seturi × 8-12 repetari",
        "muscle": "Picioare",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 90,
        "cum": "Stai pe un scaun stabil, lipit de perete ca sa nu alunece. Talpile pe podea, la latimea umerilor. Bratele incrucisate pe piept sau intinse in fata. Te apleci putin in fata si te ridici in picioare impingand in calcaie, expirand. Te asezi inapoi lent, numarand pana la 3, fara sa te lasi sa cazi.",
        "lucreaza": "Coapsele si fesierii. Este miscarea de care ai nevoie zilnic: ridicat din pat, de pe scaun, urcat scari.",
        "atentie": "Genunchii merg in directia varfurilor, nu se strang spre interior. Dupa ultima repetare ramai in picioare cateva secunde inainte sa pleci - sa nu ametesti.",
        "usor": "Sprijina-te cu mainile de coapse sau de bratele scaunului. Sau pune o perna pe scaun ca sa fie mai inalt.",
        "repsOnly": true
      },
      {
        "name": "Flotari la perete",
        "sets": "2-3 seturi × 8-12 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 90,
        "cum": "In picioare, la un pas mare de perete. Palmele pe perete la inaltimea umerilor, putin mai late decat umerii. Indoi coatele si apropii pieptul de perete in 3 secunde, apoi impingi inapoi expirand. Corpul ramane drept ca o scandura.",
        "lucreaza": "Pieptul, umerii si tricepsul.",
        "atentie": "Fundul nu ramane in urma si salele nu se lasa. Talpile nu aluneca - fa-le incaltat sau descult, nu in sosete.",
        "usor": "Stai mai aproape de perete.",
        "repsOnly": true
      },
      {
        "name": "Carligul",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun. Indoi degetele ambelor maini si le prinzi una in alta, ca doua carlige, in fata pieptului. Tragi in directii opuse, fara sa cedeze, numarand CU VOCE TARE.",
        "lucreaza": "Spatele si bicepsul. Exercitiu pe care il stii deja.",
        "atentie": "Umerii jos, nu ridicati spre urechi. Forta moderata, nu maxima.",
        "usor": "Trage mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Presiunea palmelor",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun, spatele drept. Unesti palmele in fata pieptului, coatele in lateral. Impingi o palma in cealalta cu forta moderata si numeri secundele CU VOCE TARE.",
        "lucreaza": "Pieptul si bratele. Exercitiu pe care il stii deja.",
        "atentie": "Daca numeri cu voce tare, nu poti tine respiratia. Fara incordat gatul si fara rosit la fata.",
        "usor": "Impinge mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Ridicari pe varfuri",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Gambe",
        "groups": [
          "gambe"
        ],
        "rest": 60,
        "cum": "In picioare, cu mainile pe spatarul unui scaun. Te ridici lent pe varfuri, tii o secunda sus, cobori lent, 3 secunde.",
        "lucreaza": "Gambele. Ajuta la mers si la circulatia din picioare.",
        "atentie": "Nu te lasa in fata peste scaun. Miscare lenta, fara saltat.",
        "usor": "Fa-le asezat pe scaun, ridicand doar calcaiele.",
        "repsOnly": true
      },
      {
        "name": "Plimbare alerta 20 de minute",
        "sets": "1 serie × 20 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 10 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      }
    ]
  },
  "2": {
    "day": "Marti",
    "type": "MISCARE",
    "short": "MERS · MOBILITATE · ECHILIBRU",
    "color": "#22d3ee",
    "icon": "🔵",
    "nota": "Zi usoara. Muschii se refac dupa ziua de ieri, inima lucreaza.",
    "exercises": [
      {
        "name": "Plimbare alerta 30 de minute",
        "sets": "1 serie × 30 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 15 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      },
      {
        "name": "Mobilitate 8 minute",
        "sets": "1 serie × 8 minute",
        "muscle": "Mobilitate",
        "groups": [
          "umeri",
          "spate"
        ],
        "rest": 0,
        "cum": "Fiecare miscare lent, de 10 ori: 1) rotatii de umeri in fata si in spate; 2) asezat pe scaun, rotesti trunchiul stanga-dreapta cu mainile pe piept; 3) asezat, rotunjesti spatele si apoi il indrepti cu pieptul in fata; 4) in picioare, tinut de scaun, cercuri cu soldurile; 5) asezat, intinzi un genunchi si tragi varful spre tine, pe rand; 6) cercuri din glezne.",
        "lucreaza": "Articulatiile: umeri, coloana, solduri, glezne.",
        "atentie": "Nimic nu trebuie sa doara. Capul nu se da pe spate si nu se roteste repede - poate ameti.",
        "usor": "Fa doar primele trei miscari.",
        "repsOnly": true,
        "stat": "AGI"
      },
      {
        "name": "Echilibru intr-un picior",
        "sets": "3 seturi × 20-30 secunde",
        "muscle": "Echilibru",
        "groups": [
          "gambe",
          "fesieri"
        ],
        "rest": 45,
        "cum": "In picioare, langa un scaun sau langa blatul din bucatarie, cu o mana aproape de sprijin. Ridici un picior putin de la podea si stai asa, respirand normal. O serie inseamna ambele picioare, pe rand.",
        "lucreaza": "Echilibrul, glezna si soldul. Previne cazaturile.",
        "atentie": "Tine mana la cativa centimetri de sprijin, gata sa te prinzi. Nu inchide ochii.",
        "usor": "Tine doua degete pe scaun tot timpul.",
        "repsOnly": true,
        "stat": "AGI"
      },
      {
        "name": "Mers calcai-varf",
        "sets": "3 seturi × 10 pasi",
        "muscle": "Echilibru",
        "groups": [
          "gambe"
        ],
        "rest": 45,
        "cum": "De-a lungul unui perete sau al blatului din bucatarie. Mergi in linie dreapta punand calcaiul unui picior exact in fata varfului celuilalt, ca pe o sarma. 10 pasi dus, te intorci, 10 pasi inapoi.",
        "lucreaza": "Echilibrul in mers.",
        "atentie": "Mana aproape de perete. Priveste inainte, nu la picioare.",
        "usor": "Lasa un spatiu mic intre calcai si varf.",
        "repsOnly": true,
        "stat": "AGI"
      }
    ]
  },
  "3": {
    "day": "Miercuri",
    "type": "FARA BENZI",
    "short": "TOT CORPUL · FARA BENZI",
    "color": "#f59e0b",
    "icon": "🟠",
    "nota": "Fara benzi: doar greutatea corpului si izometrie. Acelasi ritm, intensitate mai mica.",
    "exercises": [
      {
        "name": "Ridicari de pe scaun",
        "sets": "2-3 seturi × 8-12 repetari",
        "muscle": "Picioare",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 90,
        "cum": "Stai pe un scaun stabil, lipit de perete ca sa nu alunece. Talpile pe podea, la latimea umerilor. Bratele incrucisate pe piept sau intinse in fata. Te apleci putin in fata si te ridici in picioare impingand in calcaie, expirand. Te asezi inapoi lent, numarand pana la 3, fara sa te lasi sa cazi.",
        "lucreaza": "Coapsele si fesierii. Este miscarea de care ai nevoie zilnic: ridicat din pat, de pe scaun, urcat scari.",
        "atentie": "Genunchii merg in directia varfurilor, nu se strang spre interior. Dupa ultima repetare ramai in picioare cateva secunde inainte sa pleci - sa nu ametesti.",
        "usor": "Sprijina-te cu mainile de coapse sau de bratele scaunului. Sau pune o perna pe scaun ca sa fie mai inalt.",
        "repsOnly": true
      },
      {
        "name": "Flotari la perete",
        "sets": "2-3 seturi × 8-12 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 90,
        "cum": "In picioare, la un pas mare de perete. Palmele pe perete la inaltimea umerilor, putin mai late decat umerii. Indoi coatele si apropii pieptul de perete in 3 secunde, apoi impingi inapoi expirand. Corpul ramane drept ca o scandura.",
        "lucreaza": "Pieptul, umerii si tricepsul.",
        "atentie": "Fundul nu ramane in urma si salele nu se lasa. Talpile nu aluneca - fa-le incaltat sau descult, nu in sosete.",
        "usor": "Stai mai aproape de perete.",
        "repsOnly": true
      },
      {
        "name": "Carligul",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun. Indoi degetele ambelor maini si le prinzi una in alta, ca doua carlige, in fata pieptului. Tragi in directii opuse, fara sa cedeze, numarand CU VOCE TARE.",
        "lucreaza": "Spatele si bicepsul. Exercitiu pe care il stii deja.",
        "atentie": "Umerii jos, nu ridicati spre urechi. Forta moderata, nu maxima.",
        "usor": "Trage mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Presiunea palmelor",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun, spatele drept. Unesti palmele in fata pieptului, coatele in lateral. Impingi o palma in cealalta cu forta moderata si numeri secundele CU VOCE TARE.",
        "lucreaza": "Pieptul si bratele. Exercitiu pe care il stii deja.",
        "atentie": "Daca numeri cu voce tare, nu poti tine respiratia. Fara incordat gatul si fara rosit la fata.",
        "usor": "Impinge mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Ridicari pe varfuri",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Gambe",
        "groups": [
          "gambe"
        ],
        "rest": 60,
        "cum": "In picioare, cu mainile pe spatarul unui scaun. Te ridici lent pe varfuri, tii o secunda sus, cobori lent, 3 secunde.",
        "lucreaza": "Gambele. Ajuta la mers si la circulatia din picioare.",
        "atentie": "Nu te lasa in fata peste scaun. Miscare lenta, fara saltat.",
        "usor": "Fa-le asezat pe scaun, ridicand doar calcaiele.",
        "repsOnly": true
      },
      {
        "name": "Plimbare alerta 20 de minute",
        "sets": "1 serie × 20 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 10 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      }
    ]
  },
  "4": {
    "day": "Joi",
    "type": "MISCARE",
    "short": "MERS · IZOMETRIE · ECHILIBRU",
    "color": "#22d3ee",
    "icon": "🔵",
    "nota": "Zi usoara, cu exercitiile de izometrie pe care le stii deja.",
    "exercises": [
      {
        "name": "Plimbare alerta 30 de minute",
        "sets": "1 serie × 30 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 15 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      },
      {
        "name": "Presiunea palmelor",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun, spatele drept. Unesti palmele in fata pieptului, coatele in lateral. Impingi o palma in cealalta cu forta moderata si numeri secundele CU VOCE TARE.",
        "lucreaza": "Pieptul si bratele. Exercitiu pe care il stii deja.",
        "atentie": "Daca numeri cu voce tare, nu poti tine respiratia. Fara incordat gatul si fara rosit la fata.",
        "usor": "Impinge mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Carligul",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun. Indoi degetele ambelor maini si le prinzi una in alta, ca doua carlige, in fata pieptului. Tragi in directii opuse, fara sa cedeze, numarand CU VOCE TARE.",
        "lucreaza": "Spatele si bicepsul. Exercitiu pe care il stii deja.",
        "atentie": "Umerii jos, nu ridicati spre urechi. Forta moderata, nu maxima.",
        "usor": "Trage mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Sezut la perete",
        "sets": "3 seturi × 15-20 secunde",
        "muscle": "Picioare",
        "groups": [
          "cvadriceps"
        ],
        "rest": 60,
        "cum": "Cu spatele lipit de perete, talpile la un pas in fata. Aluneci in jos pana cand genunchii sunt indoiti putin - NU pana la unghi drept. Stai asa si numeri CU VOCE TARE. Te ridici impingand in calcaie.",
        "lucreaza": "Coapsele, fara miscare in genunchi.",
        "atentie": "Numara cu voce tare ca sa nu tii respiratia. Cu cat cobori mai putin, cu atat e mai usor. Opresti daca te dor genunchii.",
        "usor": "Coboara doar cativa centimetri si tine 10 secunde.",
        "repsOnly": true
      },
      {
        "name": "Echilibru intr-un picior",
        "sets": "3 seturi × 20-30 secunde",
        "muscle": "Echilibru",
        "groups": [
          "gambe",
          "fesieri"
        ],
        "rest": 45,
        "cum": "In picioare, langa un scaun sau langa blatul din bucatarie, cu o mana aproape de sprijin. Ridici un picior putin de la podea si stai asa, respirand normal. O serie inseamna ambele picioare, pe rand.",
        "lucreaza": "Echilibrul, glezna si soldul. Previne cazaturile.",
        "atentie": "Tine mana la cativa centimetri de sprijin, gata sa te prinzi. Nu inchide ochii.",
        "usor": "Tine doua degete pe scaun tot timpul.",
        "repsOnly": true,
        "stat": "AGI"
      }
    ]
  },
  "5": {
    "day": "Vineri",
    "type": "FARA BENZI",
    "short": "TOT CORPUL · FARA BENZI",
    "color": "#22c55e",
    "icon": "🟢",
    "nota": "Fara benzi: doar greutatea corpului si izometrie. Acelasi ritm, intensitate mai mica.",
    "exercises": [
      {
        "name": "Ridicari de pe scaun",
        "sets": "2-3 seturi × 8-12 repetari",
        "muscle": "Picioare",
        "groups": [
          "cvadriceps",
          "fesieri"
        ],
        "rest": 90,
        "cum": "Stai pe un scaun stabil, lipit de perete ca sa nu alunece. Talpile pe podea, la latimea umerilor. Bratele incrucisate pe piept sau intinse in fata. Te apleci putin in fata si te ridici in picioare impingand in calcaie, expirand. Te asezi inapoi lent, numarand pana la 3, fara sa te lasi sa cazi.",
        "lucreaza": "Coapsele si fesierii. Este miscarea de care ai nevoie zilnic: ridicat din pat, de pe scaun, urcat scari.",
        "atentie": "Genunchii merg in directia varfurilor, nu se strang spre interior. Dupa ultima repetare ramai in picioare cateva secunde inainte sa pleci - sa nu ametesti.",
        "usor": "Sprijina-te cu mainile de coapse sau de bratele scaunului. Sau pune o perna pe scaun ca sa fie mai inalt.",
        "repsOnly": true
      },
      {
        "name": "Flotari la perete",
        "sets": "2-3 seturi × 8-12 repetari",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps",
          "umeri"
        ],
        "rest": 90,
        "cum": "In picioare, la un pas mare de perete. Palmele pe perete la inaltimea umerilor, putin mai late decat umerii. Indoi coatele si apropii pieptul de perete in 3 secunde, apoi impingi inapoi expirand. Corpul ramane drept ca o scandura.",
        "lucreaza": "Pieptul, umerii si tricepsul.",
        "atentie": "Fundul nu ramane in urma si salele nu se lasa. Talpile nu aluneca - fa-le incaltat sau descult, nu in sosete.",
        "usor": "Stai mai aproape de perete.",
        "repsOnly": true
      },
      {
        "name": "Carligul",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Spate",
        "groups": [
          "spate",
          "biceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun. Indoi degetele ambelor maini si le prinzi una in alta, ca doua carlige, in fata pieptului. Tragi in directii opuse, fara sa cedeze, numarand CU VOCE TARE.",
        "lucreaza": "Spatele si bicepsul. Exercitiu pe care il stii deja.",
        "atentie": "Umerii jos, nu ridicati spre urechi. Forta moderata, nu maxima.",
        "usor": "Trage mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Presiunea palmelor",
        "sets": "3 seturi × 10-15 secunde",
        "muscle": "Piept",
        "groups": [
          "piept",
          "triceps"
        ],
        "rest": 45,
        "cum": "Asezat pe scaun, spatele drept. Unesti palmele in fata pieptului, coatele in lateral. Impingi o palma in cealalta cu forta moderata si numeri secundele CU VOCE TARE.",
        "lucreaza": "Pieptul si bratele. Exercitiu pe care il stii deja.",
        "atentie": "Daca numeri cu voce tare, nu poti tine respiratia. Fara incordat gatul si fara rosit la fata.",
        "usor": "Impinge mai usor si tine doar 8 secunde.",
        "repsOnly": true
      },
      {
        "name": "Ridicari pe varfuri",
        "sets": "2-3 seturi × 12-15 repetari",
        "muscle": "Gambe",
        "groups": [
          "gambe"
        ],
        "rest": 60,
        "cum": "In picioare, cu mainile pe spatarul unui scaun. Te ridici lent pe varfuri, tii o secunda sus, cobori lent, 3 secunde.",
        "lucreaza": "Gambele. Ajuta la mers si la circulatia din picioare.",
        "atentie": "Nu te lasa in fata peste scaun. Miscare lenta, fara saltat.",
        "usor": "Fa-le asezat pe scaun, ridicand doar calcaiele.",
        "repsOnly": true
      },
      {
        "name": "Plimbare alerta 20 de minute",
        "sets": "1 serie × 20 de minute",
        "muscle": "Inima / Cardio",
        "groups": [
          "cardio"
        ],
        "rest": 0,
        "cum": "Afara sau prin casa, in ritm vioi. Ritmul corect: poti vorbi in propozitii intregi, dar nu ai putea canta. O poti face oricand in zi, nu neaparat imediat dupa exercitii. Primele 3 minute si ultimele 3 minute mergi mai incet.",
        "lucreaza": "Inima, plamanii si circulatia. Este cel mai important exercitiu din tot programul.",
        "atentie": "Pulsul nu este un ghid bun pentru tine, pentru ca medicamentul pentru inima il tine jos. Ghideaza-te dupa respiratie. Daca apare durere sau apasare in piept, te opresti si te asezi.",
        "usor": "Imparte in doua plimbari de cate 10 minute, dimineata si dupa-amiaza.",
        "repsOnly": true,
        "stat": "VIT",
        "finisher": true,
        "cardio": true
      }
    ]
  },
  "6": {
    "day": "Sambata",
    "type": "ODIHNA",
    "short": "ZI LIBERA",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera. Fara exercitii. O plimbare linistita e binevenita. Odihna e parte din program.",
    "exercises": []
  },
  "0": {
    "day": "Duminica",
    "type": "ODIHNA",
    "short": "ZI LIBERA",
    "color": "#475569",
    "icon": "⚫",
    "nota": "Zi libera. Fara exercitii. O plimbare linistita e binevenita. Odihna e parte din program.",
    "exercises": []
  }
};
const BANDA_NOTA = "Mod plecare: fara benzi. Zilele de forta se fac doar cu greutatea corpului si izometrie, iar plimbarea ramane la fel.";
function BandSelect({ value, onChange }) {
  return React.createElement("select", {
    value: value || "",
    onChange: e => onChange(e.target.value),
    style: { flex: 2.2, minWidth: 0, padding: "14px 4px", fontSize: F.sm, fontWeight: 800, background: "#0b1220", color: "#e2e8f0", border: "2px solid rgba(255,255,255,.18)", borderRadius: 10, fontFamily: "inherit", boxSizing: "border-box" }
  }, React.createElement("option", { value: "" }, "banda"), BENZI.map(b => React.createElement("option", { key: b, value: b }, b)));
}
/* ═══════════════════════════════════════════════════
   MISIUNI ZILNICE SI SAPTAMANALE
   ═══════════════════════════════════════════════════ */

const CITATE = [{
  text: "Nu trebuie sa fii cel mai bun. Trebuie doar sa fii mai bun decat ieri.",
  color: "#3b82f6"
}, {
  text: "Un pas mic, facut zilnic, bate un pas mare facut o data.",
  color: "#22c55e"
}, {
  text: "Corpul urmeaza acolo unde merge disciplina.",
  color: "#a78bfa"
}, {
  text: "Ai facut ce trebuia astazi. Asta conteaza.",
  color: "#f59e0b"
}, {
  text: "Puterea nu vine din ce poti face o data, ci din ce faci in fiecare zi.",
  color: "#22d3ee"
}, {
  text: "Sistemul a inregistrat efortul tau.",
  color: "#3b82f6"
}, {
  text: "Ai devenit mai puternic.",
  color: "#22c55e"
}, {
  text: "Cine se prezinta la antrenament castiga, chiar si in zilele slabe.",
  color: "#f97316"
}, {
  text: "Varsta e un numar. Constanta e o alegere.",
  color: "#ec4899"
}, {
  text: "Astazi nu ai gasit scuze. Asta e victoria.",
  color: "#ef4444"
}, {
  text: "Fiecare repetare corecta e o investitie in urmatorii ani.",
  color: "#a78bfa"
}, {
  text: "Incet e bine. Incet si constant e imbatabil.",
  color: "#34d399"
}, {
  text: "Nu conteaza cat de greu, conteaza ca ai inceput.",
  color: "#3b82f6"
}, {
  text: "Muschii cresc in repaus, dar se cheama la antrenament.",
  color: "#f59e0b"
}, {
  text: "Un antrenament facut e un antrenament castigat.",
  color: "#22c55e"
}];
/* ═══════════════════════════════════════════════════
   COMPONENTE DE INTERFATA — totul cu text mare
   ═══════════════════════════════════════════════════ */

const cardStyle = accent => ({
  background: "rgba(255,255,255,0.03)",
  border: "1px solid " + (accent || "rgba(255,255,255,0.09)"),
  borderRadius: 14,
  padding: 16,
  marginBottom: 14
});
function Sect({
  title,
  right,
  children,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      paddingBottom: 8,
      borderBottom: "2px solid rgba(255,255,255,.08)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.lg,
      fontWeight: 800,
      color: color || "#e2e8f0",
      letterSpacing: 0.5
    }
  }, title), right ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, right) : null), children);
}
function BigBtn({
  onClick,
  children,
  color,
  bg,
  border,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      width: "100%",
      padding: "18px 16px",
      background: bg || "rgba(59,130,246,.14)",
      border: "2px solid " + (border || "rgba(59,130,246,.4)"),
      borderRadius: 12,
      color: color || "#bfdbfe",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer",
      lineHeight: 1.3,
      ...(style || {})
    }
  }, children);
}
function StatBar({
  label,
  value,
  max,
  color
}) {
  const m = max || 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 5,
      fontSize: F.md,
      color: "#cbd5e1",
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: color,
      fontWeight: 900
    }
  }, value)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 12,
      background: "rgba(255,255,255,0.07)",
      borderRadius: 6,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: Math.min(value / m * 100, 100) + "%",
      background: "linear-gradient(90deg," + color + "," + color + "99)",
      borderRadius: 6,
      transition: "width .6s ease"
    }
  })));
}
function Notif({
  msg,
  onDone
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: "calc(110px + env(safe-area-inset-bottom))",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      padding: "16px 22px",
      maxWidth: "94vw",
      background: "linear-gradient(135deg,rgba(15,23,42,.98),rgba(30,41,59,.98))",
      border: "2px solid rgba(59,130,246,.55)",
      borderRadius: 12,
      color: "#bfdbfe",
      fontSize: F.md,
      fontWeight: 700,
      textAlign: "center",
      boxShadow: "0 0 30px rgba(0,0,0,.6)",
      lineHeight: 1.4
    }
  }, msg);
}
function LvlModal({
  level,
  rank,
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.9)",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      letterSpacing: 3,
      color: "#3b82f6",
      marginBottom: 16,
      fontWeight: 800
    }
  }, "NIVEL NOU"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.huge,
      fontWeight: 900,
      color: "#e2e8f0",
      marginBottom: 12,
      textShadow: "0 0 40px " + rank.color
    }
  }, "NIVELUL ", level), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xl,
      color: rank.color,
      fontWeight: 800,
      marginBottom: 20
    }
  }, rank.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8"
    }
  }, "Atinge ecranul ca sa continui")));
}
function QuestPopup({
  quote,
  xpGain,
  multiplier,
  onClose
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.82)",
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 52,
      marginBottom: 14
    }
  }, "✅"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      color: quote.color,
      fontStyle: "italic",
      lineHeight: 1.5,
      marginBottom: 18
    }
  }, "„", quote.text, "”"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: "#4ade80"
    }
  }, "+", xpGain, " XP"), multiplier > 1 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#f59e0b",
      marginTop: 8,
      fontWeight: 700
    }
  }, "bonus ", multiplier, "x activ") : null));
}

/* ─── FEREASTRA OBLIGATORIE: SOMN ─── */
function PasiLista({
  data,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: cardStyle("rgba(255,255,255,.1)")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      fontWeight: 800,
      color: color,
      marginBottom: 12
    }
  }, data.titlu), data.pasi.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 12,
      marginBottom: 12,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 30,
      height: 30,
      borderRadius: 15,
      background: "rgba(255,255,255,.08)",
      color: color,
      fontSize: F.sm,
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, i + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.5
    }
  }, p))));
}
/* ═══════════════ TAB: AZI ═══════════════ */

function nrSeturi(txt) {
  const m = (txt || "").match(/^(\d+)(?:-(\d+))?/);
  return m ? parseInt(m[2] || m[1]) : 3;
}
function ExCard({
  ex,
  idx,
  ctx
}) {
  const {
    doneEx,
    openEx,
    setOpenEx,
    toggleEx,
    logSets,
    stergeAzi,
    getLast,
    getRecomandare,
    startRest,
    loggerSets,
    setLoggerSets,
    setSwapModal,
    S,
    todayStr,
    ziSel,
    todayDow,
    selDay
  } = ctx;
  const swapped = (S.exerciseSwaps || {})[todayStr + "_" + ex.name];
  const gata = doneEx.includes(ex.name);
  const deschis = openEx === ex.name;
  const n = nrSeturi(ex.sets);
  const last = getLast(ex.name);
  const esteAzi = selDay === todayDow;
  const sets = loggerSets[ex.name] || Array.from({
    length: n
  }, () => ({
    kg: "",
    reps: ""
  }));
  const setSets = s => setLoggerSets({
    ...loggerSets,
    [ex.name]: s
  });
  const setCell = (i, key, val) => {
    const c = sets.map(x => ({
      ...x
    }));
    c[i][key] = val;
    setSets(c);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: gata ? "rgba(34,197,94,.08)" : "rgba(255,255,255,.03)",
      border: "2px solid " + (gata ? "rgba(34,197,94,.4)" : "rgba(255,255,255,.1)"),
      borderRadius: 14,
      marginBottom: 14,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpenEx(deschis ? null : ex.name),
    style: {
      width: "100%",
      display: "flex",
      gap: 12,
      alignItems: "center",
      padding: 16,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 38,
      height: 38,
      borderRadius: 19,
      background: gata ? "#22c55e" : "rgba(255,255,255,.08)",
      color: gata ? "#052e16" : "#94a3b8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: F.md,
      fontWeight: 900
    }
  }, gata ? "✓" : idx + 1), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      fontWeight: 800,
      color: gata ? "#86efac" : "#e2e8f0",
      lineHeight: 1.3
    }
  }, swapped || ex.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 4
    }
  }, ex.sets), swapped ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xs,
      color: "#fbbf24",
      marginTop: 4
    }
  }, "schimbat astazi (initial: ", ex.name, ")") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      color: "#64748b"
    }
  }, deschis ? "▾" : "▸")), deschis ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 16px 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(0,0,0,.25)",
      borderRadius: 12,
      padding: 14,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#60a5fa",
      marginBottom: 6
    }
  }, "CUM SE FACE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#e2e8f0",
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, ex.cum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#4ade80",
      marginBottom: 6
    }
  }, "CE LUCREAZA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, ex.lucreaza), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#f87171",
      marginBottom: 6
    }
  }, "ATENTIE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55,
      marginBottom: 14
    }
  }, ex.atentie), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#fbbf24",
      marginBottom: 6
    }
  }, "DACA E PREA GREU"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55
    }
  }, ex.usor)), last ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(59,130,246,.1)",
      border: "1px solid rgba(59,130,246,.3)",
      borderRadius: 10,
      padding: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#93c5fd",
      fontWeight: 800,
      marginBottom: 6
    }
  }, "ULTIMA DATA (", last.date, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#e2e8f0",
      lineHeight: 1.5
    }
  }, last.sets.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i
  }, s.kg ? (ex.band ? "banda " + String(s.kg).toLowerCase() + " × " : s.kg + " kg × ") : "", s.reps, /secunde/.test(ex.sets) ? " sec" : /minute/.test(ex.sets) ? " min" : " rep", i < last.sets.length - 1 ? "  ·  " : "")))) : null, esteAzi ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#cbd5e1",
      marginBottom: 10
    }
  }, "SCRIE SETURILE DE AZI"), sets.map((s, i) => {
    const rec = getRecomandare(ex.name, i, ex);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 34,
        fontSize: F.md,
        color: "#64748b",
        fontWeight: 900
      }
    }, i + 1, "."), ex.repsOnly ? null : ex.band ? /*#__PURE__*/React.createElement(BandSelect, {
      value: s.kg,
      onChange: v => setCell(i, "kg", v)
    }) : /*#__PURE__*/React.createElement("input", {
      type: "number",
      inputMode: "decimal",
      step: "0.5",
      placeholder: "kg",
      value: s.kg,
      onChange: e => setCell(i, "kg", e.target.value),
      style: {
        flex: 1,
        minWidth: 0,
        padding: "14px 8px",
        background: "rgba(0,0,0,.35)",
        border: "2px solid rgba(255,255,255,.14)",
        borderRadius: 10,
        color: "#e2e8f0",
        fontSize: F.lg,
        fontWeight: 800,
        textAlign: "center",
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box"
      }
    }), /*#__PURE__*/React.createElement("input", {
      type: "number",
      inputMode: "numeric",
      placeholder: /secunde/.test(ex.sets) ? "sec" : /minute/.test(ex.sets) ? "min" : /pasi/.test(ex.sets) ? "pasi" : "rep",
      value: s.reps,
      onChange: e => setCell(i, "reps", e.target.value),
      style: {
        flex: 1,
        minWidth: 0,
        padding: "14px 8px",
        background: "rgba(0,0,0,.35)",
        border: "2px solid rgba(255,255,255,.14)",
        borderRadius: 10,
        color: "#e2e8f0",
        fontSize: F.lg,
        fontWeight: 800,
        textAlign: "center",
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box"
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => startRest(ex.name, i + 1, ex.rest || 90, ziSel.color),
      style: {
        padding: "14px 12px",
        background: "rgba(59,130,246,.16)",
        border: "2px solid rgba(59,130,246,.4)",
        borderRadius: 10,
        color: "#93c5fd",
        fontSize: F.sm,
        fontWeight: 900,
        fontFamily: "inherit",
        cursor: "pointer"
      }
    }, "PAUZA")), rec ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.xs,
        color: "#fbbf24",
        marginTop: 4,
        marginLeft: 42
      }
    }, "tinta: ", rec.kg ? (ex.band ? "banda " + String(rec.kg).toLowerCase() + " × " : rec.kg + " kg × ") : "", rec.reps, " — ", rec.nota) : null);
  }), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      const curate = sets.filter(s => s.reps !== "");
      if (!curate.length) {
        alert("Scrie macar un set.");
        return;
      }
      logSets(ex, curate);
    },
    bg: "rgba(34,197,94,.18)",
    border: "rgba(34,197,94,.5)",
    color: "#86efac",
    style: {
      marginBottom: 10
    }
  }, "✓ GATA — SALVEAZA EXERCITIUL")) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#64748b",
      marginBottom: 14,
      lineHeight: 1.5
    }
  }, "Seturile se scriu doar in ziua antrenamentului."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSwapModal(ex),
    style: {
      flex: 1,
      padding: "14px 10px",
      background: "rgba(168,85,247,.14)",
      border: "2px solid rgba(168,85,247,.35)",
      borderRadius: 10,
      color: "#d8b4fe",
      fontSize: F.sm,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "🔄 SCHIMBA"), gata ? /*#__PURE__*/React.createElement("button", {
    onClick: () => stergeAzi(ex),
    style: {
      flex: 1,
      padding: "14px 10px",
      background: "rgba(239,68,68,.12)",
      border: "2px solid rgba(239,68,68,.35)",
      borderRadius: 10,
      color: "#fca5a5",
      fontSize: F.sm,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "↩ ANULEAZA") : /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleEx(ex),
    style: {
      flex: 1,
      padding: "14px 10px",
      background: "rgba(34,197,94,.12)",
      border: "2px solid rgba(34,197,94,.35)",
      borderRadius: 10,
      color: "#86efac",
      fontSize: F.sm,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "✓ BIFEAZA"))) : null);
}
function SwapModal({
  ctx
}) {
  const {
    swapModal,
    setSwapModal,
    swapEx,
    revertSwap,
    S,
    todayStr
  } = ctx;
  const ex = swapModal;
  const lista = ALT[ex.name] || [];
  const swapped = (S.exerciseSwaps || {})[todayStr + "_" + ex.name];
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => setSwapModal(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 9000,
      background: "rgba(2,6,23,.95)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 520
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xl,
      fontWeight: 900,
      color: "#d8b4fe",
      marginBottom: 8
    }
  }, "SCHIMBA EXERCITIUL"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8",
      marginBottom: 18,
      lineHeight: 1.5
    }
  }, "In locul lui ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#e2e8f0"
    }
  }, ex.name), ", doar pentru astazi. Foloseste asta daca ceva te doare sau nu ai conditii pentru exercitiul din program."), lista.map(alt => /*#__PURE__*/React.createElement(BigBtn, {
    key: alt,
    onClick: () => swapEx(ex.name, alt),
    bg: "rgba(168,85,247,.14)",
    border: "rgba(168,85,247,.35)",
    color: "#e9d5ff",
    style: {
      marginBottom: 10,
      textAlign: "left"
    }
  }, alt)), swapped ? /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      revertSwap(ex.name);
      setSwapModal(null);
    },
    bg: "rgba(239,68,68,.12)",
    border: "rgba(239,68,68,.35)",
    color: "#fca5a5",
    style: {
      marginBottom: 10
    }
  }, "↩ INAPOI LA EXERCITIUL INITIAL") : null, /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setSwapModal(null),
    bg: "rgba(255,255,255,.06)",
    border: "rgba(255,255,255,.2)",
    color: "#cbd5e1"
  }, "INCHIDE")));
}
function TabSala({
  ctx
}) {
  const {
    PROG,
    ziSel,
    selDay,
    setSelDay,
    doneEx,
    vacation,
    showIncalzire,
    setShowIncalzire,
    showRelaxare,
    setShowRelaxare,
    todayDow
  } = ctx;
  const [showReguli, setShowReguli] = useState(false);
  const ex = ziSel.exercises || [];
  const facute = ex.filter(e => doneEx.includes(e.name)).length;
  const inc = INCALZIRE[ziSel.type];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 18
    }
  }, [1, 2, 3, 4, 5, 6, 0].map(d => {
    const z = PROG[d];
    const activ = selDay === d;
    return /*#__PURE__*/React.createElement("button", {
      key: d,
      onClick: () => setSelDay(d),
      style: {
        flex: 1,
        padding: "12px 0",
        borderRadius: 10,
        background: activ ? z.color + "33" : "rgba(255,255,255,.04)",
        border: "2px solid " + (activ ? z.color : d === todayDow ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.08)"),
        color: activ ? "#fff" : "#94a3b8",
        fontFamily: "inherit",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.md,
        fontWeight: 900
      }
    }, DOW_SHORT[d]));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,.04)",
      border: "2px solid " + ziSel.color,
      borderRadius: 14,
      padding: 18,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, ziSel.day.toUpperCase(), selDay === todayDow ? " — ASTAZI" : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: ziSel.color,
      lineHeight: 1.1,
      marginTop: 4
    }
  }, ziSel.icon, " ", ziSel.type), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      marginTop: 6
    }
  }, ziSel.short), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 10,
      lineHeight: 1.5
    }
  }, ziSel.nota), ex.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: facute === ex.length ? "#4ade80" : "#f59e0b",
      marginTop: 12,
      fontWeight: 900
    }
  }, facute, " din ", ex.length, " exercitii") : null), vacation ? /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(245,158,11,.1)",
      border: "2px solid rgba(245,158,11,.3)",
      borderRadius: 12,
      padding: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      fontWeight: 900,
      color: "#fcd34d",
      marginBottom: 6
    }
  }, "MOD PLECARE"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      lineHeight: 1.55
    }
  }, BANDA_NOTA)) : null, ex.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle(),
      textAlign: "center",
      padding: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 54,
      marginBottom: 12
    }
  }, "😌"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      fontWeight: 800,
      color: "#cbd5e1",
      marginBottom: 8
    }
  }, "Zi de odihna"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8",
      lineHeight: 1.5
    }
  }, "Muschiul se reface in zilele de pauza. Astazi nu ai nimic de facut.")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowReguli(!showReguli),
    style: {
      width: "100%",
      padding: 16,
      marginBottom: 14,
      textAlign: "left",
      background: "rgba(239,68,68,.1)",
      border: "2px solid rgba(239,68,68,.3)",
      borderRadius: 12,
      color: "#fca5a5",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "⚠️ REGULI DE SIGURANTA ", showReguli ? "▾" : "▸"), showReguli ? /*#__PURE__*/React.createElement("div", {
    style: cardStyle("rgba(239,68,68,.25)")
  }, REGULI.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: F.md,
      color: "#e2e8f0",
      lineHeight: 1.55,
      marginBottom: 12
    }
  }, "• ", r)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 14,
      borderTop: "2px solid rgba(239,68,68,.3)",
      fontSize: F.md,
      fontWeight: 900,
      color: "#f87171",
      marginBottom: 10
    }
  }, "OPRESTE-TE IMEDIAT DACA APARE:"), STOP_SEMNE.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: F.md,
      color: "#fecaca",
      lineHeight: 1.5,
      marginBottom: 8
    }
  }, "• ", s)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 14,
      lineHeight: 1.5
    }
  }, "Inainte de a incepe programul, mergi o data la medic pentru un control de rutina — mai ales pentru tensiune si inima.")) : null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowIncalzire(!showIncalzire),
    style: {
      width: "100%",
      padding: 16,
      marginBottom: 14,
      textAlign: "left",
      background: "rgba(249,115,22,.1)",
      border: "2px solid rgba(249,115,22,.3)",
      borderRadius: 12,
      color: "#fdba74",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "🔥 INAINTE SA INCEPI (obligatoriu) ", showIncalzire ? "▾" : "▸"), showIncalzire && inc ? /*#__PURE__*/React.createElement(PasiLista, {
    data: inc,
    color: "#fdba74"
  }) : null, ex.map((e, i) => /*#__PURE__*/React.createElement(ExCard, {
    key: e.name,
    ex: e,
    idx: i,
    ctx: ctx
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowRelaxare(!showRelaxare),
    style: {
      width: "100%",
      padding: 16,
      marginTop: 6,
      marginBottom: 14,
      textAlign: "left",
      background: "rgba(34,211,238,.1)",
      border: "2px solid rgba(34,211,238,.3)",
      borderRadius: 12,
      color: "#67e8f9",
      fontSize: F.md,
      fontWeight: 800,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "🧊 RELAXARE DUPA ANTRENAMENT ", showRelaxare ? "▾" : "▸"), showRelaxare ? /*#__PURE__*/React.createElement(PasiLista, {
    data: RELAXARE,
    color: "#67e8f9"
  }) : null));
}
/* ═══════════════ TAB: PROGRES ═══════════════ */

function TabProgres({
  ctx
}) {
  const {
    stats,
    muscleXp,
    S,
    level,
    rank,
    streak
  } = ctx;
  const statCol = {
    STR: "#ef4444",
    VIT: "#22c55e",
    AGI: "#22d3ee",
    INT: "#a78bfa",
    PER: "#f59e0b"
  };
  const statNume = {
    STR: "STR — Forta",
    VIT: "VIT — Rezistenta",
    AGI: "AGI — Mobilitate",
    INT: "INT — Minte",
    PER: "PER — Vointa"
  };
  const maxStat = Math.max(20, ...Object.values(stats));
  const zileAntrenate = Object.keys(S.workoutCalendar || {}).length;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Sect, {
    title: "STATISTICI"
  }, /*#__PURE__*/React.createElement("div", {
    style: cardStyle()
  }, Object.keys(stats).map(k => /*#__PURE__*/React.createElement(StatBar, {
    key: k,
    label: statNume[k],
    value: stats[k],
    max: maxStat,
    color: statCol[k]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle(),
      flex: 1,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: "#93c5fd"
    }
  }, S.totalXp), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, "XP total")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle(),
      flex: 1,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: "#4ade80"
    }
  }, zileAntrenate), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, "zile de antrenament")))), /*#__PURE__*/React.createElement(Sect, {
    title: "GRUPE MUSCULARE"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginBottom: 12,
      lineHeight: 1.5
    }
  }, "Fiecare exercitiu facut adauga puncte grupei lucrate. Asa vezi ce ai neglijat."), MUSCLE_GROUPS.map(mg => {
    const xp = muscleXp[mg.key] || 0;
    const r = getMuscleRank(xp);
    const nx = getNextMuscleRank(xp);
    return /*#__PURE__*/React.createElement("div", {
      key: mg.key,
      style: {
        ...cardStyle(),
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.md,
        fontWeight: 800,
        color: "#e2e8f0"
      }
    }, mg.icon, " ", mg.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.sm,
        fontWeight: 900,
        color: r.color
      }
    }, r.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 10,
        background: "rgba(255,255,255,.07)",
        borderRadius: 5,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        borderRadius: 5,
        background: r.color,
        width: Math.min(100, nx ? xp / nx.min * 100 : 100) + "%"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.xs,
        color: "#64748b",
        marginTop: 6
      }
    }, xp, " puncte", nx ? " · urmatorul rang la " + nx.min : " · rang maxim"));
  })), /*#__PURE__*/React.createElement(Sect, {
    title: "RANGURI"
  }, RANKS.map(r => {
    const activ = r.name === rank.name;
    const atins = level >= r.min;
    return /*#__PURE__*/React.createElement("div", {
      key: r.name,
      style: {
        ...cardStyle(activ ? r.color : "rgba(255,255,255,.08)"),
        opacity: atins ? 1 : 0.5,
        padding: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.lg,
        fontWeight: 900,
        color: r.color
      }
    }, r.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: F.sm,
        color: "#94a3b8",
        fontWeight: 700
      }
    }, "nivel ", r.min, "-", r.max)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.sm,
        color: "#cbd5e1",
        marginTop: 6,
        lineHeight: 1.5
      }
    }, r.desc), activ ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: F.sm,
        color: r.color,
        marginTop: 8,
        fontWeight: 900
      }
    }, "◀ aici esti acum") : null);
  })), (S.penaltyLog || []).length ? /*#__PURE__*/React.createElement(Sect, {
    title: "PENALIZARI",
    color: "#f87171"
  }, [...S.penaltyLog].reverse().slice(0, 8).map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      ...cardStyle("rgba(239,68,68,.25)"),
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#fca5a5",
      fontWeight: 800
    }
  }, p.date, " · -", p.penalty, " XP"), p.det ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      marginTop: 4
    }
  }, p.det) : null))) : null);
}

/* ═══════════════ TAB: CORP ═══════════════ */

function TabSetari({
  ctx
}) {
  const {
    S,
    g,
    update,
    vacation,
    soundOn,
    setSoundOn,
    setNotif,
    exportStr,
    setExportStr,
    importStr,
    setImportStr,
    lastSaved
  } = ctx;
  const [confirmReset, setConfirmReset] = useState(false);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Sect, {
    title: "MOD PLECARE / VACANTA",
    color: "#fcd34d"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#cbd5e1",
      marginBottom: 14,
      lineHeight: 1.55
    }
  }, "Cand esti plecat de acasa si nu ai benzile la tine: zilele de forta se fac doar cu greutatea corpului si izometrie. Plimbarea ramane la fel."), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      update({
        vacation: !vacation
      });
      setNotif(!vacation ? "🏖️ Mod plecare pornit" : "🏠 Inapoi la programul cu benzi");
    },
    bg: vacation ? "rgba(245,158,11,.22)" : "rgba(255,255,255,.05)",
    border: vacation ? "rgba(245,158,11,.55)" : "rgba(255,255,255,.18)",
    color: vacation ? "#fcd34d" : "#cbd5e1"
  }, vacation ? "🏖️ MOD PLECARE: PORNIT — apasa ca sa opresti" : "🏖️ PORNESTE MODUL PLECARE")), /*#__PURE__*/React.createElement(Sect, {
    title: "SUNET"
  }, /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setSoundOn(!soundOn),
    bg: soundOn ? "rgba(34,197,94,.14)" : "rgba(255,255,255,.05)",
    border: soundOn ? "rgba(34,197,94,.45)" : "rgba(255,255,255,.18)",
    color: soundOn ? "#86efac" : "#94a3b8"
  }, soundOn ? "🔊 SUNET PORNIT" : "🔇 SUNET OPRIT")), /*#__PURE__*/React.createElement(Sect, {
    title: "SALVARE"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#94a3b8",
      marginBottom: 12,
      lineHeight: 1.5
    }
  }, "Totul se salveaza singur in telefon, dupa fiecare apasare.", lastSaved ? " Ultima salvare: " + lastSaved + "." : ""), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: async () => {
      const ok = await saveToIDB(g.current);
      setNotif(ok ? "💾 Salvat" : "❌ Salvarea a esuat");
    },
    style: {
      marginBottom: 14
    }
  }, "💾 SALVEAZA ACUM"), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      setExportStr(JSON.stringify(g.current));
      setNotif("📤 Copiaza textul de mai jos");
    },
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.18)",
    color: "#cbd5e1",
    style: {
      marginBottom: 10
    }
  }, "📤 EXPORTA DATELE"), exportStr ? /*#__PURE__*/React.createElement("textarea", {
    readOnly: true,
    value: exportStr,
    onFocus: e => e.target.select(),
    style: {
      width: "100%",
      height: 110,
      background: "rgba(0,0,0,.4)",
      color: "#94a3b8",
      border: "2px solid rgba(255,255,255,.14)",
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      fontFamily: "monospace",
      marginBottom: 14,
      boxSizing: "border-box"
    }
  }) : null, /*#__PURE__*/React.createElement("textarea", {
    value: importStr,
    placeholder: "Lipeste aici datele exportate",
    onChange: e => setImportStr(e.target.value),
    style: {
      width: "100%",
      height: 90,
      background: "rgba(0,0,0,.4)",
      color: "#e2e8f0",
      border: "2px solid rgba(255,255,255,.14)",
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      fontFamily: "monospace",
      marginBottom: 10,
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      try {
        const d = JSON.parse(importStr);
        const m = {
          ...DEFAULT_STATE
        };
        for (const k of SAVE_FIELDS) if (d[k] !== undefined) m[k] = d[k];
        g.current = m;
        update({});
        setImportStr("");
        setNotif("📥 Date incarcate");
      } catch (e) {
        setNotif("❌ Text invalid");
      }
    },
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.18)",
    color: "#cbd5e1"
  }, "📥 IMPORTA DATELE")), /*#__PURE__*/React.createElement(Sect, {
    title: "STERGE TOT",
    color: "#f87171"
  }, confirmReset ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: "#fca5a5",
      marginBottom: 14,
      lineHeight: 1.5
    }
  }, "Sigur? Se sterg toate nivelurile si tot istoricul. Nu se poate reveni."), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => {
      g.current = {
        ...DEFAULT_STATE,
        lastDailyReset: new Date().toISOString().slice(0, 10)
      };
      update({});
      setConfirmReset(false);
      setNotif("Totul a fost sters.");
    },
    bg: "rgba(239,68,68,.22)",
    border: "rgba(239,68,68,.6)",
    color: "#fca5a5",
    style: {
      marginBottom: 10
    }
  }, "DA, STERGE TOT"), /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setConfirmReset(false),
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.18)",
    color: "#cbd5e1"
  }, "NU, RENUNTA")) : /*#__PURE__*/React.createElement(BigBtn, {
    onClick: () => setConfirmReset(true),
    bg: "rgba(239,68,68,.1)",
    border: "rgba(239,68,68,.3)",
    color: "#fca5a5"
  }, "🗑️ STERGE TOATE DATELE")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.sm,
      color: "#475569",
      textAlign: "center",
      marginTop: 20,
      lineHeight: 1.6
    }
  }, "Program de antrenament, nu sfat medical.", /*#__PURE__*/React.createElement("br", null), "La orice durere sau simptom neobisnuit, opreste-te si vorbeste cu medicul."));
}
/* ═══════════════════════════════════════════════════
   APLICATIA PRINCIPALA
   ═══════════════════════════════════════════════════ */

function App() {
  const [loaded, setLoaded] = useState(false);
  const [_v, _fv] = useState(0);
  const forceUpdate = () => _fv(v => v + 1);
  const g = useRef({
    ...DEFAULT_STATE
  });
  const S = g.current;
  const [notif, setNotif] = useState(null);
  const [showLvl, setShowLvl] = useState(false);
  const [questPopup, setQuestPopup] = useState(null);
  const [tab, setTab] = useState("sala");
  const [selDay, setSelDay] = useState(new Date().getDay());
  const [openEx, setOpenEx] = useState(null);
  const [swapModal, setSwapModal] = useState(null);
  const [showIncalzire, setShowIncalzire] = useState(false);
  const [showRelaxare, setShowRelaxare] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [restTimer, setRestTimer] = useState(null);
  const [restElapsed, setRestElapsed] = useState(0);
  const [loggerSets, setLoggerSets] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [exportStr, setExportStr] = useState("");
  const [importStr, setImportStr] = useState("");
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDow = new Date().getDay();
  const update = changes => {
    Object.assign(g.current, changes);
    forceUpdate();
    saveToIDB(g.current).then(ok => {
      if (ok) setLastSaved(new Date().toLocaleTimeString("ro-RO"));
    });
  };
  const getWeekId = d => {
    const dt = new Date(d);
    const day = dt.getDay() || 7;
    dt.setDate(dt.getDate() + 4 - day);
    const yr = new Date(dt.getFullYear(), 0, 1);
    return dt.getFullYear() + "-S" + String(Math.ceil(((dt - yr) / 86400000 + 1) / 7)).padStart(2, "0");
  };

  /* ─── INCARCARE + RESETARI ─── */
  useEffect(() => {
    (async () => {
      try {
        const d = await loadFromIDB();
        if (d) {
          const merged = {
            ...DEFAULT_STATE
          };
          for (const k of SAVE_FIELDS) if (d[k] !== undefined) merged[k] = d[k];
          g.current = merged;
        }
        const st = g.current;
        if (!st.startDate) st.startDate = todayStr;

        /* resetare zilnica + penalizari */
        if (st.lastDailyReset && st.lastDailyReset !== todayStr) {
          const yDate = new Date(st.lastDailyReset);
          const yDay = yDate.getDay();
          const wasWeekend = yDay === 0 || yDay === 6;
          const changes = {
            done: [],
            doneEx: [],
            lastDailyReset: todayStr
          };
          if (wasWeekend || st.vacation) {
            changes.streak = st.streak + 1;
            setTimeout(() => setNotif(st.vacation ? "🏖️ Mod plecare" : "🌙 Weekend — zi libera"), 700);
          } else {
            let total = 0,
              missedCount = 0;
            const det = [];
            const yPPL = (st.vacation ? ACASA : PPL)[yDay];
            if (yPPL && yPPL.type !== "ODIHNA") {
              const missedEx = yPPL.exercises.filter(ex => !ex.finisher && !st.doneEx.includes(ex.name));
              if (missedEx.length) {
                const p = missedEx.length * 10;
                missedCount += missedEx.length;
                det.push(missedEx.length + " exercitii (-" + p + ")");
              }
            }
            if (total > 0) {
              const newXp = st.xp - total;
              const newLvl = newXp < 0 ? Math.max(1, st.level - 1) : st.level;
              Object.assign(changes, {
                xp: newXp < 0 ? Math.max(0, getXp(newLvl) + newXp) : newXp,
                level: newLvl,
                totalXp: Math.max(0, st.totalXp - total),
                penaltyLog: [...st.penaltyLog, {
                  date: st.lastDailyReset,
                  missed: missedCount,
                  penalty: total,
                  tip: "zilnic",
                  det: det.join(", ")
                }]
              });
              setTimeout(() => setNotif("⚠️ -" + total + " XP · " + det.join(", ")), 700);
            } else if (missedCount === 0) {
              changes.streak = st.streak + 1;
            }
          }
          Object.assign(g.current, changes);
          await saveToIDB(g.current);
        } else if (!st.lastDailyReset) {
          g.current.lastDailyReset = todayStr;
        }

        /* ─── MIGRARE v2: XP recalculat din munca reala ─── */
        if (!g.current.v2) {
          const totalEx = Object.values(g.current.workoutCalendar || {}).reduce((a, b) => a + b, 0);
          let pool = totalEx * 10;
          let lvl = 1;
          while (pool >= getXp(lvl) && lvl < 200) {
            pool -= getXp(lvl);
            lvl++;
          }
          Object.assign(g.current, {
            v2: true,
            level: lvl,
            xp: pool,
            totalXp: totalEx * 10,
            penaltyLog: [],
            done: [],
            doneW: []
          });
          setTimeout(() => setNotif("Nivel recalculat din antrenamentele facute: nivelul " + lvl), 1200);
        }
        await saveToIDB(g.current);
      } catch (e) {
        console.error("Eroare la incarcare", e);
      } finally {
        setLoaded(true);
        forceUpdate();
      }
    })();
  }, []);

  /* ─── CRONOMETRU PAUZA ─── */
  useEffect(() => {
    if (!restTimer) return;
    const iv = setInterval(() => {
      const el = Math.floor((Date.now() - restTimer.startTime) / 1000);
      setRestElapsed(el);
      if (el === restTimer.totalSec) {
        if (navigator.vibrate) navigator.vibrate([250, 120, 250]);
        if (soundOn) playSound("gata");
      }
      if (el === restTimer.totalSec + 30) {
        if (navigator.vibrate) navigator.vibrate([400, 100, 400]);
        if (soundOn) playSound("intarziat");
      }
    }, 250);
    return () => clearInterval(iv);
  }, [restTimer, soundOn]);

  /* ─── XP ─── */
  const level = S.level,
    xp = S.xp,
    stats = S.stats,
    done = S.done,
    doneEx = S.doneEx,
    doneW = S.doneW,
    streak = S.streak,
    muscleXp = S.muscleXp,
    vacation = S.vacation,
    weightLog = S.weightLog,
    liftLog = S.liftLog;
  const rank = getRank(level);
  const xpN = getXp(level);
  const getMult = () => Math.round(getRankMultiplier(level) * getStreakMultiplier(streak) * 10) / 10;
  const calcAdd = (base, stat) => {
    const m = getMult();
    const amt = Math.round(base * m);
    const ns = {
      ...stats,
      [stat]: stats[stat] + 1
    };
    const n = xp + amt;
    if (n >= xpN) return {
      xp: n - xpN,
      level: level + 1,
      stats: ns,
      totalXp: S.totalXp + amt,
      _g: amt,
      _m: m
    };
    return {
      xp: n,
      stats: ns,
      totalXp: S.totalXp + amt,
      _g: amt,
      _m: m
    };
  };
  const calcRem = (base, stat) => {
    const m = getMult();
    const amt = Math.round(base * m);
    const ns = {
      ...stats,
      [stat]: Math.max(0, stats[stat] - 1)
    };
    const n = xp - amt;
    if (n < 0) return {
      xp: Math.max(0, getXp(Math.max(1, level - 1)) + n),
      level: Math.max(1, level - 1),
      stats: ns,
      totalXp: Math.max(0, S.totalXp - amt),
      _g: amt
    };
    return {
      xp: n,
      stats: ns,
      totalXp: Math.max(0, S.totalXp - amt),
      _g: amt
    };
  };
  const popQuest = (amt, m) => {
    const q = CITATE[Math.floor(Math.random() * CITATE.length)];
    setQuestPopup({
      quote: q,
      xpGain: amt,
      multiplier: m
    });
    if (soundOn) playSound("bifa");
  };
  const toggleEx = ex => {
    const nm = {
      ...muscleXp
    };
    if (doneEx.includes(ex.name)) {
      (ex.groups || []).forEach(k => {
        nm[k] = Math.max(0, (nm[k] || 0) - 5);
      });
      const c = calcRem(10, ex.stat || "STR");
      update({
        doneEx: doneEx.filter(x => x !== ex.name),
        muscleXp: nm,
        ...c
      });
      setNotif("↩ Exercitiu anulat · -" + c._g + " XP");
    } else {
      (ex.groups || []).forEach(k => {
        nm[k] = (nm[k] || 0) + 5;
      });
      const c = calcAdd(10, ex.stat || "STR");
      const wc = {
        ...(S.workoutCalendar || {})
      };
      wc[todayStr] = (wc[todayStr] || 0) + 1;
      update({
        doneEx: [...doneEx, ex.name],
        muscleXp: nm,
        workoutCalendar: wc,
        ...c
      });
      if (c.level > level) setShowLvl(true);
      popQuest(c._g, c._m);
    }
  };

  /* ─── JURNAL DE GREUTATI ─── */
  const getLast = name => {
    const e = liftLog[name];
    return e && e.length ? e[e.length - 1] : null;
  };
  const getRecomandare = (name, idx, ex) => {
    const last = getLast(name);
    if (!last || !last.sets || !last.sets[idx]) return null;
    const p = last.sets[idx];
    if (/secunde|minute|pasi/.test(ex.sets || "")) return null;
    const kg = parseFloat(p.kg) || 0;
    const reps = parseInt(p.reps) || 0;
    const m = (ex.sets || "").match(/(\d+)\s*-\s*(\d+)\s*repetari/);
    const minR = m ? parseInt(m[1]) : 10;
    const maxR = m ? parseInt(m[2]) : 12;
    if (ex.band) {
      const bi = BENZI.indexOf(p.kg);
      if (reps < maxR) return { kg: p.kg, reps: Math.max(reps + 1, minR), nota: "o repetare in plus" };
      if (last.sets.length < 3) return { kg: p.kg, reps: maxR, nota: "aceeasi banda; din saptamana 5 adauga seria a treia" };
      if (bi >= 0 && bi < BENZI.length - 1) return { kg: BENZI[bi + 1], reps: minR, nota: "treci la banda urmatoare" };
      return { kg: p.kg, reps: reps, nota: "mentine" };
    }
    if (reps >= maxR && last.sets.length < 3 && /^2-3/.test(ex.sets || "")) return { kg: 0, reps: maxR, nota: "din saptamana 5 adauga seria a treia" };
    const inc = ex.inc || 2.5;
    if (reps >= maxR && kg > 0) return {
      kg: kg + inc,
      reps: minR,
      nota: "creste cu " + inc + " kg"
    };
    return {
      kg: kg,
      reps: reps + 1,
      nota: "o repetare in plus"
    };
  };
  const logSets = (ex, sets) => {
    const name = ex.name;
    const nl = {
      ...liftLog,
      [name]: [...(liftLog[name] || []), {
        date: todayStr,
        sets
      }]
    };
    const changes = {
      liftLog: nl
    };
    if (!doneEx.includes(name)) {
      const nm = {
        ...muscleXp
      };
      (ex.groups || []).forEach(k => {
        nm[k] = (nm[k] || 0) + 5;
      });
      const c = calcAdd(10, ex.stat || "STR");
      const wc = {
        ...(S.workoutCalendar || {})
      };
      wc[todayStr] = (wc[todayStr] || 0) + 1;
      Object.assign(changes, {
        doneEx: [...doneEx, name],
        muscleXp: nm,
        workoutCalendar: wc,
        ...c
      });
      if (c.level > level) setShowLvl(true);
      popQuest(c._g, c._m);
    } else {
      setNotif("💾 Seturi salvate");
    }
    update(changes);
    const ls = {
      ...loggerSets
    };
    delete ls[name];
    setLoggerSets(ls);
  };
  const stergeAzi = ex => {
    const name = ex.name;
    const changes = {};
    if (doneEx.includes(name)) {
      const nm = {
        ...muscleXp
      };
      (ex.groups || []).forEach(k => {
        nm[k] = Math.max(0, (nm[k] || 0) - 5);
      });
      const c = calcRem(10, ex.stat || "STR");
      Object.assign(changes, {
        doneEx: doneEx.filter(x => x !== name),
        muscleXp: nm,
        ...c
      });
    }
    const ll = liftLog || {};
    if (ll[name] && ll[name].some(s => s.date === todayStr)) {
      const f = ll[name].filter(s => s.date !== todayStr);
      const n = {
        ...ll
      };
      if (f.length) n[name] = f;else delete n[name];
      changes.liftLog = n;
    }
    update(changes);
    setNotif("↩ Exercitiul de azi a fost sters");
  };

  /* ─── SCHIMBARE EXERCITIU ─── */
  const swapEx = (orig, nou) => {
    const sw = {
      ...(S.exerciseSwaps || {})
    };
    sw[todayStr + "_" + orig] = nou;
    update({
      exerciseSwaps: sw
    });
    setSwapModal(null);
    setNotif("🔄 Astazi faci: " + nou);
  };
  const revertSwap = orig => {
    const sw = {
      ...(S.exerciseSwaps || {})
    };
    delete sw[todayStr + "_" + orig];
    update({
      exerciseSwaps: sw
    });
  };

  /* ─── CRONOMETRU ─── */
  const startRest = (name, setNum, sec, color) => {
    setRestTimer({
      totalSec: sec,
      name,
      setNum,
      startTime: Date.now(),
      color: color || "#3b82f6"
    });
    setRestElapsed(0);
    if (soundOn) playSound("bifa");
  };
  const stopRest = () => {
    setRestTimer(null);
    setRestElapsed(0);
  };

  /* ─── PROGRAMUL DE AZI ─── */
  const PROG = vacation ? ACASA : PPL;
  const ziSel = PROG[selDay] || PROG[0];
  const ziAzi = PROG[todayDow] || PROG[0];
  const ctx = {
    S,
    g,
    update,
    F,
    level,
    xp,
    xpN,
    rank,
    stats,
    done,
    doneEx,
    doneW,
    streak,
    muscleXp,
    vacation,
    weightLog,
    liftLog,
    todayStr,
    todayDow,
    PROG,
    ziSel,
    ziAzi,
    selDay,
    setSelDay,
    toggleEx,
    logSets,
    stergeAzi,
    getLast,
    getRecomandare,
    swapEx,
    revertSwap,
    swapModal,
    setSwapModal,
    openEx,
    setOpenEx,
    showIncalzire,
    setShowIncalzire,
    showRelaxare,
    setShowRelaxare,
    restTimer,
    restElapsed,
    startRest,
    stopRest,
    setRestTimer,
    loggerSets,
    setLoggerSets,
    soundOn,
    setSoundOn,
    setNotif,
    setTab,
    exportStr,
    setExportStr,
    importStr,
    setImportStr,
    lastSaved,
    setLastSaved,
    getMult
  };
  if (!loaded) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 40,
        textAlign: "center",
        color: "#a78bfa",
        fontSize: F.xl,
        marginTop: 80
      }
    }, "Se incarca...");
  }
  const tabs = [{
    k: "sala",
    i: "💪",
    l: "PROGRAM"
  }, {
    k: "progres",
    i: "📈",
    l: "PROGRES"
  }, {
    k: "setari",
    i: "⚙️",
    l: "SETARI"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "linear-gradient(180deg,#0f172a,#020617)",
      color: "#e2e8f0",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      paddingBottom: "calc(120px + env(safe-area-inset-bottom))"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "calc(14px + env(safe-area-inset-top)) 16px 14px",
      background: "linear-gradient(180deg,rgba(15,23,42,.98),rgba(15,23,42,.85))",
      borderBottom: "2px solid rgba(255,255,255,.08)",
      position: "sticky",
      top: 0,
      zIndex: 100
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      lineHeight: 1
    }
  }, "NIVEL ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: rank.color
    }
  }, level)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.md,
      color: rank.color,
      fontWeight: 800,
      marginTop: 4
    }
  }, rank.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.lg,
      fontWeight: 900,
      color: streak > 0 ? "#f59e0b" : "#475569"
    }
  }, "🔥 ", streak), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xs,
      color: "#64748b",
      fontWeight: 700
    }
  }, "zile la rand"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 16,
      background: "rgba(255,255,255,.07)",
      borderRadius: 8,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: Math.min(xp / xpN * 100, 100) + "%",
      background: "linear-gradient(90deg,#3b82f6,#a78bfa)",
      borderRadius: 8,
      transition: "width .5s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.sm,
      color: "#94a3b8",
      fontWeight: 700
    }
  }, xp, " / ", xpN, " XP"), getMult() > 1 ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: F.sm,
      color: "#f59e0b",
      fontWeight: 800
    }
  }, "bonus ", getMult(), "x") : null), vacation ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      background: "rgba(245,158,11,.15)",
      border: "2px solid rgba(245,158,11,.4)",
      borderRadius: 10,
      fontSize: F.sm,
      color: "#fcd34d",
      fontWeight: 800,
      textAlign: "center"
    }
  }, "🏖️ MOD PLECARE ACTIV — antrenamente fara benzi") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, tab === "sala" && /*#__PURE__*/React.createElement(TabSala, {
    ctx: ctx
  }), tab === "progres" && /*#__PURE__*/React.createElement(TabProgres, {
    ctx: ctx
  }), tab === "setari" && /*#__PURE__*/React.createElement(TabSetari, {
    ctx: ctx
  })), restTimer ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: "calc(96px + env(safe-area-inset-bottom))",
      left: 12,
      right: 12,
      zIndex: 500,
      padding: 14,
      borderRadius: 14,
      background: restElapsed >= restTimer.totalSec ? "rgba(34,197,94,.95)" : "rgba(15,23,42,.97)",
      border: "2px solid " + (restElapsed >= restTimer.totalSec ? "#4ade80" : restTimer.color),
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xs,
      color: restElapsed >= restTimer.totalSec ? "#052e16" : "#94a3b8",
      fontWeight: 800
    }
  }, restElapsed >= restTimer.totalSec ? "POTI CONTINUA" : "PAUZA · setul " + restTimer.setNum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: F.xxl,
      fontWeight: 900,
      color: restElapsed >= restTimer.totalSec ? "#052e16" : "#e2e8f0",
      lineHeight: 1.1
    }
  }, Math.floor(Math.abs(restTimer.totalSec - restElapsed) / 60), ":", String(Math.abs(restTimer.totalSec - restElapsed) % 60).padStart(2, "0"))), /*#__PURE__*/React.createElement("button", {
    onClick: stopRest,
    style: {
      padding: "16px 20px",
      borderRadius: 12,
      border: "2px solid rgba(255,255,255,.35)",
      background: "rgba(0,0,0,.25)",
      color: restElapsed >= restTimer.totalSec ? "#052e16" : "#e2e8f0",
      fontSize: F.md,
      fontWeight: 900,
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, "GATA")) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 600,
      display: "flex",
      background: "rgba(2,6,23,.98)",
      borderTop: "2px solid rgba(255,255,255,.1)",
      paddingBottom: "env(safe-area-inset-bottom)"
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.k,
    onClick: () => setTab(t.k),
    style: {
      flex: 1,
      padding: "12px 2px 14px",
      background: "transparent",
      border: "none",
      borderTop: tab === t.k ? "4px solid #3b82f6" : "4px solid transparent",
      color: tab === t.k ? "#93c5fd" : "#64748b",
      fontFamily: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      lineHeight: 1.1
    }
  }, t.i), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      marginTop: 3
    }
  }, t.l)))), notif ? /*#__PURE__*/React.createElement(Notif, {
    msg: notif,
    onDone: () => setNotif(null)
  }) : null, showLvl ? /*#__PURE__*/React.createElement(LvlModal, {
    level: level,
    rank: rank,
    onClose: () => setShowLvl(false)
  }) : null, questPopup ? /*#__PURE__*/React.createElement(QuestPopup, {
    quote: questPopup.quote,
    xpGain: questPopup.xpGain,
    multiplier: questPopup.multiplier,
    onClose: () => setQuestPopup(null)
  }) : null, swapModal ? /*#__PURE__*/React.createElement(SwapModal, {
    ctx: ctx
  }) : null);
}
