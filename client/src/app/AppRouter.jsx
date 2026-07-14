import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useRole } from './RoleContext';
import { AppShell } from '../layouts/AppShell';
import { StudentToday } from '../features/tasks/StudentToday';
import { StudentTasks } from '../features/tasks/StudentTasks';
import { TaskForm } from '../features/tasks/TaskForm';
import { MentorTaskDetail } from '../features/tasks/MentorTaskDetail';
import { MentorOverview } from '../features/mentor/MentorOverview';
import { PlanningBoard } from '../features/planning/PlanningBoard';
import { ProgressPage } from '../features/progress/ProgressPage';
import { Journey } from '../features/gamification/Journey';
import { ReflectionsPage } from '../features/reflections/ReflectionsPage';
import { NewReflection } from '../features/reflections/NewReflection';
import { EmptyState } from '../components/ui';

export function RoleGuard({ required, children }) {
  const { role } = useRole();
  if (role !== required) return <Navigate to={role === 'mentor' ? '/mentor/overview' : '/student/today'} replace />;
  return children;
}

function HomeRedirect() {
  const { role } = useRole();
  return <Navigate to={role === 'mentor' ? '/mentor/overview' : '/student/today'} replace />;
}

function NotFound() {
  const location = useLocation();
  return <main className="page"><EmptyState title="Không tìm thấy màn hình" description={`Route ${location.pathname} không tồn tại trong Project 001.`} /></main>;
}

export function AppRouter() {
  return <BrowserRouter><Routes><Route element={<AppShell />}><Route index element={<HomeRedirect />} />
    <Route path="student" element={<RoleGuard required="student"><RoutesOutlet /></RoleGuard>}>
      <Route index element={<Navigate to="today" replace />} />
      <Route path="today" element={<StudentToday />} />
      <Route path="tasks" element={<StudentTasks />} />
      <Route path="tasks/:taskId" element={<StudentTasks />} />
      <Route path="journey" element={<Journey />} />
      <Route path="reflections" element={<ReflectionsPage />} />
      <Route path="reflections/:evaluationId" element={<ReflectionsPage />} />
    </Route>
    <Route path="mentor" element={<RoleGuard required="mentor"><RoutesOutlet /></RoleGuard>}>
      <Route index element={<Navigate to="overview" replace />} />
      <Route path="overview" element={<MentorOverview />} />
      <Route path="planning" element={<PlanningBoard />} />
      <Route path="tasks/new" element={<TaskForm />} />
      <Route path="tasks/:taskId" element={<MentorTaskDetail />} />
      <Route path="tasks/:taskId/edit" element={<TaskForm />} />
      <Route path="progress" element={<ProgressPage />} />
      <Route path="reflections" element={<ReflectionsPage />} />
      <Route path="reflections/new" element={<NewReflection />} />
      <Route path="reflections/:evaluationId" element={<ReflectionsPage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Route></Routes></BrowserRouter>;
}

function RoutesOutlet() {
  return <Outlet />;
}
