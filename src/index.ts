import { MCPServer } from "mcp-use";
import { z } from "zod";

const server = new MCPServer({
  name: "ryan-mcp",
  version: "1.0.0",
});

server.tool(
  {
    name: "fetch-weather",
    description: "Fetch real-time weather for a city",
    inputSchema: z.object({
      city: z.string().describe("The city to fetch weather for"),
    }),
  },
  async ({ city }) => {
    try {
      const geoURL =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

      const geoResponse = await fetch(geoURL);

      if (!geoResponse.ok) {
        throw new Error("Unable to find city coordinates");
      }

      const geoData = await geoResponse.json();

      if (!geoData.results?.length) {
        return {
          content: [{ type: "text", text: `City not found: ${city}` }],
        };
      }

      const location = geoData.results[0];

      const weatherURL =
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`;

      const weatherResponse = await fetch(weatherURL);

      if (!weatherResponse.ok) {
        throw new Error("Unable to fetch weather");
      }

      const weatherData = await weatherResponse.json();
      const weather = weatherData.current;

      if (!weather) {
        throw new Error("Weather data unavailable");
      }

      return {
        content: [
          {
            type: "text",
            text:
              `Current weather in ${location.name}, ${location.country}:\n` +
              `Temperature: ${weather.temperature_2m}°F\n` +
              `Feels like: ${weather.apparent_temperature}°F\n` +
              `Humidity: ${weather.relative_humidity_2m}%\n` +
              `Precipitation: ${weather.precipitation} mm\n` +
              `Wind speed: ${weather.wind_speed_10m} mph\n` +
              `Weather code: ${weather.weather_code}\n` +
              `Observation time: ${weather.time}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching weather: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

export default server;

await server.listen(3000);

