import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { format, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/index.js';
import { apiService } from '../services/api.js';

const AppContext = createContext();

// Categorías predefinidas
export const CATEGORIES = {
  food: { name: 'Comida', emoji: '🍔', color: 'bg-red-100 text-red-800' },
  transport: { name: 'Transporte', emoji: '🚗', color: 'bg-blue-100 text-blue-800' },
  shopping: { name: 'Compras', emoji: '🛒', color: 'bg-purple-100 text-purple-800' },
  entertainment: { name: 'Ocio', emoji: '🎬', color: 'bg-pink-100 text-pink-800' },
  home: { name: 'Hogar', emoji: '🏠', color: 'bg-green-100 text-green-800' },
  health: { name: 'Salud', emoji: '💊', color: 'bg-yellow-100 text-yellow-800' },
  others: { name: 'Otros', emoji: '📱', color: 'bg-gray-100 text-gray-800' }
};

// Estado inicial
const initialState = {
  expenses: [],
  groups: [],
  currentGroup: null,
  people: [],
  categories: [],
  users: [],
  darkMode: false,
  loading: false,
  error: null,
  filters: {
    category: 'all',
    dateRange: 'all',
    searchTerm: ''
  },
  goals: {},
  notifications: []
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case 'LOAD_DATA':
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null
      };
    
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload
      };
    
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload
      };
    
    case 'SET_GROUPS':
      return {
        ...state,
        groups: action.payload
      };
    
    case 'SET_EXPENSES':
      return {
        ...state,
        expenses: action.payload
      };
    
    case 'SET_CURRENT_GROUP':
      return {
        ...state,
        currentGroup: action.payload
      };
    
    case 'ADD_EXPENSE':
      const newExpense = {
        id: Date.now().toString(),
        ...action.payload,
        createdAt: new Date().toISOString(),
        groupId: state.currentGroup?.id || null
      };
      return {
        ...state,
        expenses: [newExpense, ...state.expenses]
      };
    
    case 'CREATE_GROUP':
      const newGroup = {
        id: Date.now().toString(),
        ...action.payload,
        createdAt: new Date().toISOString(),
        members: action.payload.members || []
      };
      return {
        ...state,
        groups: [newGroup, ...state.groups],
        currentGroup: newGroup
      };
    
    case 'SELECT_GROUP':
      const selectedGroup = state.groups.find(group => group.id === action.payload);
      return {
        ...state,
        currentGroup: selectedGroup || null
      };
    
    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map(group => 
          group.id === action.payload.id 
            ? { ...group, ...action.payload.updates }
            : group
        ),
        currentGroup: state.currentGroup?.id === action.payload.id 
          ? { ...state.currentGroup, ...action.payload.updates }
          : state.currentGroup
      };
    
    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter(group => group.id !== action.payload),
        currentGroup: state.currentGroup?.id === action.payload ? null : state.currentGroup,
        expenses: state.expenses.filter(expense => expense.groupId !== action.payload)
      };
    
    case 'ADD_PERSON':
      const newPerson = {
        id: Date.now().toString(),
        ...action.payload,
        createdAt: new Date().toISOString()
      };
      return {
        ...state,
        people: [newPerson, ...state.people]
      };
    
    case 'UPDATE_PERSON':
      return {
        ...state,
        people: state.people.map(person => 
          person.id === action.payload.id 
            ? { ...person, ...action.payload.updates }
            : person
        )
      };
    
    case 'DELETE_PERSON':
      return {
        ...state,
        people: state.people.filter(person => person.id !== action.payload)
      };
    
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense => 
          expense.id === action.payload.id 
            ? { ...expense, ...action.payload.updates }
            : expense
        )
      };
    
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload)
      };
    
    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        darkMode: !state.darkMode
      };
    
    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.type]: action.payload.value
        }
      };
    
    case 'SET_GOAL':
      return {
        ...state,
        goals: {
          ...state.goals,
          [action.payload.category]: action.payload.amount
        }
      };
    
    case 'REMOVE_GOAL':
      const { [action.payload]: removed, ...remainingGoals } = state.goals;
      return {
        ...state,
        goals: remainingGoals
      };
    
    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        darkMode: state.darkMode // Mantener preferencia de tema
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload)
      };
    
    default:
      return state;
  }
}

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Cargar datos iniciales desde la API
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar datos desde la API
  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Cargar datos en paralelo
      const [categoriesResponse, usersResponse, groupsResponse] = await Promise.all([
        apiService.getCategories(),
        apiService.getUsers(),
        apiService.getGroups()
      ]);
      
      dispatch({ type: 'SET_CATEGORIES', payload: categoriesResponse.data });
      dispatch({ type: 'SET_USERS', payload: usersResponse.data });
      dispatch({ type: 'SET_GROUPS', payload: groupsResponse.data });
      
      // Cargar preferencias del localStorage
      const savedPreferences = localStorage.getItem('gastosGrupalesPreferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        if (preferences.darkMode !== undefined) {
          dispatch({ type: 'TOGGLE_DARK_MODE' });
        }
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error loading initial data:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Guardar preferencias en localStorage
  useEffect(() => {
    const preferences = {
      darkMode: state.darkMode,
      filters: state.filters
    };
    localStorage.setItem('gastosGrupalesPreferences', JSON.stringify(preferences));
  }, [state.darkMode, state.filters]);

  // Aplicar tema oscuro
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // Funciones auxiliares
  const getFilteredExpenses = () => {
    let filtered = [...state.expenses];

    // Filtrar por categoría
    if (state.filters.category !== 'all') {
      filtered = filtered.filter(expense => expense.category === state.filters.category);
    }

    // Filtrar por búsqueda
    if (state.filters.searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(state.filters.searchTerm.toLowerCase())
      );
    }

    // Filtrar por rango de fechas
    const now = new Date();
    if (state.filters.dateRange === 'today') {
      const today = format(now, 'yyyy-MM-dd');
      filtered = filtered.filter(expense => 
        format(parseISO(expense.createdAt), 'yyyy-MM-dd') === today
      );
    } else if (state.filters.dateRange === 'week') {
      const weekStart = startOfWeek(now, { locale: es });
      filtered = filtered.filter(expense => 
        isAfter(parseISO(expense.createdAt), weekStart)
      );
    } else if (state.filters.dateRange === 'month') {
      const monthStart = startOfMonth(now);
      filtered = filtered.filter(expense => 
        isAfter(parseISO(expense.createdAt), monthStart)
      );
    }

    return filtered;
  };

  const getTotalsByPeriod = () => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const weekStart = startOfWeek(now, { locale: es });
    const monthStart = startOfMonth(now);

    const todayTotal = state.expenses
      .filter(expense => format(parseISO(expense.createdAt), 'yyyy-MM-dd') === today)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const weekTotal = state.expenses
      .filter(expense => isAfter(parseISO(expense.createdAt), weekStart))
      .reduce((sum, expense) => sum + expense.amount, 0);

    const monthTotal = state.expenses
      .filter(expense => isAfter(parseISO(expense.createdAt), monthStart))
      .reduce((sum, expense) => sum + expense.amount, 0);

    return { todayTotal, weekTotal, monthTotal };
  };

  const getCategoryTotals = () => {
    const totals = {};
    Object.keys(CATEGORIES).forEach(category => {
      totals[category] = state.expenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);
    });
    return totals;
  };

  const getAverageDailyExpense = () => {
    if (state.expenses.length === 0) return 0;
    
    const total = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const days = Math.max(1, Math.ceil((Date.now() - parseISO(state.expenses[state.expenses.length - 1].createdAt)) / (1000 * 60 * 60 * 24)));
    return total / days;
  };

  const getMostExpensiveCategory = () => {
    const categoryTotals = getCategoryTotals();
    const maxCategory = Object.keys(categoryTotals).reduce((a, b) => 
      categoryTotals[a] > categoryTotals[b] ? a : b
    );
    return categoryTotals[maxCategory] > 0 ? maxCategory : null;
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Importe', 'Pagado por', 'Dividido entre'];
    const csvContent = [
      headers.join(','),
      ...state.expenses.map(expense => [
        format(parseISO(expense.createdAt), 'dd/MM/yyyy HH:mm'),
        `"${expense.description}"`,
        CATEGORIES[expense.category].name,
        expense.amount,
        expense.paidBy ? state.people.find(p => p.id === expense.paidBy)?.name || 'Desconocido' : 'N/A',
        expense.splitBetween ? expense.splitBetween.map(id => state.people.find(p => p.id === id)?.name || 'Desconocido').join('; ') : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gastos_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calcular balances entre miembros del grupo
  const calculateBalances = () => {
    if (!state.currentGroup) return {};
    
    const balances = {};
    const groupExpenses = state.expenses.filter(expense => expense.groupId === state.currentGroup.id);
    
    // Inicializar balances
    state.currentGroup.members.forEach(memberName => {
      balances[memberName] = 0;
    });
    
    // Calcular balances basado en gastos
    groupExpenses.forEach(expense => {
      if (expense.paidBy && expense.splitBetween && expense.splitBetween.length > 0) {
        const amountPerPerson = expense.amount / expense.splitBetween.length;
        
        // El que pagó recibe crédito por el total
        balances[expense.paidBy] += expense.amount;
        
        // Cada persona que debe pagar pierde su parte
        expense.splitBetween.forEach(memberName => {
          balances[memberName] -= amountPerPerson;
        });
      }
    });
    
    return balances;
  };

  // Calcular deudas simplificadas
  const calculateDebts = () => {
    const balances = calculateBalances();
    const debts = [];
    
    const creditors = [];
    const debtors = [];
    
    // Separar acreedores y deudores
    Object.entries(balances).forEach(([memberName, balance]) => {
      if (balance > 0.01) {
        creditors.push({ memberName, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ memberName, amount: Math.abs(balance) });
      }
    });
    
    // Algoritmo para minimizar transacciones
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const amount = Math.min(creditor.amount, debtor.amount);
      
      if (amount > 0.01) {
        debts.push({
          from: debtor.memberName,
          to: creditor.memberName,
          amount: Math.round(amount * 100) / 100
        });
      }
      
      creditor.amount -= amount;
      debtor.amount -= amount;
      
      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }
    
    return debts;
  };

  // Obtener gastos del grupo actual
  const getCurrentGroupExpenses = () => {
    if (!state.currentGroup) return [];
    return state.expenses.filter(expense => expense.groupId === state.currentGroup.id);
  };

  // Obtener miembros del grupo actual
  const getCurrentGroupMembers = () => {
    if (!state.currentGroup) return [];
    return state.currentGroup.members.map(memberName => ({
      id: memberName,
      name: memberName
    }));
  };

  // Funciones API
  const addExpense = async (expenseData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.createExpense(expenseData);
      
      // Recargar gastos del grupo actual
      if (state.currentGroup) {
        const expensesResponse = await apiService.getGroupExpenses(state.currentGroup.id);
        dispatch({ type: 'SET_EXPENSES', payload: expensesResponse.data });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateExpense = async (expenseId, expenseData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.updateExpense(expenseId, expenseData);
      
      // Recargar gastos del grupo actual
      if (state.currentGroup) {
        const expensesResponse = await apiService.getGroupExpenses(state.currentGroup.id);
        dispatch({ type: 'SET_EXPENSES', payload: expensesResponse.data });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteExpense = async (expenseId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await apiService.deleteExpense(expenseId);
      
      // Recargar gastos del grupo actual
      if (state.currentGroup) {
        const expensesResponse = await apiService.getGroupExpenses(state.currentGroup.id);
        dispatch({ type: 'SET_EXPENSES', payload: expensesResponse.data });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const createGroup = async (groupData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.createGroup(groupData);
      
      // Recargar grupos
      const groupsResponse = await apiService.getGroups();
      dispatch({ type: 'SET_GROUPS', payload: groupsResponse.data });
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const createUser = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await apiService.createUser(userData);
      
      // Recargar usuarios
      const usersResponse = await apiService.getUsers();
      dispatch({ type: 'SET_USERS', payload: usersResponse.data });
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const selectGroup = async (group) => {
    try {
      dispatch({ type: 'SET_CURRENT_GROUP', payload: group });
      
      if (group) {
        dispatch({ type: 'SET_LOADING', payload: true });
        const expensesResponse = await apiService.getGroupExpenses(group.id);
        dispatch({ type: 'SET_EXPENSES', payload: expensesResponse.data });
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        dispatch({ type: 'SET_EXPENSES', payload: [] });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const value = {
    state,
    dispatch,
    // API functions
    addExpense,
    updateExpense,
    deleteExpense,
    createGroup,
    createUser,
    selectGroup,
    loadInitialData,
    getFilteredExpenses,
    getTotalsByPeriod,
    getCategoryTotals,
    getAverageDailyExpense,
    getMostExpensiveCategory,
    exportToCSV,
    calculateBalances,
    calculateDebts,
    getCurrentGroupExpenses,
    getCurrentGroupMembers,
    CATEGORIES
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook personalizado
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}