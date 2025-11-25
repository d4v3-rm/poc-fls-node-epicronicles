## Roadmap Ricerca & Tradizioni

### Fase 1 – Modellazione e dati
- [x] Estendere tipi `ResearchTech`/`TraditionPerk` con `era`, `clusterId`, `kind`, `origin`, `mutuallyExclusiveGroup`.
- [x] Aggiungere `research.eras` in config con gateway iniziali.
- [ ] Annotare tutte le tech/tradizioni esistenti con era/cluster/kind ed eventuale origine/rarità.
- [ ] Definire e applicare i gruppi esclusivi (IA libera/regolata, Biotech/Cyber, Dottrine flotta).

### Fase 2 – Logica di gioco
- [ ] Stato ricerca: `currentEra`, `unlockedEras`, conteggio gateway.
- [x] Selezione offerte tech per ramo con filtri era/cluster/kind e mix foundation/feature.
- [ ] Gestione scelte esclusive: blocco rami alternativi e memorizzazione scelta.
- [ ] Tradizioni: gating per era e perk esclusivi; punti tradizione da influenze/bonus.

### Fase 3 – UI/UX
- [x] Pannello Ricerca/Tradizioni ristrutturato: header era, badge era/tipo, grouping per cluster, colonne Ricerca/Tradizioni.
- [ ] Aggiungere blocchi di scelte esclusive e filtri (completate, rare, era) + barre di avanzamento per ramo.
- [ ] Filtri (completate, rare, era) e highlight completate.
- [ ] Stato attivo/progresso per ramo con barre e countdown.

### Fase 4 – Contenuti e varietà
- [ ] Ampliare pool tech per ogni era/cluster.
- [ ] Introdurre tech rare da reliquie/anomalie/eventi.
- [ ] Tradizioni avanzate per stili di gioco (economia, espansione, militare, esplorazione, IA/bio).

### Fase 5 – Bilanciamento e QA
- [ ] Test di ritmo (gateway tech per era).
- [ ] Equilibrio foundation vs feature; rischio eventi per scelte estreme (IA forte, armi bio, ecc.).
- [ ] Feedback visivo e notifiche (completamento, scelte esclusive, era sbloccata).

### Stato attuale
- Offerte Ricerca filtrate/bilanciate per era e tipo (Fondamenta/Feature/Rare).
- UI Ricerca/Tradizioni con colonne, badge era/tipo e cluster.

### Prossimi micro-step
- Annotare tutto il catalogo tech/perk con era/cluster/kind/esclusivi.
- Aggiungere blocchi UI per scelte esclusive e filtri completate/rare/era (con barre progresso per ramo).
- Gestire rare da eventi/reliquie nel pescaggio (hook da eventi/anomalie).
