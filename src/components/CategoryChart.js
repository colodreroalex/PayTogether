import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

function CategoryChart() {
  const { getCategoryTotals, CATEGORIES, state } = useApp();
  
  const categoryTotals = getCategoryTotals();
  
  const chartData = useMemo(() => {
    const labels = [];
    const data = [];
    const backgroundColors = [];
    const borderColors = [];
    
    // Colores para las categorías
    const colors = {
      food: { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 1)' },
      transport: { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)' },
      shopping: { bg: 'rgba(147, 51, 234, 0.8)', border: 'rgba(147, 51, 234, 1)' },
      entertainment: { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgba(236, 72, 153, 1)' },
      home: { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 1)' },
      health: { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgba(245, 158, 11, 1)' },
      others: { bg: 'rgba(107, 114, 128, 0.8)', border: 'rgba(107, 114, 128, 1)' }
    };
    
    Object.entries(categoryTotals).forEach(([category, total]) => {
      if (total > 0) {
        labels.push(`${CATEGORIES[category].emoji} ${CATEGORIES[category].name}`);
        data.push(total);
        backgroundColors.push(colors[category]?.bg || 'rgba(107, 114, 128, 0.8)');
        borderColors.push(colors[category]?.border || 'rgba(107, 114, 128, 1)');
      }
    });
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 4
        }
      ]
    };
  }, [categoryTotals, CATEGORIES]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          color: state.darkMode ? '#e5e7eb' : '#374151'
        }
      },
      tooltip: {
        backgroundColor: state.darkMode ? '#1f2937' : '#ffffff',
        titleColor: state.darkMode ? '#f9fafb' : '#111827',
        bodyColor: state.darkMode ? '#e5e7eb' : '#374151',
        borderColor: state.darkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `€${context.parsed.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };
  
  const totalExpenses = Object.values(categoryTotals).reduce((sum, total) => sum + total, 0);
  
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
          <span className="text-sm">Agrega algunos gastos para ver el gráfico</span>
        </p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="h-64 relative">
        <Doughnut data={chartData} options={options} />
        
        {/* Total en el centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Total
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            €{totalExpenses.toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Lista de categorías con totales */}
      <div className="mt-6 space-y-2">
        {Object.entries(categoryTotals)
          .filter(([, total]) => total > 0)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category, total]) => {
            const percentage = ((total / totalExpenses) * 100).toFixed(1);
            return (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{CATEGORIES[category].emoji}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {CATEGORIES[category].name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    €{total.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage}%
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default CategoryChart;