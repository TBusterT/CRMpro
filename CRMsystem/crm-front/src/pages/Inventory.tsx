import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { inventoryApi } from '../api/inventory.api';
import { useApi } from '../hooks/useApi';
import '../styles/inventory.css';

type ProductFormState = {
  sku: string;
  name: string;
  category: string;
  price: string;
  stock: string;
};

const initialProductForm: ProductFormState = {
  sku: '',
  name: '',
  category: '',
  price: '',
  stock: '',
};

const Inventory: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(initialProductForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: products,
    loading,
    error,
    refetch: refetchProducts,
  } = useApi(
      () => inventoryApi.getAll(),
      [],
      [],
  );

  const { data: stats, refetch: refetchStats } = useApi(
      () => inventoryApi.getStats(),
      [],
  );

  const updateField = (field: keyof ProductFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialProductForm);
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!form.sku.trim() || !form.name.trim() || !form.category.trim()) {
      setSubmitError('Заповни SKU, назву та категорію товару.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setSubmitError('Ціна має бути числом більше 0.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setSubmitError('Залишок має бути цілим числом від 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      await inventoryApi.create({
        sku: form.sku.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        price,
        stock,
      });

      resetForm();
      setIsFormOpen(false);
      setSuccessMessage('Товар успішно додано до складу.');
      refetchProducts();
      refetchStats();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Не вдалося додати товар.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="inventory-page">
        <div className="page-header inventory-page-header">
          <div className="header-titles">
            <h2>Склад</h2>
            <span className="divider">|</span>
            <span className="subtitle">Товари, залишки та вартість складу</span>
          </div>
          <button
              className="add-btn"
              type="button"
              onClick={() => {
                setIsFormOpen(prev => !prev);
                setSuccessMessage(null);
                setSubmitError(null);
              }}
          >
            <i className={`fa-solid ${isFormOpen ? 'fa-xmark' : 'fa-plus'}`}></i>
            {isFormOpen ? 'Закрити форму' : 'Додати товар'}
          </button>
        </div>

        {successMessage && (
            <div className="inventory-alert success-alert">
              <i className="fa-solid fa-circle-check"></i>
              {successMessage}
            </div>
        )}

        {isFormOpen && (
            <section className="product-form-card fade-in-card">
              <div className="form-card-heading">
                <div>
                  <h3>Новий товар</h3>
                  <p>Заповни дані товару, а статус складського залишку визначиться автоматично.</p>
                </div>
                <div className="form-card-icon">
                  <i className="fa-solid fa-boxes-stacked"></i>
                </div>
              </div>

              <form className="product-form" onSubmit={handleSubmit}>
                <label>
                  <span>SKU</span>
                  <input
                      type="text"
                      placeholder="Наприклад: CRM-001"
                      value={form.sku}
                      onChange={event => updateField('sku', event.target.value)}
                  />
                </label>

                <label>
                  <span>Назва товару</span>
                  <input
                      type="text"
                      placeholder="Ноутбук Lenovo ThinkPad"
                      value={form.name}
                      onChange={event => updateField('name', event.target.value)}
                  />
                </label>

                <label>
                  <span>Категорія</span>
                  <input
                      type="text"
                      placeholder="Техніка / Офіс / Послуги"
                      value={form.category}
                      onChange={event => updateField('category', event.target.value)}
                  />
                </label>

                <label>
                  <span>Ціна, ₴</span>
                  <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="12500"
                      value={form.price}
                      onChange={event => updateField('price', event.target.value)}
                  />
                </label>

                <label>
                  <span>Залишок, шт.</span>
                  <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="10"
                      value={form.stock}
                      onChange={event => updateField('stock', event.target.value)}
                  />
                </label>

                <div className="form-actions">
                  <button className="secondary-btn" type="button" onClick={resetForm} disabled={isSubmitting}>
                    Очистити
                  </button>
                  <button className="primary-submit-btn" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <><i className="fa-solid fa-spinner fa-spin"></i> Збереження...</>
                    ) : (
                        <><i className="fa-solid fa-check"></i> Зберегти товар</>
                    )}
                  </button>
                </div>
              </form>

              {submitError && (
                  <div className="inventory-alert error-alert">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    {submitError}
                  </div>
              )}
            </section>
        )}

        <div className="stats-container">
          <div className="stat-card blue">
            <div className="stat-info">
              <h3>Всього товарів <i className="fa-solid fa-box-open" style={{ marginLeft: '8px', opacity: 0.7 }}></i></h3>
              <div className="stat-value">
                {stats?.totalItems.toLocaleString('uk-UA') ?? '—'}
              </div>
              <div className="stat-trend">На основі бази даних</div>
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-info">
              <h3>Вартість складу <i className="fa-solid fa-money-bill-wave" style={{ marginLeft: '8px', opacity: 0.7 }}></i></h3>
              <div className="stat-value">
                {stats ? `₴${stats.totalValue.toLocaleString('uk-UA')}` : '—'}
              </div>
              <div className="stat-trend">Автоматичний підрахунок</div>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-info">
              <h3>Категорії <i className="fa-solid fa-layer-group" style={{ marginLeft: '8px', opacity: 0.7 }}></i></h3>
              <div className="stat-value">{stats?.totalCategories ?? '—'}</div>
              <div className="stat-trend">Унікальні розділи</div>
            </div>
          </div>
        </div>

        <div className="inventory-section">
          <div className="section-header">
            <h3>Каталог товарів та залишки</h3>
          </div>
          <div className="table-container">
            {loading && (
                <div style={{ padding: '20px', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin"></i> Завантаження...
                </div>
            )}
            {error && (
                <div style={{ padding: '20px', color: '#ef4444' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> {error}
                </div>
            )}
            {!loading && !error && (
                <table className="inventory-table">
                  <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Назва товару</th>
                    <th>Категорія</th>
                    <th>Ціна</th>
                    <th>Залишок</th>
                    <th>Статус</th>
                  </tr>
                  </thead>
                  <tbody>
                  {products.map((product, index) => {
                    let statusClass = 'good';
                    if (product.stock === 0) statusClass = 'danger';
                    else if (product.stock <= 5) statusClass = 'warning';

                    return (
                        <tr
                            key={product.id}
                            className="fade-in-row"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <td><strong>{product.sku}</strong></td>
                          <td>{product.name}</td>
                          <td>{product.category}</td>
                          <td>₴{Number(product.price).toLocaleString('uk-UA')}</td>
                          <td>{product.stock} шт.</td>
                          <td>
                            <span className={`status-badge ${statusClass}`}>
                              {product.status}
                            </span>
                          </td>
                        </tr>
                    );
                  })}
                  {products.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          Товарів не знайдено
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
            )}
          </div>
        </div>
      </div>
  );
};

export default Inventory;
