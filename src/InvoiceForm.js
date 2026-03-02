import React, { useEffect, useMemo, useState } from 'react';
import './InvoiceForm.css';

const DEFAULT_ROWS = 10;
const STORAGE_KEY = 'bill.invoice.v1';

const makeEmptyItem = () => ({
  description: '',
  colour: '',
  rate: '',
  amount: '',
  ps: '',
});

function todayISO() {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toDisplayDate(isoDate) {
  if (!isoDate) return '';
  const [yyyy, mm, dd] = isoDate.split('-');
  if (!yyyy || !mm || !dd) return isoDate;
  return `${dd}-${mm}-${yyyy}`;
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function InvoiceForm() {
  const defaultSeller = useMemo(
    () => ({
      displayName: 'Ankit P. Gajjar',
      legalName: 'Ankit Prakash Bhai Gajjar',
      addressLine1: 'A-23, Sagar Tenament, Nr. Navsariyan School,',
      addressLine2: 'Ranip, Ahmedabad-382480.',
      pan: 'BSDPG2179L',
      mobile1: '9724663302',
      mobile2: '9624917075',
    }),
    []
  );

  const [seller, setSeller] = useState(defaultSeller);
  const [invoice, setInvoice] = useState({
    date: todayISO(),
    billNo: '',
    billTo: '',
  });
  const [items, setItems] = useState(() =>
    Array.from({ length: DEFAULT_ROWS }, makeEmptyItem)
  );
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY) || '');
    if (!saved) return;
    if (saved.seller) setSeller(prev => ({ ...prev, ...saved.seller }));
    if (saved.invoice) setInvoice(prev => ({ ...prev, ...saved.invoice }));
    if (Array.isArray(saved.items) && saved.items.length > 0) {
      setItems(
        saved.items.map(it => {
          const row = {
            ...makeEmptyItem(),
            ...(it || {}),
          };
          // ensure amount reflects colour * rate on load
          const c = parseFloat(String(row.colour || '').replace(/,/g, '')) || 0;
          const r = parseFloat(String(row.rate || '').replace(/,/g, '')) || 0;
          row.amount = c * r;
          return row;
        })
      );
    }
  }, []);

  useEffect(() => {
    if (!autoSave) return;
    const payload = { seller, invoice, items };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [seller, invoice, items, autoSave]);

  const updateSeller = (key, value) => {
    setSeller(prev => ({ ...prev, [key]: value }));
  };

  const updateInvoice = (key, value) => {
    setInvoice(prev => ({ ...prev, [key]: value }));
  };

  const updateItem = (idx, key, value) => {
    setItems(prev =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        // update the requested field
        const newRow = { ...row, [key]: value };
        // if colour or rate changed, recalc amount automatically
        if (key === 'colour' || key === 'rate') {
          const c = parseFloat(String(newRow.colour || '').replace(/,/g, '')) || 0;
          const r = parseFloat(String(newRow.rate || '').replace(/,/g, '')) || 0;
          newRow.amount = c * r;
        }
        return newRow;
      })
    );
  };

  const addRow = () => setItems(prev => [...prev, makeEmptyItem()]);

  const newBill = () => {
    setInvoice(prev => ({ ...prev, date: todayISO(), billNo: '', billTo: '' }));
    setItems(Array.from({ length: DEFAULT_ROWS }, makeEmptyItem));
  };

  const printBill = () => window.print();

  const copyBillData = async () => {
    const text = JSON.stringify({ seller, invoice, items }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied bill data to clipboard.');
    } catch {
      prompt('Copy bill data:', text);
    }
  };

  const totals = useMemo(() => {
    let amount = 0;
    let ps = 0;
    items.forEach(row => {
      const a = parseFloat(String(row.amount || '').replace(/,/g, '')) || 0;
      const p = parseFloat(String(row.ps || '').replace(/,/g, '')) || 0;
      amount += a;
      ps += p;
    });
    if (ps >= 100) {
      amount += Math.floor(ps / 100);
      ps = ps % 100;
    }
    return { amount, ps };
  }, [items]);

  return (
    <div className="invoice-app">
      <div className="invoice-controls">
        <div className="panel">
          <div className="panel-title">Seller (your details)</div>
          <div className="grid-2">
            <div className="field">
              <label>Display name (top)</label>
              <input
                value={seller.displayName}
                onChange={e => updateSeller('displayName', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Legal name (below)</label>
              <input
                value={seller.legalName}
                onChange={e => updateSeller('legalName', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Address line 1</label>
              <input
                value={seller.addressLine1}
                onChange={e => updateSeller('addressLine1', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Address line 2</label>
              <input
                value={seller.addressLine2}
                onChange={e => updateSeller('addressLine2', e.target.value)}
              />
            </div>
            <div className="field">
              <label>PAN</label>
              <input
                value={seller.pan}
                onChange={e => updateSeller('pan', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Mobile 1</label>
              <input
                value={seller.mobile1}
                onChange={e => updateSeller('mobile1', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Mobile 2</label>
              <input
                value={seller.mobile2}
                onChange={e => updateSeller('mobile2', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Bill details</div>
          <div className="grid-2">
            <div className="field">
              <label>Date</label>
              <input
                type="date"
                value={invoice.date}
                onChange={e => updateInvoice('date', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Bill No.</label>
              <input
                value={invoice.billNo}
                onChange={e => updateInvoice('billNo', e.target.value)}
              />
            </div>
            <div className="field grid-span-2">
              <label>M/S (Bill To)</label>
              <input
                value={invoice.billTo}
                onChange={e => updateInvoice('billTo', e.target.value)}
                placeholder="Customer / Party name"
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Items</div>
          <div className="items-editor">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 38 }}>No.</th>
                  <th style={{ width: 38 }}>Description</th>
                  <th style={{ width: 74 }}>Colour</th>
                  <th style={{ width: 72 }}>Rate</th>
                  <th style={{ width: 86 }}>Amount&nbsp;(colour×rate)</th>
                  <th style={{ width: 46 }}>Ps.</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx}>
                    <td className="num">{idx + 1}</td>

                    <td>
                      <input
                        value={row.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.colour}
                        onChange={e => updateItem(idx, 'colour', e.target.value)}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.rate}
                        onChange={e => updateItem(idx, 'rate', e.target.value)}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        readOnly
                        title="Automatically calculated as colour × rate"
                        value={row.amount}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.ps}
                        onChange={e => updateItem(idx, 'ps', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="items-actions">
              <button
                type="button"
                onClick={addRow}
                title="Add a new blank item row for entering Description, Colour, Rate, Amount and Ps."
              >
                Add item
              </button>
            </div>
          </div>
        </div>

        <div className="panel actions">
          <button type="button" onClick={printBill}>
            Print / Save as PDF
          </button>
          <button type="button" onClick={copyBillData} className="secondary">
            Copy bill data
          </button>
          <button type="button" onClick={newBill} className="secondary">
            New bill (clear)
          </button>
          <label className="autosave">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={e => setAutoSave(e.target.checked)}
            />
            Auto-save
          </label>
        </div>
      </div>

      <div className="invoice-preview-wrap">
        <div className="bill-page" aria-label="Bill preview">
          <div className="bill-border" />

          <div className="bill-header">
            <div className="bill-title">{seller.displayName || '\u00A0'}</div>
            <div className="bill-subtitle">{seller.legalName || '\u00A0'}</div>
            <div className="bill-address">
              <div className="bill-address-line">{seller.addressLine1 || '\u00A0'}</div>
              <div className="bill-address-line">{seller.addressLine2 || '\u00A0'}</div>
            </div>
          </div>

          <div className="bill-meta">
            <div className="meta-left">
              <div className="meta-row">
                <span className="meta-label">PAN.</span>
                <span className="meta-value">{seller.pan || '\u00A0'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Mobile :</span>
                <span className="meta-value">{seller.mobile1 || '\u00A0'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label" />
                <span className="meta-value">{seller.mobile2 || '\u00A0'}</span>
              </div>
            </div>

            <div className="meta-right">
              <div className="meta-row">
                <span className="meta-label">Date_</span>
                <span className="meta-underline">{toDisplayDate(invoice.date) || '\u00A0'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Bill No._</span>
                <span className="meta-underline">{invoice.billNo || '\u00A0'}</span>
              </div>
            </div>
          </div>

          <div className="bill-to">
            <span className="meta-label">M/S.</span>
            <span className="meta-underline wide bold">{invoice.billTo || '\u00A0'}</span>
          </div>

          <div className="bill-table-wrap">
            <table className="bill-table">
              <thead>
                <tr>
                  <th className="c-no">No.</th>
                  <th className="c-desc">Description</th>
                  <th className="c-colour">Col...</th>
                  <th className="c-rate">Rate</th>
                  <th className="c-amount">Amount</th>
                  <th className="c-ps">P...</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx}>
                    <td className="c-no">
                      {Object.values(row).some(v => String(v || '').trim() !== '')
                        ? idx + 1
                        : '\u00A0'}
                    </td>
                    <td className="c-desc">{row.description || '\u00A0'}</td>
                    <td className="c-colour">{row.colour || '\u00A0'}</td>
                    <td className="c-rate">{row.rate || '\u00A0'}</td>
                    <td className="c-amount">{row.amount || '\u00A0'}</td>
                    <td className="c-ps">{row.ps || '\u00A0'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bill-total-row">
                  <td className="c-desc total-label" colSpan={4}>Total</td>
                  <td className="c-amount total-value">{totals.amount ? String(totals.amount) : '\u00A0'}</td>
                  <td className="c-ps total-value">{totals.ps ? String(totals.ps) : '\u00A0'}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bill-footer">
            <div className="footer-left">
              <div className="footer-line">SUBJECT TO AHMEDABAD JURISDICTION.</div>
              <div className="footer-line small">E. &amp; O. E.</div>
            </div>
            <div className="footer-right">
              <div className="footer-line">For. {seller.displayName || '\u00A0'}</div>
              <div className="signature-space" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
