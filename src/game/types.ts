export type RoomId = 'display' | 'audio' | 'controls' | 'frame' | 'crosstalk' | 'finale';

export type WindowMode = 'framed' | 'borderless';

export type BindKey = 'e' | 'f' | 'k';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type AudioStatus = 'MUTED' | 'TOO LOW' | 'STABLE' | 'TOO HIGH';

export type Settings = {
  brightness: number;
  volume: number;
  muted: boolean;
  interactKey: BindKey;
  windowMode: WindowMode;
};

export type Progress = {
  glyphActivated: boolean;
  resonatorActivated: boolean;
  terminalActivated: boolean;
  crossTalkStage: 'unlinked' | 'routed' | 'powered';
};

export type Phase = 'intro' | 'cinematic' | 'playing' | 'won';

export type Coordinates = {
  x: number;
  y: number;
};

export type TileKind = 'wall' | 'floor' | 'node' | 'exit' | 'frame' | 'watcher';

export type RoomBlueprint = {
  id: RoomId;
  code: string;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  spawn: Coordinates;
  nodePosition: Coordinates;
  relayPosition?: Coordinates;
  exitPosition: Coordinates;
  tiles: readonly (readonly TileKind[])[];
};

export type FinaleCheckItem = {
  id: 'display' | 'audio' | 'controls';
  label: string;
  ready: boolean;
  detail: string;
};

export type GameState = {
  phase: Phase;
  room: RoomId;
  position: Coordinates;
  settings: Settings;
  progress: Progress;
  feedback: string;
};

export type GameAction =
  | { type: 'START_INTRO' }
  | { type: 'START_GAME' }
  | { type: 'RESTART_GAME' }
  | { type: 'RETURN_TO_INTRO' }
  | { type: 'MOVE'; direction: Direction }
  | { type: 'INTERACT' }
  | { type: 'REJECT_UNBOUND_KEY'; key: BindKey }
  | { type: 'SET_BRIGHTNESS'; value: number }
  | { type: 'SET_VOLUME'; value: number }
  | { type: 'SET_MUTED'; value: boolean }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_INTERACT_KEY'; value: BindKey }
  | { type: 'SET_WINDOW_MODE'; value: WindowMode };
