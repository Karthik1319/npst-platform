import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRight, Bell, Clock, Eye, EyeOff, KeyRound, Loader2, Palette, ShieldCheck } from 'lucide-react';
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
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: Palette, title: 'Centralized UI Branding', text: 'Theme every integrated app from one console' },
  { icon: Bell, title: 'Unified Notifications', text: 'Templates, rules and delivery for all channels' },
  { icon: Clock, title: 'Smart Reminders', text: 'Schedules and escalations that chase themselves' },
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
      navigate('/', { replace: true });
    } else {
      form.setError('root', { message: result.error ?? 'Invalid email or password.' });
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
        style={{ background: 'radial-gradient(circle at top right, #1E3A8A 0%, #0B132B 60%, #030712 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 shadow-lg shadow-blue-950/50">
            <span className="font-heading text-xl font-extrabold">N</span>
          </div>
          <div className="leading-tight">
            <p className="font-heading text-base font-bold">NPST Shared Services</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-sky-300/80">Admin Portal</p>
          </div>
        </div>

        <div className="max-w-lg space-y-8">
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight">
            One control plane for every NPST application
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Centrally administer UI branding, notifications and reminders for Keka HR, SkillUp Lounge, NPST Finance,
            Deal Pulse and every internal application that consumes NPST Shared Services.
          </p>
          <div className="space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <feature.icon className="size-[18px] text-sky-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="text-xs text-slate-400">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8 border-t border-white/10 pt-6">
          {[
            { value: '4+', label: 'Apps integrated' },
            { value: '5,410', label: 'Employees reached' },
            { value: '99.9%', label: 'Delivery uptime' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-heading text-xl font-bold text-sky-300">{stat.value}</p>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <div className="flex items-center justify-center bg-[#F8FAFC] p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mx-auto grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-md lg:mx-0">
              <ShieldCheck className="size-6" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Portal Sign In</h2>
            <p className="text-sm text-muted-foreground">
              Authenticate to administer branding, notifications and reminders across NPST applications.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-800">
            <span className="flex items-center gap-2">
              <KeyRound className="size-3.5 shrink-0" />
              <span>
                Demo: <span className="font-semibold">admin@npst.com</span> / <span className="font-semibold">Admin@123</span>
                <span className="ml-2 text-blue-700">Maker: maker@npst.com / Maker@123 · Checker: checker@npst.com / Checker@123</span>
              </span>
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
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@npst.com"
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
