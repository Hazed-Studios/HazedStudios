import React, { useState } from 'react';
import { useCartStore, useNotificationStore } from '../context/store';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const EGYPTIAN_GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Aswan", "Asyut", "Beheira", "Beni Suef", "Dakahlia",
  "Damietta", "Faiyum", "Gharbia", "Ismailia", "Kafr El Sheikh",
  "Luxor", "Matrouh", "Minya", "Monufia", "New Valley", "North Sinai",
  "Port Said", "Qalyubia", "Qena", "Red Sea", "Sharqia", "Sohag",
  "South Sinai", "Suez"
];

const CustomCombobox = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredOptions = options.filter(o => o.toLowerCase().includes(value.toLowerCase()));

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className="fi"
        style={{ width: '100%', paddingRight: '30px' }}
        value={value}
        onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        required
      />
      <div 
        style={{ 
          position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', 
          cursor: 'pointer', color: 'var(--mu)', padding: '10px'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg)', zIndex: 10,
          maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--bd)', borderRadius: '4px',
          boxShadow: '0 10px 30px rgba(26, 18, 8, .1)'
        }}>
          {filteredOptions.length > 0 ? filteredOptions.map(o => (
            <div 
              key={o} 
              style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '13px', color: 'var(--dk)' }}
              onMouseDown={(e) => { e.preventDefault(); onChange(o); setIsOpen(false); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {o}
            </div>
          )) : (
            <div style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--mu)' }}>No matching options</div>
          )}
        </div>
      )}
    </div>
  );
};

const Checkout: React.FC = () => {
  const { cart, clearCart } = useCartStore();
  const { showNotif } = useNotificationStore();

  const [formData, setFormData] = useState({
    fn: '',
    fe: '',
    fp: '',
    fgov: 'Cairo',
    fa: '',
    paymentMethod: 'COD',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const discountAmount = discountApplied ? total * 0.10 : 0;
  const subtotalAfterDiscount = total - discountAmount;

  const isFreeShipping = subtotalAfterDiscount >= 2400;
  const shippingCost = isFreeShipping ? 0 : (['Cairo', 'Giza'].includes(formData.fgov) ? 80 : 100);
  const finalTotal = subtotalAfterDiscount + shippingCost;

  const handleApplyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'HS10') {
      setDiscountApplied(true);
      showNotif('10% Discount applied!', '#2ecc71');
    } else {
      setDiscountApplied(false);
      showNotif('Invalid coupon code', '#c0392b');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fn, fe, fp, fgov, fa, paymentMethod } = formData;

    if (!fn || !fe || !fp || !fgov || !fa) {
      showNotif('Please fill all fields', '#c0392b');
      return;
    }

    if (cart.length === 0) {
      showNotif('Your cart is empty', '#c0392b');
      return;
    }

    // Validate stock availability before creating anything
    for (const item of cart) {
      const qty = item.quantity || 1;
      const { data: stockCheck, error: stockCheckErr } = await supabase
        .from('product_stock')
        .select('quantity')
        .eq('product_id', item.id)
        .eq('size', item.size)
        .single();

      if (stockCheckErr || !stockCheck) {
        showNotif(`Unable to verify stock for ${item.name} (${item.size})`, '#c0392b');
        return;
      }

      if (stockCheck.quantity < qty) {
        showNotif(
          `Only ${stockCheck.quantity} left in stock for ${item.name} (${item.size}) — please lower the quantity`,
          '#c0392b'
        );
        return;
      }
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

        const { data: newOrderId, error: oErr } = await supabase.rpc('create_order', {
          p_customer_id: customerId,
          p_product_id: item.id,
          p_size: sizeString,
          p_address: fa,
          p_governorate: fgov,
          p_total_price: item.price * qty,
        });

        if (oErr) throw oErr;
        if (firstOrderId === 0 && newOrderId) firstOrderId = newOrderId;

        // Update stock (optimistic)
        const { data: stockData } = await supabase
          .from('product_stock')
          .select('quantity')
          .eq('product_id', item.id)
          .eq('size', item.size)
          .single();

        if (stockData && stockData.quantity >= qty) {
          const { error: stockErr } = await supabase
            .from('product_stock')
            .update({ quantity: stockData.quantity - qty })
            .eq('product_id', item.id)
            .eq('size', item.size);

          if (stockErr) {
            console.error('Stock update failed for product', item.id, item.size, stockErr);
          }
        }
      }

      // Send email to Store Owner via FormSubmit
      if (fn) {
        const productsSummary = cart.map(i => `${i.quantity || 1}x ${i.name}`).join(', ');
        const sizesSummary = cart.map(i => i.size).join(', ');
        
        fetch('https://formsubmit.co/ajax/hazed.co.hr@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `New Order! from ${fn}`,
            Customer_Name: fn,
            Customer_Email: fe,
            Phone: fp,
            Governorate: fgov,
            Address: fa,
            Products: productsSummary,
            Sizes: sizesSummary,
            Total: `${finalTotal} EGP`,
            Payment_Method: paymentMethod,
            _template: 'table'
          })
        }).catch((e) => console.log('Store email send failed:', e.message));
      }

      // Send email to Customer via Edge Function (fire and forget)
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
              price: finalTotal,
              shippingCost: shippingCost,
              orderId: firstOrderId,
              paymentMethod: paymentMethod,
            },
          }),
        }).catch((e) => console.log('Customer email send failed:', e.message));
      }

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
        <Link to="/" className="ck-logo">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Hazed Studios" style={{ height: '110px', objectFit: 'contain' }} />
        </Link>
      </div>

      <div className="ord-sec">
        <div className="ord-left">
          <div className="ord-title">Complete Your <em>Order</em></div>
          <div className="ord-sub">
            Fill in your details below. Once confirmed, you will receive an automated email regarding your order status.
          </div>

          <div className="ord-feats">
            <div className="ord-feat">Cash on Delivery & InstaPay Accepted</div>
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
                    placeholder="Your Full Name"
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
                  placeholder="your.email@example.com"
                  required
                  value={formData.fe}
                  onChange={handleChange}
                />
              </div>

              <div className="frow">
                <div className="fg">
                  <label className="fl">Governorate</label>
                  <CustomCombobox
                    value={formData.fgov}
                    onChange={(val) => setFormData({ ...formData, fgov: val })}
                    options={EGYPTIAN_GOVERNORATES}
                    placeholder="Select or type..."
                  />
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

              <div className="form-title" style={{ marginTop: '24px' }}>Payment Method</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div 
                  onClick={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                  style={{ 
                    border: formData.paymentMethod === 'COD' ? '1px solid var(--dk)' : '1px solid var(--bd)',
                    background: formData.paymentMethod === 'COD' ? 'var(--bg2)' : 'transparent',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <span style={{ fontSize: '12px', color: formData.paymentMethod === 'COD' ? 'var(--dk)' : 'var(--mu)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Cash on Delivery</span>
                </div>
                <div 
                  onClick={() => setFormData({ ...formData, paymentMethod: 'InstaPay' })}
                  style={{ 
                    border: formData.paymentMethod === 'InstaPay' ? '1px solid var(--dk)' : '1px solid var(--bd)',
                    background: formData.paymentMethod === 'InstaPay' ? 'var(--bg2)' : 'transparent',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <span style={{ fontSize: '12px', color: formData.paymentMethod === 'InstaPay' ? 'var(--dk)' : 'var(--mu)', letterSpacing: '.1em', textTransform: 'uppercase' }}>InstaPay</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  <input
                    type="text"
                    className="fi"
                    placeholder="Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{ flex: 1 }}
                    disabled={discountApplied}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={discountApplied || !couponCode}
                    style={{ padding: '0 20px', background: discountApplied ? 'var(--bd)' : 'var(--dk)', color: 'var(--bg)', border: 'none', cursor: discountApplied ? 'not-allowed' : 'pointer', fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', transition: 'all 0.3s' }}
                  >
                    {discountApplied ? 'Applied' : 'Apply'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--mu)' }}>Subtotal</span>
                  <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{total.toLocaleString()} EGP</span>
                </div>
                {discountApplied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--cr)' }}>Discount (10%)</span>
                    <span style={{ fontSize: '13px', color: 'var(--cr)' }}>-{discountAmount.toLocaleString()} EGP</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--mu)' }}>Shipping</span>
                  <span style={{ fontSize: '13px', color: 'var(--dk)' }}>{isFreeShipping ? 'Free' : `${shippingCost} EGP`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bd)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--cr)' }}>Total</span>
                  <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '24px', color: 'var(--cr)' }}>{finalTotal.toLocaleString()} EGP</span>
                </div>
              </div>

              <button type="submit" className="fsub" disabled={isSubmitting || cart.length === 0}>
                {isSubmitting ? 'Placing Order...' : 'Confirm Order →'}
              </button>
              <div className="form-note">
                By confirming, you agree to our terms of service and return policies.
              </div>
            </form>
          ) : (
            <div className="ord-success show">
              <div className="ors-icon">✓</div>
              <div className="ors-title">Order Received</div>
              <div className="ors-text">
                Thank you for choosing HAZED.STUDIOS. Your order has been placed successfully.
                <br /><br />
                {formData.paymentMethod === 'InstaPay' ? (
                   <>
                     Please transfer the total amount of <strong>{finalTotal.toLocaleString()} EGP</strong> to our InstaPay handle:
                     <br />
                     <strong style={{ fontSize: '20px', color: 'var(--cr)', display: 'block', margin: '16px 0' }}>your_instapay_handle</strong>
                     Your order will be processed as soon as we receive the transfer.
                   </>
                ) : (
                   <>
                     We will process your order soon. You will pay in cash upon delivery.
                   </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
