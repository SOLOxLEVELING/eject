import {
  canActivateGlyph,
  canActivateResonator,
  canActivateTerminal,
  formatBindKey,
  getAudioStatus,
  getFinaleDiagnostics,
  getUnmetFinaleConditions,
  isAdjacent,
  isGlyphVisible,
  isRoomExitUnlocked,
  isTerminalKeyAuthorized,
  isTileLocallyLit,
} from '../game/rules';
import type {
  AudioStatus,
  Coordinates,
  Direction,
  Progress,
  RoomBlueprint,
  Settings,
  TileKind,
} from '../game/types';

type WorldGridProps = {
  chamber: RoomBlueprint;
  position: Coordinates;
  settings: Settings;
  progress: Progress;
  feedback: string;
  onMove: (direction: Direction) => void;
  onInteract: () => void;
};

function getTileLabel(
  chamberId: RoomBlueprint['id'],
  tile: TileKind,
  isPlayerHere: boolean,
  glyphVisible: boolean,
  glyphActivated: boolean,
  audioStatus: AudioStatus,
  resonatorActivated: boolean,
  keyAuthorized: boolean,
  terminalActivated: boolean,
  exitUnlocked: boolean,
  x: number,
  y: number,
): string {
  if (isPlayerHere) {
    return `Operator position (${x}, ${y})`;
  }
  switch (tile) {
    case 'wall':
      return `Bulkhead wall (${x}, ${y})`;
    case 'node':
      if (chamberId === 'display') {
        if (glyphActivated) {
          return `Activated optical glyph (${x}, ${y})`;
        }
        return glyphVisible
          ? `Revealed optical glyph (${x}, ${y})`
          : `Obscured optical socket (${x}, ${y})`;
      }
      if (chamberId === 'audio') {
        if (resonatorActivated) {
          return `Activated acoustic resonator (${x}, ${y})`;
        }
        return `Acoustic resonator [${audioStatus}] (${x}, ${y})`;
      }
      if (chamberId === 'controls') {
        if (terminalActivated) {
          return `Authorized keybind terminal (${x}, ${y})`;
        }
        return keyAuthorized
          ? `Keybind terminal [K: AUTHORIZED] (${x}, ${y})`
          : `Keybind terminal [E: REVOKED / K: AUTHORIZED] (${x}, ${y})`;
      }
      return exitUnlocked
        ? `System interlock core [VERIFIED] (${x}, ${y})`
        : `System interlock core [FAULT] (${x}, ${y})`;
    case 'exit':
      return exitUnlocked
        ? `Unlocked sector exit (${x}, ${y})`
        : `Locked sector exit (${x}, ${y})`;
    case 'floor':
    default:
      return `Chamber floor (${x}, ${y})`;
  }
}

export function WorldGrid({
  chamber,
  position,
  settings,
  progress,
  feedback,
  onMove,
  onInteract,
}: WorldGridProps) {
  const bindLabel = formatBindKey(settings.interactKey);
  const columns = Array.from({ length: chamber.width }, (_, idx) =>
    String(idx).padStart(2, '0'),
  );

  const glyphVisible = isGlyphVisible(settings.brightness);
  const glyphActivated = progress.glyphActivated;
  const audioStatus = getAudioStatus(settings);
  const audioStable = audioStatus === 'STABLE';
  const resonatorActivated = progress.resonatorActivated;
  const keyAuthorized = isTerminalKeyAuthorized(settings.interactKey);
  const terminalActivated = progress.terminalActivated;

  const exitUnlocked = isRoomExitUnlocked(chamber.id, progress, settings);
  const adjacentToNode = isAdjacent(position, chamber.nodePosition);

  const finaleDiagnostics = getFinaleDiagnostics(settings, progress);
  const unmetFinale = getUnmetFinaleConditions(settings, progress);
  const verifiedCount = finaleDiagnostics.filter((d) => d.ready).length;

  const canInteractNow =
    (chamber.id === 'display' &&
      canActivateGlyph(position, chamber.nodePosition, settings, progress)) ||
    (chamber.id === 'audio' &&
      canActivateResonator(
        position,
        chamber.nodePosition,
        settings,
        progress,
      )) ||
    (chamber.id === 'controls' &&
      canActivateTerminal(position, chamber.nodePosition, settings, progress));

  // World-only darkness veil tied to in-game brightness setting;
  // modifies only the chamber grid, keeping walls and UI controls readable.
  const veilOpacity =
    chamber.id === 'display'
      ? Number(
          (((Math.max(0, 75 - settings.brightness) / 75) * 0.48).toFixed(2)),
        )
      : Number((((100 - settings.brightness) / 100) * 0.22).toFixed(2));

  let contextualHint = '';
  if (chamber.id === 'display') {
    if (canInteractNow) {
      contextualHint = `ADJACENT TO OPTICAL GLYPH // PRESS [${bindLabel}] OR CLICK INTERACT TO UNLOCK EXIT`;
    } else if (adjacentToNode && !glyphVisible && !glyphActivated) {
      contextualHint =
        'OPTICAL SOCKET OBSCURED // SET BRIGHTNESS TO ≥ 70% IN SYSTEM SETTINGS TO REVEAL';
    } else if (glyphActivated) {
      contextualHint =
        'EXIT LOCK DISENGAGED // WALK ONTO THE OPEN EXIT GATE AT (X:08, Y:03)';
    } else if (glyphVisible) {
      contextualHint = `OPTICAL GLYPH REVEALED AT (X:06, Y:01) // MOVE ADJACENT AND PRESS [${bindLabel}]`;
    } else {
      contextualHint = `LOW LUMINANCE (${settings.brightness}%) // MOVE TO EXPLORE OR RAISE BRIGHTNESS ≥ 70% TO REVEAL GLYPH`;
    }
  } else if (chamber.id === 'audio') {
    if (canInteractNow) {
      contextualHint = `ADJACENT TO RESONATOR [STABLE] // PRESS [${bindLabel}] OR CLICK INTERACT TO UNLOCK EXIT`;
    } else if (resonatorActivated) {
      contextualHint =
        'RESONANCE LOCK DISENGAGED // WALK ONTO THE OPEN EXIT GATE AT (X:08, Y:03)';
    } else if (adjacentToNode) {
      if (audioStatus === 'MUTED') {
        contextualHint =
          'RESONATOR CLAMPED [MUTED] // SWITCH MUTE OFF AND TUNE VOLUME TO 55–75% INCLUSIVE';
      } else {
        contextualHint = `RESONATOR DESYNC [${audioStatus}: ${settings.volume}%] // TUNE VOLUME TO 55–75% WITH MUTE OFF`;
      }
    } else if (audioStable) {
      contextualHint = `RESONANCE STABLE (${settings.volume}% UNMUTED) // STAND ADJACENT TO RESONATOR AT (X:04, Y:02) AND PRESS [${bindLabel}]`;
    } else {
      contextualHint = `CLUE: STABLE BAND 55–75% UNMUTED [NOW: ${audioStatus}] // TUNE AUDIO & APPROACH RESONATOR (04, 02)`;
    }
  } else if (chamber.id === 'controls') {
    if (canInteractNow) {
      contextualHint =
        'ADJACENT TO TERMINAL [K: AUTHORIZED] // PRESS [K] OR CLICK INTERACT TO UNLOCK EXIT';
    } else if (terminalActivated) {
      contextualHint =
        'TERMINAL AUTHORIZED // WALK ONTO THE OPEN EXIT GATE AT (X:08, Y:03)';
    } else if (adjacentToNode) {
      contextualHint = `TERMINAL REJECTS [${bindLabel}] (E: REVOKED / K: AUTHORIZED) // REBIND INTERACT TO [K] IN SETTINGS`;
    } else if (keyAuthorized) {
      contextualHint =
        'INTERACT BOUND TO [K] (AUTHORIZED) // STAND ADJACENT TO TERMINAL AT (X:05, Y:02) AND PRESS [K]';
    } else {
      contextualHint =
        'CONSOLE NOTICE: E: REVOKED / K: AUTHORIZED // REBIND INTERACT KEY TO [K] AND APPROACH TERMINAL (05, 02)';
    }
  } else {
    if (exitUnlocked) {
      contextualHint =
        'ALL THREE INTERLOCKS VERIFIED // STEP ONTO THE OPEN ESCAPE GATE AT (X:08, Y:03) TO EJECT';
    } else {
      contextualHint = `FINAL GATE LOCKED // UNMET: ${unmetFinale.join(' · ')}`;
    }
  }

  return (
    <section
      key={chamber.id}
      className="viewport-panel"
      aria-label="Sector Chamber Viewport"
      data-room={chamber.id}
    >
      <div className="panel-header">
        <div className="panel-heading-group">
          <span className="panel-index">
            {chamber.code} // 09×07 MATRIX
          </span>
          <h2 className="panel-title">{chamber.title}</h2>
        </div>
        <div className="viewport-tags">
          <span
            className={`tag-pill ${exitUnlocked ? 'tag-ok' : 'tag-warn'}`}
            data-testid="exit-lock-status"
          >
            {exitUnlocked ? 'EXIT LOCK: DISENGAGED' : 'EXIT LOCK: ENGAGED'}
          </span>
          {chamber.id === 'audio' ? (
            <span
              className={`tag-pill ${audioStable ? 'tag-ok' : 'tag-warn'}`}
              data-testid="viewport-audio-tag"
            >
              RESONANCE: {audioStatus} (55–75%)
            </span>
          ) : chamber.id === 'controls' ? (
            <span
              className={`tag-pill ${keyAuthorized ? 'tag-ok' : 'tag-warn'}`}
              data-testid="viewport-controls-tag"
            >
              E: REVOKED / K: AUTHORIZED
            </span>
          ) : chamber.id === 'finale' ? (
            <span
              className={`tag-pill ${exitUnlocked ? 'tag-ok' : 'tag-warn'}`}
              data-testid="viewport-finale-tag"
            >
              INTERLOCKS: {verifiedCount}/3 VERIFIED
            </span>
          ) : (
            <span className="tag-pill" data-testid="viewport-luminance-tag">
              LUM FIELD: {String(settings.brightness).padStart(3, '0')}%
            </span>
          )}
        </div>
      </div>

      <div className="viewport-stage-frame">
        {chamber.id === 'finale' && (
          <div
            className="finale-diagnostics-bar"
            data-testid="finale-diagnostics"
            aria-label="Finale Three-Part System Diagnostics"
          >
            {finaleDiagnostics.map((item) => (
              <div
                key={item.id}
                className={`finale-diag-card ${
                  item.ready ? 'diag-ready' : 'diag-fault'
                }`}
                data-testid={`finale-check-${item.id}`}
                data-ready={item.ready}
              >
                <div className="finale-diag-top">
                  <span className="finale-diag-label">{item.label}</span>
                  <span className="finale-diag-state">
                    {item.ready ? 'PASS' : 'FAULT'}
                  </span>
                </div>
                <span className="finale-diag-detail">{item.detail}</span>
              </div>
            ))}
          </div>
        )}

        <div className="coord-ruler-top" aria-hidden="true">
          <span className="coord-corner">Y\X</span>
          {columns.map((col) => (
            <span key={col} className="coord-cell">
              {col}
            </span>
          ))}
        </div>

        <div className="viewport-matrix-row">
          <div className="coord-ruler-left" aria-hidden="true">
            {chamber.tiles.map((_, rowIdx) => (
              <span key={rowIdx} className="coord-cell">
                {String(rowIdx).padStart(2, '0')}
              </span>
            ))}
          </div>

          <div
            className="world-grid"
            role="grid"
            aria-label={`${chamber.title} 9 by 7 tile grid`}
            style={{
              gridTemplateColumns: `repeat(${chamber.width}, minmax(0, 1fr))`,
            }}
          >
            {chamber.tiles.map((row, y) =>
              row.map((tile, x) => {
                const isPlayer = position.x === x && position.y === y;
                const cellKey = `${x}-${y}`;
                const locallyLit =
                  chamber.id !== 'display' ||
                  isTileLocallyLit(position, { x, y }, settings.brightness);

                const isDisplayNode =
                  chamber.id === 'display' && tile === 'node';
                const isAudioNode = chamber.id === 'audio' && tile === 'node';
                const isControlsNode =
                  chamber.id === 'controls' && tile === 'node';
                const isFinaleNode = chamber.id === 'finale' && tile === 'node';

                const isNodeObscured =
                  isDisplayNode && !glyphVisible && !glyphActivated;
                const isNodeRevealed =
                  (isDisplayNode && glyphVisible && !glyphActivated) ||
                  (isAudioNode && audioStable && !resonatorActivated) ||
                  (isControlsNode && keyAuthorized && !terminalActivated) ||
                  (isFinaleNode && exitUnlocked);
                const isNodeUnstable =
                  (isAudioNode && !audioStable && !resonatorActivated) ||
                  (isControlsNode && !keyAuthorized && !terminalActivated) ||
                  (isFinaleNode && !exitUnlocked);
                const isNodeActivated =
                  (isDisplayNode && glyphActivated) ||
                  (isAudioNode && resonatorActivated) ||
                  (isControlsNode && terminalActivated) ||
                  (isFinaleNode && exitUnlocked);

                const tileClasses = [
                  'world-tile',
                  `tile-${tile}`,
                  isPlayer ? 'tile-player' : '',
                  !locallyLit && tile !== 'wall' && tile !== 'exit'
                    ? 'tile-fogged'
                    : 'tile-lit',
                  isNodeObscured ? 'tile-node-obscured' : '',
                  isNodeRevealed ? 'tile-node-revealed' : '',
                  isNodeUnstable ? 'tile-node-unstable' : '',
                  isNodeActivated ? 'tile-node-activated' : '',
                  canInteractNow &&
                  (isDisplayNode || isAudioNode || isControlsNode)
                    ? 'tile-node-ready'
                    : '',
                  tile === 'exit'
                    ? exitUnlocked
                      ? 'tile-exit-unlocked'
                      : 'tile-exit-locked'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div
                    key={cellKey}
                    role="gridcell"
                    aria-label={getTileLabel(
                      chamber.id,
                      tile,
                      isPlayer,
                      glyphVisible,
                      glyphActivated,
                      audioStatus,
                      resonatorActivated,
                      keyAuthorized,
                      terminalActivated,
                      exitUnlocked,
                      x,
                      y,
                    )}
                    className={tileClasses}
                    data-coords={`${x},${y}`}
                    data-tile={tile}
                    data-glyph-state={
                      isDisplayNode
                        ? isNodeActivated
                          ? 'activated'
                          : isNodeRevealed
                            ? 'revealed'
                            : 'hidden'
                        : undefined
                    }
                    data-resonator-state={
                      isAudioNode
                        ? resonatorActivated
                          ? 'activated'
                          : audioStable
                            ? 'stable'
                            : 'unstable'
                        : undefined
                    }
                    data-terminal-state={
                      isControlsNode
                        ? terminalActivated
                          ? 'activated'
                          : keyAuthorized
                            ? 'authorized'
                            : 'revoked'
                        : undefined
                    }
                    data-exit-state={
                      tile === 'exit'
                        ? exitUnlocked
                          ? 'unlocked'
                          : 'locked'
                        : undefined
                    }
                  >
                    {tile === 'wall' && (
                      <span className="tile-wall-mark" aria-hidden="true" />
                    )}

                    {tile === 'floor' && !isPlayer && (
                      <span className="tile-floor-cross" aria-hidden="true" />
                    )}

                    {tile === 'node' && chamber.id === 'display' && (
                      <>
                        {isNodeObscured ? (
                          <div
                            className="tile-entity tile-entity-obscured"
                            aria-hidden="true"
                          >
                            <span className="entity-obscured-dot" />
                            <span className="entity-code">
                              {adjacentToNode ? 'DIM' : '?'}
                            </span>
                          </div>
                        ) : (
                          <div
                            className="tile-entity tile-entity-node"
                            aria-hidden="true"
                          >
                            <span
                              className={`entity-glyph-diamond ${
                                isNodeActivated ? 'diamond-active' : ''
                              }`}
                            />
                            <span className="entity-code">
                              {isNodeActivated ? 'LINKED' : 'GLYPH'}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {tile === 'node' && chamber.id === 'audio' && (
                      <div
                        className={`tile-entity ${
                          resonatorActivated || audioStable
                            ? 'tile-entity-node'
                            : 'tile-entity-exit'
                        }`}
                        aria-hidden="true"
                      >
                        <span
                          className={`entity-glyph-diamond ${
                            resonatorActivated
                              ? 'diamond-active'
                              : !audioStable
                                ? 'diamond-unstable'
                                : ''
                          }`}
                        />
                        <span className="entity-code">
                          {resonatorActivated
                            ? 'LINKED'
                            : audioStatus === 'STABLE'
                              ? 'STABLE'
                              : audioStatus === 'MUTED'
                                ? 'MUTED'
                                : audioStatus === 'TOO LOW'
                                  ? 'LOW'
                                  : 'HIGH'}
                        </span>
                      </div>
                    )}

                    {tile === 'node' && chamber.id === 'controls' && (
                      <div
                        className={`tile-entity ${
                          terminalActivated || keyAuthorized
                            ? 'tile-entity-node'
                            : 'tile-entity-exit'
                        }`}
                        aria-hidden="true"
                      >
                        <span
                          className={`entity-glyph-diamond ${
                            terminalActivated
                              ? 'diamond-active'
                              : !keyAuthorized
                                ? 'diamond-unstable'
                                : ''
                          }`}
                        />
                        <span className="entity-code">
                          {terminalActivated
                            ? 'LINKED'
                            : keyAuthorized
                              ? 'AUTH [K]'
                              : 'REVOKED'}
                        </span>
                      </div>
                    )}

                    {tile === 'node' && chamber.id === 'finale' && (
                      <div
                        className={`tile-entity ${
                          exitUnlocked ? 'tile-entity-node' : 'tile-entity-exit'
                        }`}
                        aria-hidden="true"
                      >
                        <span
                          className={`entity-glyph-diamond ${
                            exitUnlocked ? 'diamond-active' : 'diamond-unstable'
                          }`}
                        />
                        <span className="entity-code">
                          {exitUnlocked ? 'VERIFIED' : `${verifiedCount}/3 OK`}
                        </span>
                      </div>
                    )}

                    {tile === 'exit' && (
                      <div
                        className={`tile-entity ${
                          exitUnlocked
                            ? 'tile-entity-exit-open'
                            : 'tile-entity-exit'
                        }`}
                        aria-hidden="true"
                      >
                        <span
                          className={
                            exitUnlocked
                              ? 'entity-open-bar'
                              : 'entity-lock-bar'
                          }
                        />
                        <span className="entity-code">
                          {exitUnlocked ? 'OPEN' : 'LOCKED'}
                        </span>
                      </div>
                    )}

                    {isPlayer && (
                      <div
                        className="tile-entity tile-entity-player"
                        aria-hidden="true"
                      >
                        <span className="player-core" />
                        <span className="entity-code">OP-01</span>
                      </div>
                    )}
                  </div>
                );
              }),
            )}

            <div
              className="world-luminance-veil"
              aria-hidden="true"
              style={{ opacity: veilOpacity }}
            />
          </div>
        </div>

        <div
          className="viewport-context-bar"
          data-ready={canInteractNow || (chamber.id === 'finale' && exitUnlocked)}
        >
          <span className="context-indicator" aria-hidden="true" />
          <span className="context-text" data-testid="viewport-context-hint">
            {contextualHint}
          </span>
        </div>

        <div className="viewport-legend" aria-label="Chamber Map Legend">
          <span className="legend-item" data-testid="operator-coords">
            <i className="legend-swatch swatch-player" aria-hidden="true" />
            OP-01 Operator (X:0{position.x} Y:0{position.y})
          </span>
          <span className="legend-item">
            <i
              className={`legend-swatch ${
                (chamber.id === 'audio' && !resonatorActivated && !audioStable) ||
                (chamber.id === 'controls' && !terminalActivated && !keyAuthorized) ||
                (chamber.id === 'finale' && !exitUnlocked)
                  ? 'swatch-exit'
                  : 'swatch-node'
              }`}
              aria-hidden="true"
            />
            {chamber.id === 'display'
              ? glyphActivated
                ? 'Optical Glyph [Linked]'
                : glyphVisible
                  ? 'Optical Glyph [Revealed]'
                  : 'Optical Glyph [Obscured <70%]'
              : chamber.id === 'audio'
                ? resonatorActivated
                  ? 'Resonator [Linked]'
                  : `Resonator [${audioStatus}]`
                : chamber.id === 'controls'
                  ? terminalActivated
                    ? 'Terminal [Linked]'
                    : keyAuthorized
                      ? 'Terminal [K: Authorized]'
                      : 'Terminal [E: Revoked / K: Auth]'
                  : `Interlock Core [${verifiedCount}/3 Verified]`}
          </span>
          <span className="legend-item">
            <i
              className={`legend-swatch ${
                exitUnlocked ? 'swatch-node' : 'swatch-exit'
              }`}
              aria-hidden="true"
            />
            Bulkhead Gate [{exitUnlocked ? 'Open' : 'Locked'}]
          </span>
        </div>
      </div>

      <footer className="viewport-footer">
        <div className="telemetry-log" role="status" aria-live="polite">
          <span className="telemetry-prefix">SYS.LOG //</span>
          <span className="telemetry-text" data-testid="telemetry-feedback">
            {feedback}
          </span>
        </div>

        <div className="viewport-controls">
          <div
            className="onscreen-dpad"
            role="group"
            aria-label="On-screen movement controls"
          >
            <button
              type="button"
              className="dpad-btn"
              aria-label="Move Left"
              title="Move Left (A / Left Arrow)"
              onClick={() => onMove('left')}
              onPointerUp={(e) => e.currentTarget.blur()}
            >
              ←
            </button>
            <button
              type="button"
              className="dpad-btn"
              aria-label="Move Up"
              title="Move Up (W / Up Arrow)"
              onClick={() => onMove('up')}
              onPointerUp={(e) => e.currentTarget.blur()}
            >
              ↑
            </button>
            <button
              type="button"
              className="dpad-btn"
              aria-label="Move Down"
              title="Move Down (S / Down Arrow)"
              onClick={() => onMove('down')}
              onPointerUp={(e) => e.currentTarget.blur()}
            >
              ↓
            </button>
            <button
              type="button"
              className="dpad-btn"
              aria-label="Move Right"
              title="Move Right (D / Right Arrow)"
              onClick={() => onMove('right')}
              onPointerUp={(e) => e.currentTarget.blur()}
            >
              →
            </button>
          </div>

          <button
            type="button"
            onClick={onInteract}
            onPointerUp={(e) => e.currentTarget.blur()}
            className={`console-btn interact-action-btn ${
              canInteractNow ? 'interact-btn-ready' : ''
            }`}
            aria-label={`Interact using bound key ${bindLabel}`}
            data-testid="onscreen-interact-btn"
          >
            Interact <kbd>[{bindLabel}]</kbd>
          </button>
        </div>
      </footer>
    </section>
  );
}
