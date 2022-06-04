'use strict';

// Working Data (Yes, not from the base. I'm still learning 😬)
const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2020-11-18T21:31:17.178Z',
    '2020-12-23T07:42:02.383Z',
    '2022-01-28T09:15:04.904Z',
    '2022-04-01T10:17:24.185Z',
    '2022-05-26T14:11:59.604Z',
    '2022-05-28T17:01:17.194Z',
    '2022-05-31T23:36:17.929Z',
    '2022-06-01T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];

// Object for currency exchange during the transfer
const curConverter = {
  USD: 1.07,
};

curConverter['EUR'] = +(1 / curConverter['USD']).toFixed(2);

const test = {
  a: 1,
  b: function () {
    console.log(this);
    return this.a;
  },
};

console.log(curConverter);

/////////////////////////////////////////////////
//APP

// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

const mainEl = document.querySelector('main');

let currentAccount;
let cntSortClicks = 0;
let timer;

const createUsernames = function (accounts) {
  accounts.forEach(function (acc) {
    acc.username = acc.owner
      .toLowerCase()
      .split(' ')
      .map(user => user[0])
      .join('');
  });
};

createUsernames(accounts);

labelBalance.addEventListener('click', () => clearInterval(timer));

// Functions

const setTimer = function () {
  let time = 300;

  if (timer) clearInterval(timer);

  const tick = function () {
    const min = String(Math.floor(time / 60)).padStart(2, 0);
    const sec = String(time % 60).padStart(2, 0);

    labelTimer.textContent = `${min}:${sec}`;

    if (time === 0) {
      clearInterval(timer);
      containerApp.style.opacity = 0;
    }

    time--;
  };

  tick();
  timer = setInterval(tick, 1000);
};

const findAccount = (accounts, username) =>
  accounts.find(acc => acc.username === username);

const diffInDays = (date1, date2) =>
  Math.round(Math.abs(date1 - date2) / (1000 * 60 * 60 * 24));

const formatDateAsIntl = (date, locale, options = {}) =>
  new Intl.DateTimeFormat(locale, options).format(date);

const formatCur = (num, locale, cur) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cur,
  }).format(num);

const displayMovementsDates = function (date, locale, options = {}) {
  const diff = diffInDays(new Date(), date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff <= 7) return `${diff} days ago`;
  return formatDateAsIntl(date, locale, options);
};

const displayMovements = function (acc, sort = null) {
  containerMovements.innerHTML = '';
  const movs = sort
    ? sort === 'asc'
      ? acc.movements.slice().sort((a, b) => b - a)
      : acc.movements.slice().sort((a, b) => a - b)
    : acc.movements;
  movs.forEach(function (mov, ind) {
    const movType = mov < 0 ? 'withdrawal' : 'deposit';
    const date = displayMovementsDates(
      new Date(acc.movementsDates[ind]),
      acc.locale
    );
    const movRow = `
      <div class="movements__row">
        <div class="movements__type movements__type--${movType}">${
      ind + 1
    } ${movType}</div>
        <div class="movements__date">${date}</div>
        <div class="movements__value">${formatCur(
          mov,
          acc.locale,
          acc.currency
        )}</div>
      </div>
    `;
    containerMovements.insertAdjacentHTML('afterbegin', movRow);
  });
};

const calcDisplayBalance = function (acc) {
  const balance = acc.movements.reduce((acc, mov) => acc + mov, 0);
  acc.balance = balance;
  labelBalance.textContent = `${formatCur(balance, acc.locale, acc.currency)}`;
};

const calcDisplaySummary = function (acc) {
  const sumIn = acc.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = `${formatCur(sumIn, acc.locale, acc.currency)}`;

  const sumOut = acc.movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = `${formatCur(
    Math.abs(sumOut),
    acc.locale,
    acc.currency
  )}`;

  const sumInterest = acc.movements
    .filter(mov => mov > 0)
    .map(int => (int * acc.interestRate) / 100)
    .filter(int => int >= 1)
    .reduce((acc, int) => acc + int, 0);

  labelSumInterest.textContent = `${formatCur(
    sumInterest,
    acc.locale,
    acc.currency
  )}`;
};

const updateUI = function (acc) {
  // Display balance
  calcDisplayBalance(acc);

  // Display movements
  displayMovements(acc);

  // Display summary
  calcDisplaySummary(acc);

  // for options: "numeric", "2-digit", "narrow", "short", "long"
  labelDate.textContent = formatDateAsIntl(new Date(), acc.locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
};

// FAKE LOGIN
// currentAccount = account1;
// updateUI(currentAccount);
// containerApp.style.opacity = 100;

// Events
btnLogin.addEventListener('click', function (e) {
  e.preventDefault();

  currentAccount = findAccount(accounts, inputLoginUsername.value);

  if (currentAccount?.pin === +inputLoginPin.value) {
    // Welcome
    labelWelcome.textContent = `Welcome back, ${
      currentAccount.owner.split(' ')[0]
    }`;

    // Display the info
    containerApp.style.opacity = 100;
    inputLoginUsername.value = inputLoginPin.value = '';

    // Remove blinking cursor from the input elements
    inputLoginUsername.blur();
    inputLoginPin.blur();

    // Start timer
    setTimer();

    updateUI(currentAccount);
  }
});

btnLoan.addEventListener('click', function (e) {
  e.preventDefault();
  const amount = +inputLoanAmount.value;
  if (amount > 0 && currentAccount.movements.some(mov => mov >= amount * 0.1)) {
    setTimeout(function () {
      currentAccount.movements.push(amount);
      currentAccount.movementsDates.push(new Date().toISOString());
      updateUI(currentAccount);
      // Clear input windows
    }, 5000);
    inputLoanAmount.value = '';
    inputLoanAmount.blur();
  }
});

btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  const amount = +inputTransferAmount.value;
  const receiverAcc = findAccount(accounts, inputTransferTo.value);

  if (
    receiverAcc &&
    amount > 0 &&
    amount <= currentAccount.balance &&
    currentAccount.username !== receiverAcc.username
  ) {
    // Update movements
    currentAccount.movements.push(-amount);
    currentAccount.movementsDates.push(new Date());
    receiverAcc.movements.push(amount * curConverter[receiverAcc['currency']]);
    receiverAcc.movementsDates.push(new Date());

    updateUI(currentAccount);

    // Clear input windows
    inputTransferAmount.value = inputTransferTo.value = '';
    inputTransferAmount.blur();
    inputTransferTo.blur();
  }
});

btnClose.addEventListener('click', function (e) {
  e.preventDefault();
  if (
    inputCloseUsername.value === currentAccount.username &&
    +inputClosePin.value === currentAccount.pin
  ) {
    accounts.splice(
      accounts.findIndex(acc => acc.username === currentAccount.username),
      // accounts.indexOf(currentAccount),
      1
    );
    containerApp.style.opacity = 0;
    labelWelcome.textContent = 'Log in to get started';
    inputCloseUsername.value = inputClosePin.value = '';
  }
});

btnSort.addEventListener('click', function () {
  cntSortClicks++;
  let type;
  if (cntSortClicks % 3 === 0) {
    btnSort.textContent = 'SORT';
    displayMovements(currentAccount, null);
  } else if (cntSortClicks % 3 === 1) {
    btnSort.innerHTML = 'SORT&downarrow;';
    displayMovements(currentAccount, 'desc');
  } else {
    btnSort.innerHTML = 'SORT&uparrow; ';
    displayMovements(currentAccount, 'asc');
  }
});

mainEl.addEventListener('click', setTimer);
