import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Keyboard } from '../../tetris/keyboard';
import { RotateDirection, TetriminoShape, Tetris, TetriminoColor } from '../../tetris/game';

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [],
  templateUrl: './tetris.component.html',
  styleUrl: './tetris.component.scss'
})
export class TetrisComponent implements AfterViewInit {
  @ViewChild('game') game!: ElementRef;

  private keyboard = new Keyboard(167, 33);
  private tetris = new Tetris();
  private context: any;

  constructor() {
    this.keyboard.addKeyCallback('ArrowLeft', this.handleKeyA.bind(this));
    this.keyboard.addKeyCallback('ArrowRight', this.handleKeyD.bind(this));
    this.keyboard.addKeyCallback('ArrowDown', this.rotateLeft.bind(this));
    this.keyboard.addKeyCallback('ArrowUp', this.rotateRight.bind(this));
    this.keyboard.addKeyCallback('Space', this.drop.bind(this));
  }

  ngAfterViewInit(): void {
    this.context = this.game.nativeElement.getContext('2d');
    this.loop();

    this.tetris.start();
  }

  private handleKeyA() {
    this.tetris.moveLeft();
  }

  private handleKeyD() {
    this.tetris.moveRight();
  }

  private rotateLeft() {
    this.tetris.rotate(RotateDirection.Left);
  }

  private rotateRight() {
    this.tetris.rotate(RotateDirection.Right);
  }

  private drop() {
    this.tetris.drop();
  }

  private loop() {
    requestAnimationFrame(this.loop.bind(this));
    this.tetris.update();



    const grid = 32;
    this.context.clearRect(0,0,320,640);
    for (let row = 20; row < 40; row++) {
      for (let col = 0; col < 10; col++) {
        if (this.tetris.playfield[row][col]) {
          this.context.fillStyle = TetriminoColor[this.tetris.playfield[row][col] - 1];

          this.context.fillRect(col * grid, (row - 20) * grid, grid-1, grid-1);
        }
      }
    }
    if (this.tetris.tetrimino) {
      this.context.fillStyle = TetriminoColor[this.tetris.tetrimino.type];
      const matrix = TetriminoShape[this.tetris.tetrimino.type][this.tetris.tetrimino.rotation];

      for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
          if (matrix[row][col]) {
            this.context.fillRect((this.tetris.tetrimino.col + col) * grid, (this.tetris.tetrimino.row - 20 + row) * grid, grid-1, grid-1);
          }
        }
      }
    }
  }
}
