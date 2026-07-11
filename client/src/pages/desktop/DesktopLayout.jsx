// client/src/pages/desktop/DesktopLayout.jsx
import { useContext, useState } from 'react';
import { RoleContext } from '../../context/RoleContext';
import TaskList from '../../components/desktop/TaskList';
import TaskForm from '../../components/desktop/TaskForm'; // <--- Import Form
import EvaluationBoard from '../../components/desktop/EvaluationBoard'; // <--- Import component mới

const DesktopLayout = () => {
  const { role, toggleRole } = useContext(RoleContext);
  
  // Biến này đóng vai trò như một "còi báo hiệu". Mỗi khi nó tăng lên, Bảng Task sẽ load lại
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>💻 Môi trường làm việc (Desktop)</h1>
          <p>Bạn đang ở chế độ: {role.toUpperCase()}</p>
        </div>
        <button onClick={toggleRole} style={{ padding: '10px', cursor: 'pointer' }}>
          🔄 CHUYỂN SANG {role === 'mentor' ? 'SINH VIÊN' : 'MENTOR'}
        </button>
      </header>

      {/* Form giao việc: truyền function triggerRefresh vào */}
      <TaskForm onTaskCreated={triggerRefresh} />

      {/* Bảng công việc: truyền refreshKey vào để nó biết khi nào cần fetch lại data */}
      <TaskList refreshKey={refreshKey} />

      {/* Đặt Bảng đánh giá ở cuối trang */}
      <EvaluationBoard />
    </div>
  );
};

export default DesktopLayout;