import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import AddExpenseModal from './AddExpenseModal';
import DeleteConfirmModal from './DeleteConfirmModal';

function ExpenseList() {
  const { state, dispatch, getFilteredExpenses, CATEGORIES } = useApp();
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredExpenses = getFilteredExpenses();
  
  // Filtrar por término de búsqueda local
  const searchFilteredExpenses = searchTerm
    ? filteredExpenses.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredExpenses;

  const handleCategoryFilter = (category) => {
    dispatch({
      type: 'SET_FILTER',
      payload: { type: 'category', value: category }
    });
  };

  const handleDateFilter = (dateRange) => {
    dispatch({
      type: 'SET_FILTER',
      payload: { type: 'dateRange', value: dateRange }
    });
  };

  const handleDeleteExpense = (expenseId) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
    setDeletingExpense(null);
  };

  const groupExpensesByDate = (expenses) => {
    const groups = {};
    expenses.forEach(expense => {
      const date = format(parseISO(expense.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(expense);
    });
    return groups;
  };

  const groupedExpenses = groupExpensesByDate(searchFilteredExpenses);
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con búsqueda */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Todos los Gastos
          </h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar gastos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="space-y-4">
          {/* Filtros de categoría */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Filtrar por categoría
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilter('all')}
                className={`category-chip ${
                  state.filters.category === 'all'
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Todas
              </button>
              {Object.entries(CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => handleCategoryFilter(key)}
                  className={`category-chip ${
                    state.filters.category === key
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.emoji} {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros de fecha */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Filtrar por fecha
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'today', label: 'Hoy' },
                { key: 'week', label: 'Esta semana' },
                { key: 'month', label: 'Este mes' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleDateFilter(key)}
                  className={`category-chip ${
                    state.filters.dateRange === key
                      ? 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de gastos agrupados por fecha */}
      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const dayExpenses = groupedExpenses[date];
            const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
            
            return (
              <div key={date} className="space-y-3">
                {/* Header del día */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {format(parseISO(date + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: es })}
                  </h3>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    €{dayTotal.toFixed(2)}
                  </span>
                </div>
                
                {/* Gastos del día */}
                <div className="space-y-2">
                  {dayExpenses.map(expense => {
                    const category = CATEGORIES[expense.category];
                    return (
                      <div key={expense.id} className="expense-item group">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-lg">{category.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {expense.description}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{category.name}</span>
                              <span>•</span>
                              <span>{format(parseISO(expense.createdAt), 'HH:mm')}</span>
                              {expense.groupId && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-blue-600 dark:text-blue-400">
                                      {(() => {
                                        const group = state.groups.find(g => g.id === expense.groupId);
                                        return group ? group.name : 'Grupo';
                                      })()}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                            {expense.groupId && expense.paidBy && expense.splitBetween && (
                              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                <span>Pagado por: </span>
                                <span className="font-medium">
                                  {(() => {
                                    const person = state.people.find(p => p.id === expense.paidBy);
                                    return person ? person.name : 'Desconocido';
                                  })()}
                                </span>
                                {expense.splitBetween.length > 1 && (
                                  <>
                                    <span> • Dividido entre {expense.splitBetween.length} personas</span>
                                    <span> (€{(expense.amount / expense.splitBetween.length).toFixed(2)} c/u)</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            €{expense.amount.toFixed(2)}
                          </span>
                          
                          {/* Botones de acción */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => setEditingExpense(expense)}
                              className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                              aria-label="Editar gasto"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingExpense(expense)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                              aria-label="Eliminar gasto"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay gastos
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || state.filters.category !== 'all' || state.filters.dateRange !== 'all'
              ? 'No se encontraron gastos con los filtros aplicados'
              : 'Aún no has registrado ningún gasto'}
          </p>
        </div>
      )}

      {/* Modales */}
      {editingExpense && (
        <AddExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
      
      {deletingExpense && (
        <DeleteConfirmModal
          expense={deletingExpense}
          onConfirm={() => handleDeleteExpense(deletingExpense.id)}
          onCancel={() => setDeletingExpense(null)}
        />
      )}
    </div>
  );
}

export default ExpenseList;