'use strict';

// prettier-ignore
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //in km wise
    this.duration = duration; //in mins
  }

  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    console.log('desc', this.description);
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    console.log('pace', this.pace);
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  //description = 'Running on April 21'
  constructor(coords, distance, duration, eleveationgain) {
    super(coords, distance, duration);
    this.eleveationgain = eleveationgain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //min/km
    this.speed = this.distance / (this.duration / 60);
    console.log('speed', this.speed);
    return this.speed;
  }
}

// const run = new Running([39, -12], 54, 24, 178);
// const cycle = new Cycling([39, -12], 54, 24, 523);

class App {
  #mapEvent;
  #map;
  #workout = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._neworkout.bind(this));
    inputType.addEventListener('change', this.toggleElevationField);
    containerWorkouts.addEventListener('click', this.moveToMarker.bind(this));

    this._getLocalStorage();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        console.log('Couldnt get position');
      });
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // L.marker(coords)
    //   .addTo(this.#map)
    //   .bindPopup('Your Current Location')
    //   .openPopup();

    //handler clicks on map form appeards
    this.#map.on('click', this.showForm.bind(this));

    this.#workout.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  showForm(mapEt) {
    this.#mapEvent = mapEt;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // whenever pressed enter the popups appears
  _neworkout(e) {
    e.preventDefault();

    const ValidIputs = (...inputs) => {
      const isValid = inputs.every(inp => {
        return Number.isFinite(inp);
      });
      return isValid;
    };

    const isAllPositive = (...inputs) => {
      const isPos = inputs.every(inp => {
        return inp > 0;
      });

      return isPos;
    };

    // const isAllPositive  = (...input)=>input.every(inp => inp > 0);

    // const ValidIputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    //fetching data from form
    const type = inputType.value;
    const distance = +inputDistance.value; //converting to a number
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //check data is valid

    //if workout is running , create running object.

    if (type === 'running') {
      const cadance = +inputCadence.value;
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadance)
        !ValidIputs(distance, duration, cadance) ||
        !isAllPositive(distance, duration, cadance)
      )
        return alert('Inputs have to be a positive numbers');
      workout = new Running([lat, lng], distance, duration, cadance);
    }

    //if workout is cycling , create running object.
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (
        !ValidIputs(distance, duration, elevationGain) ||
        !isAllPositive(distance, duration)
      ) {
        alert('Inputs have to be a positive numbers');
      }
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    //Add new objects to workout array
    this.#workout.push(workout);
    console.log(this.#workout);

    //redner workput marker on map
    this._renderWorkoutMarker(workout);
    this._renderWorkoutList(workout);

    //clear input fields + hide form
    this._hideForm();

    //set local storage of all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkoutList(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type == 'running') {
      console.log('inside r');
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>`;
    }

    if (workout.type === 'cycling') {
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">spm</span>
    </div>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  moveToMarker(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workoutData = this.#workout.find(work => {
      return work.id === workoutEl.dataset.id;
    });

    this.#map.setView(workoutData.coords, 13, {
      animate: true,
      duration: 1,
    });

    //workoutData.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }
  _getLocalStorage() {
    const da = JSON.parse(localStorage.getItem('workouts'));
    console.log(da);
    if (!da) return;

    this.#workout = da;

    this.#workout.forEach(work => {
      this._renderWorkoutList(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
