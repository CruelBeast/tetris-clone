const enum TetriminoType {
  I,
  J,
  L,
  O,
  S,
  T,
  Z
}

export const TetriminoColor = [
  'cyan',
  'blue',
  'orange',
  'yellow',
  'green',
  'purple',
  'red'
];

export const TetriminoShape = [
  [[[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
   [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
   [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
   [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]],

  [[[1,0,0], [1,1,1], [0,0,0]],
   [[0,1,1], [0,1,0], [0,1,0]],
   [[0,0,0], [1,1,1], [0,0,1]],
   [[0,1,0], [0,1,0], [1,1,0]]],

  [[[0,0,1], [1,1,1], [0,0,0]],
   [[0,1,0], [0,1,0], [0,1,1]],
   [[0,0,0], [1,1,1], [1,0,0]],
   [[1,1,0], [0,1,0], [0,1,0]]],

  [[[1,1], [1,1]],
   [[1,1], [1,1]],
   [[1,1], [1,1]],
   [[1,1], [1,1]]],

  [[[0,1,1], [1,1,0], [0,0,0]],
   [[0,1,0], [0,1,1], [0,0,1]],
   [[0,0,0], [0,1,1], [1,1,0]],
   [[1,0,0], [1,1,0], [0,1,0]]],

  [[[0,1,0], [1,1,1], [0,0,0]],
   [[0,1,0], [0,1,1], [0,1,0]],
   [[0,0,0], [1,1,1], [0,1,0]],
   [[0,1,0], [1,1,0], [0,1,0]]],

  [[[1,1,0], [0,1,1], [0,0,0]],
   [[0,0,1], [0,1,1], [0,1,0]],
   [[0,0,0], [1,1,0], [0,1,1]],
   [[0,1,0], [1,1,0], [1,0,0]]],
];

const KickTableJLSTZ: Array<Array<Array<[number, number]> | undefined>> = [
  [,[[0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2]],,[[0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2]]],
  [[[0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2]],,[[0, 0], [+1, 0], [+1, -1], [0, +2], [+1, +2]],],
  [,[[0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2]],,[[0, 0], [+1, 0], [+1, +1], [0, -2], [+1, -2]]],
  [[[0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2]],,[[0, 0], [-1, 0], [-1, -1], [0, +2], [-1, +2]],],
];

const KickTableI: Array<Array<Array<[number, number]> | undefined>> = [
  [,[[0, 0], [-2, 0], [+1, 0], [-2, -1], [+1, +2]],,[[0, 0], [-1, 0], [+2, 0], [-1, +2], [+2, -1]]],
  [[[0, 0], [+2, 0], [-1, 0], [+2, +1], [-1, -2]],,[[0, 0], [-1, 0], [+2, 0], [-1, +2], [+2, -1]],],
  [,[[0, 0], [+1, 0], [-2, 0], [+1, -2], [-2, +1]],,[[0, 0], [+2, 0], [-1, 0], [+2, +1], [-1, -2]]],
  [[[0, 0], [+1, 0], [-2, 0], [+1, -2], [-2, +1]],,[[0, 0], [-2, 0], [+1, 0], [-2, -1], [+1, +2]],],
];

const enum TetrisState {
  Start,
  Paused,
  Falling,
  Locking,
  MarkForClearing,
  Clearing,
  GameOver
}

export const enum RotateDirection {
  Right,
  Left,
}

const enum TetriminoRotation {
  I, // Initial
  R, // Right
  M, // Mirrored / 2R / 2L
  L  // Left
};

interface Tetrimino {
  type: TetriminoType;
  col: number;
  row: number;
  rotation: TetriminoRotation;
};

export class Tetris {
  private readonly ROWS = 20;
  private readonly BUFFER_ROWS = 20;
  private readonly COLS = 10;

  public playfield: Array<Array<number>>;
  private bag: Array<TetriminoType> = [];
  private level = 1;
  public tetrimino: Tetrimino;
  private state: TetrisState = TetrisState.Start;
  private movesSinceTouchDown: number = 0;

  private nextUpdateAt: number | null = null;

  private renderer: Renderer = new Renderer();

  public start() {
    this.state = TetrisState.Falling;
    this.scheduleNextUpdate();
  }

  private fillBag() {
    this.bag = [TetriminoType.I, TetriminoType.J, TetriminoType.L, TetriminoType.O, TetriminoType.S, TetriminoType.T, TetriminoType.Z];
  }

  private shuffleBag() {
    let currentIndex = this.bag.length;

    while (currentIndex != 0) {
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [this.bag[currentIndex], this.bag[randomIndex]] = [this.bag[randomIndex], this.bag[currentIndex]];
    }
  }

  private getNextTetrimino(): Tetrimino {
    if (this.bag.length === 0) {
      this.fillBag();
      this.shuffleBag();
    }

    const type = this.bag.pop()!;
    const rotation = TetriminoRotation.I
    const matrix = TetriminoShape[type][rotation];

    const col = this.playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
    const row = type === TetriminoType.I ? 17 : 18;
    this.movesSinceTouchDown = 0;

    return {
      type,
      col,
      row,
      rotation,
    };
  }

  private checkAndUpdateIfMoveValid(tetrimino: Tetrimino): boolean {
    if ([TetrisState.Falling, TetrisState.Locking].includes(this.state) && this.isValidPosition(tetrimino)) {
      this.tetrimino = tetrimino;

      this.resetLockingDelayIfMoved();
      this.lockIfMoreThanAllowedMovesAfterLockingStarted();

      return true;
    }

    return false;
  }

  private resetLockingDelayIfMoved() {
    if (this.state !== TetrisState.Locking) {
      return;
    }

    console.log('delay reset')
    this.scheduleNextUpdate();
    this.movesSinceTouchDown++;
  }

  private lockIfMoreThanAllowedMovesAfterLockingStarted(moves = 15) {
    if (this.state !== TetrisState.Locking) {
      return;
    }

    if (this.movesSinceTouchDown === 15) {
      this.lockPieceAndClear();
      this.scheduleNextUpdate();
    }
  }

  public moveLeft(): boolean {
    const tetrimino = { ...this.tetrimino, col: this.tetrimino.col - 1 };
    return this.checkAndUpdateIfMoveValid(tetrimino);
  }

  public moveRight(): boolean {
    const tetrimino = { ...this.tetrimino, col: this.tetrimino.col + 1 }
    return this.checkAndUpdateIfMoveValid(tetrimino);
  }

  public rotate(direction: RotateDirection): boolean {
    const {rotation, col, row} = this.tetrimino;
    const newRotation = this.calculateNewRotation(rotation, direction);
    let kickTable: Array<[number, number]>;

    // check rotation and wall kicks
    kickTable = (TetriminoType.I === this.tetrimino.type ? KickTableI : KickTableJLSTZ)[rotation][newRotation] as Array<[number, number]>;
    for (let kick of kickTable) {
      let tetrimino = { ...this.tetrimino, col: col + kick[0], row: row + kick[1], rotation: newRotation }
      if (this.checkAndUpdateIfMoveValid(tetrimino)) {
        return true;
      }
    }

    return false;
  }

  private fall(): boolean {
    const newTetrimino = { ...this.tetrimino, row: this.tetrimino.row + 1 }
    if (this.isValidPosition(newTetrimino)) {
      this.tetrimino = newTetrimino;


      return true;
    }

    return false;
  }

  private hasTouchedDown(): boolean {
    const newTetrimino = { ...this.tetrimino, row: this.tetrimino.row + 1 }
    return !this.isValidPosition(newTetrimino)
  }

  public drop() {
    while (this.fall()) {}
  }

  private calculateNewRotation(rotation: TetriminoRotation, direction: RotateDirection): TetriminoRotation {
    return (direction === RotateDirection.Right ? rotation + 1 : rotation + 3) % 4
  }

  private getFallInterval(level: number) {
    return Math.pow((0.8-((level-1)*0.007)), level-1)
  }

  private scheduleNextUpdate() {
    if (this.state === TetrisState.Falling) {
      this.nextUpdateAt = Date.now() + Math.round(this.getFallInterval(this.level) * 300);
    } else if (this.state === TetrisState.Locking || this.state === TetrisState.Clearing) {
      console.log(this.nextUpdateAt);
      this.nextUpdateAt = Date.now() + 1000;
      console.log(this.nextUpdateAt)
    }
  }

  public update() {
    if( [TetrisState.Start, TetrisState.Paused, TetrisState.GameOver].includes(this.state) || !this.nextUpdateAt || Date.now() < this.nextUpdateAt) {
      return;
    }

    if (this.state === TetrisState.Falling) {
      this.handleFallingState();
    } else if (this.state === TetrisState.Locking) {
      this.lockPieceAndClear();
      return;
    } else if (this.state === TetrisState.Clearing) {
      this.handleClearingState();
    }

    this.scheduleNextUpdate();
  }

  private handleFallingState() {
    this.fall()
    if (this.hasTouchedDown()) {
      this.state = TetrisState.Locking;
    }
  }

  private handleClearingState() {
    this.clearFullLines();
    const nextTetrimino = this.getNextTetrimino();
    if (this.isValidPosition(nextTetrimino)) {
      this.tetrimino = nextTetrimino;
      this.state = TetrisState.Falling;
    } else {
      this.state = TetrisState.GameOver;
    }
  }

  private lockPieceAndClear() {
    this.drop();
    this.lockPiece();
    this.state = TetrisState.Clearing;
  }

  private isValidPosition(tetrimino: Tetrimino): boolean {
    const matrix = TetriminoShape[tetrimino.type][tetrimino.rotation];

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (
          matrix[row][col] &&
          (tetrimino.col + col < 0 ||
            tetrimino.col + col >= this.COLS ||
            tetrimino.row + row >= this.ROWS + this.BUFFER_ROWS ||
            this.playfield[tetrimino.row + row]?.[tetrimino.col + col])
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private lockPiece(): boolean {
    const matrix = TetriminoShape[this.tetrimino.type][this.tetrimino.rotation];

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col]) {
          const playfieldRow = this.tetrimino.row + row;
          const playfieldCol = this.tetrimino.col + col;

          if (playfieldRow >= 0 && playfieldRow < this.ROWS + this.BUFFER_ROWS &&
              playfieldCol >= 0 && playfieldCol < this.COLS) {
            this.playfield[playfieldRow][playfieldCol] = this.tetrimino.type + 1;
          }
        }
      }
    }

    return true;
  }

  private clearFullLines() {
    for (let row = this.playfield.length - 1; row >= 0; row--) {
        if (this.playfield[row].every(cell => cell !== 0)) {
            this.playfield.splice(row, 1);
            this.playfield.unshift(new Array(this.COLS).fill(0));
            row++;
        }
    }
  }

  constructor() {
    this.playfield = new Array(this.ROWS + this.BUFFER_ROWS).fill(0).map(() => new Array(this.COLS).fill(0));

    this.tetrimino = this.getNextTetrimino();
  }
}

class Renderer {
}
