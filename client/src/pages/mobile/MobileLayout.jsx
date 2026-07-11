// client/src/pages/mobile/MobileLayout.jsx
import { useContext } from 'react';
import { RoleContext } from '../../context/RoleContext';
import MobileTaskList from '../../components/mobile/MobileTaskList';

const MobileLayout = () => {
  const { role, toggleRole } = useContext(RoleContext);

  return (
    <div>
      
      {/* Thanh Header dính chặt ở trên cùng (Sticky Header) */}
      <header>
        <div>
          {role === 'mentor' ? '👨‍🏫 Mentor' : '👨‍🎓 Sinh viên'}
        </div>
        
        <button onClick={toggleRole}>
          🔄 Đổi
        </button>
      </header>

      {/* Khu vực chứa nội dung cuộn */}
      <main>
        {role === 'mentor' ? 'Lưu ý: Điện thoại chỉ dùng để kiểm tra tiến độ nhanh.' : 'Đừng lướt điện thoại nữa, làm bài đi!'}        
        <MobileTaskList />
      </main>

    </div>
  );
};

export default MobileLayout;