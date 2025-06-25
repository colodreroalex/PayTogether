import React from 'react';
import { useApp } from '../context/AppContext';
import QuickStats from './QuickStats';
import RecentExpenses from './RecentExpenses';
import CategoryChart from './CategoryChart';
import QuickActions from './QuickActions';

function Dashboard() {
  const { state, getTotalsByPeriod, getAverageDailyExpense, getMostExpensiveCategory } = useApp();
  
  const { todayTotal, weekTotal, monthTotal } = getTotalsByPeriod();
  const averageDaily = getAverageDailyExpense();
  const topCategory = getMostExpensiveCategory();
  
  const recentExpenses = state.expenses.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Actions */}
      <QuickActions />
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Hoy
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{todayTotal.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Esta semana
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{weekTotal.toFixed(2)}
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
                Este mes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{monthTotal.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Promedio diario
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                €{averageDaily.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <span className="text-2xl">💡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Card */}
      {topCategory && (
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Categoría con más gastos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {state.CATEGORIES?.[topCategory]?.emoji} {state.CATEGORIES?.[topCategory]?.name || 'Categoría'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts and Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribución por categorías
          </h3>
          <CategoryChart />
        </div>

        {/* Recent Expenses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gastos recientes
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Últimos 5
            </span>
          </div>
          <RecentExpenses expenses={recentExpenses} />
        </div>
      </div>

      {/* Quick Stats Component */}
      <QuickStats />
    </div>
  );
}

export default Dashboard;