import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function ExpenseTrendChart({ period = 'month' }) {
  const { state } = useApp();
  
  const chartData = useMemo(() => {
    const now = new Date();
    let intervals = [];
    let formatString = '';
    let groupBy = '';
    
    // Configurar intervalos según el período
    switch (period) {
      case 'week':
        const weekStart = startOfWeek(now, { locale: es });
        const weekEnd = endOfWeek(now, { locale: es });
        intervals = eachDayOfInterval({ start: weekStart, end: weekEnd });
        formatString = 'EEE';
        groupBy = 'day';
        break;
      case 'month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        intervals = eachDayOfInterval({ start: monthStart, end: monthEnd });
        formatString = 'd';
        groupBy = 'day';
        break;
      case 'year':
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);
        intervals = eachMonthOfInterval({ start: yearStart, end: yearEnd });
        formatString = 'MMM';
        groupBy = 'month';
        break;
      default:
        const defaultStart = startOfMonth(now);
        const defaultEnd = endOfMonth(now);
        intervals = eachDayOfInterval({ start: defaultStart, end: defaultEnd });
        formatString = 'd';
        groupBy = 'day';
    }
    
    // Agrupar gastos por intervalo
    const expensesByInterval = {};
    intervals.forEach(interval => {
      const key = groupBy === 'day' 
        ? format(interval, 'yyyy-MM-dd')
        : format(interval, 'yyyy-MM');
      expensesByInterval[key] = 0;
    });
    
    // Sumar gastos por intervalo
    state.expenses.forEach(expense => {
      const expenseDate = parseISO(expense.createdAt);
      const key = groupBy === 'day'
        ? format(expenseDate, 'yyyy-MM-dd')
        : format(expenseDate, 'yyyy-MM');
      
      if (expensesByInterval.hasOwnProperty(key)) {
        expensesByInterval[key] += expense.amount;
      }
    });
    
    // Preparar datos para el gráfico
    const labels = intervals.map(interval => format(interval, formatString, { locale: es }));
    const data = intervals.map(interval => {
      const key = groupBy === 'day'
        ? format(interval, 'yyyy-MM-dd')
        : format(interval, 'yyyy-MM');
      return expensesByInterval[key] || 0;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Gastos',
          data,
          borderColor: 'rgb(20, 184, 166)',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(20, 184, 166)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: 'rgb(20, 184, 166)',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3
        }
      ]
    };
  }, [state.expenses, period]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
          title: function(context) {
            const index = context[0].dataIndex;
            const interval = chartData.labels[index];
            return period === 'year' ? `${interval} ${new Date().getFullYear()}` : interval;
          },
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
    elements: {
      point: {
        hoverRadius: 8
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };
  
  // Calcular estadísticas
  const totalExpenses = chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);
  const maxExpense = Math.max(...chartData.datasets[0].data);
  const avgExpense = totalExpenses / chartData.datasets[0].data.length;
  const maxIndex = chartData.datasets[0].data.indexOf(maxExpense);
  const maxLabel = chartData.labels[maxIndex];
  
  if (totalExpenses === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-center">
          No hay datos para mostrar
          <br />
          <span className="text-sm">Agrega algunos gastos para ver la tendencia</span>
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Gráfico */}
      <div className="h-64 relative">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Estadísticas del gráfico */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            €{totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Promedio</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            €{avgExpense.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Máximo</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            €{maxExpense.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {maxLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ExpenseTrendChart;