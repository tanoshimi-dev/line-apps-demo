import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { getCategories, getItems, getImageUrl } from '../services/api';
import type { SweetsCategory, SweetsItem } from '../types';

export default function Gallery() {
  const [categories, setCategories] = useState<SweetsCategory[]>([]);
  const [items, setItems] = useState<SweetsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCategories(), getItems()])
      .then(([cats, allItems]) => {
        setCategories(cats);
        setItems(allItems);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.categoryId === selectedCategory)
    : items;

  if (loading) return <div className="page"><Header /><div className="loading">Loading...</div><Navigation /></div>;

  return (
    <div className="page">
      <Header />
      <div className="category-tabs">
        <button
          className={`category-tab ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          すべて
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="items-grid">
        {filteredItems.map((item) => (
          <Link key={item.id} to={`/items/${item.id}`} className="item-card">
            <div className="item-image">
              {item.imagePath ? (
                <img src={getImageUrl(item.imagePath)!} alt={item.name} />
              ) : (
                <span>🍰</span>
              )}
            </div>
            <div className="item-info">
              <div className="item-name">{item.name}</div>
              <div className="item-price">¥{item.price.toLocaleString()}</div>
              <div className={`item-stock ${item.stock === 0 ? 'out-of-stock' : ''}`}>
                {item.stock > 0 ? `在庫: ${item.stock}` : '売り切れ'}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🍰</div>
          <div className="empty-state-text">商品がありません</div>
        </div>
      )}
      <Navigation />
    </div>
  );
}
