import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, Sparkles, Settings2, Minus, Plus, Check, Shield, Crown, Info, Mic } from 'lucide-react';
import { 
  ROLES, 
  generateRecommendedBoard, 
  getBoardDescription, 
  shouldEnableSheriffDefault,
  ROLE_CATEGORIES 
} from '@/lib/gameConfig';
import type { RoleConfig, RoleType, WinMode } from '@/types';

interface CreateRoomSectionProps {
  onBack: () => void;
  onCreate: (hostName: string, playerCount: number, roles: RoleConfig[], enableSheriff: boolean, winMode: WinMode, enableAutoJudge: boolean) => void;
}

const ALL_ROLES: RoleType[] = [
  // 好人阵营 - 神职
  'seer', 'witch', 'hunter', 'idiot', 'guard', 'elder', 'knight',
  'gravedigger', 'crow', 'magician', 'dreamer', 'demonhunter', 
  'muter', 'miracle', 'pure', 'prince', 'count', 'alchemist',
  // 好人阵营 - 平民
  'villager', 'hooligan',
  // 狼人阵营
  'werewolf', 'whitewolf', 'wolfgun', 'wolfbeauty', 'gargoyle',
  'hiddenwolf', 'ghostknight', 'bloodmoon', 'nightmare', 
  'wolfwitch', 'redmoon',
  // 第三方阵营
  'cupid', 'admirer'
];

export function CreateRoomSection({ onBack, onCreate }: CreateRoomSectionProps) {
  const [hostName, setHostName] = useState('');
  const [playerCount, setPlayerCount] = useState(12);
  const [winMode, setWinMode] = useState<WinMode>('side');
  const [enableSheriff, setEnableSheriff] = useState(true);
  const [enableAutoJudge, setEnableAutoJudge] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customRoles, setCustomRoles] = useState<RoleConfig[]>([]);

  // 根据人数自动生成推荐板子
  const recommendedRoles = useMemo(() => {
    return generateRecommendedBoard(playerCount, winMode);
  }, [playerCount, winMode]);

  // 当前使用的角色配置
  const currentRoles = isCustom ? customRoles : recommendedRoles;

  // 当人数变化时，更新警长默认值和推荐板子
  useEffect(() => {
    if (!isCustom) {
      setEnableSheriff(shouldEnableSheriffDefault(playerCount));
    }
  }, [playerCount, isCustom]);

  // 切换到自定义模式
  const handleCustomClick = () => {
    setIsCustom(true);
    setCustomRoles([...recommendedRoles]);
  };

  // 切换回自动推荐
  const handleAutoClick = () => {
    setIsCustom(false);
  };

  // 更新角色数量
  const updateRoleCount = (roleType: RoleType, delta: number) => {
    setCustomRoles(prev => {
      const existing = prev.find(r => r.type === roleType);
      if (existing) {
        const newCount = Math.max(0, existing.count + delta);
        if (newCount === 0) {
          return prev.filter(r => r.type !== roleType);
        }
        return prev.map(r => 
          r.type === roleType 
            ? { ...r, count: newCount }
            : r
        );
      } else if (delta > 0) {
        return [...prev, { type: roleType, name: ROLES[roleType].name, count: 1 }];
      }
      return prev;
    });
  };

  const getRoleCount = (roleType: RoleType): number => {
    return currentRoles.find(r => r.type === roleType)?.count || 0;
  };

  const getTotalRoles = () => {
    return currentRoles.reduce((sum, r) => sum + r.count, 0);
  };

  // 统计阵营
  const getTeamStats = () => {
    let gods = 0, villagers = 0, werewolves = 0;
    currentRoles.forEach(role => {
      const category = ROLE_CATEGORIES[role.type];
      if (category === 'werewolf') werewolves += role.count;
      else if (category === 'god') gods += role.count;
      else if (category === 'villager') villagers += role.count;
    });
    return { gods, villagers, werewolves, total: gods + villagers + werewolves };
  };

  const handleCreate = () => {
    if (!hostName.trim()) return;
    const rolesToUse = currentRoles.filter(r => r.count > 0);
    onCreate(hostName.trim(), playerCount, rolesToUse, enableSheriff, winMode, enableAutoJudge);
  };

  const stats = getTeamStats();
  const isValid = hostName.trim() && getTotalRoles() === playerCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 头部 */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-800">
        <button 
          onClick={onBack} 
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">创建房间</h1>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6 pb-40">
        {/* 法官名字 */}
        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium">法官名字</label>
          <input
            type="text"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            placeholder="请输入你的名字（法官不参游戏）"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-slate-500 text-xs">法官负责主持游戏，不计入玩家人数</p>
        </div>

        {/* 玩家人数 */}
        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            玩家人数 <span className="text-slate-500">（不含法官）</span>
          </label>
          <div className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-3">
            <button
              onClick={() => setPlayerCount(Math.max(6, playerCount - 1))}
              className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-white flex-1 text-center">{playerCount}</span>
            <button
              onClick={() => setPlayerCount(Math.min(18, playerCount + 1))}
              className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-slate-400 text-sm">人</span>
          </div>
        </div>

        {/* 胜负模式 */}
        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            胜负模式
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setWinMode('side')}
              className={`p-4 rounded-xl border transition-all text-left ${
                winMode === 'side'
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-500/50 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
              }`}
            >
              <div className="font-medium mb-1">屠边模式</div>
              <div className="text-xs opacity-70">狼人杀死所有神职或所有平民即获胜</div>
            </button>
            <button
              onClick={() => setWinMode('city')}
              className={`p-4 rounded-xl border transition-all text-left ${
                winMode === 'city'
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-500/50 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
              }`}
            >
              <div className="font-medium mb-1">屠城模式</div>
              <div className="text-xs opacity-70">狼人杀死所有好人（神职+平民）才获胜</div>
            </button>
          </div>
        </div>

        {/* 电子法官 */}
        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Mic className="w-4 h-4" />
            电子法官 <span className="text-xs text-indigo-400">(实验功能)</span>
          </label>
          <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4">
            <div>
              <div className="text-white font-medium">{enableAutoJudge ? '启用电子法官' : '不启用'}</div>
              <div className="text-slate-500 text-xs">
                自动语音播报夜晚流程，法官可作为玩家加入
              </div>
            </div>
            <button
              onClick={() => setEnableAutoJudge(!enableAutoJudge)}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                enableAutoJudge ? 'bg-indigo-600' : 'bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                enableAutoJudge ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* 警长竞选 */}
        <div className="space-y-2">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Crown className="w-4 h-4" />
            警长竞选
          </label>
          <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4">
            <div>
              <div className="text-white font-medium">{enableSheriff ? '开启警长' : '不开启警长'}</div>
              <div className="text-slate-500 text-xs">
                {playerCount >= 8 ? '8人以上建议开启' : '8人以下建议关闭'}
              </div>
            </div>
            <button
              onClick={() => setEnableSheriff(!enableSheriff)}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                enableSheriff ? 'bg-purple-600' : 'bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                enableSheriff ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* 板子配置 */}
        <div className="space-y-3">
          <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            板子配置
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAutoClick}
              className={`h-12 text-sm font-medium rounded-xl transition-all ${
                !isCustom
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              自动推荐
            </button>
            <button
              onClick={handleCustomClick}
              className={`h-12 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1 ${
                isCustom
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              自定义
            </button>
          </div>
          
          {/* 自动推荐说明 */}
          {!isCustom && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-purple-300 font-medium">推荐板子：{getBoardDescription(recommendedRoles)}</span>
                  <p className="text-slate-400 text-xs mt-1">
                    根据{playerCount}人{winMode === 'side' ? '屠边' : '屠城'}模式自动配置
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 角色配置 */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <label className="text-slate-300 text-sm font-medium">角色配置</label>
            <span className={`text-sm font-medium ${getTotalRoles() === playerCount ? 'text-green-400' : 'text-yellow-400'}`}>
              {getTotalRoles()}/{playerCount} 人
            </span>
          </div>
          
          {/* 阵营统计 */}
          <div className="flex gap-4 mb-4 pb-4 border-b border-slate-700/50">
            <div className="text-center">
              <div className="text-blue-400 font-bold">{stats.gods}</div>
              <div className="text-slate-500 text-xs">神职</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold">{stats.villagers}</div>
              <div className="text-slate-500 text-xs">平民</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-bold">{stats.werewolves}</div>
              <div className="text-slate-500 text-xs">狼人</div>
            </div>
          </div>

          <div className="space-y-2">
            {ALL_ROLES.map(roleType => {
              const role = ROLES[roleType];
              const team = role.team;
              const count = getRoleCount(roleType);
              const colorClass = team === 'good' ? 'text-blue-400' : team === 'evil' ? 'text-red-400' : 'text-gray-400';
              
              return (
                <div key={roleType} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{role.icon}</span>
                    <span className={`${colorClass} font-medium`}>{role.name}</span>
                    <span className="text-slate-500 text-xs">{role.ability}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateRoleCount(roleType, -1)}
                      disabled={!isCustom || count <= 0}
                      className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={`w-6 text-center font-medium ${count > 0 ? 'text-white' : 'text-slate-600'}`}>
                      {count}
                    </span>
                    <button
                      onClick={() => updateRoleCount(roleType, 1)}
                      disabled={!isCustom}
                      className="w-8 h-8 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 角色预览 */}
        <div className="bg-slate-800/30 rounded-xl p-4">
          <h3 className="text-slate-400 text-sm mb-3">角色预览</h3>
          <div className="flex flex-wrap gap-2">
            {currentRoles.map((role) => (
              Array(role.count).fill(null).map((_, i) => {
                const roleInfo = ROLES[role.type];
                const team = roleInfo.team;
                const bgClass = team === 'good' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                               team === 'evil' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                               'bg-gray-500/20 text-gray-400 border-gray-500/30';
                return (
                  <span
                    key={`${role.type}-${i}`}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border ${bgClass}`}
                  >
                    {roleInfo.icon} {roleInfo.name}
                  </span>
                );
              })
            ))}
          </div>
        </div>
      </div>

      {/* 底部创建按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
        <button
          onClick={handleCreate}
          disabled={!isValid}
          className="w-full max-w-md mx-auto h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all"
        >
          <Check className="w-5 h-5" />
          创建房间
        </button>
        {!isValid && (
          <p className="text-center text-slate-500 text-xs mt-2">
            {!hostName.trim() ? '请输入法官名字' : '角色数量与玩家人数不匹配'}
          </p>
        )}
      </div>
    </div>
  );
}
