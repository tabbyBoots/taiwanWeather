# Taiwan Weather App

A Vue.js application to display a 7-day weather forecast for Taipei City districts, featuring a dynamic chart and detailed table view.

## Features

*   **District Selection:** Easily select different Taipei City districts to view their weather forecasts.
*   **Interactive Chart:** Visualize 7-day temperature (high and low) and precipitation probability in a clear, interactive chart powered by Chart.js.
*   **Detailed Table View:** Access comprehensive weather information in a tabular format.
*   **Toggle Details:** Expand or collapse the table to show more detailed weather parameters like dew point, wind, comfort index, and more.
*   **Auto-Refresh:** Weather data automatically refreshes hourly to ensure up-to-date information.

## Technologies Used

*   **Vue.js 3:** The progressive JavaScript framework for building user interfaces.
*   **Vite:** A fast and opinionated build tool for modern web projects.
*   **Axios:** A promise-based HTTP client for making API requests.
*   **Chart.js:** A flexible JavaScript charting library for creating various types of charts.
*   **Vue-Chartjs:** Vue.js wrappers for Chart.js.

## Setup and Installation

To get this project up and running on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/taiwanWeather.git
    cd taiwanWeather
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the development server, and you can view the application in your browser, usually at `http://localhost:5173`.

4.  **Build for production:**
    ```bash
    npm run build
    ```
    This command will compile and minify the project for production deployment.

## API Key

This application uses the Central Weather Administration (CWA) API for weather data. The API key is currently embedded directly in `src/components/Weather.vue`. For production environments or if you plan to modify the application, it is highly recommended to:

1.  **Obtain your own API key** from the [CWA Open Data Platform](https://opendata.cwa.gov.tw/).
2.  **Securely manage your API key** by using environment variables or a proxy server to avoid exposing it in your frontend code.