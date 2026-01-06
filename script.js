const API_KEY = "1906d96e96a649b380265431260601";

const weatherInfo = document.getElementById("weather-info");
const errorBox = document.getElementById("error");
const loading = document.getElementById("loading");
const cityInput = document.getElementById("city-input");
const autocompleteDropdown = document.getElementById("autocomplete-dropdown");

let autocompleteTimeout;

cityInput.addEventListener("input", function() {
  const query = this.value.trim();
  
  if (query.length < 1) {
    autocompleteDropdown.classList.remove("show");
    return;
  }
  
  clearTimeout(autocompleteTimeout);
  autocompleteTimeout = setTimeout(() => {
    searchCities(query);
  }, 300);
});

document.addEventListener("click", function(e) {
  if (!e.target.closest(".search-input-wrapper")) {
    autocompleteDropdown.classList.remove("show");
  }
});

async function searchCities(query) {
  try {
    const url = `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`;
    const response = await fetch(url);
    const cities = await response.json();
    
    if (cities.length > 0) {
      displayAutocomplete(cities);
    } else {
      autocompleteDropdown.classList.remove("show");
    }
  } catch (err) {
    console.error("Autocomplete error:", err);
  }
}

function displayAutocomplete(cities) {
  autocompleteDropdown.innerHTML = "";
  
  cities.slice(0, 5).forEach(city => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.innerHTML = `
      <div class="city-name-auto">${city.name}</div>
      <div class="city-details">${city.region}, ${city.country}</div>
    `;
    
    item.addEventListener("click", () => {
      cityInput.value = city.name;
      autocompleteDropdown.classList.remove("show");
      getWeather();
    });
    
    autocompleteDropdown.appendChild(item);
  });
  
  autocompleteDropdown.classList.add("show");
}

async function getWeatherByCity(cityName) {
  showLoading();

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${cityName}&days=7&aqi=yes&alerts=no`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || "City not found");
    }

    displayWeather(data);
  } catch (err) {
    showError(err.message);
  }
}

function getWeather() {
  const cityInput = document
    .getElementById("city-input")
    .value.trim();

  if (!cityInput) return;

  getWeatherByCity(cityInput);
}

function displayWeather(data) {
  weatherInfo.style.display = "grid";
  loading.style.display = "none";
  errorBox.style.display = "none";

  
  document.getElementById("city-name").textContent =
    data.location.name;

  const localDateTime = new Date(data.location.localtime);
  const currentHours = localDateTime.getHours();
  const minutes = localDateTime.getMinutes();
  const ampm = currentHours >= 12 ? 'PM' : 'AM';
  const displayHours = currentHours % 12 || 12;
  const formattedTime = `${localDateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  
  document.getElementById("date").textContent = formattedTime;

  document.getElementById("temperature").textContent =
    `${Math.round(data.current.temp_c)}°C`;

  document.getElementById("weather-description").textContent =
    data.current.condition.text;

  document.getElementById("weather-icon").src =
    "https:" + data.current.condition.icon;

  const currentSnapshot = document.querySelector(".current-snapshot");
  const condition = data.current.condition.text.toLowerCase();
  
  if (condition.includes("sunny") || condition.includes("clear")) {
    currentSnapshot.style.backgroundImage = "url('https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=1200')";
  } else if (condition.includes("rain")) {
    currentSnapshot.style.backgroundImage = "url('https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=1200')";
  } else if (condition.includes("cloud")) {
    currentSnapshot.style.backgroundImage = "url('https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200')";
  } else if (condition.includes("snow")) {
    currentSnapshot.style.backgroundImage = "url('https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1200')";
  } else {
    currentSnapshot.style.backgroundImage = "url('https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200')";
  }


  document.getElementById("feels-like").textContent =
    `${Math.round(data.current.feelslike_c)}°C`;

  document.getElementById("humidity").textContent =
    `${data.current.humidity}%`;

  document.getElementById("wind-speed").textContent =
    `${Math.round(data.current.wind_kph)} km/h`;

  document.getElementById("chance-rain").textContent =
    `${data.forecast.forecastday[0].day.daily_chance_of_rain}%`;

  const hourlyContainer = document.getElementById("hourly-list");
  hourlyContainer.innerHTML = "";

  const cityLocalTime = new Date(data.location.localtime);
  const currentHourInCity = cityLocalTime.getHours();

  for (let i = 0; i < 24; i++) {
    const targetHour = (currentHourInCity + i) % 24;
    
  
    const daysAhead = Math.floor((currentHourInCity + i) / 24);
    const forecastDayIndex = Math.min(daysAhead, data.forecast.forecastday.length - 1);
    
    const hourData = data.forecast.forecastday[forecastDayIndex].hour[targetHour];

    const hourlyItem = document.createElement("div");
    hourlyItem.className = "hourly-item";

    const displayHour = targetHour === 0 ? 12 : targetHour > 12 ? targetHour - 12 : targetHour;
    const ampm = targetHour >= 12 ? 'PM' : 'AM';
    const timeStr = `${displayHour} ${ampm}`;

    hourlyItem.innerHTML = `
      <span class="hourly-time">${timeStr}</span>
      <img class="hourly-icon" src="https:${hourData.condition.icon}" alt="Weather">
      <span class="hourly-temp">${Math.round(hourData.temp_c)}°C</span>
    `;

    hourlyContainer.appendChild(hourlyItem);
  }

  const dailyContainer = document.getElementById("daily-forecast");
  dailyContainer.innerHTML = "";

  
  data.forecast.forecastday.slice(1, 7).forEach((day) => {
    const dailyItem = document.createElement("div");
    dailyItem.className = "daily-item";

    const dayName = new Date(day.date).toLocaleDateString("en-US", {
      weekday: "short",
    });

    dailyItem.innerHTML = `
      <h4>${dayName}</h4>
      <img src="https:${day.day.condition.icon}" alt="Weather Icon">
      <p>${Math.round(day.day.maxtemp_c)}° / ${Math.round(day.day.mintemp_c)}°</p>
    `;

    dailyContainer.appendChild(dailyItem);
  });
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    showLoading();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        getWeatherByCity(`${lat},${lon}`);
      },
      (error) => {
        showError("Unable to get your location. Please enter a city name.");
      }
    );
  } else {
    showError("Geolocation is not supported by your browser.");
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
  loading.style.display = "none";
  weatherInfo.style.display = "none";
}

function showLoading() {
  loading.style.display = "block";
  errorBox.style.display = "none";
  weatherInfo.style.display = "none";
}

document.getElementById("city-input").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    getWeather();
  }
});

window.addEventListener("load", () => {
  document.getElementById("city-input").value = "New York";
  getWeatherByCity("New York");
});