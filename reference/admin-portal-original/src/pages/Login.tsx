import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRight, Boxes, CircleUserRound, Eye, EyeOff, GraduationCap, KeyRound, Loader2, Network, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const loginSchema = z.object({
  email: z.string().min(1, 'Employee ID or corporate email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: CircleUserRound, title: 'People & Workplace', text: 'Employee services and workplace resources.' },
  { icon: GraduationCap, title: 'Collaboration & Learning', text: 'Connect with teams, knowledge, and learning resources.' },
  { icon: Boxes, title: 'Business Applications', text: 'Access the internal tools and platforms used across NPST.' },
  { icon: Network, title: 'Shared Services', text: 'One centralized experience for common organizational services.' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (values: LoginValues) => {
    const result = await login(values.email, values.password, values.remember);
    if (result.ok) {
      toast.success(`Welcome back, ${result.session?.role ?? 'user'}`);
      navigate(result.session?.role === 'Employee' ? '/employee' : '/', { replace: true });
    } else {
      form.setError('root', { message: result.error ?? 'Invalid email or password.' });
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div
        className="relative hidden min-h-svh flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-12"
        style={{ background: 'radial-gradient(circle at 85% 12%, #284fbc 0%, #0e123c 45%, #01105f 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
          <svg className="absolute -right-24 top-20 h-[480px] w-[620px]" viewBox="0 0 620 480" fill="none">
            <path d="M30 390 180 250 290 310 420 150 590 70" stroke="#29b6c4" strokeOpacity=".35" strokeWidth="1.5" />
            <path d="M90 80 220 170 370 90 540 240" stroke="#4972ff" strokeOpacity=".4" strokeWidth="1" />
            <path d="M180 250 220 170 420 150 370 90" stroke="#e2f4fe" strokeOpacity=".2" />
            {[[30,390],[180,250],[290,310],[420,150],[590,70],[90,80],[220,170],[370,90],[540,240]].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#29b6c4" fillOpacity=".8" />
            ))}
          </svg>
          <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-[#29b6c4]/10 blur-3xl" />
          <div className="absolute right-0 top-0 size-80 rounded-full bg-[#4972ff]/20 blur-3xl" />
        </div>

        <div className="flex items-center gap-3">
          <img src="/npst.png" alt="NPST" className="h-10 w-auto max-w-40 object-contain" />
          <div className="leading-tight">
            <p className="font-heading text-base font-bold">NPST Shared Services</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7de3e8]">
            Your NPST digital workplace
          </p>
          <h1 className="font-heading text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">
            One Workplace. Every Team. One Connected Experience.
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-[#e2f4fe]/80 xl:text-[15px]">
            Welcome to NPST Shared Services — your central digital workplace for accessing the tools, services, and resources that keep our teams connected and moving forward.
          </p>
          <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#29b6c4]/15 text-[#7de3e8]">
                  <feature.icon className="size-[17px]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{feature.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-5">
          <p className="font-heading text-sm font-semibold tracking-wide text-[#e2f4fe]">
            Innovation in Every Byte. Collaboration in Every Step.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Built for the people behind the progress.</p>
        </div>
      </div>

      {/* Auth card */}
      <div className="flex items-center justify-center bg-[#F8FAFC] p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mx-auto grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-md lg:mx-0">
              <ShieldCheck className="size-6" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Welcome to NPST Shared Services</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your employee ID or corporate email to continue.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-800">
            <span className="flex items-center gap-2">
              <KeyRound className="size-3.5 shrink-0" />
              <span>Demo: <span className="font-semibold">admin@npst.com</span> / <span className="font-semibold">Admin@123</span></span>
            </span>
            <button
              type="button"
              onClick={() => {
                form.setValue('email', 'admin@npst.com');
                form.setValue('password', 'Admin@123');
              }}
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-blue-950"
              data-testid="login-fill-demo-button"
            >
              Fill
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate data-testid="login-form">
            {form.formState.errors.root && (
              <div
                className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
                role="alert"
                data-testid="login-error-alert"
              >
                <AlertTriangle className="size-4 shrink-0" />
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Employee ID / Corporate Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@npst.com"
                autoComplete="email"
                {...form.register('email')}
                data-testid="login-email-input"
              />
              {form.formState.errors.email && (
                <p className="text-xs font-medium text-red-600" data-testid="login-email-error">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                  data-testid="login-forgot-button"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...form.register('password')}
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  data-testid="login-password-toggle"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs font-medium text-red-600" data-testid="login-password-error">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Controller
              control={form.control}
              name="remember"
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} data-testid="login-remember-checkbox" />
                  Remember me on this device
                </label>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting} data-testid="login-submit-button">
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in to portal <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Protected by NPST SSO · Unauthorized access is logged and audited
            </p>
          </form>
        </div>
      </div>

      {/* Forgot password dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your administrator email and we will simulate sending a reset link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email address</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="admin@npst.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              data-testid="forgot-email-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)} data-testid="forgot-cancel-button">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
                  toast.error('Enter a valid email address');
                  return;
                }
                toast.success(`Password reset link sent to ${forgotEmail}`);
                setForgotOpen(false);
                setForgotEmail('');
              }}
              data-testid="forgot-send-button"
            >
              Send reset link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
