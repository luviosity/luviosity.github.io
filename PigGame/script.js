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

// const player0El = document.querySelector('.player--0');
// const player1El = document.querySelector('.player--1');
// const score0El = document.getElementById('score--0');
// const score1El = document.getElementById('score--1');
// const current0El = document.getElementById('current--0');
// const current1El = document.getElementById('current--1');
const diceImg = document.querySelector('.dice');
const btnNew = document.querySelector('.btn--new');
const btnRoll = document.querySelector('.btn--roll');
const btnHold = document.querySelector('.btn--hold');
const winnerModal = document.querySelector('.winner');
const winnerText = document.querySelector('.winner--text');
const overlay = document.querySelector('.overlay');

let currentScore = 0;
let activePlayer = 0;

const switchPlayers = function (id) {
  if (id === 0) {
    player[0].player.classList.remove('player--active');
    player[1].player.classList.add('player--active');
  } else if (id === 1) {
    player[1].player.classList.remove('player--active');
    player[0].player.classList.add('player--active');
  }
  currentScore = 0;
  player[activePlayer].current.textContent = currentScore;
  activePlayer = (activePlayer + 1) % 2;
};

const resetFunction = function () {
  for (let id = 0; id < 2; id++) {
    player[id].scoreValue = 0;
    player[id].score.textContent = player[id].scoreValue;
    currentScore = 0;
    player[id].current.textContent = currentScore;
    diceImg.classList.add('hidden');
    if (activePlayer === 1) {
      switchPlayers(activePlayer);
      activePlayer = 0;
    }
  }
};

const showModal = function () {
  winnerModal.classList.remove('hidden');
  overlay.classList.remove('hidden');
};

const closeModal = function () {
  winnerModal.classList.add('hidden');
  overlay.classList.add('hidden');
};

btnRoll.addEventListener('click', function () {
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
    switchPlayers(activePlayer);
  }
});

btnHold.addEventListener('click', function () {
  player[activePlayer].scoreValue += currentScore;
  if (player[activePlayer].scoreValue >= 100) {
    winnerText.textContent = `The winner is PLAYER ${activePlayer + 1} 🏆`;
    showModal();
  } else {
    player[activePlayer].score.textContent = player[activePlayer].scoreValue;
    switchPlayers(activePlayer);
  }
});

btnNew.addEventListener('click', function () {
  resetFunction();
});

overlay.addEventListener('click', function () {
  closeModal();
  resetFunction();
});
