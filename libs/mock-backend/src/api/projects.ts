import { readData } from '../store';
import type { Milestone, Project, ProjectStatus } from '../types';
import { clone, matches, today } from './common';

export interface UpcomingMilestone extends Milestone {
  projectId: string;
  projectName: string;
  customerName: string;
}

export interface ResourceLoad {
  name: string;
  role: string;
  /** Sum of allocations across active projects, in percent. */
  allocation: number;
  projects: number;
}

export interface ProjectsSummary {
  active: number;
  onTrack: number;
  atRisk: number;
  delayed: number;
  onHold: number;
  completed: number;
  startedLast30Days: number;
  upcomingMilestones: UpcomingMilestone[];
  overdueMilestones: number;
  resources: ResourceLoad[];
}

export interface ProjectQuery {
  search?: string;
  status?: ProjectStatus | '';
  manager?: string;
}

const isActive = (p: Project) => p.status !== 'Completed';

/** Simulated Projects & Delivery backend (read side). */
export const projectsApi = {
  async summary(): Promise<ProjectsSummary> {
    const projects = readData().projects;
    const active = projects.filter(isActive);
    const count = (status: ProjectStatus) =>
      projects.filter((p) => p.status === status).length;
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const upcoming = active
      .flatMap((p) =>
        p.milestones
          .filter(
            (m) =>
              m.status === 'In progress' ||
              m.status === 'Upcoming' ||
              m.status === 'Overdue',
          )
          .slice(0, 1)
          .map((m) => ({
            ...m,
            projectId: p.id,
            projectName: p.name,
            customerName: p.customerName,
          })),
      )
      .sort((a, b) => a.due.localeCompare(b.due));

    const load = new Map<string, ResourceLoad>();
    for (const project of active) {
      for (const member of project.team) {
        const entry = load.get(member.name) ?? {
          name: member.name,
          role: member.role,
          allocation: 0,
          projects: 0,
        };
        entry.allocation += member.allocation;
        entry.projects += 1;
        load.set(member.name, entry);
      }
    }
    return clone({
      active: active.length,
      onTrack: count('On track'),
      atRisk: count('At risk'),
      delayed: count('Delayed'),
      onHold: count('On hold'),
      completed: count('Completed'),
      startedLast30Days: active.filter(
        (p) => new Date(`${p.startDate}T00:00:00`) >= monthAgo,
      ).length,
      upcomingMilestones: upcoming.filter((m) => m.due >= today()).slice(0, 6),
      overdueMilestones: upcoming.filter((m) => m.status === 'Overdue').length,
      resources: [...load.values()].sort((a, b) => b.allocation - a.allocation),
    });
  },

  async list(query: ProjectQuery = {}): Promise<Project[]> {
    return clone(
      readData().projects.filter(
        (p) =>
          matches(query.search, p.id, p.name, p.customerName, p.manager) &&
          (!query.status || p.status === query.status) &&
          (!query.manager || p.manager === query.manager),
      ),
    );
  },

  async get(id: string): Promise<Project | null> {
    const project = readData().projects.find((p) => p.id === id);
    return project ? clone(project) : null;
  },
};
