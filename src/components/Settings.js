import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

function Settings() {
  const { state, dispatch } = useApp();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [goalCategory, setGoalCategory] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  
  const handleToggleDarkMode = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };
  
  const handleExportData = (format) => {
    if (format === 'csv') {
      const csvData = state.expenses.map(expense => ({
        fecha: new Date(expense.createdAt).toLocaleDateString('es-ES'),
        descripcion: expense.description,
        categoria: expense.category,
        importe: expense.amount
      }));
      
      const headers = ['Fecha', 'Descripción', 'Categoría', 'Importe'];
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => [
          row.fecha,
          `"${row.descripcion}"`,
          row.categoria,
          row.importe
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `gastos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'json') {
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalExpenses: state.expenses.length,
        expenses: state.expenses
      };
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `gastos_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setShowExportModal(false);
  };
  
  const handleSetGoal = () => {
    if (goalCategory && goalAmount && parseFloat(goalAmount) > 0) {
      dispatch({
        type: 'SET_GOAL',
        payload: {
          category: goalCategory,
          amount: parseFloat(goalAmount)
        }
      });
      setGoalCategory('');
      setGoalAmount('');
      setShowGoalModal(false);
    }
  };
  
  const handleRemoveGoal = (category) => {
    dispatch({
      type: 'REMOVE_GOAL',
      payload: category
    });
  };
  
  const handleClearAllData = () => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
    setShowClearDataModal(false);
  };
  
  const totalExpenses = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseCount = state.expenses.length;
  const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
  
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Configuración
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personaliza tu experiencia y gestiona tus datos
        </p>
      </div>
      
      {/* Estadísticas generales */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resumen de datos
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {expenseCount}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gastos totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              €{totalExpenses.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Importe total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              €{avgExpense.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Promedio</p>
          </div>
        </div>
      </div>
      
      {/* Configuración de apariencia */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Apariencia
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Modo oscuro</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cambia entre tema claro y oscuro
            </p>
          </div>
          <button
            onClick={handleToggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.darkMode ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                state.darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      {/* Metas de gasto */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Metas de gasto
          </h2>
          <button
            onClick={() => setShowGoalModal(true)}
            className="btn-primary text-sm px-3 py-1"
          >
            + Agregar meta
          </button>
        </div>
        
        {Object.keys(state.goals).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No tienes metas configuradas
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(state.goals).map(([category, amount]) => {
              const categoryExpenses = state.expenses
                .filter(expense => expense.category === category)
                .reduce((sum, expense) => sum + expense.amount, 0);
              const percentage = (categoryExpenses / amount) * 100;
              const isOverBudget = percentage > 100;
              
              return (
                <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {state.categories.find(cat => cat.name === category)?.emoji || '💰'}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveGoal(category)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        €{categoryExpenses.toFixed(2)} / €{amount.toFixed(2)}
                      </span>
                      <span className={`font-medium ${
                        isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOverBudget ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    
                    {isOverBudget && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        ⚠️ Has superado tu meta en €{(categoryExpenses - amount).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Gestión de datos */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Gestión de datos
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Exportar datos</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Descarga tus gastos en formato CSV o JSON
              </p>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="btn-secondary"
              disabled={expenseCount === 0}
            >
              Exportar
            </button>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Borrar todos los datos</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Esta acción no se puede deshacer
              </p>
            </div>
            <button
              onClick={() => setShowClearDataModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={expenseCount === 0}
            >
              Borrar todo
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal para exportar datos */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Exportar datos
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Selecciona el formato de exportación:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleExportData('csv')}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="font-medium text-gray-900 dark:text-white">CSV</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Compatible con Excel y hojas de cálculo
                </div>
              </button>
              <button
                onClick={() => handleExportData('json')}
                className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="font-medium text-gray-900 dark:text-white">JSON</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Formato técnico para desarrolladores
                </div>
              </button>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para agregar meta */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Agregar meta de gasto
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecciona una categoría</option>
                  {state.categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.emoji} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Límite mensual (€)
                </label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGoalModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSetGoal}
                className="btn-primary"
                disabled={!goalCategory || !goalAmount || parseFloat(goalAmount) <= 0}
              >
                Guardar meta
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para confirmar borrado */}
      {showClearDataModal && (
        <div className="modal-overlay" onClick={() => setShowClearDataModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              ⚠️ Confirmar borrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Esta acción borrará todos tus gastos, metas y configuraciones de forma permanente.
              <br /><br />
              <strong>Esta acción no se puede deshacer.</strong>
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearDataModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;