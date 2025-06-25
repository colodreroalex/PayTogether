import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

function AddExpenseModal({ onClose, expense = null }) {
  const { state, dispatch, CATEGORIES } = useApp();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    paidBy: '',
    splitBetween: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si estamos editando, cargar los datos del gasto
  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount.toString(),
        description: expense.description,
        category: expense.category,
        paidBy: expense.paidBy || '',
        splitBetween: expense.splitBetween || []
      });
    } else if (state.currentGroup) {
      // Si hay un grupo activo, pre-seleccionar todos los miembros para dividir
      setFormData(prev => ({
        ...prev,
        splitBetween: [...state.currentGroup.members]
      }));
    }
  }, [expense, state.currentGroup]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validar que hay un grupo activo
    if (!state.currentGroup) {
      newErrors.group = 'Debes crear un grupo antes de agregar gastos';
      setErrors(newErrors);
      return false;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El importe debe ser mayor a 0';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }
    
    if (!formData.category) {
      newErrors.category = 'Selecciona una categoría';
    }
    
    if (!formData.paidBy) {
      newErrors.paidBy = 'Selecciona quién pagó';
    }
    
    if (formData.splitBetween.length === 0) {
      newErrors.splitBetween = 'Selecciona al menos una persona para dividir el gasto';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: formData.category,
        groupId: state.currentGroup.id,
        paidBy: formData.paidBy,
        splitBetween: formData.splitBetween
      };

      if (expense) {
        // Editar gasto existente
        dispatch({
          type: 'UPDATE_EXPENSE',
          payload: {
            id: expense.id,
            updates: expenseData
          }
        });
      } else {
        // Agregar nuevo gasto
        dispatch({
          type: 'ADD_EXPENSE',
          payload: expenseData
        });
      }
      
      // Simular delay para mejor UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={handleBackdropClick}>
      <div className="modal-content animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {expense ? 'Editar Gasto' : 'Agregar Nuevo Gasto'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Importe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Importe *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                €
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`input-field pl-8 text-lg font-semibold ${
                  errors.amount ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="0.00"
                autoFocus
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`input-field ${
                errors.description ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="¿En qué gastaste?"
              maxLength={100}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Categoría *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleInputChange('category', key)}
                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.category === key
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-2xl">{category.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
            )}
          </div>

          {/* Sección de grupo - solo si hay un grupo activo */}
          {state.currentGroup && (
            <>
              {/* Información del grupo */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Grupo: {state.currentGroup.name}
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Este gasto se añadirá al grupo y se podrá dividir entre los miembros
                </p>
              </div>

              {/* Quién pagó */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Quién pagó? *
                </label>
                <select
                  value={formData.paidBy}
                  onChange={(e) => handleInputChange('paidBy', e.target.value)}
                  className={`input-field ${
                    errors.paidBy ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                >
                  <option value="">Selecciona quién pagó</option>
                  {state.currentGroup.members.map((memberName, index) => (
                    <option key={index} value={memberName}>
                      {memberName}
                    </option>
                  ))}
                </select>
                {errors.paidBy && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.paidBy}</p>
                )}
              </div>

              {/* División del gasto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  ¿Entre quiénes se divide? *
                </label>
                <div className="space-y-2">
                  {state.currentGroup.members.map((memberName, index) => (
                    <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.splitBetween.includes(memberName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('splitBetween', [...formData.splitBetween, memberName]);
                          } else {
                            handleInputChange('splitBetween', formData.splitBetween.filter(name => name !== memberName));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                            {memberName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {memberName}
                        </span>
                        {formData.splitBetween.includes(memberName) && formData.splitBetween.length > 0 && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            (€{(parseFloat(formData.amount || 0) / formData.splitBetween.length).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.splitBetween && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.splitBetween}</p>
                )}
                
                {/* Botones de selección rápida */}
                <div className="flex space-x-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('splitBetween', state.currentGroup.members)}
                    className="px-3 py-1 text-sm bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                  >
                    Seleccionar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('splitBetween', [])}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Deseleccionar todos
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                expense ? 'Actualizar Gasto' : 'Agregar Gasto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddExpenseModal;