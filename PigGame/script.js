'use strict';

const player = {
  0: {
    player: document.querySelector('.player--0'),
    score: document.getElementById('score--0'),
    current: document.getElementById('current--0'),
    scoreValue: 0,
  },
  1: {
    player: document.querySelector('.player--1'),
    score: document.getElementById('score--1'),
    current: document.getElementById('current--1'),
    scoreValue: 0,
  },
};

const diceImg = document.querySelector('.dice');
const btnNew = document.querySelector('.btn--new');
const btnRoll = document.querySelector('.btn--roll');
const btnHold = document.querySelector('.btn--hold');
const winnerModal = document.querySelector('.winner');
const winnerText = document.querySelector('.winner--text');
const overlay = document.querySelector('.overlay');

let currentScore = 0;
let activePlayer = 0;

const switchPlayers = function () {
  player[0].player.classList.toggle('player--active');
  player[1].player.classList.toggle('player--active');
  currentScore = 0;
  player[activePlayer].current.textContent = currentScore;
  // change the current player
  activePlayer = (activePlayer + 1) % 2;
};

const resetFunction = function () {
  currentScore = 0;
  for (let id = 0; id < 2; id++) {
    player[id].scoreValue = 0;
    player[id].score.textContent = player[id].scoreValue;
    player[id].current.textContent = currentScore;
  }
  diceImg.classList.add('hidden');
  if (activePlayer === 1) {
    switchPlayers();
    activePlayer = 0;
  }
};

const blinkModal = function () {
  winnerModal.classList.toggle('hidden');
  overlay.classList.toggle('hidden');
};

btnRoll.addEventListener('click', function () {
  btnRoll.blur();
  // 1. Roll random dice
  const dice = Math.trunc(Math.random() * 6) + 1;
  // 2. Display dice image
  diceImg.classList.remove('hidden');
  diceImg.src = `dice-${dice}.png`;
  // 3. Add a dice result to the current score
  if (dice !== 1) {
    currentScore += dice;
    player[activePlayer].current.textContent = currentScore;
  } else {
    switchPlayers();
  }
});

btnHold.addEventListener('click', function () {
  btnHold.blur();
  // 1. Add the current score to the total
  player[activePlayer].scoreValue += currentScore;
  if (player[activePlayer].scoreValue >= 100) {
    // 2. Once player reaches 100 points, he wins the game
    winnerText.textContent = `The winner is PLAYER ${activePlayer + 1} 🏆`;
    blinkModal();
  } else {
    // 2. Otherwise switch the turn
    player[activePlayer].score.textContent = player[activePlayer].scoreValue;
    switchPlayers();
  }
});

btnNew.addEventListener('click', function () {
  btnNew.blur();
  resetFunction();
});

overlay.addEventListener('click', function () {
  blinkModal();
  resetFunction();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' || e.key == 'Enter') {
    blinkModal();
    resetFunction();
  }
});
