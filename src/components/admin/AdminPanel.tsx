import React, { useState, useEffect } from 'react';
import { useAdminStore, useNotificationStore } from '../../context/store';
import { useAdminData } from '../../hooks/useAdminData';

const AdminPanel: React.FC = () => {
  const { isAdmin, logout } = useAdminStore();
  const { callEdge } = useAdminData();
  const { showNotif } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isAdmin) {
      loadData(activeTab);
    }
  }, [isAdmin, activeTab]);

  const loadData = async (tab: string) => {
    try {
      if (tab === 'overview' || tab === 'finance') {
        const ords = await callEdge('getOrders');
        const custs = await callEdge('getCustomers');
        setData({ ords, custs });
      } else if (tab === 'orders') {
        const ords = await callEdge('getOrders');
        setData({ ords });
      } else if (tab === 'customers') {
        const custs = await callEdge('getCustomers');
        setData({ custs });
      } else if (tab === 'stock') {
        // Stock doesn't strictly need Edge, but we can fetch via supabase
      }
    } catch (e: any) {
      showNotif(`Failed to load ${tab}: ${e.message}`, '#c0392b');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="adm-panel open">
      <div className="adm-nav">
        <button className="adm-hamburger mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <svg 
            width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="adm-logo">
          HAZED.<span>ADMIN</span>
        </div>
        <div className="adm-tabs desktop-only">
          {['overview', 'orders', 'customers', 'stock', 'finance'].map((tab) => (
            <button
              key={tab}
              className={`adm-tab ${activeTab === tab ? 'on' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="adm-close desktop-only" onClick={logout}>
          Close Session
        </button>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="adm-mobile-menu mobile-only">
          {['overview', 'orders', 'customers', 'stock', 'finance'].map((tab) => (
            <button
              key={tab}
              className={`adm-mobile-tab ${activeTab === tab ? 'on' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setIsMenuOpen(false);
              }}
            >
              {tab}
            </button>
          ))}
          <button className="adm-mobile-tab" onClick={logout} style={{ color: '#c0392b' }}>
            Close Session
          </button>
        </div>
      )}

      <div className="adm-body">
        <h1 className="adm-page-title" style={{ textTransform: 'capitalize' }}>
          {activeTab} Dashboard
        </h1>
        {activeTab === 'overview' && data?.ords && (
          <div className="adm-section on">
            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-lbl">Total Revenue</div>
                <div className="kpi-val">
                  {data.ords.reduce((s: number, o: any) => s + (o.total_price || 0), 0).toLocaleString()}
                  <em> EGP</em>
                </div>
              </div>
              <div className="kpi">
                <div className="kpi-lbl">Total Orders</div>
                <div className="kpi-val">{data.ords.length}</div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'orders' && data?.ords && (
          <div className="adm-section on">
            <div className="ord-table-wrap">
              <table className="ord-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Gov</th>
                    <th>Address</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ords.map((o: any) => (
                    <tr key={o.id}>
                      <td>#{String(o.id).padStart(3, '0')}</td>
                      <td>{o.customers?.name || '—'}</td>
                      <td>{o.customers?.phone || '—'}</td>
                      <td>{o.products?.name || '—'}</td>
                      <td>{o.size}</td>
                      <td>{o.governorate}</td>
                      <td>{o.address}</td>
                      <td>{o.total_price} EGP</td>
                      <td>{o.status}</td>
                      <td>{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Additional tabs omitted for brevity but they are supported conceptually */}
      </div>
    </div>
  );
};

export default AdminPanel;
