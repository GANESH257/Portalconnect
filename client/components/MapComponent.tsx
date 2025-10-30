import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Phone, Globe, ExternalLink, Clock, Users, Eye } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewsCount?: number;
  lat?: number;
  lng?: number;
  // DataForSEO specific fields
  placeId?: string;
  cid?: string;
  domain?: string;
  bookOnlineUrl?: string;
  thumbnail?: string;
  mainImage?: string;
  category?: string;
  isOpen?: boolean;
  popularTimes?: any;
}

interface MapComponentProps {
  businesses: BusinessLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  mapView?: 'standard' | 'zipcode' | 'county' | 'radius';
  radius?: number;
  selectedZipCodes?: string[];
  selectedCounties?: string[];
}

export default function MapComponent({ 
  businesses, 
  center, 
  zoom = 12, 
  mapView = 'standard',
  radius = 10,
  selectedZipCodes = [],
  selectedCounties = []
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessLocation | null>(null);
  const [businessesByZip, setBusinessesByZip] = useState<Record<string, BusinessLocation[]>>({});
  const [businessesByCounty, setBusinessesByCounty] = useState<Record<string, BusinessLocation[]>>({});

  // Group businesses by zip code and county
  useEffect(() => {
    const zipGrouped = businesses.reduce((acc, business) => {
      const zip = business.zipCode || 'Unknown';
      if (!acc[zip]) {
        acc[zip] = [];
      }
      acc[zip].push(business);
      return acc;
    }, {} as Record<string, BusinessLocation[]>);
    setBusinessesByZip(zipGrouped);

    // Group by county (extract from city or use state as fallback)
    const countyGrouped = businesses.reduce((acc, business) => {
      const county = business.city?.includes('County') 
        ? business.city 
        : `${business.city} County` || 'Unknown County';
      if (!acc[county]) {
        acc[county] = [];
      }
      acc[county].push(business);
      return acc;
    }, {} as Record<string, BusinessLocation[]>);
    setBusinessesByCounty(countyGrouped);
  }, [businesses]);

  // Filter to businesses that have real coordinates only
  const geoBusinesses = useMemo(
    () => businesses.filter(b => typeof b.lat === 'number' && typeof b.lng === 'number'),
    [businesses]
  );

  const defaultCenter = center || { lat: 38.6270, lng: -90.1994 };

  // Fit map to bounds helper
  function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
    const map = useMap();
    useEffect(() => {
      if (points.length === 0) return;
      const lats = points.map(p => p.lat);
      const lngs = points.map(p => p.lng);
      const south = Math.min(...lats);
      const north = Math.max(...lats);
      const west = Math.min(...lngs);
      const east = Math.max(...lngs);
      // @ts-ignore - Leaflet types not imported here
      map.fitBounds([[south, west], [north, east]], { padding: [40, 40] });
    }, [points, map]);
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Missouri Map Visualization */}
      <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-theme-dark-blue flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Missouri Business Locations - {mapView.toUpperCase()} View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="w-full h-96 rounded-lg overflow-hidden">
              <MapContainer center={[defaultCenter.lat, defaultCenter.lng]} zoom={12} style={{ height: '100%', width: '100%' }} className="w-full h-full" {...({} as any)}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitBounds points={geoBusinesses.map(b => ({ lat: b.lat as number, lng: b.lng as number }))} />
                {mapView === 'radius' && center && (
                  <Circle center={[center.lat, center.lng]} radius={(radius || 0) * 1609.34} {...({} as any)} />
                )}
                {geoBusinesses.slice(0, 200).map(b => (
                  <Marker key={b.id} position={[b.lat as number, b.lng as number]} eventHandlers={{ click: () => setSelectedBusiness(b) }}>
                    <Popup>
                      <div className="text-sm min-w-[200px]">
                        <div className="font-semibold text-theme-dark-blue">{b.name}</div>
                        <div className="text-gray-600 text-xs">{b.address}</div>
                        {b.rating && (
                          <div className="mt-1 flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span>{b.rating.toFixed(1)} ({b.reviewsCount || 0} reviews)</span>
                          </div>
                        )}
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            onClick={() => setSelectedBusiness(b)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Link to={`/business/${b.placeId || b.cid || b.id}`}>
                            <Button
                              size="sm"
                              className="text-xs h-7 px-2 bg-theme-blue-primary hover:bg-theme-blue-secondary text-white"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            
            {/* Map Overlay Info */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="text-sm font-medium text-gray-700">
                  📍 {geoBusinesses.length} businesses with coordinates
                </div>
                        <div className="text-xs text-gray-500">
                          View: {mapView} | Radius: {radius ? `${radius} miles` : 'Not set'}
                        </div>
                <div className="text-xs text-gray-500">
                  Click markers for details
                </div>
              </div>
              
              {/* Map Legend */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs">Center</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      mapView === 'zipcode' ? 'bg-green-500' :
                      mapView === 'county' ? 'bg-purple-500' :
                      mapView === 'radius' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}></div>
                    <span className="text-xs">Businesses</span>
                  </div>
                  {mapView === 'radius' && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-blue-500 border-dashed rounded-full"></div>
                      <span className="text-xs">Search Radius</span>
                    </div>
                  )}
                </div>
              </div>
            {/* end relative container */}
          </div>
        </CardContent>
      </Card>

              {/* Selected Business Details with DataForSEO Data */}
              {selectedBusiness && (
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-theme-dark-blue flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {selectedBusiness.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Business Info */}
                      <div>
                        <div className="flex items-start gap-3">
                          {selectedBusiness.mainImage && (
                            <img 
                              src={selectedBusiness.mainImage} 
                              alt={selectedBusiness.name}
                              className="w-16 h-16 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-theme-dark-blue">{selectedBusiness.name}</h3>
                            <p className="text-sm text-gray-600">{selectedBusiness.address}</p>
                            <p className="text-sm text-gray-600">{selectedBusiness.city}, {selectedBusiness.state} {selectedBusiness.zipCode}</p>
                            {selectedBusiness.category && (
                              <Badge variant="secondary" className="mt-1">{selectedBusiness.category}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rating and Reviews */}
                      {selectedBusiness.rating && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          <div>
                            <span className="text-lg font-bold text-yellow-600">{selectedBusiness.rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-600 ml-2">({selectedBusiness.reviewsCount || 0} reviews)</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          {selectedBusiness.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-theme-light-blue" />
                              <a href={`tel:${selectedBusiness.phone}`} className="text-sm text-blue-600 hover:underline">
                                {selectedBusiness.phone}
                              </a>
                            </div>
                          )}
                          {selectedBusiness.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-theme-light-blue" />
                              <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                Visit Website
                              </a>
                            </div>
                          )}
                          {selectedBusiness.domain && (
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-4 h-4 text-theme-light-blue" />
                              <span className="text-sm text-gray-600">{selectedBusiness.domain}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {selectedBusiness.bookOnlineUrl && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-green-600" />
                              <a href={selectedBusiness.bookOnlineUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline font-medium">
                                Book Online
                              </a>
                            </div>
                          )}
                          {selectedBusiness.isOpen !== undefined && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-theme-light-blue" />
                              <span className={`text-sm font-medium ${selectedBusiness.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                {selectedBusiness.isOpen ? 'Open Now' : 'Closed'}
                              </span>
                            </div>
                          )}
                          {selectedBusiness.popularTimes && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-theme-light-blue" />
                              <span className="text-sm text-gray-600">Popular times available</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* DataForSEO Identifiers */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 space-y-1">
                          {selectedBusiness.placeId && (
                            <div>Place ID: {selectedBusiness.placeId}</div>
                          )}
                          {selectedBusiness.cid && (
                            <div>CID: {selectedBusiness.cid}</div>
                          )}
                          {selectedBusiness.lat && selectedBusiness.lng && (
                            <div>Coordinates: {selectedBusiness.lat.toFixed(6)}, {selectedBusiness.lng.toFixed(6)}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

      {/* Businesses by Location (ZIP Code or County) */}
      <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-theme-dark-blue">
            Businesses by {mapView === 'county' ? 'County' : 'ZIP Code'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mapView === 'county' ? (
              // County View
              Object.entries(businessesByCounty).map(([county, countyBusinesses]) => (
                <div key={county} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-theme-dark-blue">{county}</h3>
                    <Badge variant="secondary">{countyBusinesses.length} businesses</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {countyBusinesses.slice(0, 6).map((business) => (
                      <div 
                        key={business.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-sm text-theme-dark-blue">{business.name}</div>
                        <div className="text-xs text-gray-600">{business.address}</div>
                        {business.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs">{business.rating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="mt-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2"
                            onClick={() => setSelectedBusiness(business)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Link to={`/business/${business.placeId || business.cid || business.id}`}>
                            <Button
                              size="sm"
                              className="text-xs h-6 px-2 bg-theme-blue-primary hover:bg-theme-blue-secondary text-white"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                    {countyBusinesses.length > 6 && (
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <div className="text-sm font-medium text-blue-600">+{countyBusinesses.length - 6} more</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              // ZIP Code View
              Object.entries(businessesByZip).map(([zip, zipBusinesses]) => (
                <div key={zip} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-theme-dark-blue">ZIP Code: {zip}</h3>
                    <Badge variant="secondary">{zipBusinesses.length} businesses</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {zipBusinesses.slice(0, 6).map((business) => (
                      <div 
                        key={business.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-sm text-theme-dark-blue">{business.name}</div>
                        <div className="text-xs text-gray-600">{business.address}</div>
                        {business.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span className="text-xs">{business.rating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="mt-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2"
                            onClick={() => setSelectedBusiness(business)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Link to={`/business/${business.placeId || business.cid || business.id}`}>
                            <Button
                              size="sm"
                              className="text-xs h-6 px-2 bg-theme-blue-primary hover:bg-theme-blue-secondary text-white"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                    {zipBusinesses.length > 6 && (
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <div className="text-sm font-medium text-blue-600">+{zipBusinesses.length - 6} more</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
