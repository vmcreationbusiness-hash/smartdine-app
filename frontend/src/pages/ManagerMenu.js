import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit, Trash2, Globe, Camera, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export const ManagerMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [apiMeals, setApiMeals] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', image: '', description: '', priceINR: '', available: true });
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => { fetchMenu(); }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to Cloudinary via backend
    try {
      toast.info('Uploading image...');
      const uploadData = new FormData();
      uploadData.append('image', file);
      uploadData.append('folder', 'smartdine/menu');
      const res = await api.post('/upload/image', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, image: res.data.url }));
      toast.success(res.data.source === 'cloudinary' ? '✅ Image uploaded to Cloudinary!' : '✅ Image uploaded');
    } catch (error) {
      // Fallback: use base64 if upload fails
      const reader2 = new FileReader();
      reader2.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader2.result }));
        toast.warning('Using local image (Cloudinary not configured)');
      };
      reader2.readAsDataURL(file);
    }
  };

  const fetchMenu = async () => {
    try { const res = await api.get('/manager/menu'); setMenuItems(res.data); }
    catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  };

  const fetchFromAPI = async () => {
    setLoading(true);
    try { const res = await api.get('/menu/fetch-from-api'); setApiMeals(res.data); setShowApiDialog(true); }
    catch { toast.error('Failed to fetch from API'); }
    finally { setLoading(false); }
  };

  const handleAddFromAPI = async (meal) => {
    if (!meal.priceINR) { toast.error('Set a price first'); return; }
    try { await api.post('/menu', { ...meal, available: true }); fetchMenu(); setShowApiDialog(false); toast.success('Added'); }
    catch { toast.error('Failed'); }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.image || !formData.priceINR) { toast.error('Fill all required fields'); return; }
    try {
      if (editingItem) await api.put(`/menu/${editingItem._id}`, formData);
      else await api.post('/menu', formData);
      toast.success(editingItem ? 'Updated' : 'Added');
      fetchMenu(); resetForm();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.delete(`/menu/${id}`); fetchMenu(); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const resetForm = () => { setShowAddDialog(false); setEditingItem(null); setFormData({ name: '', image: '', description: '', priceINR: '', available: true }); setImagePreview(''); };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/manager/dashboard')} className="p-2 rounded-xl hover:bg-white/50 transition-colors" data-testid="back-button"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: theme.primaryColor }}>{t('manager_menu.title')}</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchFromAPI} variant="outline" size="sm" className="rounded-xl text-xs" style={{ borderColor: `${theme.primaryColor}30`, color: theme.primaryColor }} data-testid="fetch-api-button">
              <Globe className="w-3.5 h-3.5 mr-1" /> {t('manager_menu.import_api')}
            </Button>
            <Button onClick={() => setShowAddDialog(true)} size="sm" className="rounded-xl text-xs text-white btn-premium" style={{ backgroundColor: theme.primaryColor }} data-testid="add-item-button">
              <Plus className="w-3.5 h-3.5 mr-1" /> {t('manager_menu.add_item')}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {menuItems.map((item) => (
            <div key={item._id} className="glass-card rounded-2xl overflow-hidden" data-testid={`menu-item-${item._id}`}>
              <div className="aspect-[4/3] overflow-hidden"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
              <div className="p-3 md:p-4">
                <div className="flex items-start justify-between gap-1 mb-1">
                  <h3 className="text-sm font-bold truncate">{item.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.available ? 'On' : 'Off'}</span>
                </div>
                <p className="text-lg font-bold mb-3" style={{ color: theme.primaryColor }}>{formatCurrency(item.priceINR)}</p>
                <div className="flex gap-2">
                  <Button onClick={() => { setEditingItem(item); setFormData(item); setImagePreview(item.image); setShowAddDialog(true); }} variant="outline" size="sm" className="flex-1 rounded-lg h-8" data-testid={`edit-${item._id}`}><Edit className="w-3 h-3" /></Button>
                  <Button onClick={() => handleDelete(item._id)} variant="outline" size="sm" className="flex-1 rounded-lg h-8 text-red-500 hover:bg-red-50" data-testid={`delete-${item._id}`}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={showAddDialog} onOpenChange={(o) => { if (!o) resetForm(); else setShowAddDialog(o); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>{editingItem ? t('manager_menu.edit_item') : t('manager_menu.add_new')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {imagePreview && <div className="w-full h-40 rounded-xl overflow-hidden shadow-sm"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /></div>}
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <div className="border-2 border-dashed rounded-xl p-4 text-center" style={{ borderColor: `${theme.primaryColor}30` }}>
                  <ImageIcon className="w-6 h-6 mx-auto mb-1" style={{ color: theme.primaryColor }} />
                  <p className="text-xs text-gray-500">{t('manager_menu.upload_gallery')}</p>
                </div>
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" data-testid="gallery-upload" />
              </label>
              <label className="cursor-pointer">
                <div className="border-2 border-dashed rounded-xl p-4 text-center" style={{ borderColor: `${theme.primaryColor}30` }}>
                  <Camera className="w-6 h-6 mx-auto mb-1" style={{ color: theme.primaryColor }} />
                  <p className="text-xs text-gray-500">{t('manager_menu.take_photo')}</p>
                </div>
                <Input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" data-testid="camera-capture" />
              </label>
            </div>
            <div><Label className="text-sm">{t('manager_menu.image_url')}</Label><Input value={formData.image} onChange={(e) => { setFormData({ ...formData, image: e.target.value }); setImagePreview(e.target.value); }} className="rounded-xl glass-input" data-testid="item-image-input" /></div>
            <div><Label className="text-sm">{t('manager_menu.item_name')} *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-xl glass-input" data-testid="item-name-input" /></div>
            <div><Label className="text-sm">{t('manager_menu.description')}</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="rounded-xl glass-input" data-testid="item-description-input" /></div>
            <div><Label className="text-sm">{t('manager_menu.price')} *</Label><Input type="number" value={formData.priceINR} onChange={(e) => setFormData({ ...formData, priceINR: e.target.value })} className="rounded-xl glass-input" data-testid="item-price-input" /></div>
            <Button onClick={handleSave} className="w-full text-white rounded-xl btn-premium" style={{ backgroundColor: theme.primaryColor }} data-testid="save-item-button">{editingItem ? t('manager_menu.update') : t('manager_menu.add_item')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>Import from TheMealDB</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {apiMeals.map((meal, idx) => (
              <div key={idx} className="glass-card rounded-xl p-3">
                <img src={meal.image} alt={meal.name} className="w-full h-28 object-cover rounded-lg mb-2" />
                <p className="font-semibold text-xs mb-2 truncate">{meal.name}</p>
                <Input type="number" placeholder="Price (INR)" onChange={(e) => { apiMeals[idx].priceINR = parseFloat(e.target.value); }} className="mb-2 h-8 text-xs rounded-lg glass-input" />
                <Button onClick={() => handleAddFromAPI(apiMeals[idx])} className="w-full text-white h-7 text-xs rounded-lg" style={{ backgroundColor: theme.secondaryColor }}>Add</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
