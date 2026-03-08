import { useState, useCallback } from 'react';
import { 
  Mic, Volume2, VolumeX, Moon, Sun, 
  Play, SkipForward, Users, Eye,
  Crown, Skull, RotateCcw, LogOut
} from 'lucide-react';
import type { Player, RoleType } from '@/types';
import { ROLES } from '@/lib/gameConfig';

// 夜晚环节定义
interface NightPhase {
  id: string;
  name: string;
  role: RoleType | 'all';
  announcement: string;
  actionPrompt?: string;
  duration: number; // 秒
}

// 出局信息
interface DeathInfo {
  playerId: string;
  playerName: string;
  role: RoleType;
  reason: string;
}

interface AutoJudgeProps {
  players: Player[];
  roles: RoleType[];
  isHost: boolean;
  onExit: () => void;
}

// 语音合成
const speak = (text: string, onEnd?: () => void) => {
  if (!window.speechSynthesis) {
    onEnd?.();
    return;
  }
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  
  utterance.onend = () => {
    onEnd?.();
  };
  
  window.speechSynthesis.speak(utterance);
};

export function AutoJudge({ 
  players, 
  roles, 
  isHost, 
  onExit 
}: AutoJudgeProps) {
  // 状态
  const [gameState, setGameState] = useState<'waiting' | 'dealing' | 'night' | 'day' | 'ended'>('waiting');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [deathInfo, setDeathInfo] = useState<DeathInfo[]>([]);
  const [showDeathInfo, setShowDeathInfo] = useState(false);
  const [judgePlayerId, setJudgePlayerId] = useState<string>('');
  
  // 判断是否有某个角色
  const hasRole = useCallback((role: RoleType) => {
    return roles.includes(role);
  }, [roles]);
  
  // 获取夜晚流程
  const getNightPhases = useCallback((): NightPhase[] => {
    const phases: NightPhase[] = [];
    
    // 第一夜特殊流程
    if (currentRound === 1) {
      if (hasRole('cupid')) {
        phases.push({
          id: 'cupid',
          name: '丘比特',
          role: 'cupid',
          announcement: '丘比特请睁眼，请选择要连接的两名玩家成为情侣。',
          actionPrompt: '请选择两名玩家成为情侣',
          duration: 15
        });
      }
      if (hasRole('admirer')) {
        phases.push({
          id: 'admirer',
          name: '暗恋者',
          role: 'admirer',
          announcement: '暗恋者请睁眼，请选择你要暗恋的玩家。',
          actionPrompt: '请选择暗恋对象',
          duration: 10
        });
      }
    }
    
    // 守卫
    if (hasRole('guard')) {
      phases.push({
        id: 'guard',
        name: '守卫',
        role: 'guard',
        announcement: '守卫请睁眼，请选择今晚要守护的玩家。',
        actionPrompt: '请选择要守护的玩家',
        duration: 10
      });
    }
    
    // 魔术师
    if (hasRole('magician')) {
      phases.push({
        id: 'magician',
        name: '魔术师',
        role: 'magician',
        announcement: '魔术师请睁眼，请选择要交换号码牌的两名玩家。',
        actionPrompt: '请选择两名玩家交换号码牌',
        duration: 10
      });
    }
    
    // 摄梦人
    if (hasRole('dreamer')) {
      phases.push({
        id: 'dreamer',
        name: '摄梦人',
        role: 'dreamer',
        announcement: '摄梦人请睁眼，请选择今晚的梦游者。',
        actionPrompt: '请选择梦游者',
        duration: 10
      });
    }
    
    // 流光伯爵
    if (hasRole('count')) {
      phases.push({
        id: 'count',
        name: '流光伯爵',
        role: 'count',
        announcement: '流光伯爵请睁眼，请选择今晚要庇护的玩家。',
        actionPrompt: '请选择要庇护的玩家',
        duration: 10
      });
    }
    
    // 狼人
    phases.push({
      id: 'werewolf',
      name: '狼人',
      role: 'werewolf',
      announcement: '狼人请睁眼，请确认同伴并选择今晚要击杀的目标。',
      actionPrompt: '请选择要击杀的目标',
      duration: 20
    });
    
    // 噩梦之影
    if (hasRole('nightmare')) {
      phases.push({
        id: 'nightmare',
        name: '噩梦之影',
        role: 'nightmare',
        announcement: '噩梦之影请睁眼，请选择今晚要恐惧的玩家。',
        actionPrompt: '请选择要恐惧的玩家',
        duration: 10
      });
    }
    
    // 狼美人
    if (hasRole('wolfbeauty')) {
      phases.push({
        id: 'wolfbeauty',
        name: '狼美人',
        role: 'wolfbeauty',
        announcement: '狼美人请睁眼，请选择今晚要魅惑的玩家。',
        actionPrompt: '请选择要魅惑的玩家',
        duration: 10
      });
    }
    
    // 石像鬼
    if (hasRole('gargoyle')) {
      phases.push({
        id: 'gargoyle',
        name: '石像鬼',
        role: 'gargoyle',
        announcement: '石像鬼请睁眼，请选择今晚要查验的玩家。',
        actionPrompt: '请选择要查验的玩家',
        duration: 10
      });
    }
    
    // 狼巫
    if (hasRole('wolfwitch')) {
      phases.push({
        id: 'wolfwitch',
        name: '狼巫',
        role: 'wolfwitch',
        announcement: '狼巫请睁眼，请选择今晚要查验的玩家。',
        actionPrompt: '请选择要查验的玩家',
        duration: 10
      });
    }
    
    // 女巫
    if (hasRole('witch')) {
      phases.push({
        id: 'witch',
        name: '女巫',
        role: 'witch',
        announcement: '女巫请睁眼，今晚死亡的是...你要使用解药吗？你要使用毒药吗？',
        actionPrompt: '请选择是否使用解药/毒药',
        duration: 15
      });
    }
    
    // 预言家
    if (hasRole('seer')) {
      phases.push({
        id: 'seer',
        name: '预言家',
        role: 'seer',
        announcement: '预言家请睁眼，请选择今晚要查验的玩家。',
        actionPrompt: '请选择要查验的玩家',
        duration: 10
      });
    }
    
    // 纯白之女
    if (hasRole('pure')) {
      phases.push({
        id: 'pure',
        name: '纯白之女',
        role: 'pure',
        announcement: '纯白之女请睁眼，请选择今晚要查验的玩家。',
        actionPrompt: '请选择要查验的玩家',
        duration: 10
      });
    }
    
    // 乌鸦
    if (hasRole('crow')) {
      phases.push({
        id: 'crow',
        name: '乌鸦',
        role: 'crow',
        announcement: '乌鸦请睁眼，请选择今晚要诅咒的玩家。',
        actionPrompt: '请选择要诅咒的玩家',
        duration: 10
      });
    }
    
    // 禁言长老
    if (hasRole('muter')) {
      phases.push({
        id: 'muter',
        name: '禁言长老',
        role: 'muter',
        announcement: '禁言长老请睁眼，请选择今晚要禁言的玩家。',
        actionPrompt: '请选择要禁言的玩家',
        duration: 10
      });
    }
    
    // 奇迹商人
    if (hasRole('miracle') && currentRound === 1) {
      phases.push({
        id: 'miracle',
        name: '奇迹商人',
        role: 'miracle',
        announcement: '奇迹商人请睁眼，请选择幸运儿并给予技能。',
        actionPrompt: '请选择幸运儿和技能',
        duration: 15
      });
    }
    
    // 猎魔人（第二晚开始）
    if (hasRole('demonhunter') && currentRound >= 2) {
      phases.push({
        id: 'demonhunter',
        name: '猎魔人',
        role: 'demonhunter',
        announcement: '猎魔人请睁眼，请选择今晚要狩猎的目标。',
        actionPrompt: '请选择要狩猎的目标',
        duration: 10
      });
    }
    
    // 守墓人（第二晚开始）
    if (hasRole('gravedigger') && currentRound >= 2) {
      phases.push({
        id: 'gravedigger',
        name: '守墓人',
        role: 'gravedigger',
        announcement: '守墓人请睁眼，昨晚被放逐的玩家是好人还是狼人？',
        actionPrompt: '请查看昨天放逐者的阵营',
        duration: 5
      });
    }
    
    return phases;
  }, [currentRound, hasRole]);
  
  // 开始夜晚
  const startNight = () => {
    setGameState('night');
    setCurrentPhase('start');
    
    if (voiceEnabled) {
      setIsSpeaking(true);
      speak(`天黑了，请所有人闭眼。第${currentRound}夜开始。`, () => {
        setIsSpeaking(false);
        runNightPhases();
      });
    } else {
      runNightPhases();
    }
  };
  
  // 执行夜晚流程
  const runNightPhases = async () => {
    const phases = getNightPhases();
    
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      setCurrentPhase(phase.id);
      
      if (voiceEnabled) {
        setIsSpeaking(true);
        await new Promise<void>((resolve) => {
          speak(phase.announcement, () => {
            setIsSpeaking(false);
            resolve();
          });
        });
      }
      
      // 等待玩家操作时间
      await new Promise(resolve => setTimeout(resolve, phase.duration * 1000));
      
      // 闭眼提示
      if (voiceEnabled && i < phases.length - 1) {
        setIsSpeaking(true);
        await new Promise<void>((resolve) => {
          speak(`${phase.name}请闭眼。`, () => {
            setIsSpeaking(false);
            resolve();
          });
        });
      }
    }
    
    // 天亮
    endNight();
  };
  
  // 结束夜晚
  const endNight = () => {
    setGameState('day');
    setCurrentPhase('day_start');
    
    // 模拟计算死亡信息（实际应该根据夜晚操作计算）
    const deaths: DeathInfo[] = [];
    setDeathInfo(deaths);
    
    if (voiceEnabled) {
      setIsSpeaking(true);
      const deathText = deaths.length > 0 
        ? `天亮了，昨晚死亡的是${deaths.map(d => d.playerName).join('、')}。` 
        : '天亮了，昨晚是平安夜。';
      speak(deathText, () => {
        setIsSpeaking(false);
      });
    }
  };
  
  // 显示死亡信息给房主
  const revealDeathInfo = () => {
    setShowDeathInfo(true);
  };
  
  // 设置出局玩家为法官
  const setPlayerAsJudge = (playerId: string) => {
    setJudgePlayerId(playerId);
    if (voiceEnabled) {
      speak('法官已接管游戏。');
    }
  };
  
  // 渲染等待界面
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              电子法官
            </h1>
            <button 
              onClick={onExit}
              className="p-2 text-slate-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* 说明 */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-2 text-purple-400">实验功能</h2>
            <p className="text-slate-300 text-sm mb-4">
              电子法官将自动播报夜晚流程，玩家根据语音提示在手机上进行操作。
            </p>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• 房主手机播放语音</li>
              <li>• 被叫醒的角色睁眼操作</li>
              <li>• 自动流转夜晚环节</li>
              <li>• 出局信息仅房主可见</li>
            </ul>
          </div>
          
          {/* 设置 */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">语音播报</span>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  voiceEnabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {/* 开始按钮 */}
          <button
            onClick={() => setGameState('dealing')}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            开始发牌
          </button>
        </div>
      </div>
    );
  }
  
  // 渲染发牌界面
  if (gameState === 'dealing') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              发牌阶段
            </h1>
            <button 
              onClick={() => setGameState('waiting')}
              className="p-2 text-slate-400 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* 发牌提示 */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-400">请确认所有玩家已收到角色</h2>
            <p className="text-slate-300 text-sm mb-4">
              请确保每位玩家都已在手机上查看了自己的角色牌。发牌完成后，点击"开始电子法官"进入夜晚流程。
            </p>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-sm text-slate-400">玩家人数: <span className="text-white font-bold">{players.filter(p => !p.is_host).length}</span> 人</p>
            </div>
          </div>
          
          {/* 玩家列表 */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              玩家列表
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players.filter(p => !p.is_host).map((player, idx) => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">#{idx + 1}</span>
                    <span className="text-white">{player.name}</span>
                  </div>
                  <span className="text-xs text-green-400">已准备</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 开始电子法官按钮 */}
          <button
            onClick={startNight}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
          >
            <Mic className="w-6 h-6" />
            开始电子法官
          </button>
          
          <p className="text-center text-slate-500 text-sm mt-4">
            点击后将开始语音播报夜晚流程
          </p>
        </div>
      </div>
    );
  }
  
  // 渲染夜晚界面
  if (gameState === 'night') {
    const phases = getNightPhases();
    const currentPhaseInfo = phases.find(p => p.id === currentPhase);
    
    return (
      <div className="min-h-screen bg-slate-950 text-white p-4">
        <div className="max-w-md mx-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Moon className="w-6 h-6 text-indigo-400" />
              <span className="text-lg font-bold">第{currentRound}夜</span>
            </div>
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg ${voiceEnabled ? 'text-green-400' : 'text-slate-500'}`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
          
          {/* 当前环节 */}
          <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-6 mb-6 text-center">
            {isSpeaking ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                  <Mic className="w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <p className="text-indigo-300">正在播报...</p>
              </div>
            ) : currentPhaseInfo ? (
              <div>
                <p className="text-indigo-400 text-sm mb-2">当前环节</p>
                <h2 className="text-2xl font-bold mb-2">{currentPhaseInfo.name}</h2>
                <p className="text-slate-400">{currentPhaseInfo.actionPrompt}</p>
              </div>
            ) : (
              <p className="text-slate-400">准备中...</p>
            )}
          </div>
          
          {/* 环节进度 */}
          <div className="space-y-2">
            {phases.map((phase, idx) => (
              <div 
                key={phase.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  phase.id === currentPhase 
                    ? 'bg-indigo-500/20 border border-indigo-500/50' 
                    : phases.findIndex(p => p.id === currentPhase) > idx
                      ? 'bg-slate-800/50 opacity-50'
                      : 'bg-slate-800/30 opacity-30'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  phase.id === currentPhase 
                    ? 'bg-indigo-500 text-white' 
                    : phases.findIndex(p => p.id === currentPhase) > idx
                      ? 'bg-green-500/50 text-green-400'
                      : 'bg-slate-700 text-slate-500'
                }`}>
                  {phases.findIndex(p => p.id === currentPhase) > idx ? '✓' : idx + 1}
                </div>
                <span className={phase.id === currentPhase ? 'text-white' : 'text-slate-400'}>
                  {phase.name}
                </span>
              </div>
            ))}
          </div>
          
          {/* 跳过按钮（仅房主） */}
          {isHost && (
            <button
              onClick={endNight}
              className="w-full mt-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center gap-2"
            >
              <SkipForward className="w-5 h-5" />
              跳过到白天
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // 渲染白天界面
  if (gameState === 'day') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sun className="w-6 h-6 text-yellow-400" />
              <span className="text-lg font-bold">第{currentRound}天</span>
            </div>
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg ${voiceEnabled ? 'text-green-400' : 'text-slate-500'}`}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
          
          {/* 昨夜信息 */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              昨夜信息
              {isHost && !showDeathInfo && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded ml-auto">
                  待查看
                </span>
              )}
            </h2>
            
            {isHost ? (
              showDeathInfo ? (
                <div>
                  {deathInfo.length > 0 ? (
                    <div className="space-y-2">
                      {deathInfo.map((death, idx) => (
                        <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Skull className="w-5 h-5 text-red-400" />
                            <span className="font-bold">{death.playerName}</span>
                            <span className="text-slate-400 text-sm">({ROLES[death.role]?.name})</span>
                          </div>
                          <p className="text-slate-400 text-sm mt-1">{death.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-green-400">
                      <p className="text-lg">✨ 平安夜</p>
                      <p className="text-sm text-slate-400">昨晚没有人死亡</p>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={revealDeathInfo}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  点击查看昨夜信息
                </button>
              )
            ) : (
              <p className="text-slate-400 text-center py-4">
                等待法官宣布昨夜信息...
              </p>
            )}
          </div>
          
          {/* 玩家列表 */}
          <div className="bg-slate-800 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              玩家列表
            </h2>
            <div className="space-y-2">
              {players.filter(p => !p.is_host).map(player => (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.is_alive ? 'bg-slate-700/50' : 'bg-slate-800/50 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={player.is_alive ? 'text-white' : 'text-slate-500 line-through'}>
                      {player.name}
                    </span>
                    {!player.is_alive && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                        已出局
                      </span>
                    )}
                  </div>
                  
                  {/* 法官操作 */}
                  {isHost && judgePlayerId === player.id && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      法官
                    </span>
                  )}
                  
                  {/* 设置法官按钮 */}
                  {isHost && !player.is_alive && judgePlayerId !== player.id && (
                    <button
                      onClick={() => setPlayerAsJudge(player.id)}
                      className="text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded"
                    >
                      设为法官
                    </button>
                  )}
                  
                  {/* 法官标识 */}
                  {judgePlayerId === player.id && (
                    <span className="text-xs bg-purple-600/50 text-purple-400 px-2 py-1 rounded flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      可查看身份
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCurrentRound(r => r + 1);
                startNight();
              }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center gap-2"
            >
              <Moon className="w-5 h-5" />
              进入黑夜
            </button>
            <button
              onClick={() => setGameState('waiting')}
              className="py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-xl"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
