'use client';

import { useState, useEffect, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DashboardHeader from './DashboardHeader';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

ChartJS.register(ArcElement, Tooltip, Legend);

const processExpenseData = (expenses) => {
  return expenses.map(exp => {
    const createdAt = exp.createdAt?.toDate ? exp.createdAt.toDate() : exp.createdAt;
    return {
      ...exp,
      createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt)
    };
  });
};

export default function DashboardPage() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [budget, setBudget] = useState('');
  const [filter, setFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');
  const [userId, setUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const unsubscribeRef = useRef(null);
  const expensesUnsubscribeRef = useRef(null);

  useEffect(() => {
    unsubscribeRef.current = onAuthStateChanged(auth, (user) => {
      setAuthChecked(true);
      if (user) {
        setUserId(user.uid);
        loadBudget(user.uid);
        expensesUnsubscribeRef.current = setupExpensesListener(user.uid);
      } else {
        // Clean up when user logs out
        if (expensesUnsubscribeRef.current) {
          expensesUnsubscribeRef.current();
          expensesUnsubscribeRef.current = null;
        }
        setUserId(null);
        setExpenses([]);
        setBudget('');
      }
    });

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (expensesUnsubscribeRef.current) expensesUnsubscribeRef.current();
    };
  }, []);

  const loadBudget = async (uid) => {
    if (!uid) return;
    try {
      const budgetDoc = await getDoc(doc(db, 'users', uid, 'settings', 'budget'));
      if (budgetDoc.exists()) {
        setBudget(budgetDoc.data().amount.toString());
      }
    } catch (error) {
      console.error('Error loading budget:', error);
    }
  };

  const setupExpensesListener = (uid) => {
    if (!uid) return null;
    try {
      return onSnapshot(
        doc(db, 'users', uid, 'expenses', 'all'),
        (doc) => {
          if (doc.exists()) {
            const expensesData = doc.data().items || [];
            setExpenses(processExpenseData(expensesData));
          }
        },
        (error) => {
          console.error('Error listening to expenses:', error);
        }
      );
    } catch (error) {
      console.error('Error setting up expenses listener:', error);
      return null;
    }
  };

  const saveBudget = async (amount) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, 'users', userId, 'settings', 'budget'), {
        amount: parseFloat(amount),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const saveExpenses = async (updatedExpenses) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, 'users', userId, 'expenses', 'all'), {
        items: updatedExpenses.map(exp => ({
          ...exp,
          createdAt: exp.createdAt instanceof Date ? Timestamp.fromDate(exp.createdAt) : exp.createdAt
        })),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setEditAmount(exp.amount.toString());
    setEditCategory(exp.category);
    setEditNote(exp.note || '');
  };

  const handleSaveEdit = async (id) => {
    const updatedExpenses = expenses.map(exp => {
      if (exp.id === id) {
        return {
          ...exp,
          amount: parseFloat(editAmount),
          category: editCategory,
          note: editNote,
        };
      }
      return exp;
    });
    await saveExpenses(updatedExpenses);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!userId) return;
    
    const newExpense = {
      id: Date.now(),
      amount: parseFloat(amount),
      category,
      note,
      createdAt: new Date(),
    };
    const updatedExpenses = [newExpense, ...expenses];
    await saveExpenses(updatedExpenses);
    setAmount('');
    setCategory('');
    setNote('');
  };

  const handleDelete = async (id) => {
    if (!userId) return;
    const updatedExpenses = expenses.filter(exp => exp.id !== id);
    await saveExpenses(updatedExpenses);
  };

  const handleBudgetChange = (e) => {
    const value = e.target.value;
    setBudget(value);
    if (userId) {
      saveBudget(value);
    }
  };

  const filteredExpenses = filter === 'All'
    ? expenses
    : expenses.filter(exp => exp.category === filter);

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const percentSpent = budget ? ((totalSpent / parseFloat(budget)) * 100).toFixed(1) : 0;
  const remainingBudget = budget ? (parseFloat(budget) - totalSpent).toFixed(2) : 0;

  const categorySums = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(categorySums),
    datasets: [
      {
        data: Object.values(categorySums),
        backgroundColor: ['#60a5fa', '#f43f5e', '#10b981', '#facc15', '#a78bfa', '#fb923c'],
        borderWidth: 1,
      },
    ],
  };

  const getBudgetStatus = () => {
    if (percentSpent < 50) return '🟢 Youre doing great!';
    if (percentSpent >= 50 && percentSpent < 100) return '🟡 Reminder to always keep an eye on your spending!';
    if (percentSpent >= 100) return '🔴 Huy tama na gin sobra mo na sa budget haha';
    return '';
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200">
      <DashboardHeader />

      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-extrabold dark:text-white">Welcome to <span className="text-blue-600 dark:text-blue-400">Spent</span></h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-xl space-y-3 h-fit">
            <h2 className="font-medium text-lg text-gray-700 dark:text-gray-200">Monthly Budget Goal</h2>
            <input
              type="number"
              value={budget}
              onChange={handleBudgetChange}
              placeholder="Enter monthly budget (₱)"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              You've spent <strong>₱{totalSpent.toFixed(2)}</strong> so far ({percentSpent}%)
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(percentSpent, 100)}%` }}
              ></div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Remaining budget: <strong>₱{remainingBudget}</strong>
            </div>

            <div className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              {getBudgetStatus()}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-xl h-full">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-3">Spending by Category</h2>
            {expenses.length > 0 ? (
              <Pie data={chartData} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Add some expenses to see the chart.</p>
            )}
          </div>
        </div>

        <form
          onSubmit={handleAddExpense}
          className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-md space-y-4"
        >
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Add New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Amount (₱)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Category (e.g. Food)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium py-3 rounded-lg"
          >
            Add Expense
          </button>
        </form>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter by Category:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white"
          >
            <option value="All">All</option>
            {[...new Set(expenses.map(e => e.category))].map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Recent Expenses</h2>
          {filteredExpenses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">No expenses found.</p>
          ) : (
            filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white dark:bg-gray-700 p-5 rounded-xl shadow-md border dark:border-gray-600 flex justify-between items-start group hover:shadow-lg transition-all"
              >
                {editingId === exp.id ? (
                  <div className="w-full space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₱)</label>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-3">
                      <button
                        onClick={() => handleSaveEdit(exp.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-lg font-semibold text-gray-800 dark:text-white">₱{exp.amount}</div>
                      <div className="text-sm text-blue-500 dark:text-blue-400 font-medium">{exp.category}</div>
                      {exp.note && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">📝 {exp.note}</div>
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {exp.createdAt.toLocaleDateString()} — {exp.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <button
                        onClick={() => handleEdit(exp)}
                        className="text-blue-500 dark:text-blue-400 text-sm font-semibold hover:underline hidden group-hover:block"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-red-500 dark:text-red-400 text-sm font-semibold hover:underline hidden group-hover:block"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}