import dayjs from "dayjs";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();
// Defined an interface for the Coordinates object

interface Coordinates {
  lat: number;
  lon: number;
}
// Defined a class for the Weather object

class Weather {
  city: string;
  date: string;
  tempF: number;
  windSpeed: number;
  humidity: number;
  icon: string;
  iconDescription: string;
  constructor(
    city: string,
    date: string,
    tempF: number,
    windSpeed: number,
    humidity: number,
    icon: string,
    iconDescription: string
  ) {
    this.city = city;
    this.date = date;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
    this.icon = icon;
    this.iconDescription = iconDescription;
  }
}
// Completed the WeatherService class
class WeatherService {
  private baseURL?: string;

  private apiKey?: string;

  private city = "";
  // TODO: Create fetchLocationData method
  // Defined the baseURL, API key, and city name properties
  constructor() {
    this.baseURL = process.env.API_BASE_URL || "";

    this.apiKey = process.env.API_KEY || "";
  }
  // Created fetchLocationData method
  private async fetchLocationData(): Promise<Coordinates> {
    try {
      if (!this.baseURL || !this.apiKey) {
        throw new Error("API base URL or API key not found");
      }

      const response = await fetch(this.buildGeocodeQuery());
      const data: Coordinates[] = (await response.json()) as Coordinates[];
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid location data received");
      }
      return data[0];
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // TODO: Create buildGeocodeQuery method
  private buildGeocodeQuery(): string {
    const geoQuery = `${this.baseURL}/geo/1.0/direct?q=${this.city}&appid=${this.apiKey}`;
    return geoQuery;
  }

  // TODO: Create buildWeatherQuery method
  private buildWeatherQuery(coordinates: Coordinates): string {
    const weatherQuery = `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&units=imperial&appid=${this.apiKey}`;
    return weatherQuery;
  }

  // TODO: Create fetchAndDestructureLocationData method
  private async fetchAndDestructureLocationData(): Promise<Coordinates> {
    return await this.fetchLocationData();
  }

  // TODO: Create fetchWeatherData method
  private async fetchWeatherData(coordinates: Coordinates): Promise<Weather[]> {
    try {
      const response = await fetch(this.buildWeatherQuery(coordinates));
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      const weatherData: { list: any[] } = (await response.json()) as any;
      if (!weatherData || !weatherData.list) {
        throw new Error("weather data not found");
      }
      if (!Array.isArray(weatherData.list) || weatherData.list.length === 0) {
        throw new Error("Invalid weather data received");
      }
      const currentWeather: Weather = this.parseCurrentWeather(
        weatherData.list[0]
      );
      const forecast: Weather[] = this.buildForecastArray(
        currentWeather,
        weatherData.list
      );
      return forecast;
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  }

  // TODO: Build parseCurrentWeather method
  private parseCurrentWeather(response: any): Weather {
    const parsedDate = dayjs.unix(response.dt).format("M/D/YYYY");

    const currentWeather = new Weather(
      this.city,
      parsedDate,
      response.main.temp,
      response.wind.speed,
      response.main.humidity,
      response.weather[0].icon,
      response.weather[0].description || response.weather[0].main
    );

    return currentWeather;
  }

  // TODO: Complete buildForecastArray method
  private buildForecastArray(
    currentWeather: Weather,
    weatherData: any[]
  ): Weather[] {
    const weatherForecast: Weather[] = [currentWeather];

    const filteredWeatherData = weatherData.filter((data: any) => {
      return data.dt_txt.includes("12:00:00");
    });

    for (const day of filteredWeatherData) {
      weatherForecast.push(
        new Weather(
          this.city,
          dayjs.unix(day.dt).format("M/D/YYYY"),
          day.main.temp,
          day.wind.speed,
          day.main.humidity,
          day.weather[0].icon,
          day.weather[0].description || day.weather[0].main
        )
      );
    }

    return weatherForecast;
  }

  // TODO: Complete getWeatherForCity method
  async getWeatherForCity(city: string): Promise<Weather[]> {
    try {
      this.city = city;
      const coordinates = await this.fetchAndDestructureLocationData();
      if (coordinates) {
        const weather = await this.fetchWeatherData(coordinates);
        return weather;
      }
      throw new Error("Coordinates not found");
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new WeatherService();
