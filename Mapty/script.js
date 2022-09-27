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
  #coords;
  #workouts = [];
  #markers = [];
  #initialMapZoom = 13;
  #markerIcon = L.icon({
    iconUrl: 'imgs/location.png',
    iconSize: [45, 50],
    popupAnchor: [0, -45],
    iconAnchor: [22.5, 50],
  });
  #editWorkoutEl;

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    form.addEventListener('keydown', this._newWorkout.bind(this));
    document.addEventListener('keydown', this._hideFormOnKey.bind(this));
    // attaching event listener to input type field
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      this._workoutHandler.bind(this)
    );
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
    this.#map.on('click', this._mapHandler.bind(this));

    this._renderAllWorkoutMarkers();
  }

  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords, {
      icon: this.#markerIcon,
    }).bindPopup(`${workout.emoji} ${workout.description}`, {
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
    });

    if (this.#editWorkoutEl) {
      this.#markers.splice(
        this._getWorkoutIndex(this.#editWorkoutEl),
        0,
        marker
      );
    } else this.#markers.push(marker);

    marker.addTo(this.#map).openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__more">
          <img src="imgs/more.png" class="workout__more--btn" alt="Menu"/>
          <div class="workout__more--dropdown-content hidden visuallyhidden">
            <button class="workout__more--content-btn" id="edit">Edit</button>
            <button class="workout__more--content-btn" id="delete">Delete</button>
          </div>
        </div>
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

    const el = this.#editWorkoutEl ? this.#editWorkoutEl : form;

    el.insertAdjacentHTML('afterend', html);
  }

  _workoutHandler(marker) {
    // When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const targetEl = marker.target;
    const workoutEl = targetEl.closest('li');

    if (!workoutEl) return;

    if (targetEl.closest('.workout__more')) {
      this._toggleMoreMenu(workoutEl);
      if (targetEl.classList.contains('workout__more--content-btn')) {
        if (targetEl.id === 'edit') this._editWorkout(workoutEl);
        if (targetEl.id === 'delete') this._deleteWorkout(workoutEl);
      }
    } else this._moveToMarker(workoutEl);
  }

  _moveToMarker(workoutEl) {
    const workout = this._findWorkout(workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#initialMapZoom, {
      animate: true,
      pan: {
        duration: 0.5,
      },
    });
  }

  _editWorkout(workoutEl) {
    const workout = this._findWorkout(workoutEl.dataset.id);
    this.#editWorkoutEl = workoutEl;

    const toggler = function (inputEl) {
      if (inputEl.closest('div').classList.contains('form__row--hidden'))
        this._toggleElevationField();
    };

    this.#coords = workout.coords;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;
    inputType.value = workout.type;

    if (workout.type === 'running') {
      inputCadence.value = workout.cadence;
      toggler.call(this, inputCadence);
    }
    if (workout.type === 'cycling') {
      inputElevation.value = workout.elevation;
      toggler.call(this, inputElevation);
    }

    this._showForm();
  }

  _deleteWorkout(workoutEl) {
    // 1. Deleting from the list
    const workoutInd = this._getWorkoutIndex(workoutEl);

    if (workoutInd > -1) {
      this.#workouts.splice(workoutInd, 1);
      // Deleting a marker
      this.#map.removeLayer(this.#markers[workoutInd]);
      this.#markers.splice(workoutInd, 1);
    }
    // 2. Set a new local storage
    this._setLocalStorage();

    // 2. Deleting a workout from the sidebar
    workoutEl.remove();
  }

  // more menu button for workout
  _toggleMoreMenu(workoutEl) {
    const moreContentEl = workoutEl.querySelector(
      '.workout__more--dropdown-content'
    );

    if (moreContentEl.classList.contains('hidden')) {
      moreContentEl.classList.remove('hidden');
      setTimeout(() => moreContentEl.classList.remove('visuallyhidden'), 5);
    } else {
      moreContentEl.classList.add('visuallyhidden');
      moreContentEl.addEventListener(
        'transitionend',
        () => {
          moreContentEl.classList.add('hidden');
        },
        {
          once: true,
          capture: false,
        }
      );
    }
  }

  _toggleElevationField() {
    inputCadence.closest('div').classList.toggle('form__row--hidden');
    inputElevation.closest('div').classList.toggle('form__row--hidden');
  }

  // show the input form when the user clicks on the map
  _mapHandler(mapE) {
    this.#coords = [mapE.latlng.lat, mapE.latlng.lng];

    this._showForm();
  }

  _showForm() {
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 5);
  }

  _hideFormOnKey(e) {
    if (e.key === 'Escape' && !form.classList.contains('hidden'))
      this._hideForm();
  }

  _newWorkout(e) {
    // for Safari browser "submit" doesn't work
    if (e.key !== 'Enter') return;

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

    let workout;
    const type = inputType.value;
    const [lat, lng] = this.#coords;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !allPositive(duration, distance, cadence) ||
        !allNumeric(duration, distance, cadence)
      )
        return alert('Inputs have to be positive!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !allPositive(duration, distance) ||
        !allNumeric(duration, distance, elevation)
      )
        return alert('Inputs have to be positive!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Render workout on list
    this._renderWorkout(workout);

    // update workout list
    if (this.#editWorkoutEl) {
      this._deleteWorkout(this.#editWorkoutEl);
      this.#workouts.splice(
        this._getWorkoutIndex(this.#editWorkoutEl),
        0,
        workout
      );
    }
    // Add new object to workout array
    else this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();

    this.#editWorkoutEl = null;
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this._renderAllWorkouts();
  }

  // find workout by id
  _findWorkout(id) {
    return this.#workouts.find(workout => workout.id === id);
  }

  _renderAllWorkouts() {
    this.#workouts.forEach(work => this._renderWorkout(work));
  }

  _renderAllWorkoutMarkers() {
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _getWorkoutIndex(workoutEl) {
    return this.#workouts.indexOf(this._findWorkout(workoutEl.dataset.id));
  }

  reset() {
    // clear local storage and reload the page
    localStorage.clear();
    location.reload();
  }
}

const app = new App();
