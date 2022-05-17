"use strict";

const initialScore = 20;
let playerNumber = 0;
let score = Math.ceil(initialScore / 2);
let highscore = 0;

const displayMessage = (element, message) =>
  (document.querySelector(element).textContent = message);

// Return random number between 1 and initialScore
const randomNumber = () => Math.trunc(Math.random() * initialScore) + 1;

let guessNumber = randomNumber();

const gameLogic = function () {
  playerNumber = Number(document.querySelector(".guess").value);

  if (score !== 0) {
    if (!playerNumber) {
      displayMessage(".message", "⛔ No number!");
    } else if (playerNumber === guessNumber) {
      displayMessage(".message", "🎉 You won!");
      displayMessage(".number", guessNumber);
      document.querySelector("body").style.backgroundColor = "#60b347";
      document.querySelector(".number").style.width = "30rem";
      if (highscore < score) {
        highscore = score;
        displayMessage(".highscore", highscore);
      }
    } else {
      score--;
      displayMessage(".score", score);
      displayMessage(
        ".message",
        score === 0
          ? "😭 You lost."
          : playerNumber > guessNumber
          ? "📈 Too high."
          : "📉 Too low."
      );
    }
  }
};

// Gaming process via "Check!" button
document.querySelector(".check").addEventListener("click", gameLogic);

// Reset game via "Again!" button
document.querySelector(".again").addEventListener("click", function () {
  document.querySelector("body").style.backgroundColor = "#222";
  document.querySelector(".number").style.width = "15rem";
  document.querySelector(".guess").value = "";
  displayMessage(".number", "?");
  displayMessage(".message", "Start guessing...");
  score = Math.ceil(initialScore / 2);
  displayMessage(".score", score);
  guessNumber = randomNumber();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") gameLogic();
});
