<template>
  <div class="weather-container">
    <h1>Taiwan Weather</h1>
    <div class="location-selector">
      <label for="location-select">Select Location:</label>
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
    </div>
    <div v-if="loading">Loading...</div>
    <div v-if="error">{{ error }}</div>
    <div v-if="processedData.tableData && processedData.tableData.length" class="weather-data">
      <WeatherChart :chartData="chartConfig" />
      <button @click="showTable = !showTable">
        {{ showTable ? 'Hide Table' : 'Show Table' }}
      </button>
      <div v-if="showTable">
        <h2>{{ weatherData.LocationName }} - {{ selectedLocation }}</h2>
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
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';
import WeatherChart from './WeatherChart.vue';

const weatherData = ref(null);
const loading = ref(true);
const error = ref(null);
const selectedLocation = ref('松山區'); // Default to 松山區
const showDetails = ref(false); // New ref to control details visibility
const showTable = ref(false); // New ref to control table visibility

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
});

watch(selectedLocation, () => {
  fetchWeatherData();
});
</script>

<style scoped>
.weather-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>