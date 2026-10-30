import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { CHARACTERS, CharacterArchetype } from './game/config/Characters';
import { GameConfig } from './game/config/GameConfig';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { MoveBookModal } from './components/MoveBookModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // UI Flow States
  const [inCharacterSelect, setInCharacterSelect] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMoveBookOpen, setIsMoveBookOpen] = useState(false);
  const [levelCompleteData, setLevelCompleteData] = useState<{
    levelName: string;
    time: number;
    timeString: string;
    score: number;
    collectibles: number;
    totalCollectibles: number;
    isNewBest: boolean;
    nextLevelId: string | null;
  } | null>(null);

  // Live HUD Stats
  const [stats, setStats] = useState({
    timer: 0,
    timerString: '00:00.0',
    checkpointsReached: 0,
    totalCheckpoints: 4,
    collectiblesGathered: 0,
    totalCollectibles: 4,
    score: 0,
    speed: 0,
    momentumMultiplier: 1.0,
    comboCount: 0,
    playerState: 'IDLE',
    comboMessage: '',
    isFirstPerson: false,
    grappleAvailable: false,
    grappleLocked: false,
    grappleDistance: null as number | null,
    nextCheckpointDistance: 0,
    nextCheckpointAngle: 0,
  });

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterArchetype>(CHARACTERS[0]);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Settings State
  const [mouseSensitivity, setMouseSensitivity] = useState(GameConfig.camera.mouseSensitivity);
  const [fov, setFov] = useState(GameConfig.camera.baseFov);
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [sfxVolume, setSfxVolume] = useState(0.85);
  const [ghostEnabled, setGhostEnabled] = useState(true);

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
        if (engineRef.current) {
          setIsPointerLocked(engineRef.current.input.getPointerLock());
        }
      },
      onLevelComplete: (summary) => {
        setLevelCompleteData(summary);
      },
      onPauseToggle: (paused) => {
        setIsPaused(paused);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Start run from Character Select
  const handleStartGame = useCallback((archetypeId: string, levelId: string) => {
    if (!engineRef.current) return;
    const char = CHARACTERS.find((c) => c.id === archetypeId) || CHARACTERS[0];
    setSelectedCharacter(char);
    engineRef.current.selectArchetype(archetypeId);
    engineRef.current.loadLevel(levelId);
    engineRef.current.start();
    setInCharacterSelect(false);
    setIsPaused(false);
    setLevelCompleteData(null);
  }, []);

  // Pointer Lock Request
  const handleRequestPointerLock = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.input.requestPointerLock();
    }
  }, []);

  // View toggle
  const handleToggleView = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.player.isFirstPerson = !engineRef.current.player.isFirstPerson;
      setStats((prev) => ({
        ...prev,
        isFirstPerson: engineRef.current!.player.isFirstPerson,
      }));
    }
  }, []);

  // Respawn
  const handleRespawn = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.player.respawn(
        (engineRef.current as unknown as { activeCheckpointPos: { x: number; y: number; z: number } })
          .activeCheckpointPos as any
      );
    }
  }, []);

  // Pause & Resume
  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current && isPaused) {
      engineRef.current.togglePause();
    }
  }, [isPaused]);

  // Restart
  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restartCurrentLevel();
      setIsPaused(false);
      setLevelCompleteData(null);
    }
  }, []);

  // Switch Level
  const handleSelectLevel = useCallback((levelId: string) => {
    if (engineRef.current) {
      engineRef.current.loadLevel(levelId);
      setIsPaused(false);
      setLevelCompleteData(null);
    }
  }, []);

  // Settings Handlers
  const handleSensitivityChange = (val: number) => {
    setMouseSensitivity(val);
    GameConfig.camera.mouseSensitivity = val;
  };

  const handleFovChange = (val: number) => {
    setFov(val);
    GameConfig.camera.baseFov = val;
    if (engineRef.current) {
      engineRef.current.camera.fov = val;
      engineRef.current.camera.updateProjectionMatrix();
    }
  };

  const handleMasterVolumeChange = (val: number) => {
    setMasterVolume(val);
    if (engineRef.current) {
      engineRef.current.audio.setMasterVolume(val);
    }
  };

  const handleSfxVolumeChange = (val: number) => {
    setSfxVolume(val);
    if (engineRef.current) {
      engineRef.current.audio.setSfxVolume(val);
    }
  };

  const handleToggleGhost = () => {
    const next = !ghostEnabled;
    setGhostEnabled(next);
    if (engineRef.current) {
      engineRef.current.ghost.setEnabled(next);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0e14] select-none font-sans">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        onClick={handleRequestPointerLock}
        className="absolute inset-0 z-0 cursor-crosshair"
      />

      {/* Main In-Game HUD */}
      {!inCharacterSelect && (
        <HUD
          checkpoints={stats.checkpointsReached}
          totalCheckpoints={stats.totalCheckpoints}
          timerString={stats.timerString}
          speed={stats.speed}
          momentum={stats.momentumMultiplier}
          comboCount={stats.comboCount}
          playerState={stats.playerState}
          character={selectedCharacter}
          comboMessage={stats.comboMessage}
          isFirstPerson={stats.isFirstPerson}
          grappleAvailable={stats.grappleAvailable}
          grappleLocked={stats.grappleLocked}
          grappleDistance={stats.grappleDistance}
          nextCheckpointDistance={stats.nextCheckpointDistance}
          nextCheckpointAngle={stats.nextCheckpointAngle}
          onToggleView={handleToggleView}
          onRespawn={handleRespawn}
          onPause={handlePause}
          onOpenMoveBook={() => setIsMoveBookOpen(true)}
          onPointerLockRequest={handleRequestPointerLock}
          isPointerLocked={isPointerLocked}
        />
      )}

      {/* Touch / Mobile Controls */}
      {!inCharacterSelect && !isPaused && (
        <MobileControls
          onJoystickMove={(x, y) => {
            if (engineRef.current) {
              engineRef.current.input.setVirtualJoystick(x, y);
            }
          }}
          onActionTrigger={(action, active) => {
            if (engineRef.current) {
              engineRef.current.input.triggerAction(action, active);
            }
          }}
        />
      )}

      {/* Character Selection Screen (Roster) */}
      {inCharacterSelect && (
        <CharacterSelectModal
          onStartGame={handleStartGame}
          defaultArchetypeId={selectedCharacter.id}
          defaultLevelId={engineRef.current?.currentLevel.id || 'level_1'}
        />
      )}

      {/* Pause Menu Modal */}
      {isPaused && !isSettingsOpen && !inCharacterSelect && (
        <PauseModal
          currentLevelId={engineRef.current?.currentLevel.id || 'level_1'}
          ghostEnabled={ghostEnabled}
          onResume={handleResume}
          onRestart={handleRestart}
          onSelectLevel={handleSelectLevel}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleGhost={handleToggleGhost}
          onOpenCharacterSelect={() => {
            setInCharacterSelect(true);
            setIsPaused(false);
          }}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mouseSensitivity={mouseSensitivity}
        onSensitivityChange={handleSensitivityChange}
        fov={fov}
        onFovChange={handleFovChange}
        masterVolume={masterVolume}
        onMasterVolumeChange={handleMasterVolumeChange}
        sfxVolume={sfxVolume}
        onSfxVolumeChange={handleSfxVolumeChange}
        isFirstPerson={stats.isFirstPerson}
        onToggleFirstPerson={handleToggleView}
      />

      {/* Move Book / Parkour Manual Modal */}
      <MoveBookModal
        isOpen={isMoveBookOpen}
        onClose={() => setIsMoveBookOpen(false)}
      />

      {/* Level Complete / Victory Screen */}
      {levelCompleteData && (
        <LevelCompleteModal
          levelName={levelCompleteData.levelName}
          timeString={levelCompleteData.timeString}
          score={levelCompleteData.score}
          collectibles={levelCompleteData.collectibles}
          totalCollectibles={levelCompleteData.totalCollectibles}
          isNewBest={levelCompleteData.isNewBest}
          nextLevelId={levelCompleteData.nextLevelId}
          onNextLevel={() => {
            if (levelCompleteData.nextLevelId && engineRef.current) {
              engineRef.current.loadLevel(levelCompleteData.nextLevelId);
              setLevelCompleteData(null);
            }
          }}
          onRestart={handleRestart}
          onMainMenu={() => {
            setInCharacterSelect(true);
            setLevelCompleteData(null);
          }}
        />
      )}
    </div>
  );
}
