import React, { useState } from 'react';
import { useCartStore, useNotificationStore } from '../context/store';
import { supabase } from '../lib/supabase';
import { track } from '@vercel/analytics/react';
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
  const [showAll, setShowAll] = useState(false);

  const filteredOptions = showAll
    ? options
    : options.filter(o => o.toLowerCase().includes(value.toLowerCase()));

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className="fi"
        style={{ width: '100%', paddingRight: '30px' }}
        value={value}
        onChange={(e) => { onChange(e.target.value); setIsOpen(true); setShowAll(false); }}
        onFocus={() => { setIsOpen(true); setShowAll(true); }}
        onClick={() => { setIsOpen(true); setShowAll(true); }}
        onBlur={() => setTimeout(() => { setIsOpen(false); setShowAll(false); }, 200)}
        placeholder={placeholder}
        required
      />
      <div
        style={{
          position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)',
          cursor: 'pointer', color: 'var(--mu)', padding: '10px'
        }}
        onClick={(e) => {
          e.preventDefault();
          if (isOpen && showAll) {
            setIsOpen(false);
            setShowAll(false);
          } else {
            setIsOpen(true);
            setShowAll(true);
          }
        }}
      >
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
    fName: '',
    lName: '',
    fe: '',
    fp: '',
    fgov: 'Cairo',
    fcity: '',
    fa: '',
    apt: '',
    paymentMethod: 'COD',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<number | null>(null);
  const [completedOrderTotal, setCompletedOrderTotal] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ fp?: string; fe?: string }>({});

  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const discountAmount = discountApplied ? total * 0.10 : 0;
  const subtotalAfterDiscount = total - discountAmount;

  const isFreeShipping = subtotalAfterDiscount >= 1990;
  const shippingCost = isFreeShipping ? 0 : (['Cairo', 'Giza'].includes(formData.fgov) ? 85 : 100);
  const finalTotal = subtotalAfterDiscount + shippingCost;

  const handleApplyCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      showNotif('Please write a discount code', '#c0392b');
      return;
    }
    if (couponCode.trim().toUpperCase() === 'HS10') {
      setDiscountApplied(true);
      showNotif('10% Discount applied!', '#2ecc71');
    } else {
      setDiscountApplied(false);
      showNotif('Invalid coupon code', '#c0392b');
    }
  };

  const handleRemoveCoupon = (e: React.MouseEvent) => {
    e.preventDefault();
    setDiscountApplied(false);
    setCouponCode('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (fieldErrors[e.target.id as keyof typeof fieldErrors]) {
      setFieldErrors({ ...fieldErrors, [e.target.id]: undefined });
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fName, lName, fe, fp, fgov, fcity, fa, apt, paymentMethod } = formData;
    const fn = `${fName} ${lName}`.trim();
    const fullAddress = [fcity, fa, apt].filter(Boolean).join(', ');

    setFieldErrors({});
    let hasError = false;
    const errors: { fp?: string; fe?: string } = {};

    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (fp && !phoneRegex.test(fp.trim())) {
      errors.fp = 'Invalid 11-digit Egyptian number';
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (fe && !emailRegex.test(fe.trim())) {
      errors.fe = 'Invalid email address format';
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(errors);
      return;
    }

    if (!fName || !lName || !fp || !fgov || !fcity || !fa) {
      showNotif('Please fill all required fields', '#c0392b');
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
          `Not enough in stock for ${item.name} (${item.size}) — please lower the quantity`,
          '#c0392b'
        );
        return;
      }
    }

    // Construct the items array
    const orderItems = cart.map(item => ({
      id: item.id,
      size: item.size,
      color: item.color,
      price: item.price,
      qty: item.quantity || 1
    }));

    setIsSubmitting(true);
    try {
      const { data: response, error: rpcErr } = await supabase.rpc('process_secure_checkout', {
        p_name: fn,
        p_phone: fp,
        p_email: fe,
        p_gov: fgov,
        p_address: fullAddress,
        p_items: orderItems
      });

      if (rpcErr) {
        throw new Error(rpcErr.message.includes('Insufficient stock')
          ? 'One or more items are out of stock in the requested quantity.'
          : rpcErr.message);
      }

      const firstOrderId = response?.first_order_id || 0;

      // Send email to Store Owner via FormSubmit
      if (fn) {
        const productsSummary = cart.map(i => `${i.quantity || 1}x ${i.name}`).join(', ');
        const sizesSummary = cart.map(i => i.size).join(', ');
        const colorsSummary = cart.map(i => i.color || '-').join(', ');

        try {
          const payload = {
            Order_ID: firstOrderId,
            Customer_Name: fn,
            Customer_Email: fe,
            Phone: fp,
            Governorate: fgov,
            Address: fullAddress,
            Products: productsSummary,
            Sizes: sizesSummary,
            Colors: colorsSummary,
            Total: `${finalTotal} EGP`,
            Payment_Method: paymentMethod
          };

          const emailUrl = import.meta.env.PROD 
            ? '/api/purchase-email'
            : `${import.meta.env.VITE_APP_URL || 'http://localhost:5000'}/api/purchase-email`;

          const emailRes = await fetch(emailUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!emailRes.ok) {
            const errText = await emailRes.text();
            console.error('Store email error response:', errText);
          }
        } catch (e: any) {
          console.error('Store email send failed:', e.message);
        }
      }

      // Send email to Customer via Edge Function (fire and forget)
      if (fe) {
        const productsSummary = cart.map(i => `${i.quantity || 1}x ${i.name}`).join(', ');
        const sizesSummary = cart.map(i => i.size).join(', ');
        try {
          const customerEmailRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`, {
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
                address: fullAddress,
                gov: fgov,
                price: finalTotal,
                shippingCost: shippingCost,
                orderId: firstOrderId,
                paymentMethod: paymentMethod,
              },
            }),
          });
          if (!customerEmailRes.ok) {
            const errText = await customerEmailRes.text();
            console.error('Customer email error response:', errText);
          }
        } catch (e: any) {
          console.error('Customer email send failed:', e.message);
        }
      }

      // Send Shipping Order to Flottex (via local backend)
      try {
        const productsSummary = cart.map(i => `${i.quantity || 1}x ${i.name} (${i.size})`).join(', ');
        // Use relative path '/api/...' in production for Vercel Serverless Functions, 
        // fallback to local Express server for local development testing.
        const flottexUrl = import.meta.env.PROD
          ? '/api/shipping/flottex'
          : `${import.meta.env.VITE_APP_URL || 'http://localhost:5000'}/api/shipping/flottex`;

        const shippingRes = await fetch(flottexUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: fn,
            phone: fp,
            address: fullAddress,
            governorate: fgov,
            products: productsSummary,
            orderId: firstOrderId,
            price: finalTotal,
            paymentMethod: formData.paymentMethod
          }),
        });

        if (!shippingRes.ok) {
          console.error('Failed to create Flottex shipment:', await shippingRes.text());
        }
      } catch (err: any) {
        console.error('Flottex API integration error:', err.message);
      }

      setCompletedOrderId(firstOrderId);
      setCompletedOrderTotal(finalTotal);
      setOrderSuccess(true);
      track('Purchase');
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

      {!orderSuccess ? (
        <div className="ord-sec">
          <div className="ord-left">
            <div className="ord-title">Complete Your <em>Order</em></div>
            <div className="ord-sub">
              Fill in your details below. Once confirmed, you will receive an automated email regarding your order status.
            </div>

            <div className="ord-feats">
              <div className="ord-feat">Cash on Delivery & InstaPay Accepted</div>
              <div className="ord-feat">Free standard shipping over 1990 EGP</div>
              <div className="ord-feat">14-Day Returns & Exchanges</div>
            </div>
          </div>

          <div className="ord-right">
            <form className="ord-form" onSubmit={submitOrder}>
              <div className="form-title">Shipping Details</div>

              <div className="frow">
                <div className="fg">
                  <label className="fl">First Name</label>
                  <input
                    type="text"
                    className="fi"
                    id="fName"
                    placeholder="First Name"
                    required
                    value={formData.fName}
                    onChange={handleChange}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Last Name</label>
                  <input
                    type="text"
                    className="fi"
                    id="lName"
                    placeholder="Last Name"
                    required
                    value={formData.lName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="frow">
                <div className="fg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="fl" style={{ marginBottom: 0 }}>Phone Number</label>
                    {fieldErrors.fp && <span style={{ color: '#c0392b', fontSize: '11px' }}>{fieldErrors.fp}</span>}
                  </div>
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
                <div className="fg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="fl" style={{ marginBottom: 0 }}>Email Address</label>
                    {fieldErrors.fe && <span style={{ color: '#c0392b', fontSize: '11px' }}>{fieldErrors.fe}</span>}
                  </div>
                  <input
                    type="email"
                    className="fi"
                    id="fe"
                    placeholder="your.email@example.com (Optional)"
                    value={formData.fe}
                    onChange={handleChange}
                  />
                </div>
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
                  <label className="fl">City / District</label>
                  <input
                    type="text"
                    className="fi"
                    id="fcity"
                    placeholder="City"
                    required
                    value={formData.fcity}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="frow">
                <div className="fg">
                  <label className="fl">Address</label>
                  <input
                    type="text"
                    className="fi"
                    id="fa"
                    placeholder="Street, Building"
                    required
                    value={formData.fa}
                    onChange={handleChange}
                  />
                </div>
                <div className="fg">
                  <label className="fl">Apartment (optional)</label>
                  <input
                    type="text"
                    className="fi"
                    id="apt"
                    placeholder="Apartment, suite, etc."
                    value={formData.apt}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-title" style={{ marginTop: '24px' }}>Payment Method</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div
                  onClick={() => setFormData({ ...formData, paymentMethod: 'COD' })}
                  style={{
                    border: formData.paymentMethod === 'COD' ? '1px solid var(--cr)' : '1px solid var(--bd)',
                    background: formData.paymentMethod === 'COD' ? 'var(--cr)' : 'transparent',
                    padding: '12px 8px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '10.5px', color: formData.paymentMethod === 'COD' ? 'var(--bg)' : 'var(--mu)', letterSpacing: '.05em', textTransform: 'uppercase', fontWeight: formData.paymentMethod === 'COD' ? 600 : 400, whiteSpace: 'nowrap' }}>Cash on Delivery</span>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, paymentMethod: 'InstaPay' })}
                  style={{
                    border: formData.paymentMethod === 'InstaPay' ? '1px solid var(--cr)' : '1px solid var(--bd)',
                    background: formData.paymentMethod === 'InstaPay' ? 'var(--cr)' : 'transparent',
                    padding: '12px 8px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '10.5px', color: formData.paymentMethod === 'InstaPay' ? 'var(--bg)' : 'var(--mu)', letterSpacing: '.05em', textTransform: 'uppercase', fontWeight: formData.paymentMethod === 'InstaPay' ? 600 : 400, whiteSpace: 'nowrap' }}>InstaPay</span>
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
                    onClick={discountApplied ? handleRemoveCoupon : handleApplyCoupon}
                    style={{
                      padding: '0 20px',
                      background: discountApplied ? 'transparent' : 'var(--dk)',
                      color: discountApplied ? 'var(--mu)' : 'var(--bg)',
                      border: discountApplied ? '1px solid var(--mu)' : 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      transition: 'all 0.3s'
                    }}
                  >
                    {discountApplied ? 'Clear' : 'Apply'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '15px', color: 'var(--mu)' }}>Subtotal</span>
                  <span style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '16px', color: 'var(--dk)' }}>{total.toLocaleString()} EGP</span>
                </div>
                {discountApplied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '15px', color: 'var(--cr)' }}>Discount (10%)</span>
                    <span style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '16px', color: 'var(--cr)' }}>-{discountAmount.toLocaleString()} EGP</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '15px', color: 'var(--mu)' }}>Shipping</span>
                  <span style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '16px', color: 'var(--dk)' }}>{isFreeShipping ? 'Free' : `${shippingCost} EGP`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bd)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '15px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--cr)' }}>Total</span>
                  <span style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '24px', color: 'var(--cr)' }}>{finalTotal.toLocaleString()} EGP</span>
                </div>
              </div>

              <button type="submit" className="fsub" disabled={isSubmitting || cart.length === 0}>
                {isSubmitting ? 'Placing Order...' : 'Confirm Order →'}
              </button>
              <div className="form-note">
                By confirming, you agree to our terms of service and return policies.
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 20px', textAlign: 'center' }}>
          <div className="ord-success show" style={{ position: 'static', opacity: 1, visibility: 'visible', pointerEvents: 'auto', transform: 'none', maxWidth: '600px', width: '100%', margin: '0 auto', boxShadow: 'none' }}>
            <div className="ors-icon">✓</div>
            <div className="ors-title">Order Received</div>
            <div className="ors-text">
              Thank you for choosing HAZED.STUDIOS. Your order has been placed successfully.
              <br /><br />
              {formData.paymentMethod === 'InstaPay' ? (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '15px', color: 'var(--cr)', fontWeight: 600, marginBottom: '16px' }}>
                      Please complete your payment to confirm the order
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--mu)', marginBottom: '8px' }}>
                      Transfer the amount of <strong>{(completedOrderTotal || finalTotal).toLocaleString()} EGP</strong> via InstaPay.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px', margin: '0 auto' }}>
                    <a
                      href="https://ipn.eg/S/kerolosayman22/instapay/84qWvF"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '14px 20px', background: '#2ecc71', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                    >
                      Pay Now via InstaPay
                    </a>

                    <a
                      href={`https://wa.me/201226292572?text=${encodeURIComponent(`Hello, I have paid for order #${completedOrderId} via InstaPay. Here is my payment screenshot:`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '14px 20px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                    >
                      Confirm Payment on WhatsApp
                    </a>
                  </div>

                  <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--mu)' }}>
                    Delivery within 1-3 days in Cairo and Giza
                  </p>
                </>
              ) : (
                <>
                  <p>We will process your order soon. You will pay in cash upon delivery.</p>
                  <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--mu)' }}>
                    Delivery within 1-3 days in Cairo and Giza
                  </p>
                </>
              )}
            </div>
          </div>
          <Link to="/" style={{ marginTop: '40px', padding: '16px 32px', background: 'var(--cr)', color: 'var(--bg)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '12px', fontWeight: 600, borderRadius: '8px', transition: 'background 0.3s, transform 0.2s', display: 'inline-block' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--dk)'} onMouseOut={(e) => e.currentTarget.style.background = 'var(--cr)'} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            Back to Home Page
          </Link>
        </div>
      )}
    </div>
  );
};

export default Checkout;
