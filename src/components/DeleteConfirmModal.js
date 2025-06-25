import React from 'react';
import { useApp } from '../context/AppContext.js';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/index.js';

function DeleteConfirmModal({ expense, onConfirm, onCancel }) {
  const { CATEGORIES } = useApp();
  const category = CATEGORIES[expense.category];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={handleBackdropClick}>
      <div className="modal-content animate-slide-up max-w-sm">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ¿Eliminar este gasto?
          </h3>
          
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Detalles del gasto */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-lg">{category.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {expense.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category.name} • {format(parseISO(expense.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  €{expense.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;