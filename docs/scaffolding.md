# Scaffolding progetto

Questa è la struttura attuale del codice dopo il refactor dello store e delle cartelle principali.

## Store
- `src/store/index.ts`: crea lo store Redux (`store`, `RootState`, `AppDispatch`).
- `src/store/slice/gameSlice.ts`: slice `game` con stato base (`view`, `config`, `session`) e reducer (`startSessionSuccess`, `returnToMenu`, `setSessionState`).
- `src/store/thunks/gameThunks.ts`: tutti i thunk di gameplay (sessione/clock, colonizzazione, cantieri, distretti, flotte, navi scientifiche, popolazione, diplomazia, salvataggi). Espone anche i tipi di risultato (es. `StartColonizationResult`).
- `src/store/utils/sessionUtils.ts`: helper condivisi (notifiche, war events, refund risorse, update popolazione).
- `src/store/hooks.ts`: hook `useGameStore` (API invariata), `useAppDispatch`, `useAppSelector`.
- `src/store/gameStore.ts`: shim di compatibilità che re-esporta `store` e `useGameStore` (per non toccare gli import dei componenti).

## Dominio (logica pura)
- `src/domain/` contiene funzioni pure per galassia, economia, colonizzazione, distretti, flotte/combattimento, diplomazia, IA, ecc.
- Config di bilanciamento in `src/config/gameConfig.ts`.

## UI
- Componenti React sotto `src/components/` organizzati per area (gameplay, debug, app shell, UI di supporto).
- Hook `useGameStore` usato dai componenti per accedere allo stato e dispatchare i thunk.

## Entry point
- `src/main.tsx` monta l’app e collega lo store Redux.

## Notazione
- Tutti i moduli TypeScript sono tipizzati strict.
- Thunk centralizzati in `gameThunks.ts` ma separabili ulteriormente (es. per dominio) se necessario; gli hook non cambiano.
