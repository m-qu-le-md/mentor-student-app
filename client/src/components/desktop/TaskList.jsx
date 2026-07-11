// client/src/components/desktop/TaskList.jsx
import { useEffect, useState, useContext } from 'react';
import axiosClient from '../../api/axiosClient';
import { RoleContext } from '../../context/RoleContext';

// 1. Nhận thêm prop refreshKey
const TaskList = ({ refreshKey }) => { 
  const [tasks, setTasks] = useState([]);
  const { role } = useContext(RoleContext);

  const fetchTasks = async () => {
    try {
      const response = await axiosClient.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    }
  };

  // 2. Thêm refreshKey vào mảng dependency
  // Mỗi khi refreshKey thay đổi giá trị, useEffect này sẽ tự động chạy lại
  useEffect(() => {
    fetchTasks();
  }, [refreshKey]); 

  const handleComplete = async (id) => {
    try {
      await axiosClient.put(`/tasks/${id}/complete`);
      fetchTasks(); 
    } catch (error) {
      alert('Lỗi: ' + error.response?.data?.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      alert('HỆ THỐNG CẢNH BÁO: ' + error.response?.data?.message);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h2>📋 Bảng Công Việc Chuyên Môn</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Nhiệm vụ</th>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Deadline</th>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Trạng thái</th>
            <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #ddd' }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Chưa có nhiệm vụ nào. Chuyển sang Mentor để giao việc!</td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{task.title}</td>
                <td style={{ padding: '10px' }}>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</td>
                <td style={{ padding: '10px' }}>
                  {task.status === 'completed' ? '🟢 Hoàn thành' : '🔴 Đang chờ'}
                </td>
                <td style={{ padding: '10px' }}>
                  {task.status !== 'completed' && (
                    <button onClick={() => handleComplete(task._id)} style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}>
                      ✅ Hoàn thành
                    </button>
                  )}
                  
                  {role === 'mentor' && (
                    <button onClick={() => handleDelete(task._id)} style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', marginLeft: '10px' }}>
                      🗑️ Xóa
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaskList;