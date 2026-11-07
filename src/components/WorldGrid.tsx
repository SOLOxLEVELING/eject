import { formatBindKey } from '../game/rules';
import type { Coordinates, RoomBlueprint, Settings, TileKind } from '../game/types';

type WorldGridProps = {
  chamber: RoomBlueprint;
  position: Coordinates;
  settings: Settings;
  feedback: string;
};

function getTileLabel(
  tile: TileKind,
  isPlayerHere: boolean,
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
      return `Dormant calibration glyph (${x}, ${y})`;
    case 'exit':
      return `Locked sector exit (${x}, ${y})`;
    case 'floor':
    default:
      return `Chamber floor (${x}, ${y})`;
  }
}

export function WorldGrid({
  chamber,
  position,
  settings,
  feedback,
}: WorldGridProps) {
  const bindLabel = formatBindKey(settings.interactKey);
  const columns = Array.from({ length: chamber.width }, (_, idx) =>
    String(idx).padStart(2, '0'),
  );

  // Subtle world-only darkness veil tied to in-game brightness setting;
  // keeps walls and controls legible at all values.
  const veilOpacity = Number(
    ((100 - settings.brightness) / 100 * 0.52).toFixed(2),
  );

  return (
    <section
      className="viewport-panel"
      aria-label="Sector Chamber Viewport"
    >
      <div className="panel-header">
        <div className="panel-heading-group">
          <span className="panel-index">VIEWPORT // 09×07 MATRIX</span>
          <h2 className="panel-title">{chamber.title}</h2>
        </div>
        <div className="viewport-tags">
          <span className="tag-pill tag-warn">EXIT LOCK: ENGAGED</span>
          <span className="tag-pill">
            LUM FIELD: {String(settings.brightness).padStart(3, '0')}%
          </span>
        </div>
      </div>

      <div className="viewport-stage-frame">
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

                return (
                  <div
                    key={cellKey}
                    role="gridcell"
                    aria-label={getTileLabel(tile, isPlayer, x, y)}
                    className={[
                      'world-tile',
                      `tile-${tile}`,
                      isPlayer ? 'tile-player' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-coords={`${x},${y}`}
                  >
                    {tile === 'wall' && (
                      <span className="tile-wall-mark" aria-hidden="true" />
                    )}

                    {tile === 'floor' && !isPlayer && (
                      <span className="tile-floor-cross" aria-hidden="true" />
                    )}

                    {tile === 'node' && (
                      <div className="tile-entity tile-entity-node" aria-hidden="true">
                        <span className="entity-glyph-diamond" />
                        <span className="entity-code">GLYPH</span>
                      </div>
                    )}

                    {tile === 'exit' && (
                      <div className="tile-entity tile-entity-exit" aria-hidden="true">
                        <span className="entity-lock-bar" />
                        <span className="entity-code">LOCKED</span>
                      </div>
                    )}

                    {isPlayer && (
                      <div className="tile-entity tile-entity-player" aria-hidden="true">
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

        <div className="viewport-legend" aria-label="Chamber Map Legend">
          <span className="legend-item">
            <i className="legend-swatch swatch-player" aria-hidden="true" />
            OP-01 Operator (X:0{position.x} Y:0{position.y})
          </span>
          <span className="legend-item">
            <i className="legend-swatch swatch-node" aria-hidden="true" />
            Optical Glyph Socket
          </span>
          <span className="legend-item">
            <i className="legend-swatch swatch-exit" aria-hidden="true" />
            Bulkhead Gate [Locked]
          </span>
        </div>
      </div>

      <footer className="viewport-footer">
        <div className="telemetry-log" role="status" aria-live="polite">
          <span className="telemetry-prefix">SYS.LOG //</span>
          <span className="telemetry-text">{feedback}</span>
        </div>

        <div className="viewport-controls">
          <span className="controls-hint">MOVE: WASD / ARROWS</span>
          <button
            type="button"
            className="console-btn interact-action-btn"
            aria-label={`Interact using bound key ${bindLabel}`}
          >
            Interact <kbd>[{bindLabel}]</kbd>
          </button>
        </div>
      </footer>
    </section>
  );
}
