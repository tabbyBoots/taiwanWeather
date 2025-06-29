<template>
  <div class="weather-container">
    <h1>台北市各區一週天氣狀況</h1>
    <div class="controls-container">
      <select id="location-select" v-model="selectedLocation">
        <option value="松山區">松山區</option>
        <option value="信義區">信義區</option>
        <option value="大安區">大安區</option>
        <option value="中山區">中山區</option>
        <option value="中正區">中正區</option>
        <option value="大同區">大同區</option>
        <option value="萬華區">萬華區</option>
        <option value="文山區">文山區</option>
        <option value="南港區">南港區</option>
        <option value="內湖區">內湖區</option>
        <option value="士林區">士林區</option>
        <option value="北投區">北投區</option>
      </select>
      <button v-if="processedData.tableData && processedData.tableData.length" @click="showTable = !showTable">
        {{ showTable ? 'Hide Table' : 'Show Table' }}
      </button>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-if="error">{{ error }}</div>
    <div v-if="processedData.tableData && processedData.tableData.length" class="weather-data">
      <WeatherChart :chartData="chartConfig" />
      <div v-if="showTable">
        <h2>{{ selectedLocation }}</h2>
        <table>
          <thead>
          <tr>
            <th>時間</th>
            <th>溫度</th>
            <th>相對濕度</th>
            <th>體感溫度</th>
            <th>降雨機率 (12h)</th>
            <th>最高溫度</th>
            <th>最低溫度</th>
            <th>紫外線指數</th>
            <th>天氣現象</th>
            <th v-if="showDetails">露點溫度</th>
            <th v-if="showDetails">風向風速</th>
            <th v-if="showDetails">舒適度</th>
            <th v-if="showDetails">最高舒適度</th>
            <th v-if="showDetails">最低舒適度</th>
            <th v-if="showDetails">最高體感溫度</th>
            <th v-if="showDetails">最低體感溫度</th>
            <th v-if="showDetails">天氣描述</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in processedData.tableData" :key="index">
            <td>{{ item.time }}</td>
            <td>{{ item.T }}</td>
            <td>{{ item.RH }}</td>
            <td>{{ item.AT }}</td>
            <td>{{ item.PoP }}</td>
            <td>{{ item.MaxT }}</td>
            <td>{{ item.MinT }}</td>
            <td>{{ item.UVI }}</td>
            <td>{{ item.Wx }}</td>
            <td v-if="showDetails">{{ item.Td }}</td>
            <td v-if="showDetails">{{ item.Wind }}</td>
            <td v-if="showDetails">{{ item.CI }}</td>
            <td v-if="showDetails">{{ item.MaxCI }}</td>
            <td v-if="showDetails">{{ item.MinCI }}</td>
            <td v-if="showDetails">{{ item.MaxAT }}</td>
            <td v-if="showDetails">{{ item.MinAT }}</td>
            <td v-if="showDetails">{{ item.WeatherDescription }}</td>
          </tr>
        </tbody>
        </table>
        <button @click="showDetails = !showDetails">
          {{ showDetails ? 'Hide Details' : 'Show Details' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import axios from 'axios';
import WeatherChart from './WeatherChart.vue';

const weatherData = ref(null);
const loading = ref(true);
const error = ref(null);
const selectedLocation = ref('內湖區'); // 預設位置為內湖
const showDetails = ref(false); // New ref to control details visibility
const showTable = ref(false); // New ref to control table visibility
let refreshInterval = null; // Auto-refresh interval

const fetchWeatherData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get(`/api/v1/rest/datastore/F-D0047-063?Authorization=CWA-9B472F71-2A99-4308-BF3B-05C3C27E0DE5&LocationName=${selectedLocation.value}`);
    if (
      response.data &&
      response.data.records &&
      Array.isArray(response.data.records.Locations) &&
      response.data.records.Locations.length > 0
    ) {
      const firstLocationsEntry = response.data.records.Locations[0];
      if (
        firstLocationsEntry &&
        Array.isArray(firstLocationsEntry.Location) &&
        firstLocationsEntry.Location.length > 0
      ) {
        const firstLocation = firstLocationsEntry.Location[0];
        if (
          firstLocation &&
          Array.isArray(firstLocation.WeatherElement) &&
          firstLocation.WeatherElement.length > 0
        ) {
          weatherData.value = firstLocation;
        } else {
          error.value = 'No weather data found for the specified location or weather elements are missing.';
        }
      } else {
        error.value = 'No weather data found for the specified location.';
      }
    } else {
      error.value = 'No weather data found for the specified location.';
    }
  } catch (err) {
    console.error('Error fetching weather data:', err);
    error.value = 'Failed to fetch weather data. Check console for details.';
  } finally {
    loading.value = false;
  }
};

const processedData = computed(() => {
  if (!weatherData.value) return [];

  const dataByTime = {};

  const dailyData = {}; // New object to store aggregated daily data

  const elementValueKeyMap = {
    "平均溫度": "Temperature",
    "最高溫度": "Temperature",
    "最低溫度": "Temperature",
    "平均露點溫度": "DewPoint",
    "平均相對濕度": "RelativeHumidity",
    "最高體感溫度": "ApparentTemperature",
    "最低體感溫度": "ApparentTemperature",
    "最大舒適度指數": "ComfortIndex",
    "最小舒適度指數": "ComfortIndex",
    "風速": "WindSpeed",
    "風向": "WindDirection",
    "12小時降雨機率": "ProbabilityOfPrecipitation",
    "天氣現象": "Weather",
    "紫外線指數": "UVIndex",
    "天氣預報綜合描述": "WeatherDescription"
  };

  const elementUnitKeyMap = {
    "平均溫度": "TemperatureUnit",
    "最高溫度": "TemperatureUnit",
    "最低溫度": "TemperatureUnit",
    "平均露點溫度": "DewPointUnit",
    "平均相對濕度": "RelativeHumidityUnit",
    "最高體感溫度": "ApparentTemperatureUnit",
    "最低體感溫度": "ApparentTemperatureUnit",
    "風速": "WindSpeedUnit",
    "紫外線指數": "UVIndexUnit"
  };

  weatherData.value.WeatherElement.forEach(element => {
    const elementName = element.ElementName;
    const valueKey = elementValueKeyMap[elementName];
    const unitKey = elementUnitKeyMap[elementName];

    if (Array.isArray(element.Time)) {
      element.Time.forEach(time => {
        const startDate = new Date(time.StartTime);
        const endDate = new Date(time.EndTime);
        const dateKey = startDate.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            date: `${startDate.getMonth() + 1}/${startDate.getDate()}`,
            MaxT_day: -Infinity,
            MinT_night: Infinity,
            PoP_values: [], // Store all PoP values for the day
            // Initialize other daily aggregated values if needed
          };
        }

        let value = '';
        if (time.ElementValue && time.ElementValue.length > 0) {
          const elementValueObj = time.ElementValue[0];

          if (elementName === '最高溫度') {
            console.log('Processing 最高溫度:', elementValueObj); // New log
            // Check if it's a day period (e.g., 06:00-18:00)
            if (startDate.getHours() >= 6 && startDate.getHours() < 18) {
              dailyData[dateKey].MaxT_day = Math.max(dailyData[dateKey].MaxT_day, parseFloat(elementValueObj.MaxTemperature));
            }
          } else if (elementName === '最低溫度') {
            console.log('Processing 最低溫度:', elementValueObj); // New log
            // Check if it's a night period (e.g., 18:00-06:00 next day)
            if (startDate.getHours() >= 18 || startDate.getHours() < 6) {
              dailyData[dateKey].MinT_night = Math.min(dailyData[dateKey].MinT_night, parseFloat(elementValueObj.MinTemperature));
            }
          } else if (elementName === '12小時降雨機率') {
            dailyData[dateKey].PoP_values.push(parseFloat(elementValueObj.ProbabilityOfPrecipitation));
          }

          // Existing logic for dataByTime (for table display)
          if (!dataByTime[time.StartTime]) {
            const month = startDate.getMonth() + 1;
            const day = startDate.getDate();
            let period = '';

            if (startDate.getHours() === 6 && endDate.getHours() === 18) {
              period = '早上';
            } else if (startDate.getHours() === 18 && endDate.getHours() === 6) {
              period = '晚上';
            } else if (startDate.getHours() === 12 && endDate.getHours() === 18) {
              period = '早上';
            } else if (startDate.getHours() === 0 && endDate.getHours() === 6) {
              period = '晚上';
            }

            dataByTime[time.StartTime] = { time: `${month}/${day}${period}` };
          }

          if (elementName === '天氣預報綜合描述') {
            value = elementValueObj.WeatherDescription || '';
          } else if (elementName === '風速') {
            value = elementValueObj.WindSpeed || '';
            if (elementValueObj.WindSpeedUnit) {
              value += ` ${elementValueObj.WindSpeedUnit}`;
            }
          } else if (elementName === '風向') {
            value = elementValueObj.WindDirection || '';
          } else if (valueKey && elementValueObj[valueKey] !== undefined) {
            value = elementValueObj[valueKey];
            if (unitKey && elementValueObj[unitKey]) {
              value += ` ${elementValueObj[unitKey]}`;
            }
          } else {
            for (const key in elementValueObj) {
              if (Object.prototype.hasOwnProperty.call(elementValueObj, key) && typeof elementValueObj[key] === 'string' && elementValueObj[key] !== '') {
                value = elementValueObj[key];
                break;
              }
            }
          }
        }
        dataByTime[time.StartTime][elementName] = value;
      });
    }
  });

  // Convert dailyData object to an array for chart display
  const finalChartData = Object.values(dailyData).map(item => {
    // Filter out initial -Infinity and Infinity values if no data was found for the period
    const maxT = item.MaxT_day === -Infinity ? null : item.MaxT_day;
    const minT = item.MinT_night === Infinity ? null : item.MinT_night;
    const maxPoP = item.PoP_values.length > 0 ? Math.max(...item.PoP_values) : null;
    return {
      time: item.date,
      MaxT: maxT,
      MinT: minT,
      PoP: maxPoP,
    };
  });

  // Sort finalChartData by date
  finalChartData.sort((a, b) => new Date(a.time) - new Date(b.time));

  // Fix missing temperature data by using previous day's temperature
  for (let i = 0; i < finalChartData.length; i++) {
    if (finalChartData[i].MaxT === null && i > 0) {
      finalChartData[i].MaxT = finalChartData[i - 1].MaxT;
    }
    if (finalChartData[i].MinT === null && i > 0) {
      finalChartData[i].MinT = finalChartData[i - 1].MinT;
    }
  }

  const finalProcessedData = Object.values(dataByTime).map(item => {
    const newItem = { ...item };

    // Map to simplified keys for table display
    newItem.T = newItem['平均溫度'];
    newItem.Td = newItem['平均露點溫度'];
    newItem.RH = newItem['平均相對濕度'];
    newItem.MaxT = newItem['最高溫度'];
    newItem.MinT = newItem['最低溫度'];
    newItem.PoP = newItem['12小時降雨機率'];
    newItem.Wx = newItem['天氣現象'];
    newItem.UVI = newItem['紫外線指數'];
    newItem.WeatherDescription = newItem['天氣預報綜合描述'];

    // Combine Wind Direction and Speed
    if (newItem['風向'] && newItem['風速']) {
      newItem.Wind = `${newItem['風向']} ${newItem['風速']}`;
    } else if (newItem['風向']) {
      newItem.Wind = newItem['風向'];
    } else if (newItem['風速']) {
      newItem.Wind = newItem['風速'];
    } else {
      newItem.Wind = '';
    }

    // Set AT and CI from MaxAT and MaxCI if they exist
    newItem.AT = newItem['最高體感溫度'];
    newItem.CI = newItem['最大舒適度指數'];

    // Clean up original keys
    delete newItem['平均溫度'];
    delete newItem['最高溫度'];
    delete newItem['最低溫度'];
    delete newItem['平均露點溫度'];
    delete newItem['平均相對濕度'];
    delete newItem['最高體感溫度'];
    delete newItem['最低體感溫度'];
    delete newItem['最大舒適度指數'];
    delete newItem['最小舒適度指數'];
    delete newItem['風速'];
    delete newItem['風向'];
    delete newItem['12小時降雨機率'];
    delete newItem['天氣現象'];
    delete newItem['紫外線指數'];
    delete newItem['天氣預報綜合描述'];

    return newItem;
  });

  console.log('finalChartData:', finalChartData); // Re-adding this log

  return {
    tableData: finalProcessedData,
    chartData: finalChartData,
  };
});

const chartConfig = computed(() => {
  if (!processedData.value.chartData) return {};
  const labels = processedData.value.chartData.map(item => item.time);
  const maxTempData = processedData.value.chartData.map(item => item.MaxT);
  const minTempData = processedData.value.chartData.map(item => item.MinT);
  const popData = processedData.value.chartData.map(item => item.PoP);

  return {
    labels: labels,
    datasets: [
      {
        label: '最高溫度',
        backgroundColor: '#ff6384',
        borderColor: '#ff6384',
        data: maxTempData,
        yAxisID: 'temperature',
      },
      {
        label: '最低溫度',
        backgroundColor: '#36a2eb',
        borderColor: '#36a2eb',
        data: minTempData,
        yAxisID: 'temperature',
      },
      {
        label: '降雨機率',
        backgroundColor: '#cc65fe',
        borderColor: '#cc65fe',
        data: popData,
        type: 'bar',
        yAxisID: 'pop',
      },
    ],
  };
});

onMounted(() => {
  fetchWeatherData();
  // Set up auto-refresh every hour (3600000 milliseconds)
  refreshInterval = setInterval(() => {
    fetchWeatherData();
  }, 3600000);
});

watch(selectedLocation, () => {
  fetchWeatherData();
});

onBeforeUnmount(() => {
  // Clean up the interval when component is unmounted
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.weather-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: #ffffff;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.controls-container {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.controls-container select {
  padding: 12px 20px;
  font-size: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  min-width: 200px;
}

.controls-container select:focus {
  outline: none;
  border-color: #4ecdc4;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.3);
}

.controls-container select option {
  background: #2a5298;
  color: #ffffff;
}

.controls-container button {
  margin: 0;
  white-space: nowrap;
}

.weather-data {
  width: 100%;
  max-width: 1000px;
}

button {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 1rem 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #764ba2 0%, #667eea 100%);
}

button:active {
  transform: translateY(0);
}

.loading, .error {
  font-size: 1.2rem;
  padding: 2rem;
  text-align: center;
  border-radius: 12px;
  margin: 2rem 0;
}

.loading {
  background: rgba(78, 205, 196, 0.2);
  border: 1px solid rgba(78, 205, 196, 0.3);
}

.error {
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.3);
}

h2 {
  font-size: 1.8rem;
  margin: 2rem 0 1rem 0;
  text-align: center;
  color: #ffffff;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

th, td {
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px;
  text-align: left;
  color: #ffffff;
}

th {
  background: rgba(255, 255, 255, 0.2);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  background: rgba(255, 255, 255, 0.05);
}

tr:nth-child(even) td {
  background: rgba(255, 255, 255, 0.1);
}

tr:hover td {
  background: rgba(255, 255, 255, 0.15);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .weather-container {
    padding: 15px;
  }
  
  h1 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }
  
  .controls-container {
    margin-bottom: 1.5rem;
    gap: 0.8rem;
  }
  
  .controls-container select {
    min-width: 180px;
    padding: 10px 16px;
  }
  
  table {
    font-size: 0.85rem;
  }
  
  th, td {
    padding: 8px;
  }
  
  button {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .weather-container {
    padding: 10px;
  }
  
  h1 {
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
  
  .controls-container {
    margin-bottom: 1rem;
    flex-direction: column;
    gap: 0.8rem;
  }
  
  .controls-container select {
    min-width: 160px;
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  .controls-container button {
    padding: 8px 16px;
    font-size: 0.85rem;
    width: 100%;
    max-width: 200px;
  }
  
  table {
    font-size: 0.75rem;
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  th, td {
    padding: 6px;
    min-width: 80px;
  }
  
  button {
    padding: 8px 16px;
    font-size: 0.85rem;
    width: 100%;
    max-width: 200px;
  }
  
  h2 {
    font-size: 1.4rem;
  }
}

/* Dark theme enhancements */
@media (prefers-color-scheme: dark) {
  .weather-container {
    background: linear-gradient(135deg, #0c1445 0%, #1a237e 100%);
  }
}
</style>
