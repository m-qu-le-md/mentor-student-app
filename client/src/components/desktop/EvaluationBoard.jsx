// client/src/components/desktop/EvaluationBoard.jsx
import { useEffect, useState, useContext } from 'react';
import axiosClient from '../../api/axiosClient';
import { RoleContext } from '../../context/RoleContext';

const EvaluationBoard = () => {
  const { role } = useContext(RoleContext);
  const [evaluations, setEvaluations] = useState([]);
  
  // State cho Form
  const [rating, setRating] = useState(3);
  const [feedback, setFeedback] = useState('');

  const fetchEvaluations = async () => {
    try {
      const response = await axiosClient.get('/evaluations');
      setEvaluations(response.data);
    } catch (error) {
      console.error('Lỗi tải đánh giá:', error);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Tự động tính thứ 2 và chủ nhật của tuần hiện tại
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 7));

    try {
      await axiosClient.post('/evaluations', {
        weekStart,
        weekEnd,
        mentorRating: rating,
        mentorFeedback: feedback
      });
      setFeedback('');
      setRating(3);
      fetchEvaluations(); // Tải lại danh sách
    } catch (error) {
      alert('Lỗi gửi đánh giá: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
      
      {/* CỘT TRÁI: Form đánh giá (CHỈ HIỂN THỊ KHI LÀ MENTOR) */}
      {role === 'mentor' && (
        <div style={{ flex: 1, backgroundColor: '#2c3e50', padding: '20px', borderRadius: '8px', color: 'white' }}>
          <h3>⚖️ Viết Phê Bình Tuần</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label>Chấm điểm hiệu suất (1-5 sao): </label>
              <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ padding: '5px' }}>
                {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} Sao</option>)}
              </select>
            </div>
            
            <textarea 
              rows="5"
              placeholder="VD: Tuần này làm test UWorld sai nhiều câu hỏi cơ bản, cần rà soát lại flashcard và tránh phân tâm..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', resize: 'vertical' }}
            />
            
            <button type="submit" style={{ padding: '10px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              Ghi nhận Đánh giá
            </button>
          </form>
        </div>
      )}

      {/* CỘT PHẢI: Lịch sử nhận xét (AI CŨNG XEM ĐƯỢC) */}
      <div style={{ flex: role === 'mentor' ? 1 : 2, backgroundColor: role === 'mentor' ? '#34495e' : '#fff', padding: '20px', borderRadius: '8px', color: role === 'mentor' ? 'white' : 'black', border: role === 'student' ? '1px solid #ccc' : 'none' }}>
        <h3>📜 Lời Nhận Xét Từ Mentor</h3>
        {evaluations.length === 0 ? (
          <p style={{ color: 'gray', fontStyle: 'italic' }}>Chưa có đánh giá nào.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
            {evaluations.map(ev => (
              <div key={ev._id} style={{ padding: '15px', backgroundColor: role === 'mentor' ? '#2c3e50' : '#f8f9fa', borderRadius: '8px', borderLeft: `5px solid ${ev.mentorRating >= 4 ? '#27ae60' : ev.mentorRating <= 2 ? '#e74c3c' : '#f1c40f'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>Tuần: {new Date(ev.weekStart).toLocaleDateString('vi-VN')} - {new Date(ev.weekEnd).toLocaleDateString('vi-VN')}</span>
                  <span>⭐ {ev.mentorRating}/5</span>
                </div>
                <p style={{ margin: 0, lineHeight: '1.5' }}>"{ev.mentorFeedback}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default EvaluationBoard;