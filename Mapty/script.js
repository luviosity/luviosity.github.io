'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  emoji = '🏃‍♂️';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence; // in step/min
    this._calcPace();
    this._setDescription();
  }

  _calcPace() {
    this.pace = this.duration / this.distance; // min/km
  }
}

class Cycling extends Workout {
  type = 'cycling';
  emoji = '🚴‍♀️';

  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation; // in meters 7
    this._calcSpeed();
    this._setDescription();
  }

  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60); // km/h
  }
}

// APPLICATION
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #initialMapZoom = 13;
  #markerIcon = L.icon({
    iconUrl: 'imgs/location.png',
    iconSize: [45, 50],
    // iconAnchor: [22, 94],
    popupAnchor: [0, -20],
    // shadowUrl: 'my-icon-shadow.png',
    // shadowSize: [68, 95],
    // shadowAnchor: [22, 94],
  });

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    // attaching event listener to input type field
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
  }

  // get user current position
  _getPosition() {
    // if a browser is old we have to be sure that it has the navigator.geolocation property
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("Can't get your current position!");
      }
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#initialMapZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords, {
      icon: this.#markerIcon,
    })
      .addTo(this.#map)
      .bindPopup(`${workout.emoji} ${workout.description}`, {
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      })
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <button class="workout__more--btn">
          <img src="imgs/more.png" class="workout__more--img" alt="Options"/>
        </button>
        <div class="workout__details">
          <span class="workout__icon">${workout.emoji}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">m</span>
        </div>
      </li> 
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToMarker(marker) {
    // When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const workoutEl = marker.target.closest('li');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#initialMapZoom, {
      pan: {
        duration: 0.5,
      },
    });
  }

  _toggleElevationField() {
    inputCadence.closest('div').classList.toggle('form__row--hidden');
    inputElevation.closest('div').classList.toggle('form__row--hidden');
  }

  // show the input form when the user clicks on the map
  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    // TODO: why???
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _newWorkout(e) {
    e.preventDefault();
    // two helper functions to check inputs
    // checking if all inputs are positive
    const allPositive = function (...inputs) {
      return inputs.every(inp => inp > 0);
    };

    // checking if all inputs are numeric
    const allNumeric = function (...inputs) {
      return inputs.every(inp => Number.isFinite(inp));
    };

    // consolidate all checking
    // const validInputs = function (numArr, posArr = []) {
    //   if (posArr.length === 0) posArr = [...numArr];
    //   if (!allPositive(...posArr) || !allNumeric(...numArr))
    //     return alert('Inputs have to be positive numbers!');
    // };

    let workout;
    const type = inputType.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !allPositive(duration, distance, cadence) ||
        !allNumeric(duration, distance, cadence)
      )
        return alert('Inputs have to be positive!');
      // validInputs([duration, distance, cadence]);

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !allPositive(duration, distance) ||
        !allNumeric(duration, distance, elevation)
      )
        return alert('Inputs have to be positive!');
      // validInputs([duration, distance, elevation], [duration, distance]);

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage(this.#workouts);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
  }

  reset() {
    // clear local storage and reload the page
    localStorage.clear();
    location.reload();
  }
}

const app = new App();
