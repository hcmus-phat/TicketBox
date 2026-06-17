"use client";

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { ConcertTable } from '@/components/concert-table';
import { getRevenueSummary, getConcerts } from '@/lib/api';
import { BarChart3, Users, Calendar, TrendingUp, RefreshCw } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [concertsList, setConcertsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, concertsData] = await Promise.all([
        getRevenueSummary(),
        getConcerts()
      ]);
      setStats(summaryData);
      setConcertsList(concertsData.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Không thể tải dữ liệu dashboard. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-black tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Tổng quan bán vé và vận hành sự kiện từ dữ liệu thật.</p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {error && (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="text-destructive font-semibold mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && !stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-32 rounded-3xl border border-border bg-card p-6 animate-pulse" />
              ))}
            </div>
            <div className="h-64 rounded-3xl border border-border bg-card p-6 animate-pulse" />
          </div>
        )}

        {/* Real Content */}
        {stats && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tổng sự kiện</p>
                    <p className="text-3xl font-black text-foreground">{stats.totalEvents ?? concertsList.length}</p>
                  </div>
                  <Calendar className="size-10 text-primary/25" />
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vé đã bán</p>
                    <p className="text-3xl font-black text-foreground">
                      {(stats.ticketsSold || 0).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <TrendingUp className="size-10 text-accent/25" />
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Doanh thu</p>
                    <p className="text-3xl font-black text-foreground">
                      {stats.revenue >= 1000000000
                        ? `${(stats.revenue / 1000000000).toFixed(2)}Bđ`
                        : `${(stats.revenue || 0).toLocaleString('vi-VN')}đ`}
                    </p>
                  </div>
                  <BarChart3 className="size-10 text-primary/25" />
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Người dùng</p>
                    <p className="text-3xl font-black text-foreground">
                      {(stats.users || 0).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <Users className="size-10 text-primary/25" />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-black text-foreground">Sự kiện gần đây</h2>
                {loading && <span className="text-xs text-muted-foreground animate-pulse">Đang cập nhật danh sách...</span>}
              </div>
              {concertsList.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                  Chưa có sự kiện nào được ghi nhận.
                </div>
              ) : (
                <ConcertTable concerts={concertsList} />
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-black text-foreground">Doanh thu hàng tháng</h3>
                <div className="h-48 flex items-end gap-2">
                  {stats.monthlySales?.map((value: number, idx: number) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-xl bg-primary/25 transition hover:bg-primary/50"
                      style={{ height: `${value}%` }}
                      title={`Tháng ${idx + 1}: ${value}%`}
                    />
                  )) || <div className="text-muted-foreground w-full text-center py-16">Không có dữ liệu biểu đồ</div>}
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-black text-foreground">Phân bổ loại vé</h3>
                <div className="space-y-3">
                  {stats.ticketDistribution?.map((item: any) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${item.color || 'bg-primary'}`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  )) || <div className="text-muted-foreground text-center py-16">Không có dữ liệu phân bổ</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
