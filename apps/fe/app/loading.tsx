import { Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
