import React from 'react';
import { useCartStore } from '../../context/store';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity } = useCartStore();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

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
            cart.map((item, i) => (
              <div className="cart-item" key={i}>
                <div className="ci-img">
                  {item.visual ? (
                    <img src={item.visual} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    'H.S'
                  )}
                </div>
                <div className="ci-info">
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-sz">
                    {item.size} • {item.color}
                  </div>
                  <div className="ci-price">
                    {item.oldPrice ? (
                      <>
                        <span style={{ textDecoration: 'line-through', color: 'var(--mu2)', marginRight: '8px', fontSize: '0.9em' }}>
                          {(item.oldPrice * (item.quantity || 1)).toLocaleString()} EGP
                        </span>
                        <span style={{ color: 'var(--cr)' }}>
                          {(item.price * (item.quantity || 1)).toLocaleString()} EGP
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
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-foot">
            <div className="cart-total-row">
              <div className="cart-total-lbl">Total</div>
              <div className="cart-total-val">{total.toLocaleString()} EGP</div>
            </div>
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
