import { Button, Dialog, Progress } from '../../components/ui';

export function RewardDialog({ reward, onClose, onNext }) {
  return (
    <Dialog open={Boolean(reward)} title="Một bước tiến thật đẹp" onClose={onClose} sheet>
      {reward && <div className="reward-content">
        <div className="reward-xp">+{reward.xpAwarded} XP</div>
        <p>{reward.isLate ? 'Bạn đã quay lại và hoàn tất nhiệm vụ trễ.' : 'Bạn hoàn thành đúng hạn. Nhịp học đang rất tốt.'}</p>
        <div className="stack">
          <div><div className="metric-line"><span>Level {reward.level?.current || 1}</span><strong>{reward.level?.xpIntoLevel || 0}/{reward.level?.xpForNext || 200} XP</strong></div><Progress value={reward.level?.xpIntoLevel || 0} max={reward.level?.xpForNext || 200} label="Tiến độ level" /></div>
          {reward.week && <div><div className="metric-line"><span>Mục tiêu tuần</span><strong>{reward.week.earnedXp}/{reward.week.targetXp} XP</strong></div><Progress value={reward.week.earnedXp} max={reward.week.targetXp} label="Tiến độ tuần" /></div>}
        </div>
        {reward.achievements?.length > 0 && <div className="achievement-callout">Huy hiệu mới: <strong>{reward.achievements.map((item) => item.title).join(', ')}</strong></div>}
        <div className="reward-actions"><Button variant="secondary" onClick={onClose}>Ở lại</Button>{reward.nextTask && <Button onClick={onNext}>Nhiệm vụ tiếp theo</Button>}</div>
      </div>}
    </Dialog>
  );
}
