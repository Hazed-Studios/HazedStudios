/**
 * HAZED.STUDIOS AdminPanel Component
 * Faithful rebuild of the original static HTML admin panel:
 * Overview, Orders, Customers, Stock, Finance
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, Trash2 } from 'lucide-react';
import { useAdminStore } from '../../context/store';
import { supabase } from '../../lib/supabase';
import { useAdminService, useOrders, useCustomers, useProducts, useAnalytics, usePagination, useWaitlist } from './useAdmin';
import { exporters, whatsapp } from './admin.utils';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

type TabType = 'overview' | 'orders' | 'customers' | 'stock' | 'finance' | 'early access' | 'analytics' | 'insights';

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
        fontSize: '10px',
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

const CustomSelect: React.FC<{
  value: string;
  options: string[];
  onChange: (val: string) => void;
  style?: React.CSSProperties;
}> = ({ value, options, onChange, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If clicking inside the button, do nothing (handled by button onClick)
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      // If clicking inside the portal dropdown, do nothing (handled by item onClick)
      const portal = document.getElementById('custom-select-portal');
      if (portal && portal.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleScroll = (e: Event) => {
      // Only close if scrolling an element other than the portal itself
      const target = e.target as HTMLElement;
      if (target.id !== 'custom-select-portal') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ display: 'inline-block' }}>
      <button 
        onClick={toggleDropdown}
        style={{
          background: 'var(--bg2)', border: '1px solid var(--bd)', color: 'var(--dk)',
          fontSize: '12px', padding: '6px 12px 6px 10px', 
          cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', 
          gap: '12px', minWidth: '120px', justifyContent: 'space-between',
          transition: 'border-color 0.2s',
          ...style
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cr)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--bd)'}
      >
        {value}
        <span style={{ fontSize: '9px', opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {isOpen && createPortal(
        <div 
          id="custom-select-portal"
          style={{
            position: 'fixed', top: coords.top + 4, left: coords.left, width: coords.width,
            background: 'var(--bg2)', border: '1px solid var(--bd)',
            zIndex: 999999, boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            maxHeight: '200px', overflowY: 'auto'
          }}
        >
          {options.map(opt => (
            <div
              key={opt}
              onClick={(e) => { e.stopPropagation(); onChange(opt); setIsOpen(false); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--cr)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dk)'; }}
              style={{
                padding: '10px 12px', fontSize: '12px', color: 'var(--dk)', 
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              {opt}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { isAdmin, logout } = useAdminStore();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return (localStorage.getItem('adminActiveTab') as TabType) || 'overview';
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { service } = useAdminService(isAdmin ? supabase : null);

  // The 'isAdmin' flag is just a local UI preference - it doesn't guarantee
  // the actual Supabase session is still valid. If the session has expired
  // (e.g. on a device that's been logged in a while), every data fetch gets
  // silently blocked by RLS, showing an empty panel with no explanation.
  // Verify the real session on mount and whenever the tab regains focus.
  useEffect(() => {
    if (!isAdmin) return;

    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        logout();
      }
    };

    verifySession();
    window.addEventListener('focus', verifySession);
    return () => window.removeEventListener('focus', verifySession);
  }, [isAdmin, logout]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error (continuing anyway):', err);
    } finally {
      logout();
      navigate('/');
    }
  };

  const { orders, updateOrderStatus, deleteOrder } = useOrders(service);
  const { customers, deleteCustomer } = useCustomers(service);
  const { products, updateStock } = useProducts(service);
  const { report, webAnalytics, generateFinanceReport, getSalesByProduct } = useAnalytics(service);
  const { waitlist, deleteWaitlistEntry } = useWaitlist(service);

  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [selectedWaitlist, setSelectedWaitlist] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingStock, setEditingStock] = useState<{ productId: number; sizes: Record<string, number> } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const handleBulkDeleteWaitlist = async () => {
    if (selectedWaitlist.size === 0) return;
    setConfirmConfig({
      message: `Are you sure you want to delete ${selectedWaitlist.size} email${selectedWaitlist.size > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmConfig(null);
        setIsDeleting(true);
        for (const id of Array.from(selectedWaitlist)) {
          await deleteWaitlistEntry(id);
        }
        setSelectedWaitlist(new Set());
        setIsDeleting(false);
      }
    });
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedOrders.size === 0) return;
    setConfirmConfig({
      message: `Are you sure you want to delete ${selectedOrders.size} order${selectedOrders.size > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmConfig(null);
        setIsDeleting(true);
        for (const id of Array.from(selectedOrders)) {
          await deleteOrder(id);
        }
        setSelectedOrders(new Set());
        setIsDeleting(false);
        generateFinanceReport();
        getSalesByProduct();
      }
    });
  };

  const handleBulkDeleteCustomers = async () => {
    if (selectedCustomers.size === 0) return;
    setConfirmConfig({
      message: `Are you sure you want to delete ${selectedCustomers.size} customer${selectedCustomers.size > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmConfig(null);
        setIsDeleting(true);
        for (const id of Array.from(selectedCustomers)) {
          await deleteCustomer(id);
        }
        setSelectedCustomers(new Set());
        setIsDeleting(false);
      }
    });
  };

  if (!isAdmin) return null;

  // ===== Derived data (matches the original's client-side calculations) =====
  const total = report?.totalRevenue ?? 0;
  const avg = orders.length ? Math.round(total / orders.length) : 0;
  const stockRemaining = products.reduce((sum, p: any) => {
    const sizeStock = p.size_stock || {};
    return sum + (Object.values(sizeStock).reduce((s: number, q: any) => s + (Number(q) || 0), 0) as number);
  }, 0);

  const totalPiecesSold = orders
    .filter((o: any) => o.status !== 'Cancelled')
    .reduce((sum, o: any) => sum + (o.quantity || 1), 0);
  
  const originalStock = stockRemaining + totalPiecesSold;

  const validOrders = orders.filter((o: any) => ['Confirmed', 'Shipped', 'Delivered'].includes(o.status));

  const topProducts = (() => {
    const counts: Record<string, number> = {};
    validOrders.forEach((o: any) => {
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
  const todayRevenue = validOrders
    .filter((o: any) => new Date(o.created_at).toDateString() === today)
    .reduce((s: number, o: any) => s + (o.total_price || 0), 0);

  const stockValue = products.reduce((sum: number, p: any) => {
    const stock = Object.values(p.size_stock || {}).reduce((s: number, q: any) => s + (Number(q) || 0), 0) as number;
    return sum + stock * (p.price || 0);
  }, 0);

  const revenueByProduct = (() => {
    const revs: Record<string, { count: number; rev: number }> = {};
    validOrders.forEach((o: any) => {
      const name = o.products?.name || 'Unknown';
      if (!revs[name]) revs[name] = { count: 0, rev: 0 };
      revs[name].count += 1;
      revs[name].rev += o.total_price || 0;
    });
    return Object.entries(revs).sort((a, b) => b[1].rev - a[1].rev);
  })();

  // ===== Sales Insights: parse "2x M (Baby Blue)" style labels to get
  // real units sold per size and per color, not just order counts =====
  const parseOrderLine = (o: any) => {
    const match = /^(\d+)x\s+(\S+)/.exec(o.size || '');
    return {
      qty: match ? parseInt(match[1], 10) : 1,
      size: match ? match[2] : (o.size || 'Unknown'),
    };
  };

  const unitsBySize = (() => {
    const bySize: Record<string, number> = {};
    validOrders.forEach((o: any) => {
      const { qty, size } = parseOrderLine(o);
      bySize[size] = (bySize[size] || 0) + qty;
    });
    return Object.entries(bySize).sort((a, b) => b[1] - a[1]);
  })();

  const unitsByColor = (() => {
    const byColor: Record<string, number> = {};
    validOrders.forEach((o: any) => {
      const { qty } = parseOrderLine(o);
      const name = o.products?.name || 'Unknown';
      byColor[name] = (byColor[name] || 0) + qty;
    });
    return Object.entries(byColor).sort((a, b) => b[1] - a[1]);
  })();

  // Restock priority: real sales velocity (units/day since first order)
  // vs current stock per product+size, so restocking is based on actual
  // demand rather than a guess.
  const earliestOrderDate = validOrders.length
    ? Math.min(...validOrders.map((o: any) => new Date(o.created_at).getTime()))
    : Date.now();
  const daysSinceLaunch = Math.max(1, (Date.now() - earliestOrderDate) / (1000 * 60 * 60 * 24));

  const restockPriority = (() => {
    const soldByProductSize: Record<string, number> = {};
    validOrders.forEach((o: any) => {
      const { qty, size } = parseOrderLine(o);
      const key = `${o.product_id}|${size}`;
      soldByProductSize[key] = (soldByProductSize[key] || 0) + qty;
    });

    const rows: { product: string; size: string; sold: number; velocity: number; currentStock: number; daysLeft: number | null }[] = [];
    products.forEach((p: any) => {
      Object.entries(p.size_stock || {}).forEach(([size, stock]) => {
        const key = `${p.id}|${size}`;
        const sold = soldByProductSize[key] || 0;
        const velocity = sold / daysSinceLaunch;
        const currentStock = Number(stock) || 0;
        const daysLeft = velocity > 0 ? Math.round(currentStock / velocity) : null;
        rows.push({ product: p.name, size, sold, velocity, currentStock, daysLeft });
      });
    });

    return rows.sort((a, b) => {
      if (a.daysLeft === null) return 1;
      if (b.daysLeft === null) return -1;
      return a.daysLeft - b.daysLeft;
    });
  })();

  const overviewOrdersPagination = usePagination(orders, 10);
  const ordersPagination = usePagination(orders, 50);
  const customersPagination = usePagination(customersWithStats, 50);
  const waitlistPagination = usePagination(waitlist, 50);

  const handleWhatsAppOrder = (o: any) => {
    const phone = o.customers?.phone || '';
    const msg = `Hi ${o.customers?.name || ''}! Your HAZED.STUDIOS order (${o.products?.name || ''} Size ${o.size}) has been ${o.status}. Please reply with "Confirm" or "Decline" to confirm or ignore the order.`;
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
        .adm-kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: var(--bd); border: 1px solid var(--bd); margin-bottom: 40px; }
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

        .adm-checkbox {
          appearance: none;
          background-color: var(--bg);
          margin: 0;
          font: inherit;
          color: currentColor;
          width: 16px;
          height: 16px;
          border: 1px solid var(--bd);
          border-radius: 2px;
          display: grid;
          place-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .adm-checkbox:hover {
          border-color: var(--cr);
        }
        .adm-checkbox::before {
          content: "";
          width: 10px;
          height: 10px;
          transform: scale(0);
          transition: 120ms transform ease-in-out;
          background-color: var(--cr);
          transform-origin: center;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        .adm-checkbox:checked::before {
          transform: scale(1);
        }
        .adm-checkbox:checked {
          border-color: var(--cr);
          background-color: var(--bg2);
        }

        @keyframes slideInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .btn-delete-premium {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(192, 57, 43, 0.05);
          border: 1px solid rgba(192, 57, 43, 0.3);
          color: #c0392b;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: slideInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }
        .btn-delete-premium::before {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(192, 57, 43, 0.9);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: -1;
        }
        .btn-delete-premium:hover {
          color: var(--bg);
          border-color: rgba(192, 57, 43, 0.9);
          box-shadow: 0 4px 12px rgba(192, 57, 43, 0.15);
        }
        .btn-delete-premium:hover::before {
          transform: scaleX(1);
          transform-origin: left;
        }
        .btn-delete-premium:disabled {
          opacity: 0.5;
          pointer-events: none;
        }
        .btn-delete-icon {
          transition: transform 0.3s;
        }
        .btn-delete-premium:hover .btn-delete-icon {
          transform: scale(1.1) rotate(-10deg);
        }

        @keyframes modalPop {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .adm-modal-content {
          animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .adm-panel button:active {
          transform: scale(0.95) !important;
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
            {(['overview', 'insights', 'analytics', 'orders', 'customers', 'stock', 'finance', 'early access'] as TabType[]).map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => { 
                  setActiveTab(tab); 
                  localStorage.setItem('adminActiveTab', tab);
                  setMenuOpen(false); 
                }}
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
                  <em style={styles.kpiEm}>/{originalStock}</em>
                </div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLbl}>Avg. Order Value</div>
                <div style={styles.kpiVal}>
                  {avg.toLocaleString()}
                  <em style={styles.kpiEm}> EGP</em>
                </div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLbl}>Total Visitors</div>
                <div style={styles.kpiVal}>{webAnalytics?.count?.visitors || 0}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLbl}>Total Page Views</div>
                <div style={styles.kpiVal}>{webAnalytics?.count?.pageviews || 0}</div>
              </div>
            </div>

            <div className="adm-row-grid">
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Recent Orders</div>
                  {selectedOrders.size > 0 && (
                    <button onClick={handleBulkDeleteOrders} disabled={isDeleting} className="btn-delete-premium">
                      <Trash2 size={14} className="btn-delete-icon" />
                      <span>Delete Selected ({selectedOrders.size})</span>
                    </button>
                  )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="adm-table" style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, width: '30px', padding: '12px 10px' }}>
                          <input type="checkbox" className="adm-checkbox" checked={overviewOrdersPagination.items.length > 0 && overviewOrdersPagination.items.every((o: any) => selectedOrders.has(o.id))} onChange={(e) => {
                            if (e.target.checked) {
                              const newSet = new Set(selectedOrders);
                              overviewOrdersPagination.items.forEach((o: any) => newSet.add(o.id));
                              setSelectedOrders(newSet);
                            } else {
                              const newSet = new Set(selectedOrders);
                              overviewOrdersPagination.items.forEach((o: any) => newSet.delete(o.id));
                              setSelectedOrders(newSet);
                            }
                          }} />
                        </th>
                        {['#', 'Customer', 'Email', 'Product', 'Size', 'Gov.', 'Total', 'Status', 'Date'].map((h) => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {overviewOrdersPagination.items.length === 0 ? (
                        <tr><td colSpan={9} style={styles.emptyCell}>No orders yet.</td></tr>
                      ) : (
                        overviewOrdersPagination.items.map((o: any) => (
                          <tr key={o.id}>
                            <td style={{ ...styles.td, padding: '12px 10px' }}>
                              <input type="checkbox" className="adm-checkbox" checked={selectedOrders.has(o.id)} onChange={(e) => {
                                const newSet = new Set(selectedOrders);
                                if (e.target.checked) newSet.add(o.id);
                                else newSet.delete(o.id);
                                setSelectedOrders(newSet);
                              }} />
                            </td>
                            <td data-label="#" style={styles.td}>#{String(o.id).padStart(3, '0')}</td>
                            <td data-label="Customer" style={styles.td}>{o.customers?.name || '—'}</td>
                            <td data-label="Email" style={styles.td}>{o.customers?.email || '—'}</td>
                            <td data-label="Product" style={styles.td}>{o.products?.name || '—'}</td>
                            <td data-label="Size" style={styles.td}>{o.size}</td>
                            <td data-label="Gov." style={styles.td}>{o.governorate}</td>
                            <td data-label="Total" style={styles.tdPrice}>{(o.total_price || 0).toLocaleString()} EGP</td>
                            <td data-label="Status" style={styles.td}><StatusBadge status={o.status} /></td>
                            <td data-label="Date" style={styles.tdMuted}>
                              {new Date(o.created_at).toLocaleDateString('en-GB')} <br/>
                              <span style={{ fontSize: '10px', opacity: 0.7 }}>
                                {new Date(o.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <TablePagination pagination={overviewOrdersPagination} />
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
                        <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{name}</span>
                        <span style={{ fontSize: '13px', color: 'var(--cr)' }}>{count} sold</span>
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
              <div style={{ display: 'flex', gap: '12px' }}>
                {selectedOrders.size > 0 && (
                  <button onClick={handleBulkDeleteOrders} disabled={isDeleting} className="btn-delete-premium">
                    <Trash2 size={14} className="btn-delete-icon" />
                    <span>Delete Selected ({selectedOrders.size})</span>
                  </button>
                )}
                <button style={styles.exportBtn} onClick={() => exporters.toCSV(orders, 'hazed_orders.csv')}>
                  Export CSV
                </button>
              </div>
            </div>

            <div style={styles.admCard}>
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-table" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '30px', padding: '12px 10px' }}>
                        <input type="checkbox" className="adm-checkbox" checked={ordersPagination.items.length > 0 && ordersPagination.items.every((o: any) => selectedOrders.has(o.id))} onChange={(e) => {
                          if (e.target.checked) {
                            const newSet = new Set(selectedOrders);
                            ordersPagination.items.forEach((o: any) => newSet.add(o.id));
                            setSelectedOrders(newSet);
                          } else {
                            const newSet = new Set(selectedOrders);
                            ordersPagination.items.forEach((o: any) => newSet.delete(o.id));
                            setSelectedOrders(newSet);
                          }
                        }} />
                      </th>
                      {['#', 'Customer', 'Phone', 'Email', 'Product', 'Size', 'Gov.', 'Address', 'Total', 'Status', 'WhatsApp', 'Date'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ordersPagination.items.length === 0 ? (
                      <tr><td colSpan={12} style={styles.emptyCell}>No orders found.</td></tr>
                    ) : (
                      ordersPagination.items.map((o: any) => (
                        <tr key={o.id}>
                          <td style={{ ...styles.td, padding: '12px 10px' }}>
                            <input type="checkbox" className="adm-checkbox" checked={selectedOrders.has(o.id)} onChange={(e) => {
                              const newSet = new Set(selectedOrders);
                              if (e.target.checked) newSet.add(o.id);
                              else newSet.delete(o.id);
                              setSelectedOrders(newSet);
                            }} />
                          </td>
                          <td data-label="#" style={styles.td}>#{String(o.id).padStart(3, '0')}</td>
                          <td data-label="Customer" style={styles.td}>{o.customers?.name || '—'}</td>
                          <td data-label="Phone" style={styles.td}>{o.customers?.phone || ''}</td>
                          <td data-label="Email" style={styles.td}>{o.customers?.email || '—'}</td>
                          <td data-label="Product" style={{ ...styles.td, minWidth: '180px', whiteSpace: 'normal' }}>{o.products?.name || '—'}</td>
                          <td data-label="Size" style={styles.td}>{o.size}</td>
                          <td data-label="Gov." style={styles.td}>{o.governorate}</td>
                          <td data-label="Address" style={{ ...styles.td, minWidth: '220px', whiteSpace: 'normal' }}>{o.address || '—'}</td>
                          <td data-label="Total" style={styles.tdPrice}>{(o.total_price || 0).toLocaleString()} EGP</td>
                          <td data-label="Status" style={styles.td}>
                            <CustomSelect
                              value={o.status}
                              onChange={async (val) => {
                                await updateOrderStatus(o.id, val);
                                generateFinanceReport();
                                getSalesByProduct();
                              }}
                              options={['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']}
                            />
                          </td>
                          <td data-label="WhatsApp" style={styles.td}>
                            <button style={styles.waBtn} onClick={() => handleWhatsAppOrder(o)}>WhatsApp ↗</button>
                          </td>
                          <td data-label="Date" style={styles.tdMuted}>
                            {new Date(o.created_at).toLocaleDateString('en-GB')} <br/>
                            <span style={{ fontSize: '10px', opacity: 0.7 }}>
                              {new Date(o.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
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
              <div style={{ display: 'flex', gap: '12px' }}>
                {selectedCustomers.size > 0 && (
                  <button onClick={handleBulkDeleteCustomers} disabled={isDeleting} className="btn-delete-premium">
                    <Trash2 size={14} className="btn-delete-icon" />
                    <span>Delete Selected ({selectedCustomers.size})</span>
                  </button>
                )}
                <button style={styles.exportBtn} onClick={() => exporters.toCSV(customersWithStats, 'hazed_customers.csv')}>
                  Export CSV
                </button>
              </div>
            </div>

            <div style={styles.admCard}>
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-table" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '30px', padding: '12px 10px' }}>
                        <input type="checkbox" className="adm-checkbox" checked={customersPagination.items.length > 0 && customersPagination.items.every((c: any) => selectedCustomers.has(c.id))} onChange={(e) => {
                          if (e.target.checked) {
                            const newSet = new Set(selectedCustomers);
                            customersPagination.items.forEach((c: any) => newSet.add(c.id));
                            setSelectedCustomers(newSet);
                          } else {
                            const newSet = new Set(selectedCustomers);
                            customersPagination.items.forEach((c: any) => newSet.delete(c.id));
                            setSelectedCustomers(newSet);
                          }
                        }} />
                      </th>
                      {['Name', 'Email', 'Phone', 'Governorate', 'Orders', 'Total Spent', 'Last Order', 'WhatsApp'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customersPagination.items.length === 0 ? (
                      <tr><td colSpan={8} style={styles.emptyCell}>No customers found.</td></tr>
                    ) : (
                      customersPagination.items.map((c: any) => (
                        <tr key={c.id}>
                          <td style={{ ...styles.td, padding: '12px 10px' }}>
                            <input type="checkbox" className="adm-checkbox" checked={selectedCustomers.has(c.id)} onChange={(e) => {
                              const newSet = new Set(selectedCustomers);
                              if (e.target.checked) newSet.add(c.id);
                              else newSet.delete(c.id);
                              setSelectedCustomers(newSet);
                            }} />
                          </td>
                          <td data-label="Name" style={styles.td}>{c.name}</td>
                          <td data-label="Email" style={styles.td}>{c.email || '—'}</td>
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
                    {editingStock?.productId === p.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
                        {Object.keys(p.size_stock || {}).map(size => (
                          <div key={size} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--mu)', width: '30px' }}>{size}</span>
                            <input 
                              type="number" 
                              value={editingStock?.sizes[size] || 0}
                              onChange={(e) => setEditingStock(prev => prev ? { ...prev, sizes: { ...prev.sizes, [size]: Number(e.target.value) } } : null)}
                              style={{ width: '60px', padding: '4px 8px', border: '1px solid var(--bd)', background: 'var(--bg)', color: 'var(--dk)', fontSize: '12px', outline: 'none' }}
                            />
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button disabled={isDeleting} onClick={async () => {
                            setIsDeleting(true);
                            const totalQty = Object.values(editingStock!.sizes).reduce((sum, q) => sum + q, 0);
                            await updateStock(p.id, totalQty, editingStock!.sizes);
                            setEditingStock(null);
                            setIsDeleting(false);
                          }} style={{ ...styles.exportBtn, color: 'var(--green)', borderColor: 'var(--green)' }}>Save</button>
                          <button onClick={() => setEditingStock(null)} style={{ ...styles.exportBtn, color: 'var(--mu)', borderColor: 'var(--mu)' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', width: '100%' }}>
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
                        <button onClick={() => setEditingStock({ productId: p.id, sizes: { ...p.size_stock } })} style={{ ...styles.exportBtn, padding: '2px 8px', fontSize: '10px', marginLeft: 'auto' }}>Edit</button>
                      </div>
                    )}
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
                      <span style={{ fontSize: '13px', color: 'var(--dk)', lineHeight: '1.4' }}>
                        {name.includes(' — ') ? (
                          <>
                            {name.split(' — ')[0]} —<br />
                            <span style={{ color: 'var(--mu)', fontSize: '12px' }}>{name.split(' — ')[1]}</span>
                          </>
                        ) : (
                          name
                        )}
                      </span>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--mu)' }}>{d.count} units</span>
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
        {/* ===== EARLY ACCESS ===== */}
        {activeTab === 'early access' && (
          <div>
            <div className="adm-page-header">
              <div>
                <div style={styles.pageTitle}>Early Access</div>
                <div style={styles.pageSub}>{waitlist.length} subscribers on the waitlist</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {selectedWaitlist.size > 0 && (
                  <button onClick={handleBulkDeleteWaitlist} disabled={isDeleting} className="btn-delete-premium">
                    <Trash2 size={14} className="btn-delete-icon" />
                    <span>Delete Selected ({selectedWaitlist.size})</span>
                  </button>
                )}
                <button style={styles.exportBtn} onClick={() => exporters.toCSV(waitlist, 'hazed_waitlist.csv')}>
                  Export CSV
                </button>
              </div>
            </div>

            <div style={styles.admCard}>
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-table" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: '30px', padding: '12px 10px' }}>
                        <input type="checkbox" className="adm-checkbox" checked={waitlistPagination.items.length > 0 && waitlistPagination.items.every((w: any) => selectedWaitlist.has(w.id))} onChange={(e) => {
                          if (e.target.checked) {
                            const newSet = new Set(selectedWaitlist);
                            waitlistPagination.items.forEach((w: any) => newSet.add(w.id));
                            setSelectedWaitlist(newSet);
                          } else {
                            const newSet = new Set(selectedWaitlist);
                            waitlistPagination.items.forEach((w: any) => newSet.delete(w.id));
                            setSelectedWaitlist(newSet);
                          }
                        }} />
                      </th>
                      {['ID', 'Email', 'Joined Date'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {waitlistPagination.items.length === 0 ? (
                      <tr><td colSpan={3} style={styles.emptyCell}>No early access subscribers yet.</td></tr>
                    ) : (
                      waitlistPagination.items.map((w: any) => (
                        <tr key={w.id}>
                          <td style={{ ...styles.td, padding: '12px 10px' }}>
                            <input type="checkbox" className="adm-checkbox" checked={selectedWaitlist.has(w.id)} onChange={(e) => {
                              const newSet = new Set(selectedWaitlist);
                              if (e.target.checked) newSet.add(w.id);
                              else newSet.delete(w.id);
                              setSelectedWaitlist(newSet);
                            }} />
                          </td>
                          <td data-label="ID" style={styles.td}>#{String(w.id).padStart(3, '0')}</td>
                          <td data-label="Email" style={{...styles.tdMuted, fontWeight: 'bold'}}>{w.email}</td>
                          <td data-label="Joined Date" style={styles.tdMuted}>
                            {new Date(w.created_at).toLocaleDateString('en-GB')} <br/>
                            <span style={{ fontSize: '10px', opacity: 0.7 }}>
                              {new Date(w.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination pagination={waitlistPagination} />
            </div>
          </div>
        )}
        {/* ===== ANALYTICS ===== */}
        {activeTab === 'analytics' && (
          <div>
            <div className="adm-page-header">
              <div>
                <div style={styles.pageTitle}>Web Analytics</div>
              </div>
            </div>

            {/* Top KPIs */}
            <div className="adm-kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '24px' }}>
              <div style={styles.kpi}>
                <div style={styles.kpiLbl}>Total Visitors</div>
                <div style={styles.kpiVal}>{webAnalytics?.count?.visitors || 0}</div>
              </div>
              <div style={styles.kpi}>
                <div style={styles.kpiLbl}>Total Page Views</div>
                <div style={styles.kpiVal}>{webAnalytics?.count?.pageviews || 0}</div>
              </div>
            </div>

            {/* Data Grids */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              
              {/* Top Countries */}
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Top Countries</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {(!webAnalytics?.countries || webAnalytics.countries.length === 0) ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No data available.</div>
                  ) : (
                    webAnalytics.countries.map((c: any, i: number) => (
                      <div key={i} style={styles.topProdRow}>
                        <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{c.country || 'Unknown'}</span>
                        <span style={{ fontSize: '13px', color: 'var(--cr)' }}>{c.visitors} visitors</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Referrers */}
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Top Referrers</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {(!webAnalytics?.referrers || webAnalytics.referrers.length === 0) ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No data available.</div>
                  ) : (
                    webAnalytics.referrers.map((r: any, i: number) => (
                      <div key={i} style={styles.topProdRow}>
                        <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{r.referrerHostname || 'Direct / Unknown'}</span>
                        <span style={{ fontSize: '13px', color: 'var(--cr)' }}>{r.visitors} visitors</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Pages */}
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Top Pages</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {(!webAnalytics?.pages || webAnalytics.pages.length === 0) ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No data available.</div>
                  ) : (
                    webAnalytics.pages.map((p: any, i: number) => (
                      <div key={i} style={styles.topProdRow}>
                        <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{p.requestPath || '/'}</span>
                        <span style={{ fontSize: '13px', color: 'var(--cr)' }}>{p.visitors} visitors</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Devices */}
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Devices</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {(!webAnalytics?.devices || webAnalytics.devices.length === 0) ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No data available.</div>
                  ) : (
                    webAnalytics.devices.map((d: any, i: number) => (
                      <div key={i} style={styles.topProdRow}>
                        <span style={{ fontSize: '13px', color: 'var(--dk)', textTransform: 'capitalize' }}>{d.deviceType || 'Unknown'}</span>
                        <span style={{ fontSize: '13px', color: 'var(--cr)' }}>{d.visitors} visitors</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Browsers */}
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Browsers</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {(!webAnalytics?.browsers || webAnalytics.browsers.length === 0) ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No data available.</div>
                  ) : (
                    webAnalytics.browsers.map((b: any, i: number) => (
                      <div key={i} style={styles.topProdRow}>
                        <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{b.browserName || 'Unknown'}</span>
                        <span style={{ fontSize: '13px', color: 'var(--cr)' }}>{b.visitors} visitors</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top OS */}
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Operating Systems</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {(!webAnalytics?.os || webAnalytics.os.length === 0) ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No data available.</div>
                  ) : (
                    webAnalytics.os.map((o: any, i: number) => (
                      <div key={i} style={styles.topProdRow}>
                        <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{o.osName || 'Unknown'}</span>
                        <span style={{ fontSize: '13px', color: 'var(--cr)' }}>{o.visitors} visitors</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Events */}
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Custom Events</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {(!webAnalytics?.events || webAnalytics.events.length === 0) ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No events tracked yet.</div>
                  ) : (
                    webAnalytics.events.map((e: any, i: number) => (
                      <div key={i} style={styles.topProdRow}>
                        <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{e.eventName || 'Unknown'}</span>
                        <span style={{ fontSize: '13px', color: 'var(--cr)' }}>{e.total} occurrences</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===== INSIGHTS (sales by size/color, restock priority) ===== */}
        {activeTab === 'insights' && (
          <div>
            <div className="adm-page-header">
              <div>
                <div style={styles.pageTitle}>Sales Insights</div>
                <div style={styles.pageSub}>Based on {validOrders.length} orders — what's actually selling</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              {/* Best Selling Sizes - Bar Chart */}
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Best Selling Sizes</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {unitsBySize.length === 0 ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No sales yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={unitsBySize.map(([size, units]) => ({ size, units }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(192,127,69,.12)" vertical={false} />
                        <XAxis dataKey="size" tick={{ fontSize: 11, fill: 'var(--mu)' }} axisLine={{ stroke: 'var(--bd)' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--mu)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--bd)', fontSize: 12 }}
                          formatter={(value: any) => [`${value} sold`, '']}
                        />
                        <Bar dataKey="units" fill="var(--cr)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Best Selling Color - Pie Chart */}
              <div style={styles.admCard}>
                <div style={styles.admCardHead}>
                  <div style={styles.admCardTtl}>Best Selling Color</div>
                </div>
                <div style={{ padding: '20px' }}>
                  {unitsByColor.length === 0 ? (
                    <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No sales yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={unitsByColor.map(([name, units]) => ({ name, units }))}
                          dataKey="units"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, units }: any) => `${name.split('—').pop()?.trim() || name}: ${units}`}
                          labelLine={false}
                        >
                          {unitsByColor.map(([name], i) => {
                            const colorMap: Record<string, string> = {
                              'Baby Blue': '#a4c2d3',
                              'Natural Linen': '#e3dac9',
                            };
                            const matchedColor = Object.keys(colorMap).find((c) => name.includes(c));
                            const fallback = ['#C07F45', '#9a8878', '#27a06a', '#5a9abf'][i % 4];
                            return <Cell key={i} fill={matchedColor ? colorMap[matchedColor] : fallback} />;
                          })}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--bd)', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Restock Urgency Chart */}
            <div style={styles.admCard}>
              <div style={styles.admCardHead}>
                <div style={styles.admCardTtl}>Restock Urgency — Estimated Days Left</div>
              </div>
              <div style={{ padding: '20px' }}>
                {restockPriority.length === 0 ? (
                  <div style={{ color: 'var(--mu)', fontSize: '11px' }}>No stock data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(180, restockPriority.length * 40)}>
                    <BarChart
                      layout="vertical"
                      data={restockPriority
                        .filter((r) => r.daysLeft !== null)
                        .map((r) => ({
                          label: `${r.product.split('—').pop()?.trim() || r.product} - ${r.size}`,
                          daysLeft: r.daysLeft,
                          urgent: r.daysLeft !== null && r.daysLeft <= 14,
                        }))}
                      margin={{ left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(192,127,69,.12)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--mu)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: 'var(--dk)' }} axisLine={false} tickLine={false} width={140} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--bd)', fontSize: 12 }}
                        formatter={(value: any) => [`${value} days`, 'Est. left']}
                      />
                      <Bar dataKey="daysLeft" radius={[0, 3, 3, 0]}>
                        {restockPriority
                          .filter((r) => r.daysLeft !== null)
                          .map((r, i) => (
                            <Cell key={i} fill={r.daysLeft !== null && r.daysLeft <= 14 ? 'var(--red)' : 'var(--cr)'} />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {restockPriority.some((r) => r.daysLeft === null) && (
                  <div style={{ fontSize: '10px', color: 'var(--mu)', marginTop: '8px' }}>
                    Sizes with no sales yet aren't shown on this chart (no velocity to estimate from) — see the table below for those.
                  </div>
                )}
              </div>
            </div>

            {/* Restock Priority Table - exact numbers */}
            <div style={{ ...styles.admCard, marginTop: '24px' }}>
              <div style={styles.admCardHead}>
                <div style={styles.admCardTtl}>Restock Priority — Exact Numbers</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Product', 'Size', 'Units Sold', 'Current Stock', 'Est. Days Left'].map((h) => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {restockPriority.length === 0 ? (
                      <tr><td colSpan={5} style={styles.emptyCell}>No stock data yet.</td></tr>
                    ) : (
                      restockPriority.map((r, i) => {
                        const urgent = r.daysLeft !== null && r.daysLeft <= 14;
                        return (
                          <tr key={i}>
                            <td style={styles.td}>{r.product}</td>
                            <td style={styles.td}>{r.size}</td>
                            <td style={styles.td}>{r.sold}</td>
                            <td style={styles.td}>{r.currentStock}</td>
                            <td style={{ ...styles.td, color: urgent ? 'var(--red)' : 'var(--dk)', fontWeight: urgent ? 600 : 400 }}>
                              {r.daysLeft === null ? '—' : `${r.daysLeft} days${urgent ? ' — restock soon' : ''}`}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--mu)', marginTop: '12px' }}>
              Estimate based on average sales velocity since your first order ({Math.round(daysSinceLaunch)} days ago). Treat as a guide, not a guarantee.
            </div>
          </div>
        )}
      </main>

      {confirmConfig && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="adm-modal-content">
            <div style={styles.modalMessage}>{confirmConfig.message}</div>
            <div style={styles.modalActions}>
              <button style={{ ...styles.exportBtn, color: 'var(--mu)', borderColor: 'var(--mu)' }} onClick={() => setConfirmConfig(null)}>
                Cancel
              </button>
              <button style={{ ...styles.exportBtn, color: 'var(--bg)', background: 'var(--cr)', borderColor: 'var(--cr)' }} onClick={confirmConfig.onConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
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
        <CustomSelect 
          value={String(itemsPerPage)} 
          options={['10', '20', '50', '100']}
          onChange={(val) => {
            setItemsPerPage(Number(val));
            goToPage(1);
          }}
          style={{ minWidth: '70px', padding: '4px 8px', fontSize: '11px', background: 'transparent', border: 'none' }}
        />
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
    fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mu)',
    background: 'none', border: '1px solid var(--bd)', padding: '8px 18px', cursor: 'pointer',
    transition: 'all 0.3s', textDecoration: 'none',
  },
  tab: {
    fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '8px 18px',
    border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.3s', background: 'none', color: 'var(--mu)',
  },
  tabActive: { background: 'var(--cr)', color: 'var(--bg)', borderColor: 'var(--cr)' },
  pageTitle: { fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--mu)', marginBottom: '12px' },
  pageSub: { fontSize: '13px', letterSpacing: '0.15em', color: 'var(--mu)', marginBottom: '40px' },
  kpi: { background: 'var(--bg2)', padding: '28px' },
  kpiLbl: { fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--mu)', marginBottom: '12px' },
  kpiVal: { fontFamily: "'Times New Roman', Times, serif", fontSize: '44px', fontWeight: 300, color: 'var(--dk)', lineHeight: 1, marginBottom: '6px' },
  kpiEm: { fontSize: '18px', color: 'var(--cr)', fontStyle: 'normal' },
  admCard: { background: 'var(--bg2)', border: '1px solid var(--bd)', marginBottom: '24px' },
  admCardHead: { padding: '20px 24px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  admCardTtl: { fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--mu)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--mu)',
    textAlign: 'left', padding: '12px 20px', borderBottom: '1px solid var(--bd)', whiteSpace: 'nowrap', background: 'var(--bg2)',
  },
  td: { fontSize: '13px', color: 'var(--dk)', padding: '12px 20px', borderBottom: '1px solid var(--bd2)', whiteSpace: 'nowrap' },
  tdPrice: { fontSize: '18px', color: 'var(--cr)', fontFamily: "'Times New Roman', Times, serif", padding: '12px 20px', borderBottom: '1px solid var(--bd2)' },
  tdMuted: { fontSize: '13px', color: 'var(--mu)', padding: '12px 20px', borderBottom: '1px solid var(--bd2)' },
  emptyCell: { textAlign: 'center', color: 'var(--mu)', padding: '24px' },
  topProdRow: { padding: '12px 0', borderBottom: '1px solid var(--bd2)', display: 'flex', justifyContent: 'space-between' },
  exportBtn: {
    fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--cr)',
    background: 'none', border: '1px solid var(--bd)', padding: '6px 14px', cursor: 'pointer', transition: 'all 0.3s',
  },
  statusSel: { background: 'transparent', border: '1px solid var(--bd)', color: 'var(--dk)', fontSize: '12px', padding: '4px 8px', cursor: 'pointer', outline: 'none' },
  waBtn: { background: '#25D366', border: 'none', color: 'white', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '5px 12px', cursor: 'pointer', transition: 'opacity 0.3s' },
  stockItem: { background: 'var(--bg2)', padding: '24px' },
  stockName: { fontSize: '13px', letterSpacing: '0.1em', color: 'var(--dk)', marginBottom: '4px' },
  stockNum: { fontFamily: "'Times New Roman', Times, serif", fontSize: '36px', color: 'var(--cr)', lineHeight: 1, marginBottom: '8px' },
  stockBarWrap: { height: '2px', background: 'rgba(192,127,69,.12)', marginBottom: '8px' },
  stockBar: { height: '100%', background: 'var(--cr)', transition: 'width 0.6s' },
  sizeBadge: { fontSize: '10px', padding: '2px 4px', border: '1px solid var(--bd)', borderRadius: '2px', color: 'var(--mu)', background: 'var(--bg)' },
  finItem: { background: 'var(--bg2)', padding: '24px', border: '1px solid var(--bd)' },
  finLbl: { fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--mu)', marginBottom: '12px' },
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
    gap: '12px',
    background: 'var(--bg2)',
    flexWrap: 'nowrap',
    overflowX: 'auto',
  },
  paginationLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  paginationRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
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
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26, 18, 8, 0.4)',
    backdropFilter: 'blur(8px)',
    zIndex: 10005,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContent: {
    background: 'var(--bg2)',
    padding: '40px',
    border: '1px solid var(--cr)',
    borderRadius: '4px',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
  },
  modalMessage: {
    fontSize: '15px',
    letterSpacing: '0.1em',
    color: 'var(--dk)',
    marginBottom: '32px',
    lineHeight: 1.6,
  },
  modalActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center'
  },
};

export default AdminPanel;
