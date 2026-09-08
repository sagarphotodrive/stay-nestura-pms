import { useState, useEffect } from 'react';
import {
  Download, TrendingUp, IndianRupee, Clock, BarChart3,
  Home, AlertCircle, Users, RefreshCw, CheckCircle, UserCheck
} from 'lucide-react';
import { api } from '../lib/api';
import { format } from '../lib/format';
import { generateReportPDF } from '../lib/pdf';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('pnl');
  const [report, setReport] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [guestAnalytics, setGuestAnalytics] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [adrData, setAdrData] = useState(null);
  const [expSummary, setExpSummary] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [kpiMetrics, setKpiMetrics] = useState(null);
  const [channelProfit, setChannelProfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    api.get('/properties').then(res => setProperties(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAllReports();
  }, [year, month, propertyId]);

  const fetchAllReports = async () => {
    setLoading(true);
    const params = { year, month };
    if (propertyId) params.property_id = propertyId;
    const results = await Promise.allSettled([
      api.get('/reports/profit-loss', { params }),
      api.get('/reports/revenue', { params }),
      api.get('/reports/guest-analytics', { params }),
      api.get('/reports/payment-summary', { params }),
      api.get('/reports/adr', { params }),
      api.get('/expenses/summary', { params }),
      api.get('/bookings/stats/overview', { params }),
      api.get('/reports/kpi-metrics', { params }),
      api.get('/reports/channel-profitability', { params })
    ]);
    const val = (i) => results[i].status === 'fulfilled' ? results[i].value.data : null;
    if (val(0)) setReport(val(0));
    if (val(1)) setRevenue(val(1));
    if (val(2)) setGuestAnalytics(val(2));
    if (val(3)) setPaymentSummary(val(3));
    if (val(4)) setAdrData(val(4));
    if (val(5)) setExpSummary(val(5));
    if (val(6)) setOccupancy(val(6));
    if (val(7)) setKpiMetrics(val(7));
    if (val(8)) setChannelProfit(val(8));
    setLoading(false);
  };

  const monthLabel = `${format(new Date(year, month - 1), 'MMMM yyyy')}`;
  const propLabel = propertyId ? (properties.find(p => p.id === parseInt(propertyId))?.name || '') : 'All Properties';
  const subTitle = `${monthLabel} | ${propLabel}`;

  const downloadPnlPDF = () => {
    if (!report) return;
    generateReportPDF('Profit & Loss Report', subTitle, [{
      title: 'Property-wise P&L',
      head: ['Property', 'Nights Sold', 'Occupancy %', 'Gross Revenue', 'Expenses', 'Net Profit'],
      body: [...report.properties.map(p => [p.property_name, `${p.nights_sold}/${p.available_nights}`, `${p.occupancy_percent}%`, `INR ${p.gross_revenue.toLocaleString()}`, `-INR ${p.expenses.toLocaleString()}`, `INR ${p.net_profit.toLocaleString()}`]),
        [{ content: 'Total', styles: { fontStyle: 'bold' } }, '', '', `INR ${report.totals.total_gross.toLocaleString()}`, `-INR ${report.totals.total_expenses.toLocaleString()}`, `INR ${report.totals.total_net.toLocaleString()}`]]
    }], [
      { label: 'Total Revenue', value: `INR ${report.totals.total_gross.toLocaleString()}` },
      { label: 'Expenses', value: `-INR ${report.totals.total_expenses.toLocaleString()}` },
      { label: 'Net Profit', value: `INR ${report.totals.total_net.toLocaleString()}` }
    ]);
  };

  const downloadRevenuePDF = () => {
    if (!revenue) return;
    const tables = [];
    if (revenue.byChannel?.length) tables.push({ title: 'Revenue by Channel', head: ['Channel', 'Bookings', 'Revenue'], body: [...revenue.byChannel.map(c => [c.channel, c.bookings, `INR ${c.gross.toLocaleString()}`]), [{ content: 'Total', styles: { fontStyle: 'bold' } }, revenue.byChannel.reduce((s,c) => s+c.bookings, 0), `INR ${revenue.byChannel.reduce((s,c) => s+c.gross, 0).toLocaleString()}`]] });
    if (revenue.byProperty?.length) tables.push({ title: 'Revenue by Property', head: ['Property', 'Gross Revenue'], body: [...revenue.byProperty.map(p => [p.property_name, `INR ${p.gross.toLocaleString()}`]), [{ content: 'Total', styles: { fontStyle: 'bold' } }, `INR ${revenue.byProperty.reduce((s,p) => s+p.gross, 0).toLocaleString()}`]] });
    generateReportPDF('Revenue Report', subTitle, tables);
  };

  const downloadOccupancyPDF = () => {
    if (!occupancy) return;
    generateReportPDF('Occupancy Report', subTitle, [{
      title: 'Property Occupancy',
      head: ['Property', 'Nights Booked', 'Nights Available', 'Occupancy %'],
      body: occupancy.occupancy?.map(p => [p.property_name, p.total_nights_booked, p.total_nights_available, `${p.occupancy_percent}%`]) || []
    }], [
      { label: 'Total Bookings', value: String(occupancy.summary?.total_bookings || 0) },
      { label: 'Unique Guests', value: String(occupancy.summary?.unique_guests || 0) },
      { label: 'Gross Revenue', value: `INR ${(occupancy.summary?.total_gross || 0).toLocaleString()}` },
      { label: 'Net Revenue', value: `INR ${(occupancy.summary?.total_net || 0).toLocaleString()}` }
    ]);
  };

  const downloadExpensesPDF = () => {
    if (!expSummary) return;
    const tables = [];
    if (expSummary.byCategory?.length) tables.push({ title: 'Expenses by Category', head: ['Category', 'Count', 'Total'], body: expSummary.byCategory.map(c => [c.category, c.count, `INR ${c.total.toLocaleString()}`]) });
    if (expSummary.byProperty?.length) tables.push({ title: 'Expenses by Property', head: ['Property', 'Total'], body: expSummary.byProperty.map(p => [p.property_name, `INR ${p.total.toLocaleString()}`]) });
    generateReportPDF('Expenses Report', subTitle, tables, [{ label: 'Total Expenses', value: `INR ${(expSummary.total || 0).toLocaleString()}` }]);
  };

  const downloadGuestsPDF = () => {
    if (!guestAnalytics) return;
    generateReportPDF('Guest Analytics', subTitle, [{
      title: 'Top Guests by Revenue',
      head: ['#', 'Guest', 'Phone', 'Stays', 'Total Spent'],
      body: guestAnalytics.topGuests?.map((g, i) => [i + 1, g.name, g.phone || '-', g.total_stays, `INR ${(g.total_spent || g.lifetime_value || 0).toLocaleString()}`]) || []
    }], [
      { label: 'Total Guests', value: String(guestAnalytics.total_guests) },
      { label: 'New Guests', value: String(guestAnalytics.new_guests) },
      { label: 'Repeat Guests', value: String(guestAnalytics.repeat_guests) },
      { label: 'Repeat Rate', value: `${guestAnalytics.repeat_rate}%` }
    ]);
  };

  const downloadPaymentsPDF = () => {
    if (!paymentSummary) return;
    generateReportPDF('Payment Summary', subTitle, [{
      title: 'Payment Breakdown',
      head: ['Status', 'Count', 'Amount'],
      body: [
        ['Fully Paid', paymentSummary.paid.count, `INR ${paymentSummary.paid.total.toLocaleString()}`],
        ['Partial - Collected', paymentSummary.partial.count, `INR ${paymentSummary.partial.collected.toLocaleString()}`],
        ['Partial - Remaining', '', `INR ${paymentSummary.partial.remaining.toLocaleString()}`],
        ['Pending', paymentSummary.pending.count, `INR ${paymentSummary.pending.total.toLocaleString()}`],
        [{ content: 'Total Collected', styles: { fontStyle: 'bold' } }, '', `INR ${paymentSummary.total_collected.toLocaleString()}`],
        [{ content: 'Total Pending', styles: { fontStyle: 'bold' } }, '', `INR ${paymentSummary.total_pending.toLocaleString()}`]
      ]
    }]);
  };

  const downloadAdrPDF = () => {
    if (!adrData) return;
    generateReportPDF('ADR Report', subTitle, [{
      title: 'Average Daily Rate by Property',
      head: ['Property', 'Base Price', 'Nights Sold', 'Total Revenue', 'ADR', 'vs Base'],
      body: adrData.properties?.map(p => [p.property_name, `INR ${p.base_price.toLocaleString()}`, p.nights_sold, `INR ${p.total_revenue.toLocaleString()}`, `INR ${p.adr.toLocaleString()}`, p.base_price > 0 ? `${p.adr >= p.base_price ? '+' : ''}${Math.round((p.adr - p.base_price) / p.base_price * 100)}%` : 'N/A']) || []
    }], [{ label: 'Overall ADR', value: `INR ${adrData.overall_adr.toLocaleString()}` }]);
  };

  const downloadKpiPDF = () => {
    if (!kpiMetrics) return;
    generateReportPDF('KPI Metrics Report', subTitle, [{
      title: 'Key Performance Indicators',
      head: ['Property', 'RevPAR', 'GOPPAR', 'ALOS', 'ADR', 'Occupancy'],
      body: kpiMetrics.properties?.map(p => [p.property_name, `INR ${p.revpar.toLocaleString()}`, `INR ${p.goppar.toLocaleString()}`, `${p.alos} nights`, `INR ${p.adr.toLocaleString()}`, `${p.occupancy}%`]) || []
    }], [{ label: 'RevPAR', value: `INR ${kpiMetrics.revpar.toLocaleString()}` }, { label: 'GOPPAR', value: `INR ${kpiMetrics.goppar.toLocaleString()}` }, { label: 'ALOS', value: `${kpiMetrics.alos} nights` }]);
  };

  const downloadChannelPDF = () => {
    if (!channelProfit) return;
    generateReportPDF('Channel Profitability Report', subTitle, [{
      title: 'Channel Performance',
      head: ['Channel', 'Bookings', 'Gross Revenue', 'Commission %', 'Commission', 'Net Revenue', 'Share %'],
      body: channelProfit.channels?.map(c => [c.channel, c.bookings, `INR ${c.gross.toLocaleString()}`, `${c.commission_rate}%`, `-INR ${c.commission.toLocaleString()}`, `INR ${c.net_after_commission.toLocaleString()}`, `${c.share_pct}%`]) || []
    }], [{ label: 'Direct %', value: `${channelProfit.summary.direct_pct}%` }, { label: 'Commission Drain', value: `INR ${channelProfit.summary.total_commission.toLocaleString()}` }]);
  };

  const downloadMap = { pnl: downloadPnlPDF, revenue: downloadRevenuePDF, occupancy: downloadOccupancyPDF, expenses: downloadExpensesPDF, guests: downloadGuestsPDF, payments: downloadPaymentsPDF, adr: downloadAdrPDF, kpi: downloadKpiPDF, channels: downloadChannelPDF };

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { id: 'pnl', label: 'P&L' },
    { id: 'kpi', label: 'KPIs' },
    { id: 'channels', label: 'Channels' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'occupancy', label: 'Occupancy' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'guests', label: 'Guests' },
    { id: 'payments', label: 'Payments' },
    { id: 'adr', label: 'ADR' },
  ];

  const maxChannelGross = revenue?.byChannel?.length ? Math.max(...revenue.byChannel.map(c => c.gross)) : 1;
  const maxPropGross = revenue?.byProperty?.length ? Math.max(...revenue.byProperty.map(p => p.gross)) : 1;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <div className="report-filters">
          <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">All Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{format(new Date(2024, m - 1), 'MMMM')}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="report-tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`report-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </div>
      <div style={{ marginBottom: '12px' }}>
        <button className="btn btn-sm btn-primary" onClick={() => downloadMap[activeTab]()}><Download size={14} /> PDF</button>
      </div>

      {/* P&L Tab */}
      {activeTab === 'pnl' && report && (
        <>
          <div className="report-summary">
            <div className="summary-item">
              <span className="label">Total Revenue</span>
              <span className="value">₹{report.totals.total_gross.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="label">Expenses</span>
              <span className="value text-red">-₹{report.totals.total_expenses.toLocaleString()}</span>
            </div>
            <div className="summary-item highlight">
              <span className="label">Net Profit</span>
              <span className="value">₹{report.totals.total_net.toLocaleString()}</span>
            </div>
          </div>
          <div className="report-table">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Nights Sold</th>
                  <th>Occupancy %</th>
                  <th>Gross Revenue</th>
                  <th>Expenses</th>
                  <th>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {report.properties.map(prop => (
                  <tr key={prop.property_id}>
                    <td>{prop.property_name}</td>
                    <td>{prop.nights_sold} / {prop.available_nights || '-'}</td>
                    <td>{prop.occupancy_percent}%</td>
                    <td>₹{prop.gross_revenue.toLocaleString()}</td>
                    <td className="text-red">-₹{prop.expenses.toLocaleString()}</td>
                    <td className="profit">₹{prop.net_profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* KPI Metrics Tab */}
      {activeTab === 'kpi' && kpiMetrics && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="RevPAR" value={`₹${kpiMetrics.revpar.toLocaleString()}`} icon={TrendingUp} color="#6366f1" />
            <StatCard title="GOPPAR" value={`₹${kpiMetrics.goppar.toLocaleString()}`} icon={IndianRupee} color="#10b981" />
            <StatCard title="Avg Length of Stay" value={`${kpiMetrics.alos} nights`} icon={Clock} color="#f59e0b" />
            <StatCard title="ADR" value={`₹${kpiMetrics.adr.toLocaleString()}`} icon={BarChart3} color="#3b82f6" />
          </div>
          <div className="stats-grid" style={{ marginTop: '12px' }}>
            <StatCard title="Occupancy Rate" value={`${kpiMetrics.occupancy_rate}%`} icon={Home} color="#8b5cf6" />
            <StatCard title="Total Revenue" value={`₹${kpiMetrics.total_revenue.toLocaleString()}`} icon={IndianRupee} color="#10b981" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>KPIs by Property</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Property</th><th>RevPAR</th><th>GOPPAR</th><th>ALOS</th><th>ADR</th><th>Occ %</th></tr></thead>
                <tbody>
                  {kpiMetrics.properties?.map(p => (
                    <tr key={p.property_name}>
                      <td>{p.property_name}</td>
                      <td>₹{p.revpar.toLocaleString()}</td>
                      <td className={p.goppar >= 0 ? 'profit' : 'text-red'}>₹{p.goppar.toLocaleString()}</td>
                      <td>{p.alos}</td>
                      <td>₹{p.adr.toLocaleString()}</td>
                      <td>{p.occupancy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px', padding: '16px' }}>
            <div className="kpi-glossary">
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Glossary</h4>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: 1.6 }}>
                <div><strong>RevPAR</strong> — Revenue Per Available Room (Total Revenue ÷ Available Room-Nights)</div>
                <div><strong>GOPPAR</strong> — Gross Operating Profit Per Available Room ((Revenue − Expenses) ÷ Available Room-Nights)</div>
                <div><strong>ALOS</strong> — Average Length of Stay (Total Nights ÷ Total Bookings)</div>
                <div><strong>ADR</strong> — Average Daily Rate (Revenue ÷ Nights Sold)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Profitability Tab */}
      {activeTab === 'channels' && channelProfit && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Direct Revenue %" value={`${channelProfit.summary.direct_pct}%`} icon={TrendingUp} color="#10b981" />
            <StatCard title="OTA Revenue %" value={`${channelProfit.summary.ota_pct}%`} icon={BarChart3} color="#f59e0b" />
            <StatCard title="Commission Drain" value={`₹${channelProfit.summary.total_commission.toLocaleString()}`} icon={AlertCircle} color="#ef4444" />
            <StatCard title="Net After Commission" value={`₹${channelProfit.summary.net_after_commission.toLocaleString()}`} icon={IndianRupee} color="#3b82f6" />
          </div>
          {/* Direct vs OTA bar */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Direct vs OTA Split</h3></div>
            <div className="card-content">
              <div className="channel-split-bar">
                <div className="channel-split-direct" style={{ width: `${channelProfit.summary.direct_pct}%` }}>
                  {channelProfit.summary.direct_pct > 10 && `Direct ${channelProfit.summary.direct_pct}%`}
                </div>
                <div className="channel-split-ota" style={{ width: `${channelProfit.summary.ota_pct}%` }}>
                  {channelProfit.summary.ota_pct > 10 && `OTA ${channelProfit.summary.ota_pct}%`}
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Channel Breakdown</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Channel</th><th>Bookings</th><th>Gross</th><th>Comm %</th><th>Commission</th><th>Net</th><th>Share</th></tr></thead>
                <tbody>
                  {channelProfit.channels?.map(c => (
                    <tr key={c.channel}>
                      <td style={{ textTransform: 'capitalize' }}>{c.channel}</td>
                      <td>{c.bookings}</td>
                      <td>₹{c.gross.toLocaleString()}</td>
                      <td>{c.commission_rate}%</td>
                      <td className="text-red">{c.commission > 0 ? `-₹${c.commission.toLocaleString()}` : '₹0'}</td>
                      <td className="profit">₹{c.net_after_commission.toLocaleString()}</td>
                      <td>{c.share_pct}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                    <td>Total</td>
                    <td>{channelProfit.channels?.reduce((s, c) => s + c.bookings, 0)}</td>
                    <td>₹{channelProfit.summary.total_gross.toLocaleString()}</td>
                    <td>{channelProfit.summary.commission_drain_pct}%</td>
                    <td className="text-red">-₹{channelProfit.summary.total_commission.toLocaleString()}</td>
                    <td className="profit">₹{channelProfit.summary.net_after_commission.toLocaleString()}</td>
                    <td>100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && revenue && (
        <div className="report-sections">
          <div className="card">
            <div className="card-header"><h3>Revenue by Channel</h3></div>
            <div className="card-content">
              {revenue.byChannel?.map(ch => (
                <div key={ch.channel} className="bar-chart-row">
                  <span className="bar-label">{ch.channel}</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${(ch.gross / maxChannelGross) * 100}%`, backgroundColor: ch.channel === 'direct' ? '#10b981' : ch.channel === 'airbnb' ? '#ff5a5f' : '#003580' }}></div>
                  </div>
                  <span className="bar-value">₹{ch.gross.toLocaleString()}</span>
                </div>
              ))}
              <div className="bar-chart-row" style={{ borderTop: '2px solid var(--border)', paddingTop: '8px', marginTop: '8px', fontWeight: 700 }}>
                <span className="bar-label">Total</span>
                <div className="bar-container"></div>
                <span className="bar-value">₹{(revenue.byChannel?.reduce((s, c) => s + c.gross, 0) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Revenue by Property</h3></div>
            <div className="card-content">
              {revenue.byProperty?.map(p => (
                <div key={p.property_name} className="bar-chart-row">
                  <span className="bar-label">{p.property_name}</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${(p.gross / maxPropGross) * 100}%`, backgroundColor: '#6366f1' }}></div>
                  </div>
                  <span className="bar-value">₹{p.gross.toLocaleString()}</span>
                </div>
              ))}
              <div className="bar-chart-row" style={{ borderTop: '2px solid var(--border)', paddingTop: '8px', marginTop: '8px', fontWeight: 700 }}>
                <span className="bar-label">Total</span>
                <div className="bar-container"></div>
                <span className="bar-value">₹{(revenue.byProperty?.reduce((s, p) => s + p.gross, 0) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Channel Breakdown</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Channel</th><th>Bookings</th><th>Revenue</th></tr></thead>
                <tbody>
                  {revenue.byChannel?.map(ch => (
                    <tr key={ch.channel}>
                      <td>{ch.channel}</td>
                      <td>{ch.bookings}</td>
                      <td className="profit">₹{ch.gross.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                    <td>Total</td>
                    <td>{revenue.byChannel?.reduce((s, c) => s + c.bookings, 0)}</td>
                    <td className="profit">₹{(revenue.byChannel?.reduce((s, c) => s + c.gross, 0) || 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Occupancy Tab */}
      {activeTab === 'occupancy' && occupancy && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Total Bookings" value={occupancy.summary?.total_bookings || 0} icon={UserCheck} color="#10b981" />
            <StatCard title="Unique Guests" value={occupancy.summary?.unique_guests || 0} icon={Users} color="#6366f1" />
            <StatCard title="Gross Revenue" value={`₹${(occupancy.summary?.total_gross || 0).toLocaleString()}`} icon={IndianRupee} color="#3b82f6" />
            <StatCard title="Net Revenue" value={`₹${(occupancy.summary?.total_net || 0).toLocaleString()}`} icon={TrendingUp} color="#10b981" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Property Occupancy</h3></div>
            <div className="card-content">
              {occupancy.occupancy?.map(p => (
                <div key={p.property_name} className="occupancy-item">
                  <span className="occupancy-name">{p.property_name}</span>
                  <div className="occupancy-bar">
                    <div className="occupancy-fill" style={{ width: `${p.occupancy_percent}%` }} />
                  </div>
                  <span className="occupancy-percent">{p.occupancy_percent}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Occupancy Details</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Property</th><th>Nights Booked</th><th>Nights Available</th><th>Occupancy %</th></tr></thead>
                <tbody>
                  {occupancy.occupancy?.map(p => (
                    <tr key={p.property_name}>
                      <td>{p.property_name}</td>
                      <td>{p.total_nights_booked}</td>
                      <td>{p.total_nights_available}</td>
                      <td>{p.occupancy_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && expSummary && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Total Expenses" value={`₹${(expSummary.total || 0).toLocaleString()}`} icon={IndianRupee} color="#ef4444" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Expense by Category</h3></div>
            <div className="card-content">
              {expSummary.byCategory?.map(cat => {
                const maxCat = expSummary.byCategory.length ? Math.max(...expSummary.byCategory.map(c => c.total)) : 1;
                return (
                  <div key={cat.category} className="bar-chart-row">
                    <span className="bar-label">{cat.category}</span>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${(cat.total / maxCat) * 100}%`, backgroundColor: '#ef4444' }}></div>
                    </div>
                    <span className="bar-value">₹{cat.total.toLocaleString()} ({cat.count})</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Expense by Property</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Property</th><th>Total Expenses</th></tr></thead>
                <tbody>
                  {expSummary.byProperty?.map(p => (
                    <tr key={p.property_id}>
                      <td>{p.property_name}</td>
                      <td className="text-red">₹{p.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Guest Analytics Tab */}
      {activeTab === 'guests' && guestAnalytics && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Total Guests" value={guestAnalytics.total_guests} icon={Users} color="#6366f1" />
            <StatCard title="New Guests" value={guestAnalytics.new_guests} icon={UserCheck} color="#10b981" />
            <StatCard title="Repeat Guests" value={guestAnalytics.repeat_guests} icon={RefreshCw} color="#f59e0b" />
            <StatCard title="Repeat Rate" value={`${guestAnalytics.repeat_rate}%`} icon={TrendingUp} color="#3b82f6" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Top Guests by Revenue</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>#</th><th>Guest</th><th>Phone</th><th>Stays</th><th>Total Spent</th></tr></thead>
                <tbody>
                  {guestAnalytics.topGuests?.map((g, i) => (
                    <tr key={g.id}>
                      <td>{i + 1}</td>
                      <td>{g.name}</td>
                      <td>{g.phone}</td>
                      <td>{g.total_stays}</td>
                      <td className="profit">₹{(g.total_spent || g.lifetime_value || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary Tab */}
      {activeTab === 'payments' && paymentSummary && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Paid Bookings" value={paymentSummary.paid.count} icon={CheckCircle} color="#10b981" />
            <StatCard title="Paid Amount" value={`₹${paymentSummary.paid.total.toLocaleString()}`} icon={IndianRupee} color="#10b981" />
            <StatCard title="Pending Bookings" value={paymentSummary.pending.count} icon={Clock} color="#f59e0b" />
            <StatCard title="Pending Amount" value={`₹${paymentSummary.pending.total.toLocaleString()}`} icon={AlertCircle} color="#ef4444" />
          </div>
          <div className="stats-grid" style={{ marginTop: '16px' }}>
            <StatCard title="Partial Payments" value={paymentSummary.partial.count} icon={Clock} color="#8b5cf6" />
            <StatCard title="Collected (Partial)" value={`₹${paymentSummary.partial.collected.toLocaleString()}`} icon={IndianRupee} color="#6366f1" />
            <StatCard title="Remaining (Partial)" value={`₹${paymentSummary.partial.remaining.toLocaleString()}`} icon={AlertCircle} color="#ef4444" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Collection Summary</h3></div>
            <div className="card-content">
              <div className="bar-chart-row">
                <span className="bar-label">Collected</span>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${paymentSummary.total_collected / Math.max(1, paymentSummary.total_collected + paymentSummary.total_pending) * 100}%`, backgroundColor: '#10b981' }}></div>
                </div>
                <span className="bar-value">₹{paymentSummary.total_collected.toLocaleString()}</span>
              </div>
              <div className="bar-chart-row">
                <span className="bar-label">Pending</span>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${paymentSummary.total_pending / Math.max(1, paymentSummary.total_collected + paymentSummary.total_pending) * 100}%`, backgroundColor: '#ef4444' }}></div>
                </div>
                <span className="bar-value">₹{paymentSummary.total_pending.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADR Tab */}
      {activeTab === 'adr' && adrData && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Overall ADR" value={`₹${adrData.overall_adr.toLocaleString()}`} icon={TrendingUp} color="#6366f1" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Average Daily Rate by Property</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Property</th><th>Base Price</th><th>Nights Sold</th><th>Total Revenue</th><th>ADR</th><th>vs Base</th></tr></thead>
                <tbody>
                  {adrData.properties?.map(p => (
                    <tr key={p.property_id}>
                      <td>{p.property_name}</td>
                      <td>₹{p.base_price.toLocaleString()}</td>
                      <td>{p.nights_sold}</td>
                      <td>₹{p.total_revenue.toLocaleString()}</td>
                      <td className="profit">₹{p.adr.toLocaleString()}</td>
                      <td className={p.adr >= p.base_price ? 'text-green' : 'text-red'}>
                        {p.base_price > 0 ? `${p.adr >= p.base_price ? '+' : ''}${Math.round((p.adr - p.base_price) / p.base_price * 100)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
