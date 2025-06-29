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

  // Custom plugin to draw temperature and rain labels with smart positioning
  const customLabelsPlugin = {
    id: 'customLabels',
    afterDatasetsDraw: (chart) => {
      const { ctx, data, scales } = chart;
      const chartArea = chart.chartArea;
      const tempScale = scales.temperature;
      
      // Store label positions to avoid overlaps
      const labelPositions = [];
      
      data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        
        // Handle temperature datasets with smart positioning
        if (dataset.label === '最高溫度' || dataset.label === '最低溫度') {
          meta.data.forEach((point, index) => {
            const value = dataset.data[index];
            if (value !== null && value !== undefined) {
              const x = point.x;
              const y = point.y;
              const isMaxTemp = dataset.label === '最高溫度';
              
              // Set label style
              ctx.save();
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = isMaxTemp ? '#ff4757' : '#3742fa';
              ctx.lineWidth = 1.5;
              ctx.font = 'bold 10px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const text = Math.round(value) + '°C';
              const textWidth = ctx.measureText(text).width;
              const padding = 4;
              const labelHeight = 16;
              
              // Smart positioning: try preferred position first, then adjust if needed
              let labelY;
              if (isMaxTemp) {
                // For max temp, try above the point first
                labelY = y - 15;
                // If it would go above chart area, position below
                if (labelY - labelHeight/2 < chartArea.top) {
                  labelY = y + 20;
                }
              } else {
                // For min temp, try below the point first  
                labelY = y + 15;
                // If it would go below chart area, position above
                if (labelY + labelHeight/2 > chartArea.bottom) {
                  labelY = y - 20;
                }
              }
              
              // Check for overlaps with existing labels
              const currentLabel = { x, y: labelY, width: textWidth + padding * 2, height: labelHeight };
              for (const existingLabel of labelPositions) {
                if (Math.abs(currentLabel.x - existingLabel.x) < 30 && 
                    Math.abs(currentLabel.y - existingLabel.y) < labelHeight + 5) {
                  // Adjust position to avoid overlap
                  labelY = isMaxTemp ? labelY - 20 : labelY + 20;
                  currentLabel.y = labelY;
                  break;
                }
              }
              
              // Ensure label stays within chart bounds
              labelY = Math.max(chartArea.top + labelHeight/2, 
                       Math.min(chartArea.bottom - labelHeight/2, labelY));
              
              labelPositions.push({ x, y: labelY, width: textWidth + padding * 2, height: labelHeight });
              
              // Draw background for label
              const rectX = x - textWidth/2 - padding;
              const rectY = labelY - labelHeight/2;
              const rectWidth = textWidth + padding * 2;
              const radius = 3;
              
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(rectX, rectY, rectWidth, labelHeight, radius);
              } else {
                // Fallback for browsers without roundRect
                ctx.moveTo(rectX + radius, rectY);
                ctx.lineTo(rectX + rectWidth - radius, rectY);
                ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
                ctx.lineTo(rectX + rectWidth, rectY + labelHeight - radius);
                ctx.quadraticCurveTo(rectX + rectWidth, rectY + labelHeight, rectX + rectWidth - radius, rectY + labelHeight);
                ctx.lineTo(rectX + radius, rectY + labelHeight);
                ctx.quadraticCurveTo(rectX, rectY + labelHeight, rectX, rectY + labelHeight - radius);
                ctx.lineTo(rectX, rectY + radius);
                ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
              }
              ctx.fillStyle = isMaxTemp ? 'rgba(255, 71, 87, 0.9)' : 'rgba(55, 66, 250, 0.9)';
              ctx.fill();
              ctx.stroke();
              
              // Draw text
              ctx.fillStyle = '#ffffff';
              ctx.fillText(text, x, labelY);
              ctx.restore();
            }
          });
        }
        
        // Handle rain probability dataset - simplified display
        if (dataset.label === '降雨機率') {
          meta.data.forEach((point, index) => {
            const value = dataset.data[index];
            if (value !== null && value !== undefined && value > 0) { // Only show if > 0
              const x = point.x;
              const y = point.y;
              
              // Position text in the middle of the bar
              const labelY = y + (chartArea.bottom - y) / 2;
              
              // Set label style - simple text without background
              ctx.save();
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px Arial'; // Smaller, more concise
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              
              const text = Math.round(value) + '%';
              
              // Add text stroke for better readability
              ctx.strokeText(text, x, labelY);
              ctx.fillText(text, x, labelY);
              ctx.restore();
            }
          });
        }
      });
    }
  };

  const ctx = chartCanvas.value.getContext('2d');
  weatherChart = new Chart(ctx, {
    type: 'line',
    data: {
      ...props.chartData,
      datasets: props.chartData.datasets?.map(dataset => ({
        ...dataset,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3,
        ...(dataset.label === '最高溫度' && {
          borderColor: '#ff4757',
          backgroundColor: '#ff4757',
          pointBackgroundColor: '#ff4757',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }),
        ...(dataset.label === '最低溫度' && {
          borderColor: '#3742fa',
          backgroundColor: '#3742fa',
          pointBackgroundColor: '#3742fa',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }),
        ...(dataset.label === '降雨機率' && {
          backgroundColor: 'rgba(116, 185, 255, 0.6)',
          borderColor: '#74b9ff',
          borderWidth: 2,
        }),
      })) || [],
    },
    plugins: [customLabelsPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#ffffff',
            font: {
              size: 14,
              weight: 'bold',
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false,
          },
          ticks: {
            color: '#ffffff',
            font: {
              size: 12,
              weight: 'bold',
            },
            padding: 10,
          },
        },
        temperature: {
          type: 'linear',
          display: true,
          position: 'left',
          min: 15,
          max: 40,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false,
          },
          ticks: {
            color: '#ffffff',
            font: {
              size: 12,
              weight: 'bold',
            },
            padding: 10,
            callback: function(value) {
              return value + '°C';
            },
          },
          title: {
            display: false, // Remove temperature label to save space
          },
        },
        pop: {
          type: 'linear',
          display: false, // Hide the right-side scale since we show labels above bars
          position: 'right',
          min: 0,
          max: 100,
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
  max-width: 100%;
  margin: 20px 0;
  min-height: 400px;
  background: linear-gradient(135deg, rgba(45, 52, 54, 0.9), rgba(99, 110, 114, 0.9));
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .chart-container {
    min-height: 350px;
    padding: 15px;
    margin: 15px 0;
    border-radius: 12px;
  }
}

@media (max-width: 480px) {
  .chart-container {
    min-height: 300px;
    padding: 10px;
    margin: 10px 0;
  }
}
</style>
