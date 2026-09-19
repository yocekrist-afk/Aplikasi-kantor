import React from 'react';
import { Play } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';

export function ParticipantFaq() {
  const { data: faqs, loading } = useFirestore('faqs');

  if (loading) {
    return <div className="flex justify-center items-center py-20 text-gray-500">Loading FAQs...</div>;
  }

  const activeFaqs = faqs?.filter(f => f.status === 'Active') || [];

  if (activeFaqs.length === 0) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-500">
        Belum ada data FAQ yang tersedia.
      </div>
    );
  }

  return (
    <div className="p-2 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeFaqs.map((faq, idx) => (
          <div key={faq.id || idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <a 
              href={faq.youtubeUrl || '#'} 
              target={faq.youtubeUrl ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 group block bg-gray-100"
            >
              {faq.cover ? (
                <img src={faq.cover} alt={faq.pertanyaan} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 ml-1 fill-current" />
                </div>
              </div>
            </a>
            
            <h3 className="font-bold text-gray-800 text-lg mb-2">{faq.pertanyaan}</h3>
            {faq.jawaban && (
              <p className="text-gray-600 text-sm line-clamp-3">{faq.jawaban}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
