# Il settore Audiovisivo — l'economia della cultura e dell'identità italiana

Landing dello studio socioeconomico OpenEconomics per APA (dati 2023, aggiornamento marzo 2026).
Testi, dati e sequenza delle sezioni seguono il documento `Studio APA Testi e grafici.pdf`.

**Online:** https://alessiogranella.github.io/oe-caso-studio-audiovisivo/

## File

- `index.html` — la pagina, statica. Si apre con doppio clic.
- `ds-kit/` — token, font e componenti del design system
  (copia da `OpenEconomics/design-system/src/`; ricopiare quando i token cambiano).
- `assets/` — immagine della hero e logo del cliente.
- `src/` — sorgenti: `page_tpl.html` (struttura), `page.css` (stili di pagina),
  `buildpage.py` (compone `index.html` iniettando CSS e wordmark),
  `flourish2.json.gz` (dati originali delle visualizzazioni, per riferimento).

```bash
cd src && python3 buildpage.py
```

## Grafici

I quindici grafici sono **ricostruiti dal motore del design system** (`js/charts.js`), a
partire dai dati originali delle visualizzazioni Flourish della pagina di partenza
(`src/flourish2.json.gz`). Stessi dati, stessi tipi e stesso ordine degli originali, ma font
Atkinson e Hedvig, palette bluette con rampa ordinale per diretto/indiretto/indotto, scala
sequenziale per le mappe e magenta `#C300C3` per la sola voce di costo del waterfall.

Tipi disponibili nel motore: `hbars`, `compare`, `waterfall`, `map`, `donut`, `grid`
(matrice a bolle) e `treemap`. Tutti con tooltip su mouse, tocco e tastiera, legenda attiva
e controlli segmentati dove ci sono più viste.

```bash
cd src && gunzip -kf flourish2.json.gz && python3 mkdata.py && python3 buildpage.py
```

Due semplificazioni rispetto agli originali, per leggibilità, dichiarate anche sotto i
grafici: il grafico per settore mostra i primi 15 settori su 63 e il treemap i primi 24, con
le tre regioni principali nel tooltip.

## Hero

UI Block `.oe-hero-analisi` del design system: chip «Caso studio», logo APA in alto a destra,
titolo, sottotitolo e i cinque indicatori standard (tipo di analisi, modello / metodologia,
fonti, anno di riferimento, ultimo aggiornamento).

## Regole seguite dal documento APA

- **Executive Summary**: numeri tutti dello stesso colore, forma Titolo → Numero → Valuta
  (variante `.oe-kpi--titled` del design system) e descrizione al passaggio del mouse.
- **Alternanza**: sezioni bianche con riquadro del grafico grigio, sezioni grigie con
  riquadro bianco.
- **Titoli su una riga**, a capo solo quando servono.
- **«Scopri di più»** (`<details>`) sui tre blocchi di testo più densi: principali evidenze,
  impianto metodologico, metodologia.

## Punti aperti

- Nell'Executive Summary il PIL è **11,6 Mld €** come scritto nel PDF; nella sezione
  «Analisi degli Impatti economici» è **11,8**, sempre come da PDF. I due valori restano
  diversi sulla pagina.
- Il titolo «Il contributo regionale al PIL: concentrazione e diffusione degli effetti»
  compare due volte nel PDF: sopra la mappa della spesa e sopra quella del PIL. Riportato in
  entrambi i punti.
- Manca l'URL dell'articolo su SROI chiesto dal PDF: nel markup c'è un `TODO` nel punto esatto.
- Le due «Nota metodologica» puntano ai PDF ospitati sul dominio di staging
  `uipqqkwl.elementor.cloud`: da sostituire quando saranno su un dominio definitivo.
- Le descrizioni a passaggio del mouse di «Spesa complessiva», «Benefici sociali» e «SROI»
  sono state scritte per questa pagina: nel materiale di partenza non esistevano.
