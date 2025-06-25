import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import CategoryChart from './CategoryChart';
import ExpenseTrendChart from './ExpenseTrendChart';
import MonthlyComparisonChart from './MonthlyComparisonChart';
import { parseISO, startOfWeek, startOfMonth, endOfWeek, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

function Statistics() {
  const { state, CATEGORIES } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  const now = new Date();
  
  // Calcular rangos de fechas según el período seleccionado
  const getDateRange = (period) => {
    switch (period) {
      case 'week':
        return {
          start: startOfWeek(now, { locale: es }),
          end: endOfWeek(now, { locale: es }),
          previous: {
            start: startOfWeek(subWeeks(now, 1), { locale: es }),
            end: endOfWeek(subWeeks(now, 1), { locale: es })
          }
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          previous: {
            start: startOfMonth(subMonths(now, 1)),
            end: endOfMonth(subMonths(now, 1))
          }
        };
      case 'year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31),
          previous: {
            start: new Date(now.getFullYear() - 1, 0, 1),
            end: new Date(now.getFullYear() - 1, 11, 31)
          }
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          previous: {
            start: startOfMonth(subMonths(now, 1)),
            end: endOfMonth(subMonths(now, 1))
          }
        };
    }
  };
  
  const dateRange = getDateRange(selectedPeriod);
  
  // Filtrar gastos por período
  const currentPeriodExpenses = state.expenses.filter(expense => {
    const expenseDate = parseISO(expense.createdAt);
    return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
  });
  
  const previousPeriodExpenses = state.expenses.filter(expense => {
    const expenseDate = parseISO(expense.createdAt);
    return expenseDate >= dateRange.previous.start && expenseDate <= dateRange.previous.end;
  });
  
  // Calcular totales
  const currentTotal = currentPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const previousTotal = previousPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const changePercentage = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  
  // Estadísticas por categoría del período actual
  const categoryStats = Object.entries(CATEGORIES).map(([key, category]) => {
    const categoryExpenses = currentPeriodExpenses.filter(expense => expense.category === key);
    const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const count = categoryExpenses.length;
    const average = count > 0 ? total / count : 0;
    
    return {
      key,
      category,
      total,
      count,
      average,
      percentage: currentTotal > 0 ? (total / currentTotal) * 100 : 0
    };
  }).filter(stat => stat.total > 0).sort((a, b) => b.total - a.total);
  
  // Gastos por día de la semana
  const dayOfWeekStats = {};
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  dayNames.forEach((day, index) => {
    dayOfWeekStats[day] = {
      total: 0,
      count: 0,
      expenses: []
    };
  });
  
  currentPeriodExpenses.forEach(expense => {
    const dayIndex = parseISO(expense.createdAt).getDay();
    const dayName = dayNames[dayIndex];
    dayOfWeekStats[dayName].total += expense.amount;
    dayOfWeekStats[dayName].count += 1;
    dayOfWeekStats[dayName].expenses.push(expense);
  });
  
  const mostExpensiveDay = Object.entries(dayOfWeekStats).reduce(
    (max, [day, stats]) => stats.total > max.total ? { day, ...stats } : max,
    { day: 'N/A', total: 0, count: 0 }
  );
  
  const periods = [
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
    { key: 'year', label: 'Este año' }
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con selector de período */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Estadísticas Detalladas
          </h2>
          <div className="flex space-x-2">
            {periods.map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  selectedPeriod === period.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Resumen del período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total gastado
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{currentTotal.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Número de gastos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPeriodExpenses.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cambio vs período anterior
              </p>
              <p className={`text-2xl font-bold ${
                changePercentage >= 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              changePercentage >= 0 
                ? 'bg-red-100 dark:bg-red-900' 
                : 'bg-green-100 dark:bg-green-900'
            }`}>
              <span className="text-2xl">{changePercentage >= 0 ? '📈' : '📉'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por categorías */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribución por categorías
          </h3>
          <CategoryChart />
        </div>
        
        {/* Tendencia de gastos */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tendencia de gastos
          </h3>
          <ExpenseTrendChart period={selectedPeriod} />
        </div>
      </div>
      
      {/* Estadísticas por categoría */}
      {categoryStats.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Desglose por categorías
          </h3>
          <div className="space-y-4">
            {categoryStats.map(stat => (
              <div key={stat.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{stat.category.emoji}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {stat.category.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.count} gasto{stat.count !== 1 ? 's' : ''} • Promedio: €{stat.average.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    €{stat.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Estadísticas por día de la semana */}
      {currentPeriodExpenses.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Gastos por día de la semana
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {Object.entries(dayOfWeekStats).map(([day, stats]) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {day}
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      €{stats.total.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({stats.count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 rounded-lg p-4">
              <h4 className="font-semibold text-accent-900 dark:text-accent-100 mb-2">
                Día con más gastos
              </h4>
              <p className="text-2xl font-bold text-accent-800 dark:text-accent-200">
                {mostExpensiveDay.day}
              </p>
              <p className="text-sm text-accent-600 dark:text-accent-300">
                €{mostExpensiveDay.total.toFixed(2)} en {mostExpensiveDay.count} gasto{mostExpensiveDay.count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Comparación mensual */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Comparación mensual
        </h3>
        <MonthlyComparisonChart />
      </div>
    </div>
  );
}

export default Statistics;