import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleProvider } from './RoleContext';
import { RoleGuard } from './AppRouter';

function renderGuard(required, initialPath) {
  return render(<RoleProvider><MemoryRouter initialEntries={[initialPath]}><Routes><Route path="/student/today" element={<div>Student Today</div>} /><Route path="/mentor/overview" element={<div>Mentor Overview</div>} /><Route path="/mentor/planning" element={<RoleGuard required={required}><div>Planning riêng</div></RoleGuard>} /></Routes></MemoryRouter></RoleProvider>);
}

describe('role guard Project 001', () => {
  beforeEach(() => sessionStorage.clear());
  it('phiên mới mặc định Student và chặn direct-link Mentor', async () => {
    renderGuard('mentor', '/mentor/planning');
    expect(await screen.findByText('Student Today')).toBeInTheDocument();
  });
  it('giữ direct-link Mentor khi role phiên hợp lệ', async () => {
    sessionStorage.setItem('studymed-role', 'mentor');
    renderGuard('mentor', '/mentor/planning');
    expect(await screen.findByText('Planning riêng')).toBeInTheDocument();
  });
});
