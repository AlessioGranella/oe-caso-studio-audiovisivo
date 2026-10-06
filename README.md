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

I quindici grafici sono gli **embed Flourish originali** della pagina di partenza
(`flo.uri.sh/visualisation/<id>/embed`), con lo stesso markup e le stesse altezze del
sorgente. Hanno il loro fondo blu scuro e la loro palette: non seguono i colori del design
system perché la richiesta era di usare esattamente le stesse visualizzazioni.

Nota: gli embed Flourish non vengono disegnati nei browser headless, quindi non compaiono
negli screenshot automatici. In un browser normale si caricano regolarmente; gli URL sono
stati verificati uno per uno (tutti 200).

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
