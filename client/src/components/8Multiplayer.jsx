import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import socket from '../socket';

const GRID_SIZE = 3;     
const TILE_SIZE = 100;   

const EightPuzzleGame = ({ lobbyCode }) => {
  const gameRef = useRef(null);

// Quando il componente monta, emetti "initPuzzle" passando la lobbyCode
useEffect(() => {
  if (lobbyCode) {
    socket.emit("initPuzzle", { lobbyCode });
  }
}, [lobbyCode]);

  useEffect(() => {
    let isMounted = true; // flag per verificare se il componente è ancora montato
    let grid = [];
    let blankPos = { x: 2, y: 2 };

    function preload() {}

    function create() {
      const scene = this;
      // Usa once per evitare duplicazioni, e controlla isMounted
      socket.once("initGame", (initialBoard) => {
        if (!isMounted) return; // se il componente è stato smontato, non fare nulla
        for (let row = 0; row < GRID_SIZE; row++) {
          grid[row] = [];
          for (let col = 0; col < GRID_SIZE; col++) {
            if (initialBoard[row][col] === 0) {
              grid[row][col] = null;
              blankPos = { x: col, y: row };
            } else {
              let tile = createTile(scene, col, row, initialBoard[row][col]);
              grid[row][col] = tile;
            }
          }
        }
      });
    }

    function createTile(scene, gridX, gridY, number) {
      const x = gridX * TILE_SIZE + TILE_SIZE / 2;
      const y = gridY * TILE_SIZE + TILE_SIZE / 2;
      const container = scene.add.container(x, y);

      const graphics = scene.add.graphics();
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRoundedRect(-TILE_SIZE / 2 + 5, -TILE_SIZE / 2 + 5, TILE_SIZE - 10, TILE_SIZE - 10, 10);
      graphics.lineStyle(2,0x000000, 1);
      graphics.strokeRoundedRect(-TILE_SIZE / 2 + 5, -TILE_SIZE / 2 + 5, TILE_SIZE - 10, TILE_SIZE - 10, 10);
      container.add(graphics);

      const text = scene.add.text(0, 0, number.toString(), { fontSize: '32px', color: '#000' });
      text.setOrigin(0.5);
      container.add(text);

      container.gridX = gridX;
      container.gridY = gridY;
      container.number = number;

      container.setSize(TILE_SIZE, TILE_SIZE);
      container.setInteractive();
      container.on('pointerdown', () => {
        tryMoveTile(scene, container);
      });

      return container;
    }

    function tryMoveTile(scene, tile) {
      const gx = tile.gridX;
      const gy = tile.gridY;
      if (
        (Math.abs(blankPos.x - gx) === 1 && blankPos.y === gy) ||
        (Math.abs(blankPos.y - gy) === 1 && blankPos.x === gx)
      ) {
        swapTile(tile, blankPos.x, blankPos.y, true);
      }
    }

    function swapTile(tile, newGridX, newGridY, shouldEmit = true) {
      grid[tile.gridY][tile.gridX] = null;
      grid[newGridY][newGridX] = tile;
      const oldX = tile.gridX;
      const oldY = tile.gridY;
      tile.gridX = newGridX;
      tile.gridY = newGridY;
      blankPos = { x: oldX, y: oldY };

      tile.scene.tweens.add({
        targets: tile,
        x: newGridX * TILE_SIZE + TILE_SIZE / 2,
        y: newGridY * TILE_SIZE + TILE_SIZE / 2,
        duration: 150,
        onComplete: () => {
          if (checkVictory()) {
            socket.emit("puzzleSolved", { lobbyCode, message: "Puzzle solved!" });
          }
        }
      });

      if (shouldEmit) {
        socket.emit("tileMoved", {
          lobbyCode,
          tileNumber: tile.number,
          newGridX,
          newGridY,
          oldGridX: oldX,
          oldGridY: oldY
        });
      }
    }

    function checkVictory() {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (row === GRID_SIZE - 1 && col === GRID_SIZE - 1) {
            if (grid[row][col] !== null) return false;
          } else {
            if (grid[row][col] === null) return false;
            const expectedNumber = row * GRID_SIZE + col + 1;
            if (grid[row][col].number !== expectedNumber) return false;
          }
        }
      }
      return true;
    }

    socket.on("tileMoved", (data) => {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const tile = grid[row][col];
          if (tile && tile.number === data.tileNumber) {
            swapTile(tile, data.newGridX, data.newGridY, false);
            return;
          }
        }
      }
    });

    const config = {
      type: Phaser.AUTO,
      width: GRID_SIZE * TILE_SIZE,
      height: GRID_SIZE * TILE_SIZE,
      backgroundColor: '077EDB',
      parent: gameRef.current,
      scene: { preload, create }
    };

    const game = new Phaser.Game(config);

    return () => {
      isMounted = false; // segnala che il componente si sta smontando
      game.destroy(true);
      socket.off("initGame");
      socket.off("tileMoved");
    };
  }, [lobbyCode]);

  return <div ref={gameRef} />;
};

export default EightPuzzleGame;
