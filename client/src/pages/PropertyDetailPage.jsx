import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertiesAPI } from '@/api/axios';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, MapPin, BedDouble, Bath, Maximize2, Building2, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imgIndex, setImgIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesAPI.getById(id).then(r => r.data.data),
  });

  if (isLoading) return <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />;
  const p = data;
  if (!p) return <div className="text-center py-20 text-gray-400">Property not found</div>;

  const images = p.images?.length > 0 ? p.images : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/properties')} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{p.title}</h1>
          <div className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="w-3.5 h-3.5" />{p.address}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery / Carousel */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="relative h-64 md:h-96 bg-gradient-to-br from-accent/10 to-blue-50">
              {images.length > 0 ? (
                <>
                  <img src={images[imgIndex]} alt={p.title} className="w-full h-full object-cover" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={() => setImgIndex(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`} />)}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Building2 className="w-16 h-16 text-accent/20" /></div>
              )}
            </div>
            {images.length > 1 && (
              <div className="p-3 flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIndex(i)} className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${i === imgIndex ? 'border-accent' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{p.description || 'No description provided.'}</p>
          </div>

          {/* Map */}
          {p.latitude && p.longitude && (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Location</h3></div>
              <div className="h-72">
                <iframe
                  title="Property Location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${p.latitude},${p.longitude}&z=15&output=embed`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-card p-6">
            <p className="text-3xl font-bold text-accent">{formatCurrency(p.price)}</p>
            <div className="flex gap-2 mt-3">
              <span className={`status-badge ${p.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : p.status === 'SOLD' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status.replace(/_/g, ' ')}</span>
              <span className="status-badge bg-gray-100 text-gray-700">{p.type}</span>
            </div>

            <div className="mt-6 space-y-3">
              {p.type !== 'PLOT' && (
                <>
                  <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center gap-2"><BedDouble className="w-4 h-4" /> Bedrooms</span><span className="font-medium">{p.bedrooms}</span></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center gap-2"><Bath className="w-4 h-4" /> Bathrooms</span><span className="font-medium">{p.bathrooms}</span></div>
                </>
              )}
              <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center gap-2"><Maximize2 className="w-4 h-4" /> Area</span><span className="font-medium">{p.areaSqFt?.toLocaleString()} sqft</span></div>
            </div>
          </div>

          {/* Amenities */}
          {p.amenities?.length > 0 && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/5 text-accent text-sm rounded-lg">
                    <Tag className="w-3 h-3" />{a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Agent Info */}
          {p.agent && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Listed By</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-semibold">{p.agent.name?.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium">{p.agent.name}</p>
                  <p className="text-xs text-gray-500">{p.agent.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
