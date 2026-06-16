export const API_BASE_URL = 'http://127.0.0.1:4000';

export class ApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export function getFriendlyErrorMessage(error: any): string {
  if (error instanceof ApiError) {
    const code = error.statusCode;
    const msg = error.message?.toLowerCase() || '';

    if (code === 429) {
      return 'Yêu cầu quá nhanh. Vui lòng thử lại sau vài giây (Rate Limit).';
    }
    if (code === 503) {
      return 'Hệ thống đang bận hoặc đang bảo trì (Circuit Breaker). Vui lòng quay lại sau.';
    }
    if (code === 403) {
      return 'Bạn không có quyền thực hiện hành động này.';
    }

    if (msg.includes('sold out') || msg.includes('hết vé') || msg.includes('sold_out')) {
      return 'Xin lỗi, loại vé này đã được bán hết.';
    }
    if (msg.includes('max_per_user') || msg.includes('max per user') || msg.includes('vượt quá số lượng')) {
      return 'Bạn đã vượt quá số lượng vé tối đa được phép mua cho mỗi tài khoản.';
    }
    if (msg.includes('expired') || msg.includes('hết hạn')) {
      return 'Phiên đặt giữ ghế của bạn đã hết hạn. Vui lòng chọn lại ghế.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  return 'Đã có lỗi xảy ra.';
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Try to get token from localStorage for client-side fetches
  let token = '';
  if (typeof window !== 'undefined') {
    token = window.localStorage.getItem('access_token') || '';
  }

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || 'API Request failed';
    const statusCode = errorData.metadata?.statusCode || response.status;
    throw new ApiError(message, statusCode);
  }

  // BE wrapper format: { statusCode, message, data, metadata }
  const json = await response.json();
  return json.data;
}

// ----------------------------------------------------
// CONCERTS
// ----------------------------------------------------

export async function getConcerts(params?: { status?: string; keyword?: string; fromDate?: string; toDate?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value));
      }
    });
  }
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  const data = await fetchApi(`/concerts${queryString}`, { next: { revalidate: 60 } } as any); // use ISR cache
  
  // data format: { items: [], meta: {} }
  return {
    items: data.items.map((concert: any) => mapConcertToDisplay(concert)),
    meta: data.meta,
  };
}

export async function getConcertById(id: string) {
  const concert = await fetchApi(`/concerts/${id}`, { next: { revalidate: 60 } } as any);
  return mapConcertToDisplay(concert);
}

function mapConcertToDisplay(concert: any) {
  // Mapping BE model to what FE components expect based on mock data
  const ticketsSold = concert.ticketsSold ?? 0;
  const capacity = concert.capacity ?? 0;
  
  const isSoldOut = capacity > 0 && ticketsSold >= capacity;
  let statusDisplay = 'Đang bán';
  
  if (concert.status === 'CANCELLED') statusDisplay = 'Đã hủy';
  else if (concert.status === 'COMPLETED') statusDisplay = 'Đã kết thúc';
  else if (isSoldOut) statusDisplay = 'Hết vé';
  else if (capacity > 0 && capacity - ticketsSold <= capacity * 0.2) statusDisplay = 'Sắp hết vé';

  return {
    id: concert.id,
    title: concert.name,
    artist: concert.artistName || 'Various Artists',
    date: concert.eventDate,
    time: new Date(concert.eventDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    venue: concert.venueName,
    city: concert.venueAddress, // Map to address since BE doesn't have separate city field
    image: concert.posterUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=700&fit=crop',
    description: concert.description,
    price: 0, // Will be fetched from ticket zones if needed
    capacity: capacity,
    soldOut: isSoldOut,
    genre: concert.genre || 'N/A',
    language: concert.language || 'N/A',
    ageLimit: concert.ageLimit || 'N/A',
    ticketsSold: ticketsSold,
    revenue: concert.revenue ?? 0,
    status: statusDisplay,
    seatMapSvgUrl: concert.seatMapSvgUrl,
    rawStatus: concert.status,
    seatZones: concert.seatZones,
  };
}

// ----------------------------------------------------
// ORDERS
// ----------------------------------------------------

export async function createOrder(payload: any, idempotencyKey?: string) {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['idempotency-key'] = idempotencyKey;
  }
  return await fetchApi('/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// PAYMENTS
// ----------------------------------------------------

export async function createPayment(payload: { orderId: string; provider: string; returnUrl?: string }) {
  return await fetchApi('/payments/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// AUTH
// ----------------------------------------------------

export async function login(payload: any) {
  const data = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.accessToken) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('access_token', data.accessToken);
    }
  }
  return data;
}

export async function register(payload: any) {
  return await fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProfile() {
  return await fetchApi('/auth/profile');
}

export async function logout() {
  await fetchApi('/auth/logout', { method: 'POST' });
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('access_token');
  }
}

// ----------------------------------------------------
// MOCKED SEATS & TICKET ZONES (Not in BE yet)
// ----------------------------------------------------

// Import these locally inside functions or handle in mock-data.ts 
// to avoid circular dependency for now, or just expose async mock functions.
import { getTicketZonesByConcertId, getSeatsByConcertId } from './mock-data';

export async function getTicketZonesAsync(concertId: string, preFetchedSeatZones?: any[]) {
  try {
    let seatZones = preFetchedSeatZones;
    if (!seatZones) {
      const concert = await fetchApi(`/concerts/${concertId}`, { next: { revalidate: 60 } } as any);
      seatZones = concert.seatZones;
    }

    if (!seatZones || seatZones.length === 0) {
      const localTypes = getLocalTicketTypes(concertId);
      if (localTypes && localTypes.length > 0) {
        return localTypes.map((t, idx) => ({
          id: t.id,
          name: t.name,
          label: t.name,
          price: t.price,
          remaining: t.remaining,
          total: t.totalQuantity,
          color: ['#ff3b30', '#ffcc00', '#34c759', '#007aff', '#af52de'][idx % 5],
          description: '',
          status: t.remaining === 0 ? 'sold-out' : t.remaining / t.totalQuantity <= 0.15 ? 'limited' : 'available',
          concertId,
          seatZoneId: t.id,
          ticketTypeId: t.id,
        }));
      }
      return getTicketZonesByConcertId(concertId); // fallback if no real zones
    }

    const validMockCodes = ['svip', 'vip', 'premium', 'standard', 'economy'];

    return seatZones.flatMap((zone: any, index: number) => {
      const ticketType = zone.ticketTypes?.[0];
      if (!ticketType) return [];

      let status = 'available';
      if (ticketType.status === 'SOLD_OUT' || ticketType.remaining === 0) status = 'sold-out';
      else if (ticketType.remaining / ticketType.totalQuantity <= 0.15) status = 'limited';

      const mockCode = validMockCodes[index % validMockCodes.length];

      return [{
        id: mockCode,
        name: zone.name,
        label: ticketType.name,
        price: ticketType.price,
        remaining: ticketType.remaining,
        total: ticketType.totalQuantity,
        color: zone.color || '#cccccc',
        description: '',
        status,
        concertId,
        seatZoneId: zone.id,
        ticketTypeId: ticketType.id,
      }];
    });
  } catch (error) {
    console.error('Error fetching ticket zones:', error);
    return getTicketZonesByConcertId(concertId);
  }
}

export async function getSeatsAsync(concertId: string, preFetchedSeatZones?: any[]) {
  try {
    let seatZones = preFetchedSeatZones;
    if (!seatZones) {
      const concert = await fetchApi(`/concerts/${concertId}`, { next: { revalidate: 60 } } as any);
      seatZones = concert.seatZones;
    }

    if (!seatZones || seatZones.length === 0) {
       return getSeatsByConcertId(concertId);
    }

    const seats: any[] = [];
    const validMockCodes = ['svip', 'vip', 'premium', 'standard', 'economy'];
    
    seatZones.forEach((zone: any, index: number) => {
      const mockCode = validMockCodes[index % validMockCodes.length];
      const rowNames = ['A', 'B', 'C', 'D'];
      const seatsPerRow = 12;
      
      rowNames.forEach((row, rowIndex) => {
        for (let number = 1; number <= seatsPerRow; number++) {
           const isOuterDisabled = rowIndex === rowNames.length - 1 && (number <= 2 || number >= seatsPerRow - 1);
           const isSold = (rowIndex + number) % 9 === 0;
           const isHeld = (rowIndex + number) % 13 === 0;

           seats.push({
             id: `seat-${concertId}-${mockCode}-${row}-${number}`,
             row,
             number,
             label: `${row}${number.toString().padStart(2, '0')}`,
             status: isOuterDisabled ? 'disabled' : isSold ? 'sold' : isHeld ? 'held' : 'available',
             zoneId: mockCode,
             concertId,
             seatZoneId: zone.id,
           });
        }
      });
    });
    
    return seats;
  } catch (error) {
    return getSeatsByConcertId(concertId);
  }
}

// ----------------------------------------------------
// LOCAL STORAGE TICKET TYPES FALLBACK (For Admin CRUD)
// ----------------------------------------------------

const TICKET_TYPES_LOCAL_KEY = 'ticketbox-local-ticket-types';

export function getLocalTicketTypes(concertId: string): any[] {
  if (typeof window === 'undefined') return [];
  const stored = window.localStorage.getItem(`${TICKET_TYPES_LOCAL_KEY}-${concertId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveLocalTicketTypes(concertId: string, types: any[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`${TICKET_TYPES_LOCAL_KEY}-${concertId}`, JSON.stringify(types));
  }
}

export async function createTicketType(concertId: string, payload: any) {
  try {
    return await fetchApi(`/concerts/${concertId}/ticket-types`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Backend API /ticket-types not found, falling back to LocalStorage', err);
    const mockTypes = getLocalTicketTypes(concertId);
    const newType = {
      id: `tickettype-${Date.now()}`,
      concertId,
      name: payload.name,
      price: Number(payload.price),
      totalQuantity: Number(payload.totalQuantity),
      remaining: Number(payload.totalQuantity),
      maxPerUser: Number(payload.maxPerUser || 4),
      status: 'ACTIVE',
      saleStartAt: payload.saleStartAt || null,
      saleEndAt: payload.saleEndAt || null,
    };
    const updated = [...mockTypes, newType];
    saveLocalTicketTypes(concertId, updated);
    return newType;
  }
}

export async function updateTicketType(concertId: string, ticketTypeId: string, payload: any) {
  try {
    return await fetchApi(`/concerts/${concertId}/ticket-types/${ticketTypeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Backend API /ticket-types not found, falling back to LocalStorage', err);
    const mockTypes = getLocalTicketTypes(concertId);
    const updated = mockTypes.map((t: any) => {
      if (t.id === ticketTypeId) {
        return {
          ...t,
          name: payload.name,
          price: Number(payload.price),
          totalQuantity: Number(payload.totalQuantity),
          maxPerUser: Number(payload.maxPerUser || 4),
          saleStartAt: payload.saleStartAt || null,
          saleEndAt: payload.saleEndAt || null,
        };
      }
      return t;
    });
    saveLocalTicketTypes(concertId, updated);
    return { id: ticketTypeId, ...payload };
  }
}

export async function deleteTicketType(concertId: string, ticketTypeId: string) {
  try {
    return await fetchApi(`/concerts/${concertId}/ticket-types/${ticketTypeId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Backend API /ticket-types not found, falling back to LocalStorage', err);
    const mockTypes = getLocalTicketTypes(concertId);
    const updated = mockTypes.filter((t: any) => t.id !== ticketTypeId);
    saveLocalTicketTypes(concertId, updated);
    return { success: true };
  }
}
