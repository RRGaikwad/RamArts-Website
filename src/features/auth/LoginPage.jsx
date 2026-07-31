import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/Button';
import { useAuth, useLogin } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password required'),
});

export default function LoginPage() {
  const { user, ready, isAdmin } = useAuth();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (ready && user && isAdmin) navigate(from, { replace: true });
  }, [ready, user, isAdmin, navigate, from]);

  if (ready && user && isAdmin) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values) => {
    try {
      await login.mutateAsync(values);
      toast.success('Welcome back');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <>
      <SEO title="Admin Login" path="/admin/login" />
      <div className="flex min-h-screen items-center justify-center bg-paper px-5">
        <div className="w-full max-w-md border border-line bg-paper-raised p-8 shadow-soft">
          <p className="font-display text-2xl font-bold">
            Ram<span className="text-brand">Arts</span>
          </p>
          <h1 className="mt-6 font-display text-display-md">Admin sign in</h1>
          <p className="mt-2 text-sm text-ink-muted">Authorized access only. No public registration.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label-field">
                Email
              </label>
              <input id="email" type="email" className="input-field" autoComplete="username" {...register('email')} />
              {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="label-field">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" loading={login.isPending}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
