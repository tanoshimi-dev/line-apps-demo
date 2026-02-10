import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { getItem, getImageUrl } from '../services/api';
import type { SweetsItem } from '../types';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<SweetsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getItem(id)
      .then(setItem)
      .catch(() => navigate('/gallery'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="page"><Header /><div className="loading">Loading...</div><Navigation /></div>;
  if (!item) return null;

  return (
    <div className="page">
      <Header />
      <div className="item-detail-image">
        {item.imagePath ? (
          <img src={getImageUrl(item.imagePath)!} alt={item.name} />
        ) : (
          <span>🍰</span>
        )}
      </div>
      <div className="item-detail-info">
        {item.category && <div className="item-detail-category">{item.category.name}</div>}
        <div className="item-detail-name">{item.name}</div>
        <div className="item-detail-price">¥{item.price.toLocaleString()}</div>
        <div className={`item-stock ${item.stock === 0 ? 'out-of-stock' : ''}`}>
          {item.stock > 0 ? `在庫: ${item.stock}個` : '売り切れ'}
        </div>
        {item.description && (
          <div className="item-detail-description">{item.description}</div>
        )}
      </div>
      <Navigation />
    </div>
  );
}
