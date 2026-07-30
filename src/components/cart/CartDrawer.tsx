import React from 'react';
import { useCartStore } from '../../context/store';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart } = useCartStore();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const cartWhatsapp = () => {
    if (!cart.length) return;
    const items = cart.map((i) => `${i.name} (${i.size} - ${i.color})`).join(', ');
    window.open(
      `https://wa.me/201555553777?text=Hi%20HAZED.STUDIOS!%20I'd%20like%20to%20order:%20${encodeURIComponent(
        items
      )}%20—%20Total:%20${total}%20EGP`,
      '_blank'
    );
  };

  return (
    <>
      <div className={`cart-ov ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-head">
          <div className="cart-ttl">Your Bag</div>
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
                  {item.visual && item.visual.startsWith('/images/') ? (
                    <img src={item.visual} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    item.visual || 'H.S'
                  )}
                </div>
                <div className="ci-info">
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-sz">
                    {item.size} • {item.color}
                  </div>
                  <div className="ci-price">{item.price.toLocaleString()} EGP</div>
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
            <button className="cart-wa" onClick={cartWhatsapp}>
              Order via WhatsApp
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
