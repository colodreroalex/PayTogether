import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function Header() {
  const { state, dispatch } = useApp();
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  
  // Calcular total de gastos del grupo actual
  const relevantExpenses = state.currentGroup 
    ? state.expenses.filter(expense => expense.groupId === state.currentGroup.id)
    : [];
  
  const totalExpenses = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  const toggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Título */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">💰</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Gastos Grupales
              </h1>
              <div className="flex items-center space-x-2">
                {state.currentGroup ? (
                  <button
                    onClick={() => setShowGroupSelector(!showGroupSelector)}
                    className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    <span>📊 {state.currentGroup.name}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Crea un grupo para empezar
                  </span>
                )}
                {showGroupSelector && state.groups.length > 0 && (
                  <div className="absolute top-16 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="p-2">
                      {state.groups.map(group => (
                        <button
                          key={group.id}
                          onClick={() => {
                            dispatch({ type: 'SET_CURRENT_GROUP', payload: group });
                            setShowGroupSelector(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                            state.currentGroup?.id === group.id
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          📊 {group.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Balance Total y Controles */}
          <div className="flex items-center space-x-4">
            {/* Balance Total */}
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {state.currentGroup ? `Total del grupo` : 'Sin grupo activo'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.currentGroup ? (
                  `${state.currentGroup?.currency === 'EUR' ? '€' : state.currentGroup?.currency || '€'}${totalExpenses.toFixed(2)}`
                ) : (
                  '€0.00'
                )}
              </p>
              {state.currentGroup && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {state.currentGroup.members.length} participantes
                </p>
              )}
            </div>

            {/* Toggle Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Cambiar tema"
            >
              {state.darkMode ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;