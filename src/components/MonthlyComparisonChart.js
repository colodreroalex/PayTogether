import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale/index.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function MonthlyComparisonChart() {
  const { state } = useApp();
  
  const chartData = useMemo(() => {
    const now = new Date();
    const monthsToShow = 6; // Mostrar últimos 6 meses
    
    // Generar los últimos 6 meses
    const months = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      months.push(subMonths(now, i));
    }
    
    // Agrupar gastos por mes
    const expensesByMonth = {};
    months.forEach(month => {
      const key = format(month, 'yyyy-MM');
      expensesByMonth[key] = 0;
    });
    
    // Sumar gastos por mes
    state.expenses.forEach(expense => {
      const expenseDate = parseISO(expense.createdAt);
      const monthKey = format(expenseDate, 'yyyy-MM');
      
      if (expensesByMonth.hasOwnProperty(monthKey)) {
        expensesByMonth[monthKey] += expense.amount;
      }
    });
    
    // Preparar datos para el gráfico
    const labels = months.map(month => format(month, 'MMM yyyy', { locale: es }));
    const data = months.map(month => {
      const key = format(month, 'yyyy-MM');
      return expensesByMonth[key] || 0;
    });
    
    // Colores dinámicos basados en el valor
    const maxValue = Math.max(...data);
    const colors = data.map(value => {
      if (value === 0) return 'rgba(156, 163, 175, 0.6)';
      if (value === maxValue) return 'rgba(239, 68, 68, 0.8)';
      if (value > maxValue * 0.7) return 'rgba(245, 158, 11, 0.8)';
      return 'rgba(20, 184, 166, 0.8)';
    });
    
    const borderColors = data.map(value => {
      if (value === 0) return 'rgba(156, 163, 175, 1)';
      if (value === maxValue) return 'rgba(239, 68, 68, 1)';
      if (value > maxValue * 0.7) return 'rgba(245, 158, 11, 1)';
      return 'rgba(20, 184, 166, 1)';
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Gastos Mensuales',
          data,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    };
  }, [state.expenses]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: state.darkMode ? '#1f2937' : '#ffffff',
        titleColor: state.darkMode ? '#f9fafb' : '#111827',
        bodyColor: state.darkMode ? '#e5e7eb' : '#374151',
        borderColor: state.darkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `Gastos: €${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: state.darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: state.darkMode ? '#374151' : '#f3f4f6',
          borderDash: [2, 2]
        },
        ticks: {
          color: state.darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value) {
            return '€' + value.toFixed(0);
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };
  
  // Calcular estadísticas
  const monthlyData = chartData.datasets[0].data;
  const totalExpenses = monthlyData.reduce((sum, value) => sum + value, 0);
  const avgMonthly = totalExpenses / monthlyData.length;
  const maxMonth = Math.max(...monthlyData);
  const minMonth = Math.min(...monthlyData.filter(v => v > 0));
  const maxIndex = monthlyData.indexOf(maxMonth);
  const minIndex = monthlyData.indexOf(minMonth);
  const maxMonthLabel = chartData.labels[maxIndex];
  const minMonthLabel = chartData.labels[minIndex];
  
  // Calcular tendencia
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const trend = currentMonth - previousMonth;
  const trendPercentage = previousMonth > 0 ? ((trend / previousMonth) * 100) : 0;
  
  if (totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-center">
          No hay datos para comparar
          <br />
          <span className="text-sm">Agrega algunos gastos para ver la comparación mensual</span>
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Gráfico */}
      <div className="h-64 relative">
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Promedio mensual</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              €{avgMonthly.toFixed(2)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mes con más gastos</p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {maxMonthLabel}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              €{maxMonth.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tendencia mensual</p>
            <div className="flex items-center space-x-2">
              {trend >= 0 ? (
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7m0 10H7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10m0-10h10" />
                </svg>
              )}
              <span className={`text-sm font-semibold ${
                trend >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {Math.abs(trendPercentage).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              vs. mes anterior
            </p>
          </div>
          
          {minMonth > 0 && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mes con menos gastos</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {minMonthLabel}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                €{minMonth.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonthlyComparisonChart;