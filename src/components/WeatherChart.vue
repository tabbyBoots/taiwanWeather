<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
});

const chartCanvas = ref(null);
let weatherChart = null;

const createChart = () => {
  if (weatherChart) {
    weatherChart.destroy();
  }

  const ctx = chartCanvas.value.getContext('2d');
  weatherChart = new Chart(ctx, {
    type: 'line',
    data: props.chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        temperature: {
          type: 'linear',
          display: true,
          position: 'left',
          min: 20,
          max: 45,
          title: {
            display: true,
            text: 'Temperature (°C)',
          },
        },
        pop: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Rain Probability (%)',
          },
          grid: {
            drawOnChartArea: false, // only draw grid lines for the first y-axis
          },
        },
      },
    },
  });
};

onMounted(() => {
  createChart();
});

watch(() => props.chartData, () => {
  createChart();
}, { deep: true });

onBeforeUnmount(() => {
  if (weatherChart) {
    weatherChart.destroy();
  }
});
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  max-width: 100%; /* Ensure it doesn't exceed parent width */
  margin-top: 20px;
  min-height: 300px; /* Give it a minimum height */
}
</style>