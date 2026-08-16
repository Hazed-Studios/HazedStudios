/**
 * HAZED.STUDIOS AdminPanel Component
 * Faithful rebuild of the original static HTML admin panel:
 * Overview, Orders, Customers, Stock, Finance
 */

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAdminStore } from '../../context/store';
import { supabase } from '../../lib/supabase';
import { useAdminService, useOrders, useCustomers, useProducts, useAnalytics, usePagination } from './useAdmin';
import { exporters, whatsapp } from './admin.utils';

type TabType = 'overview' | 'orders' | 'customers' | 'stock' | 'finance';

const STATUS_CLASS: Record<string, { bg: string; color: string; border: string }> = {
  Pending: { bg: 'rgba(214,137,16,.1)', color: 'var(--amber)', border: 'rgba(214,137,16,.2)' },
  Confirmed: { bg: 'rgba(39,160,106,.1)', color: 'var(--green)', border: 'rgba(39,160,106,.2)' },
  Shipped: { bg: 'rgba(151,198,224,.15)', color: 'var(--bld)', border: 'rgba(151,198,224,.3)' },
  Delivered: { bg: 'rgba(192,127,69,.1)', color: 'var(--cr)', border: 'var(--bd)' },
  Cancelled: { bg: 'rgba(214,137,16,.1)', color: 'var(--amber)', border: 'rgba(214,137,16,.2)' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_CLASS[status] || STATUS_CLASS.Pending;
  return (
    <span
      style={{
        fontSize: '7px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        padding: '3px 10px',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        display: 'inline-block',
      }}
    >
      {status}
    </span>
  );
};

const AdminPanel: React.FC = () => {
  const { isAdmin, logout } = useAdminStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [menuOpen, setMenuOpen] = useState(false);

  const { service } = useAdminService(isAdmin ? supabase : null);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error (continuing anyway):', err);
    } finally {
      logout();
    }
  };

  const { orders, updateOrderStatus } = useOrders(service);
  const { customers } = useCustomers(service);
  const { products } = useProducts(service);
  const { report } = useAnalytics(service);

  if (!isAdmin) return null;

  // ===== Derived data (matches the original's client-side calculations) =====
  const total = report?.totalRevenue ?? 0;
  const avg = orders.length ? Math.round(total / orders.length) : 0;
  const stockRemaining = products.reduce((sum, p: any) => {
    const sizeStock = p.size_stock || {};
    return sum + (Object.values(sizeStock).reduce((s: number, q: any) => s + (Number(q) || 0), 0) as number);
  }, 0);

  const recentOrders = orders.slice(0, 5);

  const topProducts = (() => {
    const counts: Record<string, number> = {};
    orders.forEach((o: any) => {
      const name = o.products?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  })();

  const customersWithStats = customers.map((c: any) => {
    const custOrders = orders.filter((o: any) => o.customer_id === c.id);
    const totalSpent = custOrders.reduce((s: number, o: any) => s + (o.total_price || 0), 0);
    const lastOrder = custOrders.length
      ? new Date(
          custOrders.reduce((latest: string, o: any) => (o.created_at > latest ? o.created_at : latest), custOrders[0].created_at)
        ).toLocaleDateString('en-GB')
      : null;
    return { ...c, orderCount: custOrders.length, totalSpent, lastOrder };
  });

  const today = new Date().toDateString();
  const todayRevenue = orders
    .filter((o: any) => new Date(o.created_at).toDateString() === today)
    .reduce((s: number, o: any) => s + (o.total_price || 0), 0);

  const stockValue = products.reduce((sum: number, p: any) => {
    const stock = Object.values(p.size_stock || {}).reduce((s: number, q: any) => s + (Number(q) || 0), 0) as number;
    return sum + stock * (p.price || 0);
  }, 0);

  const revenueByProduct = (() => {
    const revs: Record<string, { count: number; rev: number }> = {};
    orders.forEach((o: any) => {
      const name = o.products?.name || 'Unknown';
      if (!revs[name]) revs[name] = { count: 0, rev: 0 };
      revs[name].count += 1;
      revs[name].rev += o.total_price || 0;
    });
    return Object.entries(revs).sort((a, b) => b[1].rev - a[1].rev);
  })();

  const ordersPagination = usePagination(orders, 50);
  const customersPagination = usePagination(customersWithStats, 50);

  const handleWhatsAppOrder = (o: any) => {
    const phone = o.customers?.phone || '';
    const msg = `Hi ${o.customers?.name || ''}! Your HAZED.STUDIOS order (${o.products?.name || ''} Size ${o.size}) has been ${o.status} 🖤`;
    whatsapp.sendMessage(phone, msg);
  };

  const handleWhatsAppCustomer = (c: any) => {
    whatsapp.sendMessage(c.phone, `Hi ${c.name}! HAZED.STUDIOS here 🖤`);
  };

  return (
    <div className="adm-panel" style={styles.container}>
      <style>{`
        .adm-panel-nav { display: flex; justify-content: space-between; align-items: center; padding: 18px 40px; border-bottom: 1px solid var(--bd); background: var(--bg2); flex-shrink: 0; }
        .adm-nav-top { display: flex; align-items: center; }
        .adm-hamburger { display: none; background: none; border: none; color: var(--dk); cursor: pointer; padding: 4px; }
        .adm-nav-menu { display: flex; align-items: center; gap: 24px; }
        .adm-panel-tabs { display: flex; gap: 4px; }
        .adm-panel-body { padding: 40px; overflow-y: auto; flex: 1; }
        .adm-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; background: var(--bd); border: 1px solid var(--bd); margin-bottom: 40px; }
        .adm-row-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2px; margin-bottom: 24px; }
        .adm-stock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: var(--bd); border: 1px solid var(--bd); }
        .adm-fin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: var(--bd); border: 1px solid var(--bd); margin-bottom: 32px; }
        .adm-page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; gap: 16px; flex-wrap: wrap; }
        
        @media (max-width: 900px) {
          .adm-kpi-grid { grid-template-columns: 1fr 1fr; }
          .adm-row-grid { grid-template-columns: 1fr; }
          .adm-stock-grid { grid-template-columns: 1fr; }
          .adm-fin-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .adm-panel-nav { flex-direction: column; align-items: stretch; padding: 16px 20px; }
          .adm-nav-top { position: relative; justify-content: flex-start; width: 100%; }
          .adm-logo { position: absolute; left: 50%; transform: translateX(-50%); width: max-content; }
          .adm-hamburger { display: block; z-index: 10002; position: relative; }
          
          .adm-nav-menu {
            position: fixed; top: 0; left: 0; bottom: 0;
            width: 80%; max-width: 320px;
            background: var(--bg2);
            flex-direction: column; align-items: stretch; gap: 0; 
            padding: 80px 0 0;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10000;
            border-right: 1px solid var(--bd);
          }
          .adm-nav-menu.open { transform: translateX(0); }
          
          .adm-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6); z-index: 9999;
            opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
          }
          .adm-overlay.open { opacity: 1; pointer-events: auto; }
          
          .adm-panel-tabs { flex-direction: column; gap: 0; }
          .adm-panel-tabs button { 
            width: 100%; text-align: left !important; padding: 24px 32px !important; 
            font-size: 12px !important; border: none !important; border-bottom: 1px solid var(--bd2) !important; border-radius: 0;
            background: transparent !important; color: var(--dk) !important;
            letter-spacing: 0.2em !important; transition: all 0.2s;
          }
          .adm-panel-tabs button:last-child { border-bottom: none !important; }
          .adm-panel-tabs button.active {
            background: rgba(192, 127, 69, 0.08) !important;
            color: var(--cr) !important;
            border-left: 3px solid var(--cr) !important;
            padding-left: 29px !important;
          }
          .adm-mobile-close {
            margin-top: auto; padding: 24px !important; font-size: 11px !important;
            border: none !important; border-top: 1px solid var(--bd) !important; background: var(--bg) !important;
            color: var(--mu) !important; text-align: center; display: block; width: 100%;
          }
          .adm-panel-body { padding: 16px; }
          .adm-kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      {/* Header */}
      <header className="adm-panel-nav">
        <div className="adm-nav-top">
          <button className="adm-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="adm-logo" style={styles.logo}>
            HAZED.<span style={{ color: 'var(--cr)' }}>ADMIN</span>
          </div>
        </div>
        
        <div className={`adm-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}></div>

        <div className={`adm-nav-menu ${menuOpen ? 'open' : ''}`}>
          <div className="adm-panel-tabs">
            {(['overview', 'orders', 'customers', 'stock', 'finance'] as TabType[]).map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => { setActiveTab(tab); setMenuOpen(false); }}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <a href={import.meta.env.BASE_URL} onClick={handleLogout} style={{ ...styles.closeBtn, textAlign: 'center' }} className="adm-mobile-close">
            ← Back to Store
          </a>
        </div>
      </header>

      {/* Body */}
      <main className="adm-panel-body">
        {/* ===== OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <div>
            <div style={styles.pageTitle}>Dashboard</div>
            <div style={styles.pageSub}>
              Collection 01 — {orders.length} orders as of {new Date().toLocaleDateString('en-GB')}
            </div>

            <div className="adm-kpi-grid">
              <div style={styles.kpi}>
                <div style={styles.kpiLbl}>Total Revenue</div>
                <div style={styles.kpiVal}>
                  {total.toLocaleString()}
                  <em style={styles.kpiEm}> EGP</em>
                </div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLbl}>Total Orders</div>
                <div style={styles.kpiVal}>{orders.length}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLbl}>Pieces Remaining</div>
                <div style={styles.kpiVal}>
                  {stockRemaining}
                  <em style={styles.kpiEm}>/{products.length * 50}</em>
                </div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLbl}>Avg. Order Value</div>
                <div style={styles.kpiVal}>
                  {avg.toLocaleString()}
                  <em style={styles.kpiEm}> EGP</em>
                </div>
              </div>
            </div>

            <div className="adm-row-grid">
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Recent Orders</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="adm-table" style={styles.table}>
                    <thead>
                      <tr>
                        {['#', 'Customer', 'Product', 'Size', 'Gov.', 'Total', 'Status', 'Date'].map((h) => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.length === 0 ? (
                        <tr><td colSpan={8} style={styles.emptyCell}>No orders yet.</td></tr>
                      ) : (
                        recentOrders.map((o: any) => (
                          <tr key={o.id}>
                            <td data-label="#" style={styles.td}>#{String(o.id).padStart(3, '0')}</td>
                            <td data-label="Customer" style={styles.td}>{o.customers?.name || '—'}</td>
                            <td data-label="Product" style={styles.td}>{o.products?.name || '—'}</td>
                            <td data-label="Size" style={styles.td}>{o.size}</td>
                            <td data-label="Gov." style={styles.td}>{o.governorate}</td>
                            <td data-label="Total" style={styles.tdPrice}>{(o.total_price || 0).toLocaleString()} EGP</td>
                            <td data-label="Status" style={styles.td}><StatusBadge status={o.status} /></td>
                            <td data-label="Date" style={styles.tdMuted}>{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Top Products</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {topProducts.length === 0 ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No sales yet.</div>
                  ) : (
                    topProducts.map(([name, count]) => (
                      <div key={name} style={styles.topProdRow}>
                        <span style={{ fontSize: '11px', color: 'var(--dk)' }}>{name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--cr)' }}>{count} sold</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== ORDERS ===== */}
        {activeTab === 'orders' && (
          <div>
            <div className="adm-page-header">
              <div>
                <div style={styles.pageTitle}>Orders</div>
                <div style={styles.pageSub}>{orders.length} orders — Collection 01</div>
              </div>
              <button style={styles.exportBtn} onClick={() => exporters.toCSV(orders, 'hazed_orders.csv')}>
                Export CSV
              </button>
            </div>

            <div style={styles.admCard}>
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-table" style={styles.table}>
                  <thead>
                    <tr>
                      {['#', 'Customer', 'Phone', 'Product', 'Size', 'Gov.', 'Address', 'Total', 'Status', 'WhatsApp', 'Date'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ordersPagination.items.length === 0 ? (
                      <tr><td colSpan={11} style={styles.emptyCell}>No orders found.</td></tr>
                    ) : (
                      ordersPagination.items.map((o: any) => (
                        <tr key={o.id}>
                          <td data-label="#" style={styles.td}>#{String(o.id).padStart(3, '0')}</td>
                          <td data-label="Customer" style={styles.td}>{o.customers?.name || '—'}</td>
                          <td data-label="Phone" style={styles.td}>{o.customers?.phone || ''}</td>
                          <td data-label="Product" style={{ ...styles.td, minWidth: '180px', whiteSpace: 'normal' }}>{o.products?.name || '—'}</td>
                          <td data-label="Size" style={styles.td}>{o.size}</td>
                          <td data-label="Gov." style={styles.td}>{o.governorate}</td>
                          <td data-label="Address" style={{ ...styles.td, minWidth: '220px', whiteSpace: 'normal', fontSize: '10px', color: 'var(--mu)' }}>{o.address || '—'}</td>
                          <td data-label="Total" style={styles.tdPrice}>{(o.total_price || 0).toLocaleString()} EGP</td>
                          <td data-label="Status" style={styles.td}>
                            <select
                              value={o.status}
                              onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                              style={styles.statusSel}
                            >
                              {['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                          <td data-label="WhatsApp" style={styles.td}>
                            <button style={styles.waBtn} onClick={() => handleWhatsAppOrder(o)}>WhatsApp ↗</button>
                          </td>
                          <td data-label="Date" style={styles.tdMuted}>{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination pagination={ordersPagination} />
            </div>
          </div>
        )}

        {/* ===== CUSTOMERS ===== */}
        {activeTab === 'customers' && (
          <div>
            <div className="adm-page-header">
              <div>
                <div style={styles.pageTitle}>Customers</div>
                <div style={styles.pageSub}>{customers.length} customers — Collection 01</div>
              </div>
              <button style={styles.exportBtn} onClick={() => exporters.toCSV(customersWithStats, 'hazed_customers.csv')}>
                Export CSV
              </button>
            </div>

            <div style={styles.admCard}>
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-table" style={styles.table}>
                  <thead>
                    <tr>
                      {['Name', 'Phone', 'Governorate', 'Orders', 'Total Spent', 'Last Order', 'WhatsApp'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customersPagination.items.length === 0 ? (
                      <tr><td colSpan={7} style={styles.emptyCell}>No customers found.</td></tr>
                    ) : (
                      customersPagination.items.map((c: any) => (
                        <tr key={c.id}>
                          <td data-label="Name" style={styles.td}>{c.name}</td>
                          <td data-label="Phone" style={styles.td}>{c.phone}</td>
                          <td data-label="Gov." style={styles.td}>{c.governorate || '—'}</td>
                          <td data-label="Orders" style={styles.td}>{c.orderCount}</td>
                          <td data-label="Total Spent" style={styles.tdPrice}>{c.totalSpent.toLocaleString()} EGP</td>
                          <td data-label="Last Order" style={styles.tdMuted}>{c.lastOrder || '—'}</td>
                          <td data-label="WhatsApp" style={styles.td}>
                            <button style={styles.waBtn} onClick={() => handleWhatsAppCustomer(c)}>WhatsApp</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination pagination={customersPagination} />
            </div>
          </div>
        )}

        {/* ===== STOCK ===== */}
        {activeTab === 'stock' && (
          <div>
            <div style={styles.pageTitle}>Stock &amp; Inventory</div>
            <div style={styles.pageSub}>Collection 01 — {stockRemaining} pieces remaining</div>

            <div className="adm-stock-grid">
              {products.map((p: any) => {
                const stock = Object.values(p.size_stock || {}).reduce((s: number, q: any) => s + (Number(q) || 0), 0) as number;
                const pct = Math.min(Math.round((stock / 15) * 100), 100);
                const low = stock <= 5;
                return (
                  <div key={p.id} style={styles.stockItem}>
                    <div style={styles.stockName}>{p.name}</div>
                    <div style={{ ...styles.stockNum, ...(low ? { color: 'var(--red)' } : {}) }}>{stock}</div>
                    <div style={styles.stockBarWrap}>
                      <div style={{ ...styles.stockBar, width: `${pct}%`, ...(low ? { background: 'var(--red)' } : {}) }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {Object.entries(p.size_stock || {}).map(([size, qty]: [string, any]) => {
                        const q = Number(qty) || 0;
                        const state = q > 2 ? 'ok' : q > 0 ? 'low' : 'none';
                        return (
                          <span
                            key={size}
                            style={{
                              ...styles.sizeBadge,
                              ...(state === 'ok'
                                ? { borderColor: 'rgba(39,160,106,.3)', color: 'var(--green)' }
                                : state === 'low'
                                ? { borderColor: 'rgba(192,35,35,.3)', color: 'var(--red)' }
                                : {}),
                            }}
                          >
                            {size}:{q}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== FINANCE ===== */}
        {activeTab === 'finance' && (
          <div>
            <div style={styles.pageTitle}>Financial Report</div>
            <div style={styles.pageSub}>Collection 01 — Revenue breakdown</div>

            <div className="adm-fin-grid">
              {[
                ['Total Revenue', `${total.toLocaleString()}`, 'EGP'],
                ["Today's Revenue", `${todayRevenue.toLocaleString()}`, 'EGP'],
                ['Orders', `${orders.length}`, ''],
                ['Avg. Order Value', `${avg.toLocaleString()}`, 'EGP'],
                ['Units Sold', `${orders.length}`, ''],
                ['Stock Value Left', `${stockValue.toLocaleString()}`, 'EGP'],
              ].map(([lbl, val, suffix]) => (
                <div key={lbl} style={styles.finItem}>
                  <div style={styles.finLbl}>{lbl}</div>
                  <div style={styles.finVal}>
                    {val}
                    {suffix && <em style={styles.finEm}> {suffix}</em>}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.admCard}>
              <div style={styles.admCardHead}>
                <div style={styles.admCardTtl}>Revenue by Product</div>
              </div>
              <div style={{ padding: '20px' }}>
                {revenueByProduct.length === 0 ? (
                  <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No sales yet.</div>
                ) : (
                  revenueByProduct.map(([name, d]) => (
                    <div key={name} style={styles.revRow}>
                      <span style={{ fontSize: '11px', color: 'var(--dk)' }}>{name}</span>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--mu)' }}>{d.count} units</span>
                        <span style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '18px', color: 'var(--cr)' }}>
                          {d.rev.toLocaleString()} EGP
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const TablePagination = ({ pagination }: { pagination: any }) => {
  const { currentPage, itemsPerPage, setItemsPerPage, total, goToPage, nextPage, prevPage, canGoNext, canGoPrev } = pagination;
  
  if (total === 0) return null;
  
  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(startIdx + itemsPerPage - 1, total);

  return (
    <div style={styles.paginationContainer}>
      <div style={styles.paginationLeft}>
        Rows per page: 
        <select 
          value={itemsPerPage} 
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            goToPage(1);
          }}
          style={styles.paginationSelect}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      <div style={styles.paginationRight}>
        <span>{startIdx}–{endIdx} of {total.toLocaleString()}</span>
        <button 
          onClick={prevPage} 
          disabled={!canGoPrev}
          style={{ ...styles.paginationBtn, opacity: canGoPrev ? 1 : 0.3, cursor: canGoPrev ? 'pointer' : 'default' }}
        >
          &lt;
        </button>
        <button 
          onClick={nextPage} 
          disabled={!canGoNext}
          style={{ ...styles.paginationBtn, opacity: canGoNext ? 1 : 0.3, cursor: canGoNext ? 'pointer' : 'default' }}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    inset: 0,
    background: 'var(--bg)',
    zIndex: 9998,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  logo: { fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', letterSpacing: '0.2em', color: 'var(--dk)' },
  closeBtn: {
    fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mu)',
    background: 'none', border: '1px solid var(--bd)', padding: '8px 18px', cursor: 'pointer',
    transition: 'all 0.3s', textDecoration: 'none',
  },
  tab: {
    fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '8px 18px',
    border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.3s', background: 'none', color: 'var(--mu)',
  },
  tabActive: { background: 'var(--cr)', color: 'var(--bg)', borderColor: 'var(--cr)' },
  pageTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: '36px', fontWeight: 300, marginBottom: '6px', color: 'var(--dk)' },
  pageSub: { fontSize: '10px', letterSpacing: '0.15em', color: 'var(--mu)', marginBottom: '40px' },
  kpi: { background: 'var(--bg2)', padding: '28px' },
  kpiLbl: { fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--mu)', marginBottom: '12px' },
  kpiVal: { fontFamily: "'Times New Roman', Times, serif", fontSize: '44px', fontWeight: 300, color: 'var(--dk)', lineHeight: 1, marginBottom: '6px' },
  kpiEm: { fontSize: '18px', color: 'var(--cr)', fontStyle: 'normal' },
  admCard: { background: 'var(--bg2)', border: '1px solid var(--bd)', marginBottom: '24px' },
  admCardHead: { padding: '20px 24px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  admCardTtl: { fontSize: '8px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--cr)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    fontSize: '7px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--mu)',
    textAlign: 'left', padding: '12px 20px', borderBottom: '1px solid var(--bd)', whiteSpace: 'nowrap', background: 'var(--bg2)',
  },
  td: { fontSize: '11px', color: 'var(--dk)', padding: '12px 20px', borderBottom: '1px solid var(--bd2)', whiteSpace: 'nowrap' },
  tdPrice: { fontSize: '16px', color: 'var(--cr)', fontFamily: "'Times New Roman', Times, serif", padding: '12px 20px', borderBottom: '1px solid var(--bd2)' },
  tdMuted: { fontSize: '11px', color: 'var(--mu)', padding: '12px 20px', borderBottom: '1px solid var(--bd2)' },
  emptyCell: { textAlign: 'center', color: 'var(--mu)', padding: '24px' },
  topProdRow: { padding: '12px 0', borderBottom: '1px solid var(--bd2)', display: 'flex', justifyContent: 'space-between' },
  exportBtn: {
    fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--cr)',
    background: 'none', border: '1px solid var(--bd)', padding: '6px 14px', cursor: 'pointer', transition: 'all 0.3s',
  },
  statusSel: { background: 'transparent', border: '1px solid var(--bd)', color: 'var(--dk)', fontSize: '9px', padding: '4px 8px', cursor: 'pointer', outline: 'none' },
  waBtn: { background: '#25D366', border: 'none', color: 'white', fontSize: '7px', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '5px 12px', cursor: 'pointer', transition: 'opacity 0.3s' },
  stockItem: { background: 'var(--bg2)', padding: '24px' },
  stockName: { fontSize: '11px', letterSpacing: '0.1em', color: 'var(--dk)', marginBottom: '4px' },
  stockNum: { fontFamily: "'Times New Roman', Times, serif", fontSize: '36px', color: 'var(--cr)', lineHeight: 1, marginBottom: '8px' },
  stockBarWrap: { height: '2px', background: 'rgba(192,127,69,.12)', marginBottom: '8px' },
  stockBar: { height: '100%', background: 'var(--cr)', transition: 'width 0.6s' },
  sizeBadge: { fontSize: '8px', padding: '2px 4px', border: '1px solid var(--bd)', borderRadius: '2px', color: 'var(--mu)', background: 'var(--bg)' },
  finItem: { background: 'var(--bg2)', padding: '24px', border: '1px solid var(--bd)' },
  finLbl: { fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--mu)', marginBottom: '12px' },
  finVal: { fontFamily: "'Times New Roman', Times, serif", fontSize: '32px', color: 'var(--dk)', lineHeight: 1 },
  finEm: { fontSize: '14px', color: 'var(--cr)', fontStyle: 'normal' },
  revRow: { padding: '16px 0', borderBottom: '1px solid var(--bd2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '12px 24px',
    borderTop: '1px solid var(--bd)',
    fontSize: '12px',
    color: 'var(--dk)',
    gap: '24px',
    background: 'var(--bg2)',
  },
  paginationLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
  },
  paginationRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontWeight: 600,
  },
  paginationSelect: {
    background: 'transparent',
    border: 'none',
    color: 'var(--dk)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  },
  paginationBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--dk)',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
};

export default AdminPanel;
