import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Bell } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { connectToasts, toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { cva } from '@/lib/variants';

afterEach(cleanup);

describe('helpers', () => {
  it('cn joins classes and skips empty values', () => {
    expect(cn('a', false, null, undefined, ['b', ['c']], 0, 'd')).toBe(
      'a b c d',
    );
  });

  it('cva adds the base class, the chosen (or default) variants and extra classes', () => {
    const variants = cva('base', {
      variants: {
        tone: { info: 'info', warn: 'warn' },
        size: { sm: 'sm', lg: 'lg' },
      },
      defaultVariants: { tone: 'info', size: 'sm' },
    });
    expect(variants()).toBe('base info sm');
    expect(variants({ tone: 'warn', className: 'extra' })).toBe(
      'base warn sm extra',
    );
  });

  it('toast sends messages through the platform notification service', () => {
    const notify = { toast: vi.fn() };
    connectToasts(notify as never);
    toast.success('Saved');
    toast.error('Failed', { description: 'Try again' });
    expect(notify.toast).toHaveBeenNthCalledWith(1, 'Saved', {
      kind: 'success',
    });
    expect(notify.toast).toHaveBeenNthCalledWith(2, 'Failed: Try again', {
      kind: 'error',
    });
    connectToasts(null);
  });
});

describe('icons', () => {
  it('render like lucide-react (same SVG attributes and class names)', () => {
    const { container } = render(<Bell className="extra" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toBe('lucide lucide-bell extra');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('stroke-width')).toBe('2');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});

describe('Button', () => {
  it('is a button by default and can render onto another element', () => {
    render(
      <>
        <Button>Save</Button>
        <Button render={<a href="/x" />} variant="outline">
          Link
        </Button>
      </>,
    );
    expect(
      screen.getByRole('button', { name: 'Save' }).getAttribute('type'),
    ).toBe('button');
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link.getAttribute('href')).toBe('/x');
    expect(link.getAttribute('data-slot')).toBe('button');
  });
});

describe('Dialog', () => {
  it('opens from its trigger, closes on Escape, and supports controlled state', () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open controlled</button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Controlled</DialogTitle>
            </DialogContent>
          </Dialog>
        </>
      );
    }
    render(
      <>
        <Dialog>
          <DialogTrigger render={<Button />}>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Hello</DialogTitle>
          </DialogContent>
        </Dialog>
        <Controlled />
      </>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Hello' });
    expect(dialog.hasAttribute('data-open')).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open controlled' }));
    expect(screen.getByRole('dialog', { name: 'Controlled' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Select', () => {
  it('shows the selected value and reports changes', () => {
    const onValueChange = vi.fn();
    render(
      <Select defaultValue="Asia/Kolkata" onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
          <SelectItem value="UTC">UTC</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger.textContent).toBe('Asia/Kolkata');
    fireEvent.click(trigger);
    expect(
      screen
        .getByRole('option', { name: 'Asia/Kolkata' })
        .getAttribute('aria-selected'),
    ).toBe('true');
    fireEvent.click(screen.getByRole('option', { name: 'UTC' }));
    expect(onValueChange).toHaveBeenCalledWith('UTC');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger.textContent).toBe('UTC');
  });
});

describe('DropdownMenu', () => {
  it('opens from its trigger, runs the item action and closes', () => {
    const onSignOut = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" />}>
          Account
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onSignOut} variant="destructive">
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole('button', { name: 'Account' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on a click outside', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('menu')).toBeTruthy();
    act(() => {
      document.body.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true }),
      );
    });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('Checkbox and Tabs', () => {
  it('Checkbox toggles and exposes data-checked for its styles', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="2FA" onCheckedChange={onCheckedChange} />);
    const box = screen.getByRole('checkbox', { name: '2FA' });
    expect(box.hasAttribute('data-checked')).toBe(false);
    fireEvent.click(box);
    expect(box.hasAttribute('data-checked')).toBe(true);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('Tabs show one panel at a time and mark the active tab', () => {
    render(
      <Tabs defaultValue="theme">
        <TabsList>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>
        <TabsContent value="theme">Theme panel</TabsContent>
        <TabsContent value="assets">Assets panel</TabsContent>
      </Tabs>,
    );
    expect(
      screen.getByRole('tab', { name: 'Theme' }).hasAttribute('data-active'),
    ).toBe(true);
    expect(screen.getByRole('tabpanel').textContent).toBe('Theme panel');
    fireEvent.click(screen.getByRole('tab', { name: 'Assets' }));
    expect(
      screen.getByRole('tab', { name: 'Assets' }).hasAttribute('data-active'),
    ).toBe(true);
    expect(screen.getByRole('tabpanel').textContent).toBe('Assets panel');
  });
});
