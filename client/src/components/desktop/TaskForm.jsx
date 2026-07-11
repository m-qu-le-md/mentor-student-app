// client/src/components/desktop/TaskForm.jsx
import { useState, useContext } from 'react';
import axiosClient from '../../api/axiosClient';
import { RoleContext } from '../../context/RoleContext';

const TaskForm = ({ onTaskCreated }) => {
  const { role } = useContext(RoleContext);
  
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [difficulty, setDifficulty] = useState(3);

  // Nếu không phải Mentor, ẩn hoàn toàn form này
  if (role !== 'mentor') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Bắn API lên backend
      await axiosClient.post('/tasks', {
        title,
        dueDate,
        difficulty: Number(difficulty)
      });

      // Reset form sau khi thành công
      setTitle('');
      setDueDate('');
      setDifficulty(3);

      // Báo cho Layout biết để load lại bảng Task
      if (onTaskCreated) onTaskCreated();
      
    } catch (error) {
      alert('Lỗi tạo nhiệm vụ: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <h3 style={{ margin: 0 }}>✍️ Bảng Lên Kế Hoạch</h3>
      <input 
        type="text" 
        placeholder="Tên công việc..." 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        style={{ flex: 2, padding: '10px', borderRadius: '4px', border: 'none' }}
      />
      <input 
        type="date" 
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        required
        style={{ flex: 1, padding: '10px', borderRadius: '4px', border: 'none' }}
      />
      <select 
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        style={{ flex: 0.5, padding: '10px', borderRadius: '4px', border: 'none' }}
      >
        <option value={1}>Độ khó: 1</option>
        <option value={2}>Độ khó: 2</option>
        <option value={3}>Độ khó: 3</option>
        <option value={4}>Độ khó: 4</option>
        <option value={5}>Độ khó: 5</option>
      </select>
      <button type="submit" style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', backgroundColor: '#3498db', color: 'white', cursor: 'pointer' }}>
        🚀 Giao Việc
      </button>
    </form>
  );
};

export default TaskForm;