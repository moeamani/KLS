import { Button } from '@heroui/react';
import { useNavigate } from 'react-router';
import { LogoMark } from '@/components/Logo';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-[60dvh] place-items-center px-6 py-16 text-center">
      <div className="grid justify-items-center gap-3">
        <LogoMark className="size-10" />
        <h1 className="text-xl font-bold">این صفحه پیدا نشد</h1>
        <p className="max-w-sm text-sm leading-7 text-muted">نشانی را بررسی کنید یا از صفحه اصلی ادامه دهید.</p>
        <Button onPress={() => navigate('/')}>صفحه اصلی</Button>
      </div>
    </div>
  );
}
