import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Palette,
  ShieldCheck,
} from '@/components/icons';
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
import styles from './Login.module.css';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

const FEATURES = [
  {
    icon: Palette,
    title: 'Centralized UI Branding',
    text: 'Theme every integrated app from one console',
  },
  {
    icon: Bell,
    title: 'Unified Notifications',
    text: 'Templates, rules and delivery for all channels',
  },
  {
    icon: Clock,
    title: 'Smart Reminders',
    text: 'Schedules and escalations that chase themselves',
  },
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
      form.setError('root', {
        message: result.error ?? 'Invalid email or password.',
      });
    }
  };

  return (
    <div className={styles.div}>
      {/* Brand panel */}
      <div className={`${styles.div2} ${styles.brandPanel}`}>
        {/* The original showed an "N" logo mark here; the portal shows no logo. */}
        <div className={styles.div3}>
          <div className={styles.div5}>
            <p className={styles.p}>NPST Shared Services</p>
            <p className={styles.p2}>Admin Portal</p>
          </div>
        </div>

        <div className={styles.div6}>
          <h1 className={styles.h1}>
            One control plane for every NPST application
          </h1>
          <p className={styles.p3}>
            Centrally administer UI branding, notifications and reminders for
            Keka HR, SkillUp Lounge, NPST Finance, Deal Pulse and every internal
            application that consumes NPST Shared Services.
          </p>
          <div className={styles.div7}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className={styles.div8}>
                <div className={`${styles.div9} npst-sized`}>
                  <feature.icon
                    className={`${styles.featureicon} npst-sized`}
                  />
                </div>
                <div>
                  <p className={styles.p4}>{feature.title}</p>
                  <p className={styles.p5}>{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.div10}>
          {[
            { value: '4+', label: 'Apps integrated' },
            { value: '5,410', label: 'Employees reached' },
            { value: '99.9%', label: 'Delivery uptime' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className={styles.p6}>{stat.value}</p>
              <p className={styles.p7}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <div className={styles.div11}>
        <div className={styles.div12}>
          <div className={styles.div13}>
            <div className={`${styles.div14} npst-sized`}>
              <ShieldCheck className={`${styles.shieldCheck} npst-sized`} />
            </div>
            <h2 className={styles.h2}>Portal Sign In</h2>
            <p className={styles.p8}>
              Authenticate to administer branding, notifications and reminders
              across NPST applications.
            </p>
          </div>

          <div className={styles.div15}>
            <span className={styles.span2}>
              <KeyRound className={`${styles.keyRound} npst-sized`} />
              <span>
                Demo: <span className={styles.span3}>admin@npst.com</span> /{' '}
                <span className={styles.span3}>Admin@123</span>
                <span className={styles.span4}>
                  Maker: maker@npst.com / Maker@123 · Checker: checker@npst.com
                  / Checker@123
                </span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                form.setValue('email', 'admin@npst.com');
                form.setValue('password', 'Admin@123');
              }}
              className={styles.button}
              data-testid="login-fill-demo-button"
            >
              Fill
            </button>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={styles.div7}
            noValidate
            data-testid="login-form"
          >
            {form.formState.errors.root && (
              <div
                className={styles.div16}
                role="alert"
                data-testid="login-error-alert"
              >
                <AlertTriangle
                  className={`${styles.alertTriangle} npst-sized`}
                />
                {form.formState.errors.root.message}
              </div>
            )}

            <div className={styles.div17}>
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
                <p className={styles.p9} data-testid="login-email-error">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className={styles.div17}>
              <div className={styles.div18}>
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className={styles.button2}
                  data-testid="login-forgot-button"
                >
                  Forgot password?
                </button>
              </div>
              <div className={styles.div19}>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={styles.input}
                  {...form.register('password')}
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className={styles.button3}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  data-testid="login-password-toggle"
                >
                  {showPassword ? (
                    <EyeOff className={`${styles.eyeOff} npst-sized`} />
                  ) : (
                    <Eye className={`${styles.eyeOff} npst-sized`} />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className={styles.p9} data-testid="login-password-error">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Controller
              control={form.control}
              name="remember"
              render={({ field }) => (
                <label className={styles.label}>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    data-testid="login-remember-checkbox"
                  />
                  Remember me on this device
                </label>
              )}
            />

            <Button
              type="submit"
              className={styles.button4}
              size="lg"
              disabled={form.formState.isSubmitting}
              data-testid="login-submit-button"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className={`${styles.loader2} npst-sized`} /> Signing
                  in…
                </>
              ) : (
                <>
                  Sign in to portal{' '}
                  <ArrowRight className={`${styles.eyeOff} npst-sized`} />
                </>
              )}
            </Button>

            <p className={styles.p10}>
              Protected by NPST SSO · Unauthorized access is logged and audited
            </p>
          </form>
        </div>
      </div>

      {/* Forgot password dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your administrator email and we will simulate sending a
              reset link.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.div17}>
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
            <Button
              variant="outline"
              onClick={() => setForgotOpen(false)}
              data-testid="forgot-cancel-button"
            >
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
