import React, { useState } from 'react';
import { useCartStore, useNotificationStore } from '../context/store';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const Checkout: React.FC = () => {
  const { cart, clearCart } = useCartStore();
  const { showNotif } = useNotificationStore();

  const [formData, setFormData] = useState({
    fn: '',
    fe: '',
    fp: '',
    fgov: 'Cairo',
    fa: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [waLink, setWaLink] = useState('');

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fn, fe, fp, fgov, fa } = formData;

    if (!fn || !fe || !fp || !fgov || !fa) {
      showNotif('Please fill all fields', '#c0392b');
      return;
    }

    if (cart.length === 0) {
      showNotif('Your cart is empty', '#c0392b');
      return;
    }

    setIsSubmitting(true);
    try {
      let { data: existingCust } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', fp)
        .maybeSingle();

      let customerId;
      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const { data: newCust, error: cErr } = await supabase
          .from('customers')
          .insert({ name: fn, phone: fp, email: fe, governorate: fgov })
          .select('id')
          .single();
        if (cErr) throw cErr;
        customerId = newCust.id;
      }

      let firstOrderId = 0;

      for (const item of cart) {
        const qty = item.quantity || 1;
        const sizeString = `${qty}x ${item.size} (${item.color})`;
        
        const { data: newOrder, error: oErr } = await supabase
          .from('orders')
          .insert({
            customer_id: customerId,
            product_id: item.id,
            size: sizeString,
            address: fa,
            governorate: fgov,
            total_price: item.price * qty,
            status: 'Pending',
          })
          .select('id')
          .single();

        if (oErr) throw oErr;
        if (firstOrderId === 0 && newOrder) firstOrderId = newOrder.id;

        // Update Stock (Optimistic)
        const { data: stockData } = await supabase
          .from('product_stock')
          .select('quantity')
          .eq('product_id', item.id)
          .eq('size', item.size)
          .single();

        if (stockData && stockData.quantity >= qty) {
          await supabase
            .from('product_stock')
            .update({ quantity: stockData.quantity - qty })
            .eq('product_id', item.id)
            .eq('size', item.size);
        }
      }

      // Send email via Edge Function (fire and forget)
      if (fe) {
        const productsSummary = cart.map(i => `${i.quantity || 1}x ${i.name}`).join(', ');
        const sizesSummary = cart.map(i => i.size).join(', ');
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'sendConfirmation',
            payload: {
              customerEmail: fe,
              customerName: fn,
              product: productsSummary,
              size: sizesSummary,
              address: fa,
              gov: fgov,
              price: total,
              orderId: firstOrderId,
            },
          }),
        }).catch((e) => console.log('Email send failed:', e.message));
      }

      const waItems = cart.map(i => `${i.quantity || 1}x ${i.name} (${i.size} - ${i.color})`).join(', ');
      const msg = `Hi HAZED.STUDIOS! New order:%0A%0AName: ${encodeURIComponent(fn)}%0APhone: ${fp}%0AItems: ${encodeURIComponent(waItems)}%0AAddress: ${encodeURIComponent(fa + ', ' + fgov)}%0ATotal: ${total.toLocaleString()} EGP`;

      setWaLink(`https://wa.me/201555553777?text=${msg}`);
      setOrderSuccess(true);
      clearCart();
    } catch (err: any) {
      showNotif(`Order failed: ${err.message || 'please try again'}`, '#c0392b');
      console.error('Order error:', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-view open" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="ck-nav">
        <Link to="/" className="ck-back">
          ← Back to Store
        </Link>
        <Link to="/" className="ck-logo" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Hazed Studios" style={{ height: '110px', objectFit: 'contain' }} />
        </Link>
        <div className="ck-tag"></div>
      </div>

      <div className="ord-sec">
        <div className="ord-left">
          <div className="ord-title">Complete Your <em>Order</em></div>
          <div className="ord-sub">
            Fill in your details below. You will only pay upon delivery. Once confirmed, you will receive an automated email and a WhatsApp prompt to finalize your drop-off window.
          </div>

          <div className="ord-feats">
            <div className="ord-feat">Cash on Delivery anywhere in Egypt</div>
            <div className="ord-feat">Free standard shipping over 2400 EGP</div>
            <div className="ord-feat">14-Day Returns & Exchanges</div>
          </div>
        </div>

        <div className="ord-right">
          {!orderSuccess ? (
            <form className="ord-form" onSubmit={submitOrder}>
              <div className="form-title">Shipping Details</div>

              <div className="frow">
                <div className="fg">
                  <label className="fl">Full Name</label>
                  <input
                    type="text"
                    className="fi"
                    id="fn"
                    placeholder="Kareem Ahmed"
                    required
                    value={formData.fn}
                    onChange={handleChange}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Phone Number</label>
                  <input
                    type="tel"
                    className="fi"
                    id="fp"
                    placeholder="01xxxxxxxxx"
                    required
                    value={formData.fp}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="fg">
                <label className="fl">Email Address</label>
                <input
                  type="email"
                  className="fi"
                  id="fe"
                  placeholder="kareem@example.com"
                  required
                  value={formData.fe}
                  onChange={handleChange}
                />
              </div>

              <div className="frow">
                <div className="fg">
                  <label className="fl">Governorate</label>
                  <select className="fsel" id="fgov" value={formData.fgov} onChange={handleChange} required>
                    <option value="Cairo">Cairo</option>
                    <option value="Giza">Giza</option>
                    <option value="Alexandria">Alexandria</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Detailed Address</label>
                  <input
                    type="text"
                    className="fi"
                    id="fa"
                    placeholder="Street, Building, Apt..."
                    required
                    value={formData.fa}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--mu)' }}>Subtotal</span>
                  <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{total.toLocaleString()} EGP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--mu)' }}>Shipping</span>
                  <span style={{ fontSize: '13px', color: 'var(--dk)' }}>Calculated via WhatsApp</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bd)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--cr)' }}>Total</span>
                  <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '24px', color: 'var(--cr)' }}>{total.toLocaleString()} EGP</span>
                </div>
              </div>

              <button type="submit" className="fsub" disabled={isSubmitting || cart.length === 0}>
                {isSubmitting ? 'Placing Order...' : 'Confirm Order →'}
              </button>
              <div className="form-note">
                Payment is Cash on Delivery. By confirming, you agree to our terms.
              </div>
            </form>
          ) : (
            <div className="ord-success show">
              <div className="ors-icon">✓</div>
              <div className="ors-title">Order Received</div>
              <div className="ors-text">
                Thank you for choosing HAZED.STUDIOS. Your order has been placed successfully.
                <br />
                <br />
                Please click below to send us a quick WhatsApp message so we can confirm your delivery time.
              </div>
              <a href={waLink} target="_blank" rel="noreferrer" className="ors-wa">
                Confirm on WhatsApp ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
