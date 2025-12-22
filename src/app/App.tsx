import { useEffect } from "react";
import { GameScreen } from "@features/game-screen";
import { MainMenu } from "@pages/MainMenu";
import { useGameStore } from "@store/gameStore";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "@styles/main.scss";

const ROUTES = {
  mainMenu: "/",
  game: "/game",
} as const;

export const App = () => {
  const view = useGameStore((state) => state.view);
  const autoStart = useGameStore((state) => state.config.debug.autoStart);
  const hasSession = useGameStore((state) => Boolean(state.session));
  const startNewSession = useGameStore((state) => state.startNewSession);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoStart && !hasSession) {
      startNewSession();
    }
  }, [autoStart, hasSession, startNewSession]);

  useEffect(() => {
    if (view === "simulation") {
      navigate(ROUTES.game, { replace: true });
    } else {
      navigate(ROUTES.mainMenu, { replace: true });
    }
  }, [view, navigate]);

  const isMenu = view === "mainMenu";

  return (
    <div className={`app-shell ${isMenu ? "app-shell--menu" : ""}`}>
      <Routes>
        <Route path={ROUTES.mainMenu} element={<MainMenu />} />
        <Route
          path={ROUTES.game}
          element={
            view === "simulation" ? (
              <GameScreen />
            ) : (
              <Navigate to={ROUTES.mainMenu} replace />
            )
          }
        />
        <Route
          path="*"
          element={<Navigate to={isMenu ? "/" : "/game"} replace />}
        />
      </Routes>
    </div>
  );
};
