import { useState } from 'react';

export const useGameScreenWindows = () => {
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [diplomacyOpen, setDiplomacyOpen] = useState(false);
  const [economyOpen, setEconomyOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [galaxyOpen, setGalaxyOpen] = useState(false);
  const [colonizationOpen, setColonizationOpen] = useState(false);
  const [battlesOpen, setBattlesOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);

  return {
    windows: {
      missionsOpen,
      eventsOpen,
      diplomacyOpen,
      economyOpen,
      researchOpen,
      galaxyOpen,
      colonizationOpen,
      battlesOpen,
      logOpen,
      debugModalOpen,
    },
    openers: {
      openMissions: () => setMissionsOpen(true),
      openEvents: () => setEventsOpen(true),
      openDiplomacy: () => setDiplomacyOpen(true),
      openEconomy: () => setEconomyOpen(true),
      openResearch: () => setResearchOpen(true),
      openGalaxy: () => setGalaxyOpen(true),
      openColonization: () => setColonizationOpen(true),
      openBattles: () => setBattlesOpen(true),
      openLog: () => setLogOpen(true),
      openDebug: () => setDebugModalOpen(true),
    },
    closers: {
      closeMissions: () => setMissionsOpen(false),
      closeEvents: () => setEventsOpen(false),
      closeDiplomacy: () => setDiplomacyOpen(false),
      closeEconomy: () => setEconomyOpen(false),
      closeResearch: () => setResearchOpen(false),
      closeGalaxy: () => setGalaxyOpen(false),
      closeColonization: () => setColonizationOpen(false),
      closeBattles: () => setBattlesOpen(false),
      closeLog: () => setLogOpen(false),
      closeDebug: () => setDebugModalOpen(false),
    },
  };
};
