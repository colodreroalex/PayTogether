import React from 'react';
import { useApp } from '../context/AppContext.js';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/index.js';

function QuickStats() {
  const { state, getAverageDailyExpense, getMostExpensiveCategory, CATEGORIES } = useApp();
  
  const averageDaily = getAverageDailyExpense();
  const topCategory = getMostExpensiveCategory();
  
  // Calcular gastos del mes actual
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const monthExpenses = state.expenses.filter(expense => {
    const expenseDate = parseISO(expense.createdAt);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });
  
  const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
  const currentDay = now.getDate();
  const expectedMonthlyAverage = (monthTotal / currentDay) * daysInMonth;
  
  // Encontrar el día con más gastos
  const expensesByDay = {};
  monthExpenses.forEach(expense => {
    const day = format(parseISO(expense.createdAt), 'yyyy-MM-dd');
    if (!expensesByDay[day]) {
      expensesByDay[day] = { total: 0, count: 0 };
    }
    expensesByDay[day].total += expense.amount;
    expensesByDay[day].count += 1;
  });
  
  const maxDayExpense = Object.entries(expensesByDay).reduce(
    (max, [day, data]) => data.total > max.total ? { day, ...data } : max,
    { day: null, total: 0, count: 0 }
  );
  
  // Calcular tendencia (comparar últimos 7 días vs 7 días anteriores)
  const last7Days = state.expenses
    .filter(expense => {
      const expenseDate = parseISO(expense.createdAt);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return expenseDate >= sevenDaysAgo;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  const previous7Days = state.expenses
    .filter(expense => {
      const expenseDate = parseISO(expense.createdAt);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return expenseDate >= fourteenDaysAgo && expenseDate < sevenDaysAgo;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  const trendPercentage = previous7Days > 0 
    ? ((last7Days - previous7Days) / previous7Days) * 100 
    : last7Days > 0 ? 100 : 0;
  
  const stats = [
    {
      title: 'Promedio diario',
      value: `€${averageDaily.toFixed(2)}`,
      subtitle: 'Basado en tu historial',
      icon: '📊',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    {
      title: 'Categoría favorita',
      value: topCategory ? CATEGORIES[topCategory]?.name : 'N/A',
      subtitle: topCategory ? `${CATEGORIES[topCategory]?.emoji} Donde más gastas` : 'Agrega gastos para ver',
      icon: '🎯',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    },
    {
      title: 'Proyección mensual',
      value: `€${expectedMonthlyAverage.toFixed(2)}`,
      subtitle: `Basado en €${monthTotal.toFixed(2)} gastados`,
      icon: '📈',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    {
      title: 'Tendencia semanal',
      value: `${trendPercentage >= 0 ? '+' : ''}${trendPercentage.toFixed(1)}%`,
      subtitle: trendPercentage >= 0 ? 'Gastos aumentaron' : 'Gastos disminuyeron',
      icon: trendPercentage >= 0 ? '📈' : '📉',
      color: trendPercentage >= 0 
        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  ];
  
  if (maxDayExpense.day) {
    stats.push({
      title: 'Día con más gastos',
      value: `€${maxDayExpense.total.toFixed(2)}`,
      subtitle: format(parseISO(maxDayExpense.day), "d 'de' MMMM", { locale: es }),
      icon: '🔥',
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    });
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Estadísticas Rápidas
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {format(now, "MMMM yyyy", { locale: es })}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={stat.title}
            className="card hover:shadow-lg transition-all duration-300 group cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.subtitle}
                </p>
              </div>
            </div>
            
            {/* Indicador de tendencia */}
            {stat.title === 'Tendencia semanal' && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Últimos 7 días</span>
                  <span className={`px-2 py-1 rounded-full ${stat.color}`}>
                    €{last7Days.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Insight adicional */}
      {state.expenses.length > 0 && (
        <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-primary-200 dark:border-primary-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <h4 className="font-semibold text-primary-900 dark:text-primary-100 mb-1">
                Consejo del día
              </h4>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                {averageDaily > 50 
                  ? 'Considera revisar tus gastos diarios para optimizar tu presupuesto.'
                  : averageDaily > 20
                  ? '¡Buen control de gastos! Mantén este ritmo.'
                  : 'Excelente gestión financiera. ¡Sigue así!'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickStats;