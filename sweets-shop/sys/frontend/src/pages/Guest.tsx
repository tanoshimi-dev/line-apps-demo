import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, login } from '../services/liff';
import { getCategories, getItems } from '../services/api';
import type { SweetsCategory, SweetsItem } from '../types';

export default function Guest() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<SweetsCategory[]>([]);
  const [items, setItems] = useState<SweetsItem[]>([]);

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/', { replace: true });
      return;
    }
    getCategories().then(setCategories).catch(console.error);
    getItems().then(setItems).catch(console.error);
  }, [navigate]);

  return (
    <div className="guest-page">
      <div className="guest-hero">
        <div className="guest-logo">Sweets Shop</div>
        <div className="guest-subtitle">こだわりのスイーツをお届けします</div>
      </div>

      <div className="guest-gallery">
        <div className="section-title">人気のスイーツ</div>
        <div className="category-tabs">
          {categories.map((cat) => (
            <span key={cat.id} className="category-tab">{cat.name}</span>
          ))}
        </div>
        <div className="items-grid">
          {items.slice(0, 6).map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-image">🍰</div>
              <div className="item-info">
                <div className="item-name">{item.name}</div>
                <div className="item-price">¥{item.price.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="guest-login">
        <div className="guest-login-text">
          LINEでログインしてポイントを貯めよう！
        </div>
        <button onClick={login} className="btn btn-line">
          LINEでログイン
        </button>
      </div>
    </div>
  );
}
