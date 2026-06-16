"use client";

import { useEffect, useState, use } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { 
  getConcertById, 
  getLocalTicketTypes, 
  createTicketType, 
  updateTicketType, 
  deleteTicketType,
  getFriendlyErrorMessage
} from '@/lib/api';
import { ArrowLeft, Plus, Edit2, Trash2, Calendar, DollarSign, Users, Clock } from 'lucide-react';
import Link from 'next/link';

interface AdminConcertDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AdminConcertDetailPage({ params }: AdminConcertDetailPageProps) {
  const { id: concertId } = use(params);
  const [concert, setConcert] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [maxPerUser, setMaxPerUser] = useState('4');
  const [saleStartAt, setSaleStartAt] = useState('');
  const [saleEndAt, setSaleEndAt] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const concertData = await getConcertById(concertId);
        setConcert(concertData);
        
        // Load ticket types (combining DB and LocalStorage fallback)
        const localTypes = getLocalTicketTypes(concertId);
        setTicketTypes(localTypes);
      } catch (err) {
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [concertId]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setPrice('');
    setTotalQuantity('');
    setMaxPerUser('4');
    setSaleStartAt('');
    setSaleEndAt('');
  }

  function validate() {
    if (!name.trim()) return 'Vui lòng nhập tên hạng vé.';
    if (Number(price) <= 0) return 'Giá vé phải lớn hơn 0.';
    if (Number(totalQuantity) <= 0) return 'Số lượng vé phải lớn hơn 0.';
    if (Number(maxPerUser) < 1) return 'Số lượng mua tối đa phải ít nhất là 1.';
    if (saleStartAt && saleEndAt && new Date(saleStartAt) >= new Date(saleEndAt)) {
      return 'Thời gian bắt đầu bán phải trước thời gian kết thúc.';
    }
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationMsg = validate();
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        totalQuantity: Number(totalQuantity),
        maxPerUser: Number(maxPerUser),
        saleStartAt: saleStartAt || null,
        saleEndAt: saleEndAt || null,
      };

      if (editingId) {
        await updateTicketType(concertId, editingId, payload);
        setSuccess('Cập nhật hạng vé thành công!');
      } else {
        await createTicketType(concertId, payload);
        setSuccess('Tạo hạng vé thành công!');
      }

      // Refresh list
      setTicketTypes(getLocalTicketTypes(concertId));
      resetForm();
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  }

  function handleEdit(t: any) {
    setEditingId(t.id);
    setName(t.name);
    setPrice(t.price.toString());
    setTotalQuantity(t.totalQuantity.toString());
    setMaxPerUser(t.maxPerUser.toString());
    setSaleStartAt(t.saleStartAt ? t.saleStartAt.substring(0, 16) : '');
    setSaleEndAt(t.saleEndAt ? t.saleEndAt.substring(0, 16) : '');
  }

  async function handleDelete(ticketTypeId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa hạng vé này không?')) return;
    setError('');
    setSuccess('');
    try {
      await deleteTicketType(concertId, ticketTypeId);
      setSuccess('Xóa hạng vé thành công!');
      setTicketTypes(getLocalTicketTypes(concertId));
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <Link
          href="/admin/concerts"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Quản lý sự kiện
        </Link>

        {concert && (
          <div className="p-6 bg-card border border-border rounded-3xl">
            <h1 className="text-3xl font-black text-foreground">{concert.title}</h1>
            <p className="text-muted-foreground mt-1">{concert.artist} · {concert.venue}, {concert.city}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form */}
          <div className="lg:col-span-1 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-black text-foreground mb-6">
              {editingId ? 'Sửa hạng vé' : 'Thêm hạng vé mới'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Tên hạng vé</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Vé VIP, Vé GA..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-border bg-background px-4 focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Giá vé (VNĐ)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="Mệnh giá"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Số lượng</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder="Tổng số vé"
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-primary/15"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Max / User</label>
                  <input
                    type="number"
                    placeholder="4"
                    value={maxPerUser}
                    onChange={(e) => setMaxPerUser(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-background px-4 focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Mở bán lúc</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={saleStartAt}
                    onChange={(e) => setSaleStartAt(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-primary/15 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Đóng bán lúc</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={saleEndAt}
                    onChange={(e) => setSaleEndAt(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-primary/15 text-sm"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-500">
                  {success}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-muted"
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-primary py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition"
                >
                  {editingId ? 'Lưu thay đổi' : 'Tạo hạng vé'}
                </button>
              </div>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 rounded-[2rem] border border-border bg-card p-6 shadow-sm overflow-hidden">
            <h2 className="text-xl font-black text-foreground mb-6">Các hạng vé hiện có</h2>
            
            {ticketTypes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Chưa có hạng vé nào được cấu hình.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-sm font-bold text-muted-foreground pb-4">
                      <th className="pb-3">Hạng vé</th>
                      <th className="pb-3">Giá vé</th>
                      <th className="pb-3 text-center">Số lượng</th>
                      <th className="pb-3 text-center">Max/User</th>
                      <th className="pb-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ticketTypes.map((t) => (
                      <tr key={t.id} className="text-sm">
                        <td className="py-4 font-bold text-foreground">{t.name}</td>
                        <td className="py-4 text-primary font-bold">{t.price.toLocaleString('vi-VN')}đ</td>
                        <td className="py-4 text-center">{t.totalQuantity}</td>
                        <td className="py-4 text-center">{t.maxPerUser}</td>
                        <td className="py-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => handleEdit(t)}
                              className="rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition"
                              aria-label="Sửa hạng vé"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="rounded-full p-2 text-rose-500 hover:bg-rose-500/10 transition"
                              aria-label="Xóa hạng vé"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
