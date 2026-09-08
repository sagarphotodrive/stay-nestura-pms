import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Plus, X, Edit3, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { format } from '../lib/format';
import { generateReportPDF } from '../lib/pdf';
import LoadingSpinner from '../components/LoadingSpinner';

// Expenses Component
const Expenses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [expFilterCategory, setExpFilterCategory] = useState('');
  const [expFilterProperty, setExpFilterProperty] = useState('');
  const [expFilterDateFrom, setExpFilterDateFrom] = useState(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });
  const [expFilterDateTo, setExpFilterDateTo] = useState('');
  const [expFilterPayment, setExpFilterPayment] = useState('');
  const emptyEForm = { property_id: '', category: 'cleaning', description: '', amount: '', payment_method: 'cash', vendor_name: '', expense_date: new Date().toISOString().split('T')[0], is_recurring: false, recurring_frequency: 'monthly', recurring_day: new Date().getDate() };
  const [eForm, setEForm] = useState(emptyEForm);

  useEffect(() => {
    fetchExpenses();
    api.get('/properties').then(res => setProperties(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let filtered = [...allExpenses];
    if (expFilterCategory) filtered = filtered.filter(e => e.category === expFilterCategory);
    if (expFilterProperty) filtered = filtered.filter(e => String(e.property_id) === expFilterProperty);
    if (expFilterDateFrom) filtered = filtered.filter(e => e.expense_date >= expFilterDateFrom);
    if (expFilterDateTo) filtered = filtered.filter(e => e.expense_date <= expFilterDateTo);
    if (expFilterPayment) filtered = filtered.filter(e => e.payment_method === expFilterPayment);
    filtered.sort((a, b) => b.expense_date.localeCompare(a.expense_date) || (b.id - a.id));
    setExpenses(filtered);
  }, [expFilterCategory, expFilterProperty, expFilterDateFrom, expFilterDateTo, expFilterPayment, allExpenses]);
  useEffect(() => {
    if (searchParams.get('action') === 'new') { openExpForm(); setSearchParams({}, { replace: true }); }
  }, []);

  const fetchExpenses = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/summary')
      ]);
      const exps = expRes.data.expenses || [];
      setAllExpenses(exps);
      setExpenses(exps);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openExpForm = async () => {
    try { const res = await api.get('/properties'); setProperties(res.data || []); } catch(e) {}
    setEditId(null); setEForm(emptyEForm); setShowForm(true);
  };

  const openEditExp = async (exp) => {
    try { const res = await api.get('/properties'); setProperties(res.data || []); } catch(e) {}
    setEditId(exp.id);
    setEForm({ property_id: String(exp.property_id), category: exp.category, description: exp.description, amount: exp.amount, payment_method: exp.payment_method || 'cash', vendor_name: exp.vendor_name || '', expense_date: exp.expense_date, is_recurring: !!exp.is_recurring, recurring_frequency: exp.recurring_frequency || 'monthly', recurring_day: exp.recurring_day || new Date(exp.expense_date).getDate() });
    setShowForm(true);
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    try {
      const data = { ...eForm, property_id: parseInt(eForm.property_id), amount: parseFloat(eForm.amount), recurring_day: parseInt(eForm.recurring_day) || new Date(eForm.expense_date).getDate() };
      if (editId) { await api.put(`/expenses/${editId}`, data); } else { await api.post('/expenses', data); }
      setShowForm(false); setEForm(emptyEForm); setEditId(null); fetchExpenses();
    } catch (err) { console.error(err); }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await api.delete(`/expenses/${id}`); fetchExpenses(); } catch (err) { console.error(err); }
  };

  const downloadExpensesPDF = () => {
    const dateRange = (expFilterDateFrom || expFilterDateTo) ? `${expFilterDateFrom || 'Start'} to ${expFilterDateTo || 'Now'}` : 'All Time';
    const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    generateReportPDF('Expenses', dateRange, [{
      title: `Expense Details (${expenses.length} transactions)`,
      head: ['Date', 'Description', 'Category', 'Property', 'Payment', 'Amount'],
      body: [...expenses.map(e => [format(new Date(e.expense_date), 'dd MMM yyyy'), e.description, e.category.replace(/_/g, ' '), e.property_id === 0 ? 'Common' : (e.property_name || '-'), e.payment_method, `INR ${parseFloat(e.amount).toLocaleString()}`]),
        [{ content: 'Total', styles: { fontStyle: 'bold' }, colSpan: 5 }, `INR ${total.toLocaleString()}`]]
    }], [{ label: 'Total Expenses', value: `INR ${total.toLocaleString()}` }, { label: 'Transactions', value: String(expenses.length) }]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h1>Expenses</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={downloadExpensesPDF}><Download size={16} /> PDF</button>
          <button className="btn btn-primary" onClick={openExpForm}><Plus size={18} /> Add Expense</button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit Expense' : 'Add Expense'}</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleExpense} className="modal-form">
              <div className="form-row">
                <div className="form-group"><label>Property *</label><select required value={eForm.property_id} onChange={e => setEForm({...eForm, property_id: e.target.value})}><option value="">Select property</option><option value="0">Common - Stay Nestura (All Properties)</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="form-group"><label>Category *</label><select value={eForm.category} onChange={e => setEForm({...eForm, category: e.target.value})}><option value="rent">Rent</option><option value="cleaning">Cleaning</option><option value="electricity">Electricity</option><option value="water">Water</option><option value="laundry">Laundry</option><option value="maintenance">Maintenance</option><option value="internet">Internet</option><option value="supplies">Supplies</option><option value="groceries">Groceries</option><option value="staff_salary">Staff Salary</option><option value="travel">Travel</option><option value="marketing">Marketing</option><option value="other">Other</option></select></div>
              </div>
              <div className="form-group"><label>Description *</label><input required value={eForm.description} onChange={e => setEForm({...eForm, description: e.target.value})} placeholder="What is this expense for?"/></div>
              <div className="form-row">
                <div className="form-group"><label>Amount (₹) *</label><input required type="number" value={eForm.amount} onChange={e => setEForm({...eForm, amount: e.target.value})} placeholder="e.g. 1500"/></div>
                <div className="form-group"><label>Date</label><input type="date" value={eForm.expense_date} onChange={e => setEForm({...eForm, expense_date: e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Payment Method</label><select value={eForm.payment_method} onChange={e => setEForm({...eForm, payment_method: e.target.value})}><option value="cash">Cash</option><option value="UPI">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option></select></div>
                <div className="form-group"><label>Vendor</label><input value={eForm.vendor_name} onChange={e => setEForm({...eForm, vendor_name: e.target.value})} placeholder="Vendor name"/></div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={eForm.is_recurring} onChange={e => setEForm({...eForm, is_recurring: e.target.checked})} />
                  Repeat this expense automatically every month
                </label>
              </div>
              {eForm.is_recurring && (
                <div className="form-row">
                  <div className="form-group"><label>Frequency</label><select value={eForm.recurring_frequency} onChange={e => setEForm({...eForm, recurring_frequency: e.target.value})}><option value="monthly">Monthly</option></select></div>
                  <div className="form-group"><label>Day of month</label><input type="number" min="1" max="31" value={eForm.recurring_day} onChange={e => setEForm({...eForm, recurring_day: e.target.value})} placeholder="e.g. 5"/></div>
                </div>
              )}
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Expense'}</button></div>
            </form>
          </div>
        </div>
      )}

      {summary && (
        <div className="expense-summary-grid">
          <div className="expense-total-card">
            <div className="expense-total-label">Total This Month</div>
            <div className="expense-total-amount">₹{parseFloat(summary.total || 0).toLocaleString()}</div>
            <div className="expense-total-count">{expenses.length} transactions</div>
          </div>
          {summary.byCategory?.slice(0, 5).map(cat => (
            <div key={cat.category} className="expense-cat-card">
              <div className="expense-cat-header">
                <span className="expense-cat-name">{cat.category.replace(/_/g, ' ')}</span>
                <span className="expense-cat-count">{expenses.filter(e => e.category === cat.category).length} items</span>
              </div>
              <div className="expense-cat-amount">₹{parseFloat(cat.total).toLocaleString()}</div>
              <div className="expense-cat-bar"><div className="expense-cat-fill" style={{ width: `${Math.min(100, (cat.total / (summary.total || 1)) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-group">
          <label>Category</label>
          <select value={expFilterCategory} onChange={e => setExpFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="rent">Rent</option>
            <option value="cleaning">Cleaning</option>
            <option value="electricity">Electricity</option>
            <option value="water">Water</option>
            <option value="laundry">Laundry</option>
            <option value="maintenance">Maintenance</option>
            <option value="internet">Internet</option>
            <option value="supplies">Supplies</option>
            <option value="groceries">Groceries</option>
            <option value="staff_salary">Staff Salary</option>
            <option value="travel">Travel</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Property</label>
          <select value={expFilterProperty} onChange={e => setExpFilterProperty(e.target.value)}>
            <option value="">All Properties</option>
            <option value="0">Common</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Payment</label>
          <select value={expFilterPayment} onChange={e => setExpFilterPayment(e.target.value)}>
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div className="filter-group">
          <label>From Date</label>
          <input type="date" value={expFilterDateFrom} onChange={e => setExpFilterDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input type="date" value={expFilterDateTo} onChange={e => setExpFilterDateTo(e.target.value)} />
        </div>
        {(expFilterCategory || expFilterProperty || expFilterDateFrom || expFilterDateTo || expFilterPayment) && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setExpFilterCategory(''); setExpFilterProperty(''); setExpFilterDateFrom(''); setExpFilterDateTo(''); setExpFilterPayment(''); }} style={{ alignSelf: 'flex-end' }}>Clear Filters</button>
        )}
      </div>

      <div className="expense-table-wrapper">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Property</th>
              <th>Payment</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td className="expense-td-date">{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</td>
                <td className="expense-td-desc">{expense.description}</td>
                <td><span className={`expense-cat-badge ${expense.category}`}>{expense.category.replace(/_/g, ' ')}</span>{expense.is_recurring && <span className="expense-cat-badge" title={`Repeats monthly on day ${expense.recurring_day || ''}`} style={{ marginLeft: '4px' }}>↻ recurring</span>}</td>
                <td className="expense-td-prop">{expense.property_id === 0 ? 'Common' : expense.property_name || '-'}</td>
                <td className="expense-td-method">{expense.payment_method}</td>
                <td className="expense-td-amount">₹{parseFloat(expense.amount).toLocaleString()}</td>
                <td className="expense-td-actions">
                  <button className="btn-icon-sm" title="Edit" onClick={() => openEditExp(expense)}><Edit3 size={14}/></button>
                  <button className="btn-icon-sm" title="Delete" onClick={() => deleteExpense(expense.id)}><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;
