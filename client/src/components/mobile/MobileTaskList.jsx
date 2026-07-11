// client/src/components/mobile/MobileTaskList.jsx
import { useEffect, useState, useContext } from 'react';
import axiosClient from '../../api/axiosClient';
import { RoleContext } from '../../context/RoleContext';

const MobileTaskList = () => {
  const [tasks, setTasks] = useState([]);
  const { role } = useContext(RoleContext);

  const fetchTasks = async () => {
    try {
      const response = await axiosClient.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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
    <div>
      {tasks.length === 0 ? (
        <div>
          Chưa có nhiệm vụ. Tốt nhất là mở máy tính lên để Mentor giao việc!
        </div>
      ) : (
        tasks.map((task) => (
          <div key={task._id}>
            {task.title}
            ⏳ Hạn cuối: {new Date(task.dueDate).toLocaleDateString('vi-VN')}            

            <div>
              {task.status !== 'completed' ? (
                <button onClick={() => handleComplete(task._id)}
                  style={{ 
                    flex: 1, // Nút tự động giãn tràn chiều ngang
                    padding: '12px', 
                    backgroundColor: '#27ae60', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ Đã Xong
                </button>
              ) : (
                <div>
                  🎉 Đã Hoàn Thành
                </div>
              )}

              {/* Nút Xóa chỉ hiện cho Mentor, kích thước nhỏ hơn một chút để tránh bấm nhầm */}
              {role === 'mentor' && task.status !== 'completed' && (
                <button onClick={() => handleDelete(task._id)}
                  style={{ 
                    padding: '12px 20px', 
                    backgroundColor: '#e74c3c', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px' 
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MobileTaskList;