import React from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

function RecentExpenses({ expenses }) {
  const { CATEGORIES } = useApp();
  
  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-sm text-center">
          No hay gastos recientes
          <br />
          <span className="text-xs">Agrega tu primer gasto</span>
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => {
        const category = CATEGORIES[expense.category];
        const isToday = format(parseISO(expense.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        
        return (
          <div 
            key={expense.id} 
            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Icono de categoría */}
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">{category.emoji}</span>
            </div>
            
            {/* Información del gasto */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                {expense.description}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span className={`px-2 py-1 rounded-full ${category.color} dark:bg-opacity-20`}>
                  {category.name}
                </span>
                <span>•</span>
                <span>
                  {isToday 
                    ? format(parseISO(expense.createdAt), 'HH:mm')
                    : format(parseISO(expense.createdAt), "d MMM, HH:mm", { locale: es })
                  }
                </span>
                {isToday && (
                  <>
                    <span>•</span>
                    <span className="text-primary-600 dark:text-primary-400 font-medium">
                      Hoy
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Importe */}
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                €{expense.amount.toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}
      
      {/* Indicador de más gastos */}
      {expenses.length >= 5 && (
        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ver todos los gastos en la pestaña "Gastos"
          </p>
        </div>
      )}
    </div>
  );
}

export default RecentExpenses;