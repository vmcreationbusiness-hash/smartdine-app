import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, Image as ImageIcon, Palette } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const RestaurantSettings = () => {
  const [settings, setSettings] = useState({
    restaurantName: '', address: '', contactNumber: '', GSTNumber: '', UPI_ID: '',
    sgstPercent: 2.5, cgstPercent: 2.5,
    logo: '', backgroundImage: '', backgroundColor: '#FFF8E1',
    primaryColor: '#E65100', secondaryColor: '#F57F17', accentColor: '#B71C1C', overlayOpacity: 0.88
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [bgPreview, setBgPreview] = useState('');
  const navigate = useNavigate();
  const { theme, refreshTheme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try { const res = await api.get('/manager/settings'); setSettings(res.data); setLogoPreview(res.data.logo); setBgPreview(res.data.backgroundImage); }
    catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'logo') setLogoPreview(reader.result);
      else setBgPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary via backend
    try {
      toast.info('Uploading image...');
      const uploadData = new FormData();
      uploadData.append('image', file);
      const endpoint = type === 'logo' ? '/upload/logo' : '/upload/background';
      const res = await api.post(endpoint, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (type === 'logo') setSettings(prev => ({ ...prev, logo: res.data.url }));
      else setSettings(prev => ({ ...prev, backgroundImage: res.data.url }));
      toast.success(res.data.source === 'cloudinary' ? '✅ Uploaded to Cloudinary!' : '✅ Image uploaded');
    } catch (error) {
      // Fallback to base64
      const reader2 = new FileReader();
      reader2.onloadend = () => {
        if (type === 'logo') setSettings(prev => ({ ...prev, logo: reader2.result }));
        else setSettings(prev => ({ ...prev, backgroundImage: reader2.result }));
        toast.warning('Using local image (Cloudinary not configured)');
      };
      reader2.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await api.put('/manager/settings', settings); toast.success('Settings saved!'); refreshTheme(); }
    catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const ColorPicker = ({ label, field }) => (
    <div>
      <Label className="font-semibold text-sm">{label}</Label>
      <div className="flex gap-2 mt-2">
        <div className="relative w-12 h-10 rounded-lg overflow-hidden shadow-sm border" style={{ borderColor: `${theme.primaryColor}20` }}>
          <Input type="color" value={settings[field]} onChange={(e) => setSettings({ ...settings, [field]: e.target.value })} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
          <div className="w-full h-full rounded-lg" style={{ backgroundColor: settings[field] }} />
        </div>
        <Input type="text" value={settings[field]} onChange={(e) => setSettings({ ...settings, [field]: e.target.value })} className="flex-1 h-10 rounded-lg glass-input text-sm font-mono" />
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-header sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/manager/dashboard')} className="p-2 rounded-xl hover:bg-white/50 transition-colors" data-testid="back-button"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: theme.primaryColor }}>{t('settings.title')}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="glass-strong rounded-xl p-1 mb-6">
            <TabsTrigger value="basic" className="rounded-lg data-[state=active]:shadow-md">{t('settings.basic_info')}</TabsTrigger>
            <TabsTrigger value="theme" className="rounded-lg data-[state=active]:shadow-md">{t('settings.theme_branding')}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="animate-fade-in-up">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings2Icon color={theme.primaryColor} /> {t('settings.restaurant_info')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { id: 'restaurantName', label: t('settings.restaurant_name') + ' *', hint: t('settings.appears_as_name') },
                  { id: 'address', label: t('settings.address') },
                  { id: 'contactNumber', label: t('settings.contact') },
                  { id: 'GSTNumber', label: t('settings.gst') },
                  { id: 'UPI_ID', label: t('settings.upi') },
                ].map(f => (
                  <div key={f.id}>
                    <Label className="font-semibold text-sm">{f.label}</Label>
                    <Input value={settings[f.id] || ''} onChange={(e) => setSettings({ ...settings, [f.id]: e.target.value })} className="mt-2 h-11 rounded-xl glass-input" data-testid={`${f.id}-input`} />
                    {f.hint && <p className="text-xs text-gray-400 mt-1">{f.hint}</p>}
                  </div>
                ))}
              </div>

              {/* GST Configuration */}
              <div className="mt-8 pt-6 border-t" style={{ borderColor: `${theme.primaryColor}15` }}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.primaryColor }}>
                  GST Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="font-semibold text-sm">State GST (SGST) %</Label>
                    <Input type="number" step="0.1" min="0" max="100" value={settings.sgstPercent ?? 2.5} onChange={(e) => setSettings({ ...settings, sgstPercent: parseFloat(e.target.value) || 0 })} className="mt-2 h-11 rounded-xl glass-input" data-testid="sgst-input" />
                    <p className="text-xs text-gray-400 mt-1">Applied on bill after discount</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-sm">Central GST (CGST) %</Label>
                    <Input type="number" step="0.1" min="0" max="100" value={settings.cgstPercent ?? 2.5} onChange={(e) => setSettings({ ...settings, cgstPercent: parseFloat(e.target.value) || 0 })} className="mt-2 h-11 rounded-xl glass-input" data-testid="cgst-input" />
                    <p className="text-xs text-gray-400 mt-1">Applied on bill after discount</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: `${theme.primaryColor}08` }}>
                  <p className="text-xs text-gray-500">Total GST: <span className="font-bold" style={{ color: theme.primaryColor }}>{((settings.sgstPercent ?? 2.5) + (settings.cgstPercent ?? 2.5)).toFixed(1)}%</span> (SGST {settings.sgstPercent ?? 2.5}% + CGST {settings.cgstPercent ?? 2.5}%)</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-5 animate-fade-in-up">
            {/* Logo */}
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-5">{t('settings.logo')}</h2>
              <div className="flex items-center gap-6">
                {logoPreview && <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border" style={{ borderColor: `${theme.primaryColor}20` }}><img src={logoPreview} alt="Logo" className="w-full h-full object-contain" /></div>}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed rounded-2xl p-6 text-center hover:border-opacity-100 transition-all" style={{ borderColor: `${theme.primaryColor}30` }}>
                    <Upload className="w-7 h-7 mx-auto mb-2" style={{ color: theme.primaryColor }} />
                    <p className="text-sm text-gray-500">{t('settings.upload_logo')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('settings.file_limit')}</p>
                  </div>
                  <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" data-testid="logo-upload" />
                </label>
              </div>
            </div>

            {/* Background */}
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-5">{t('settings.bg_image')}</h2>
              {bgPreview && <div className="w-full h-40 rounded-2xl overflow-hidden shadow-lg mb-4 border" style={{ borderColor: `${theme.primaryColor}20` }}><img src={bgPreview} alt="Background" className="w-full h-full object-cover" /></div>}
              <label className="cursor-pointer block">
                <div className="border-2 border-dashed rounded-2xl p-6 text-center hover:border-opacity-100 transition-all" style={{ borderColor: `${theme.primaryColor}30` }}>
                  <ImageIcon className="w-7 h-7 mx-auto mb-2" style={{ color: theme.primaryColor }} />
                  <p className="text-sm text-gray-500">{t('settings.upload_bg')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('settings.file_limit')}</p>
                </div>
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'background')} className="hidden" data-testid="background-upload" />
              </label>
            </div>

            {/* Colors */}
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><Palette className="w-5 h-5" style={{ color: theme.primaryColor }} /> {t('settings.colors')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ColorPicker label={t('settings.bg_color')} field="backgroundColor" />
                <ColorPicker label={t('settings.primary_color')} field="primaryColor" />
                <ColorPicker label={t('settings.secondary_color')} field="secondaryColor" />
                <ColorPicker label={t('settings.accent_color')} field="accentColor" />
              </div>
              <div className="mt-6">
                <Label className="font-semibold text-sm">{t('settings.overlay_opacity')}: {Math.round(settings.overlayOpacity * 100)}%</Label>
                <input type="range" min="0" max="1" step="0.01" value={settings.overlayOpacity} onChange={(e) => setSettings({ ...settings, overlayOpacity: parseFloat(e.target.value) })} className="w-full mt-2 accent-current" style={{ accentColor: theme.primaryColor }} />
                <p className="text-xs text-gray-400 mt-1">{t('settings.overlay_desc')}</p>
              </div>

              {/* Live Preview */}
              <div className="mt-6 p-5 rounded-2xl" style={{ backgroundColor: settings.backgroundColor }}>
                <p className="text-sm font-semibold mb-3" style={{ color: settings.primaryColor }}>Live Preview</p>
                <div className="flex gap-3">
                  <div className="px-4 py-2 rounded-xl text-white text-xs font-semibold" style={{ backgroundColor: settings.primaryColor }}>Primary</div>
                  <div className="px-4 py-2 rounded-xl text-white text-xs font-semibold" style={{ backgroundColor: settings.secondaryColor }}>Secondary</div>
                  <div className="px-4 py-2 rounded-xl text-white text-xs font-semibold" style={{ backgroundColor: settings.accentColor }}>Accent</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSave} disabled={saving} className="w-full text-white rounded-xl h-14 text-base font-semibold btn-premium flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} data-testid="save-settings-button">
          <Save className="w-5 h-5" />
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </main>
    </div>
  );
};

const Settings2Icon = ({ color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
  </svg>
);
