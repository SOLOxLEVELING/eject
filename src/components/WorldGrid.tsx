import { Operator } from './Operator';
import {
  canActivateGlyph,
  canActivateResonator,
  canActivateTerminal,
  formatBindKey,
  getAudioStatus,
  getFinaleDiagnostics,
  getNextCrossTalkStage,
  getTileAt,
  isAdjacent,
  isGlyphVisible,
  isRoomExitUnlocked,
  isTerminalKeyAuthorized,
  isTileLocallyLit,
} from '../game/rules';
import type { Coordinates, Direction, Progress, RoomBlueprint, Settings } from '../game/types';

type WorldGridProps = {
  chamber: RoomBlueprint;
  position: Coordinates;
  settings: Settings;
  progress: Progress;
  onMove: (direction: Direction) => void;
  onInteract: () => void;
};

export function WorldGrid({ chamber, position, settings, progress, onMove, onInteract }: WorldGridProps) {
  const bindLabel = formatBindKey(settings.interactKey);
  const glyphVisible = isGlyphVisible(settings.brightness);
  const audioStatus = getAudioStatus(settings);
  const audioStable = audioStatus === 'STABLE';
  const keyAuthorized = isTerminalKeyAuthorized(settings.interactKey);
  const exitUnlocked = isRoomExitUnlocked(chamber.id, progress, settings);
  const adjacentToNode = isAdjacent(position, chamber.nodePosition);
  const adjacentToRelay = Boolean(chamber.relayPosition && isAdjacent(position, chamber.relayPosition));
  const crossTalk = chamber.id === 'crosstalk';
  const adjacentToExit = isAdjacent(position, chamber.exitPosition);
  const finaleDiagnostics = getFinaleDiagnostics(settings, progress);
  const verifiedCount = finaleDiagnostics.filter((item) => item.ready).length;
  const canInteractNow =
    (chamber.id === 'display' && canActivateGlyph(position, chamber.nodePosition, settings, progress)) ||
    (chamber.id === 'audio' && canActivateResonator(position, chamber.nodePosition, settings, progress)) ||
    (chamber.id === 'controls' && canActivateTerminal(position, chamber.nodePosition, settings, progress)) ||
    (crossTalk && getNextCrossTalkStage(chamber, position, settings, progress) !== progress.crossTalkStage);
  const showInteract = (adjacentToNode || adjacentToRelay) && chamber.id !== 'finale' && chamber.id !== 'frame' && !exitUnlocked &&
    !(crossTalk && adjacentToNode && progress.crossTalkStage !== 'unlinked');

  // Darkness belongs to the environment; the operator, props and HUD stay readable.
  const veilOpacity = chamber.id === 'display'
    ? (Math.max(0, 75 - settings.brightness) / 75) * 0.48
    : ((100 - settings.brightness) / 100) * 0.22;

  let contextualHint = '';
  if (crossTalk && (adjacentToNode || adjacentToRelay)) {
    contextualHint = exitUnlocked ? 'The relay is latched. The exit is powered.'
      : adjacentToRelay ? progress.crossTalkStage === 'unlinked' ? 'Relay: no optical carrier. Trace its input cable.' : `Relay: ${audioStatus.toLowerCase()}.`
        : progress.crossTalkStage !== 'unlinked' ? 'Carrier latched. Follow the cable.' : glyphVisible ? 'Optical receiver within reach.' : 'A lens trace needs more light.';
  } else if (adjacentToNode) {
    if (chamber.id === 'frame') {
      contextualHint = exitUnlocked ? 'The frame has withdrawn. The passage is clear.' : 'The frame cuts through the passage. Check the world parameters.';
    } else if (exitUnlocked) {
      contextualHint = 'Linked. The door is open.';
    } else if (chamber.id === 'display') {
      contextualHint = glyphVisible ? 'Optical glyph within reach.' : 'A faint trace. It needs more light.';
    } else if (chamber.id === 'audio') {
      contextualHint = `Resonator: ${audioStatus.toLowerCase()}.`;
    } else if (chamber.id === 'controls') {
      contextualHint = keyAuthorized ? 'Terminal: authorized input.' : 'Read the authorization plate on the terminal.';
    } else {
      contextualHint = `${verifiedCount} of 3 locks aligned. Check the world parameters.`;
    }
  } else if (adjacentToExit) {
    contextualHint = exitUnlocked ? 'The way is open.' : 'The door is still sealed.';
  }

  const nodeLabel = {
    display: progress.glyphActivated ? 'Linked optical glyph' : glyphVisible ? 'Revealed optical glyph' : 'Faint optical socket',
    audio: progress.resonatorActivated ? 'Linked resonator' : `Resonator: ${audioStatus}`,
    controls: progress.terminalActivated ? 'Authorized terminal' : 'Terminal: E revoked, K authorized',
    frame: 'Retractable containment frame',
    crosstalk: progress.crossTalkStage !== 'unlinked' ? 'Linked optical receiver' : glyphVisible ? 'Revealed optical receiver' : 'Faint optical lens',
    finale: `System gate: ${verifiedCount} of 3 locks aligned`,
  }[chamber.id];
  const nodeCode = {
    display: glyphVisible ? 'SIGNAL FOUND' : 'FAINT TRACE',
    audio: audioStatus,
    controls: 'E: REVOKED',
    frame: settings.windowMode,
    crosstalk: progress.crossTalkStage !== 'unlinked' ? 'CARRIER ROUTED' : glyphVisible ? 'LENS READY' : 'FAINT LENS',
    finale: `${verifiedCount}/3`,
  }[chamber.id];

  return (
    <section key={chamber.id} className="room-scene" aria-label={chamber.title} data-room={chamber.id} data-cross-stage={crossTalk ? progress.crossTalkStage : undefined}>
      <div
        className="world-grid"
        role="grid"
        data-window-mode={chamber.id === 'frame' ? settings.windowMode : undefined}
        aria-label={`${chamber.title} chamber`}
        style={{
          gridTemplateColumns: `repeat(${chamber.width}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${chamber.height}, minmax(0, 1fr))`,
        }}
      >
        {crossTalk && (
          <svg className="cross-cable" viewBox="0 0 900 700" preserveAspectRatio="none" aria-hidden="true">
            <path className="cable-jacket" d="M250 150H350V350H550V550H750V350H850" />
            <path className="cable-input" d="M250 150H350V350H550V550H650" />
            <path className="cable-output" d="M650 550H750V350H850" />
          </svg>
        )}
        {chamber.tiles.map((row, y) => (
          <div key={y} className="world-row" role="row">
            {row.map((baseTile, x) => {
              const tile = getTileAt(chamber, { x, y }, settings) ?? baseTile;
              const isFrame = baseTile === 'frame';
              const isPlayer = position.x === x && position.y === y;
              const locallyLit = chamber.id !== 'display' || isTileLocallyLit(position, { x, y }, settings.brightness);
              const isNode = tile === 'node';
              const nodeNearby = isNode && isAdjacent(position, { x, y });
              const crossRelay = isNode && crossTalk && x === chamber.relayPosition?.x && y === chamber.relayPosition?.y;
              const crossReceiver = isNode && crossTalk && !crossRelay;
              const audioMachine = isNode && (chamber.id === 'audio' || crossRelay);
              const relayCode = progress.crossTalkStage === 'unlinked' ? 'NO CARRIER' : audioStatus;
              const exposedWall = tile === 'wall' && y < chamber.height - 1 && getTileAt(chamber, { x, y: y + 1 }, settings) !== 'wall';
              const nodeActivated = isNode && (
                (chamber.id === 'display' && progress.glyphActivated) ||
                (chamber.id === 'audio' && progress.resonatorActivated) ||
                (chamber.id === 'controls' && progress.terminalActivated) ||
                (crossReceiver && progress.crossTalkStage !== 'unlinked') ||
                (crossRelay && progress.crossTalkStage === 'powered') ||
                (chamber.id === 'finale' && exitUnlocked)
              );
              const nodeRevealed = isNode && !nodeActivated && (
                (chamber.id === 'display' && glyphVisible) ||
                (chamber.id === 'audio' && audioStable) ||
                (chamber.id === 'controls' && keyAuthorized) ||
                (crossReceiver && glyphVisible) ||
                (crossRelay && progress.crossTalkStage === 'routed' && audioStable)
              );
              const nodeObscured = isNode && (chamber.id === 'display' || crossReceiver) && !glyphVisible && !nodeActivated;
              const nodeUnstable = isNode && !nodeActivated && !nodeRevealed && !nodeObscured;
              const tileClasses = [
                'world-tile', `tile-${tile}`,
                isFrame ? 'tile-frame' : '',
                isPlayer ? 'tile-player' : '',
                !locallyLit && tile !== 'wall' && tile !== 'exit' ? 'tile-fogged' : 'tile-lit',
                nodeObscured ? 'tile-node-obscured' : '',
                nodeRevealed ? 'tile-node-revealed' : '',
                nodeUnstable ? 'tile-node-unstable' : '',
                nodeActivated ? 'tile-node-activated' : '',
                nodeNearby && canInteractNow ? 'tile-node-ready' : '',
                tile === 'exit' ? exitUnlocked ? 'tile-exit-unlocked' : 'tile-exit-locked' : '',
              ].filter(Boolean).join(' ');
              const label = isPlayer ? 'Operator OP-01' : isFrame ? exitUnlocked ? 'Retracted frame: clear passage' : 'Containment frame: blocked passage' : isNode ? crossRelay ? `Acoustic relay: ${nodeActivated ? 'powered' : relayCode}` : nodeLabel
                : tile === 'exit' ? exitUnlocked ? 'Open exit' : 'Sealed exit'
                  : tile === 'wall' ? 'Bulkhead wall' : 'Floor';

              return (
                <div
                  key={`${x}-${y}`}
                  role="gridcell"
                  aria-label={label}
                  className={tileClasses}
                  data-coords={`${x},${y}`}
                  data-tile={tile}
                  data-frame-state={isFrame ? settings.windowMode : undefined}
                  data-cross-receiver-state={crossReceiver ? nodeActivated ? 'linked' : glyphVisible ? 'revealed' : 'hidden' : undefined}
                  data-cross-relay-state={crossRelay ? nodeActivated ? 'powered' : progress.crossTalkStage === 'unlinked' ? 'no-carrier' : audioStatus.toLowerCase().replaceAll(' ', '-') : undefined}
                  data-wall-face={exposedWall || undefined}
                  data-nearby={isNode ? nodeNearby : isFrame ? adjacentToNode : tile === 'exit' ? adjacentToExit : undefined}
                  data-audio-level={audioMachine ? audioStatus.toLowerCase().replaceAll(' ', '-') : undefined}
                  data-glyph-state={isNode && chamber.id === 'display' ? nodeActivated ? 'activated' : nodeRevealed ? 'revealed' : 'hidden' : undefined}
                  data-resonator-state={isNode && chamber.id === 'audio' ? nodeActivated ? 'activated' : audioStable ? 'stable' : 'unstable' : undefined}
                  data-terminal-state={isNode && chamber.id === 'controls' ? nodeActivated ? 'activated' : keyAuthorized ? 'authorized' : 'revoked' : undefined}
                  data-exit-state={tile === 'exit' ? exitUnlocked ? 'unlocked' : 'locked' : undefined}
                >
                  {tile === 'wall' && !isFrame && <span className="tile-wall-mark" aria-hidden="true" />}
                  {tile === 'wall' && x === 3 && y === 0 && (
                    <span className="wall-inscription" aria-hidden="true">{{ display: 'LIGHT LEAVES A TRACE', audio: 'SEEK A STEADY SIGNAL', controls: 'IDENTITY IS AN INPUT', frame: 'FRAME', crosstalk: 'CROSS-TALK', finale: 'THREE SYSTEMS · ONE EXIT' }[chamber.id]}</span>
                  )}
                  {tile === 'floor' && <span className="tile-floor-cross" aria-hidden="true" />}
                  {isFrame && (
                    <div className="frame-mechanism" aria-hidden="true">
                      <span className="frame-rail" />
                      <span className="frame-beam frame-beam-top" />
                      <span className="frame-beam frame-beam-bottom" />
                    </div>
                  )}
                  {isNode && (
                    <div className={`tile-entity ${nodeObscured ? 'tile-entity-obscured' : nodeUnstable ? 'tile-entity-exit' : 'tile-entity-node'}`} aria-hidden="true">
                      <svg className="room-machine" viewBox="0 0 100 64" focusable="false">
                        <path className="machine-shadow" d="M9 54h82v8H9z" />
                        {(chamber.id === 'display' || crossReceiver) && (
                          <>
                            <path className="machine-housing" d="M18 53V15l8-8h48l8 8v38z" />
                            {crossReceiver && <path className="receiver-hood" d="M15 11h10v43H15m60-43h10v43H75M35 4h30" />}
                            <path className="optical-socket" d="M50 12 72 32 50 52 28 32z" />
                            <g className="optical-signal">
                              <path d="m50 18 15 14-15 14-15-14zM50 24v16m-8-8h16" />
                              <path d="M23 19h8m38 0h8M23 45h8m38 0h8" />
                            </g>
                          </>
                        )}
                        {(chamber.id === 'audio' || crossRelay) && (
                          <>
                            <path className="machine-housing" d="M18 52h64v7H18zM20 47V17h8v30m44 0V17h8v30" />
                            {crossRelay && <path className="relay-coil" d="M10 16v28m5-28v28m70-28v28m5-28v28M9 55h82" />}
                            <circle className="resonator-ring" cx="50" cy="29" r="22" />
                            <path className="resonator-wave" d="M32 29h7l5-11 7 22 6-17 5 6h7" />
                            <path className="resonator-mute" d="m34 13 32 32" />
                          </>
                        )}
                        {chamber.id === 'controls' && (
                          <>
                            <path className="machine-housing" d="M20 5h60v37H20zM28 42l-8 14h60l-8-14" />
                            <path className="terminal-screen" d="M26 11h48v25H26z" />
                            <text className="terminal-key" x="50" y="30" textAnchor="middle">{keyAuthorized || nodeActivated ? 'K' : 'E'}</text>
                            <path d="M31 48h38m-40 5h42" />
                          </>
                        )}
                        {chamber.id === 'finale' && (
                          <>
                            <path className="machine-housing" d="M12 10h76v45H12z" />
                            {finaleDiagnostics.map((item, index) => (
                              <g key={item.id} className="gate-circuit" data-ready={item.ready}>
                                <path d={`M${28 + index * 22} 16v22m-6-15h12m-12 8h12`} />
                                <circle cx={28 + index * 22} cy="45" r="3" />
                              </g>
                            ))}
                          </>
                        )}
                      </svg>
                      <span className="entity-code">
                        {crossRelay ? nodeActivated ? 'POWERED' : relayCode : nodeActivated && !crossReceiver ? 'LINKED' : nodeCode}
                      </span>
                      {chamber.id === 'controls' && !nodeActivated && <span className="entity-code">K: AUTHORIZED</span>}
                    </div>
                  )}
                  {tile === 'exit' && (
                    <>
                      <div className={`tile-entity ${exitUnlocked ? 'tile-entity-exit-open' : 'tile-entity-exit'}`} aria-hidden="true">
                        <div className={`door-frame ${exitUnlocked ? 'entity-open-bar' : 'entity-lock-bar'}`}>
                          <span className="door-leaf door-leaf-left" />
                          <span className="door-leaf door-leaf-right" />
                          <span className="door-threshold" />
                        </div>
                        <span className="entity-code">{exitUnlocked ? 'OPEN' : 'SEALED'}</span>
                      </div>
                      {chamber.id === 'finale' && (
                        <div className="gate-locks" role="group" aria-label="Live gate locks">
                          {finaleDiagnostics.map((item) => (
                            <span key={item.id} className="gate-lock" role="img" aria-label={`${item.id}: ${item.detail}`} title={`${item.id}: ${item.detail}`} data-testid={`finale-check-${item.id}`} data-ready={item.ready}><span aria-hidden="true">{{ display: 'L', audio: 'A', controls: 'K' }[item.id]}</span></span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {isPlayer && (
                    <div className="tile-entity tile-entity-player" aria-hidden="true">
                      <Operator />
                      <span className="entity-code">OP-01</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {chamber.id === 'frame' && <p className="frame-clue" role="note">THE FRAME IS PART OF THE PRISON.</p>}
        {crossTalk && <p className="frame-clue" role="note">CATCH THE LIGHT. CARRY THE SIGNAL.</p>}
        <div className="world-luminance-veil" aria-hidden="true" style={{ opacity: veilOpacity }} />
      </div>

      <footer className="scene-controls">
        <div className="movement-controls">
          <span className="movement-hint">Move <kbd>WASD / Arrows</kbd></span>
          <div className="onscreen-dpad" role="group" aria-label="On-screen movement controls">
            {([
              ['left', '←'], ['up', '↑'], ['down', '↓'], ['right', '→'],
            ] as const).map(([direction, symbol]) => (
              <button
                key={direction}
                type="button"
                className="dpad-btn"
                aria-label={`Move ${direction}`}
                onClick={(event) => {
                  onMove(direction);
                  if (event.detail > 0) event.currentTarget.blur();
                }}
              >{symbol}</button>
            ))}
          </div>
        </div>
        <div className="nearby-interaction">
          <span className="context-text" role="status" data-testid="viewport-context-hint">{contextualHint}</span>
          {showInteract && (
            <button
              type="button"
              onClick={(event) => {
                onInteract();
                if (event.detail > 0) event.currentTarget.blur();
              }}
              className={`console-btn interact-action-btn ${canInteractNow ? 'interact-btn-ready' : ''}`}
              aria-label={`Interact using bound key ${bindLabel}`}
              data-testid="onscreen-interact-btn"
            >
              Interact <kbd>{bindLabel}</kbd>
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
