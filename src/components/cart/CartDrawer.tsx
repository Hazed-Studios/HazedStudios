import React from 'react';
import { useCartStore } from '../../context/store';
import { useNavigate } from 'react-router-dom';
import { calculateCartTotal, getBundleInfo } from '../../utils/cartUtils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity } = useCartStore();
  const navigate = useNavigate();

  const bundle = getBundleInfo(cart);
  const total = calculateCartTotal(cart);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };


  return (
    <>
      <div className={`cart-ov ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-head">
          <div className="cart-ttl">Your Cart</div>
          <button className="cart-x" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-ico">H.S</div>
              <div className="cart-empty-msg">
                Your bag is empty.
                <br />
                Add a piece to begin.
              </div>
            </div>
          ) : (
            <>
              {bundle.qualifies && (
                <div style={{
                  background: 'rgba(192, 127, 69, 0.08)',
                  border: '1px solid var(--cr)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 10px rgba(192, 127, 69, 0.08)'
                }}>
                  <div>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--cr)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      ✓ BUNDLE & SAVE APPLIED
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--dk)', marginTop: '2px', fontWeight: 500 }}>
                      {bundle.totalPoloQty === 2
                        ? 'Buy 2 for 1,200 EGP (Saved 1,200 EGP!)'
                        : bundle.totalPoloQty === 3
                        ? 'Buy 3 for 1,650 EGP (Saved 1,950 EGP!)'
                        : bundle.label}
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cr)', whiteSpace: 'nowrap' }}>
                    -{bundle.bundleDiscount} EGP
                  </span>
                </div>
              )}

              {bundle.totalPoloQty === 1 && (
                <div style={{
                  background: 'rgba(192, 127, 69, 0.05)',
                  border: '1px dashed var(--cr)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: 'var(--dk)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '15px' }}>⚡</span>
                  <div>
                    Add <strong>1 more piece</strong> to get <strong>Buy 2 for 1,200 EGP</strong> (Save 1,200 EGP instead of 1,400)!
                  </div>
                </div>
              )}

              {cart.map((item, i) => (
                <div className="cart-item" key={i}>
                  <div className="ci-img">
                    {item.visual ? (
                      <img src={item.visual} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '4px' }} />
                    ) : (
                      'H.S'
                    )}
                  </div>
                  <div className="ci-info">
                    <div className="ci-name">{item.name}</div>
                    <div className="ci-sz">
                      {item.size} • {item.color}
                    </div>
                    <div className="ci-price" style={{ fontFamily: '"Times New Roman", Times, serif', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {item.oldPrice ? (
                        <>
                          <span style={{ textDecoration: 'line-through', color: 'var(--mu2)', fontSize: '0.9em', whiteSpace: 'nowrap' }}>
                            {(item.oldPrice * (item.quantity || 1)).toLocaleString()} EGP
                          </span>
                          <span style={{ color: 'var(--cr)', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            {(item.price * (item.quantity || 1)).toLocaleString()} EGP
                            <span style={{ 
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              fontSize: '10px', 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.05em', 
                              color: 'var(--bg)', 
                              background: 'var(--cr)', 
                              padding: '3px 6px', 
                              borderRadius: '3px',
                              fontWeight: 700
                            }}>
                              SALE
                            </span>
                          </span>
                        </>
                      ) : (
                        <>{(item.price * (item.quantity || 1)).toLocaleString()} EGP</>
                      )}
                    </div>
                    <div className="ci-qty" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      <button style={{ border: '1px solid var(--bd)', background: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: '4px', color: 'var(--dk)' }} onClick={() => updateQuantity(i, (item.quantity || 1) - 1)}>-</button>
                      <span style={{ fontSize: '13px' }}>{item.quantity || 1}</span>
                      <button style={{ border: '1px solid var(--bd)', background: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: '4px', color: 'var(--dk)' }} onClick={() => updateQuantity(i, (item.quantity || 1) + 1)}>+</button>
                    </div>
                  </div>
                  <button className="ci-rm" onClick={() => removeFromCart(i)}>
                    ×
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-foot">
            <div className="cart-total-row">
              <div className="cart-total-lbl">Subtotal</div>
              <div className="cart-total-val" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                {bundle.qualifies ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--mu2)', fontSize: '14px' }}>
                      {bundle.regularSaleTotal.toLocaleString()} EGP
                    </span>
                    <span style={{ color: 'var(--cr)' }}>
                      {total.toLocaleString()} EGP
                    </span>
                  </div>
                ) : (
                  `${total.toLocaleString()} EGP`
                )}
              </div>
            </div>
            {bundle.qualifies && (
              <div style={{ fontSize: '11.5px', color: 'var(--cr)', textAlign: 'right', fontWeight: 600, marginTop: '-6px', marginBottom: '12px', letterSpacing: '0.02em' }}>
                ✓ Total Saved: {bundle.totalSavedVsOriginal.toLocaleString()} EGP!
              </div>
            )}
            <button className="btn-checkout" onClick={handleCheckout}>
              Checkout →
            </button>

          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
