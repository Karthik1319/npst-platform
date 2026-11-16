import { daysBetweenInclusive, dateFrom, minutesAgo } from '../dates';
import type { Random } from '../random';
import type {
  Employee,
  EmploymentStatus,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from '../types';
import {
  emailFor,
  ENGINEERS,
  FIRST_NAMES,
  HR_TEAM,
  LAST_NAMES,
  PROJECT_MANAGERS,
  SALES_MANAGER,
  SALES_TEAM,
  SOLUTIONS_TEAM,
} from './people';

const EMAIL_DOMAIN = 'npst.example';

interface Department {
  name: string;
  size: number;
  head: [string, string];
  /** Named people (and their designation) placed in this department. */
  named?: readonly (readonly [string, string])[];
  designations: readonly string[];
}

const DEPARTMENTS: Department[] = [
  {
    name: 'Engineering',
    size: 92,
    head: ['Ramesh Iyer', 'VP – Engineering'],
    named: [
      ...ENGINEERS.map((n) => [n, 'Senior Software Engineer'] as const),
      ['Arjun Malhotra', 'Software Engineer'],
    ],
    designations: [
      'Software Engineer',
      'Senior Software Engineer',
      'Tech Lead',
      'Associate Software Engineer',
      'Engineering Manager',
    ],
  },
  {
    name: 'Delivery',
    size: 34,
    head: ['Kavita Menon', 'Head of Delivery'],
    named: PROJECT_MANAGERS.map((n) => [n, 'Project Manager'] as const),
    designations: [
      'Project Manager',
      'Senior Project Manager',
      'Delivery Analyst',
      'Implementation Engineer',
    ],
  },
  {
    name: 'Solutions',
    size: 14,
    head: ['Rohan Deshmukh', 'Solutions Lead'],
    named: SOLUTIONS_TEAM.filter((n) => n !== 'Rohan Deshmukh').map(
      (n) => [n, 'Solutions Architect'] as const,
    ),
    designations: [
      'Solutions Architect',
      'Pre-sales Consultant',
      'Business Analyst',
    ],
  },
  {
    name: 'Product',
    size: 16,
    head: ['Shruti Bhatia', 'Head of Product'],
    designations: [
      'Product Manager',
      'Senior Product Manager',
      'UX Designer',
      'Product Analyst',
    ],
  },
  {
    name: 'Quality Assurance',
    size: 30,
    head: ['Venkat Raman', 'QA Manager'],
    designations: [
      'QA Engineer',
      'Senior QA Engineer',
      'Automation Engineer',
      'Performance Test Engineer',
    ],
  },
  {
    name: 'Sales',
    size: 18,
    head: [SALES_MANAGER, 'Sales Manager – West'],
    named: SALES_TEAM.map(
      (n) =>
        [
          n,
          n === 'Imran Shaikh' ? 'Key Account Manager' : 'Sales Executive',
        ] as const,
    ),
    designations: [
      'Sales Executive',
      'Senior Sales Executive',
      'Inside Sales Associate',
      'Key Account Manager',
    ],
  },
  {
    name: 'Customer Success',
    size: 22,
    head: ['Anil Kapoor', 'Head of Customer Success'],
    designations: [
      'Customer Success Manager',
      'Support Engineer',
      'Senior Support Engineer',
    ],
  },
  {
    name: 'Information Security',
    size: 9,
    head: ['Gautam Sethi', 'CISO'],
    designations: [
      'Security Analyst',
      'Security Engineer',
      'Compliance Analyst',
    ],
  },
  {
    name: 'Human Resources',
    size: 8,
    head: [HR_TEAM[0], 'HR Manager'],
    named: [[HR_TEAM[1], 'HR Business Partner']],
    designations: [
      'HR Executive',
      'Talent Acquisition Specialist',
      'HR Business Partner',
    ],
  },
  {
    name: 'Finance',
    size: 10,
    head: ['Sunita Rao', 'Finance Controller'],
    designations: ['Accountant', 'Senior Accountant', 'Finance Analyst'],
  },
  {
    name: 'Operations',
    size: 16,
    head: ['Mukesh Jain', 'Head of Operations'],
    designations: [
      'Operations Executive',
      'Reconciliation Analyst',
      'Settlement Analyst',
    ],
  },
  {
    name: 'Administration',
    size: 7,
    head: ['Farida Sheikh', 'Admin Manager'],
    designations: ['Admin Executive', 'Facilities Coordinator'],
  },
];

const LOCATIONS = [
  'Mumbai',
  'Mumbai',
  'Pune',
  'Bengaluru',
  'Navi Mumbai',
] as const;
const pad = (n: number) => String(n).padStart(2, '0');

export function seedEmployees(now: Date, random: Random): Employee[] {
  const employees: Employee[] = [];
  const usedNames = new Set<string>();
  let next = 1001;

  const add = (
    name: string,
    department: string,
    designation: string,
    manager: Employee | null,
    joinedDaysAgo: number,
  ): Employee => {
    usedNames.add(name);
    let status: EmploymentStatus = joinedDaysAgo < 180 ? 'Probation' : 'Active';
    if (status === 'Active' && random.chance(0.015)) status = 'Notice period';
    const employee: Employee = {
      id: `EMP-${next++}`,
      name,
      department,
      designation,
      managerId: manager?.id ?? null,
      managerName: manager?.name ?? null,
      status,
      type:
        designation.startsWith('Associate') && random.chance(0.4)
          ? 'Intern'
          : random.chance(0.06)
            ? 'Contract'
            : 'Full-time',
      joinDate: dateFrom(now, -joinedDaysAgo),
      birthday: `${pad(random.int(1, 12))}-${pad(random.int(1, 28))}`,
      email: emailFor(name, EMAIL_DOMAIN),
      phone: `+91 9${random.int(100, 999)} ${random.int(10000, 99999)}`,
      location: random.pick(LOCATIONS),
      workMode: random.pick([
        'Office',
        'Office',
        'Hybrid',
        'Hybrid',
        'Remote',
      ] as const),
    };
    employees.push(employee);
    return employee;
  };

  for (const department of DEPARTMENTS) {
    const head = add(
      department.head[0],
      department.name,
      department.head[1],
      null,
      random.int(1500, 3200),
    );
    const leads: Employee[] = [];
    for (const [name, designation] of department.named ?? []) {
      const joined = name === 'Arjun Malhotra' ? 1 : random.int(200, 2400);
      const employee = add(name, department.name, designation, head, joined);
      if (leads.length < 2 && designation !== 'Software Engineer')
        leads.push(employee);
    }
    while (
      employees.filter((e) => e.department === department.name).length <
      department.size
    ) {
      let name: string;
      do {
        name = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`;
      } while (usedNames.has(name));
      const manager =
        leads.length > 0 && random.chance(0.7) ? random.pick(leads) : head;
      add(
        name,
        department.name,
        random.pick(department.designations),
        manager,
        random.int(20, 2600),
      );
    }
  }
  // A few birthdays in the coming days, so the dashboard has something to celebrate.
  const today = new Date(now);
  [1, 3, 6, 9].forEach((offset, index) => {
    const employee = employees[(index + 1) * 37];
    if (!employee) return;
    const day = new Date(today);
    day.setDate(day.getDate() + offset);
    employee.birthday = `${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
  });
  return employees;
}

const REASONS: Record<LeaveType, readonly string[]> = {
  'Casual leave': [
    'Family function',
    'Personal work',
    'Travelling to hometown',
    'House shifting',
  ],
  'Sick leave': [
    'Fever and doctor’s advice to rest',
    'Medical appointment',
    'Recovering from a minor surgery',
  ],
  'Earned leave': [
    'Family vacation',
    'Wedding in the family',
    'Planned holiday',
  ],
  'Comp off': [
    'Worked on the weekend for the PRJ-218 cut-over',
    'Production support on a holiday',
  ],
};

export function seedLeaveRequests(
  now: Date,
  random: Random,
  employees: readonly Employee[],
): LeaveRequest[] {
  const plan: [LeaveStatus, 'today' | 'past' | 'future'][] = [
    ...Array<[LeaveStatus, 'future']>(7).fill(['Pending', 'future']),
    ...Array<[LeaveStatus, 'today']>(12).fill(['Approved', 'today']),
    ...Array<[LeaveStatus, 'past']>(12).fill(['Approved', 'past']),
    ...Array<[LeaveStatus, 'future']>(6).fill(['Approved', 'future']),
    ...Array<[LeaveStatus, 'past']>(4).fill(['Rejected', 'past']),
  ];
  const staff = employees.filter((e) => e.managerId !== null);
  const used = new Set<string>();
  return plan
    .map(([status, when], index): LeaveRequest => {
      let employee = random.pick(staff);
      while (used.has(employee.id)) employee = random.pick(staff);
      used.add(employee.id);
      const type = random.pick([
        'Casual leave',
        'Casual leave',
        'Sick leave',
        'Earned leave',
        'Comp off',
      ] as const);
      const days =
        type === 'Earned leave' ? random.int(3, 6) : random.int(1, 2);
      const start =
        when === 'today'
          ? -random.int(0, days - 1)
          : when === 'past'
            ? -random.int(8, 60)
            : random.int(2, 25);
      const from = dateFrom(now, start);
      const to = dateFrom(now, start + days - 1);
      const appliedDaysAgo =
        when === 'future'
          ? random.int(0, 4)
          : random.int(Math.max(1, -start + 2), -start + 12);
      return {
        id: `LR-${2201 + index}`,
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        type,
        from,
        to,
        days: daysBetweenInclusive(from, to),
        reason: random.pick(REASONS[type]),
        status,
        appliedAt: minutesAgo(
          now,
          appliedDaysAgo * 24 * 60 + random.int(30, 500),
        ),
        ...(status === 'Pending'
          ? {}
          : {
              decidedBy: employee.managerName ?? HR_TEAM[0],
              decidedAt: minutesAgo(
                now,
                Math.max(0, appliedDaysAgo - 1) * 24 * 60 + 60,
              ),
            }),
      };
    })
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}
