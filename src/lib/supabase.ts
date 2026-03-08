import { createClient } from '@supabase/supabase-js';
import type { Room, Player } from '@/types';

const supabaseUrl = 'https://xhoskpjcnfgwxetpeuhd.supabase.co';
const supabaseKey = 'sb_publishable_EjjJ5nVFXa4llTvvER2DGg_cHc1xiZg';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// 生成随机房间ID (6位数字)
export function generateRoomId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成玩家ID
export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 创建房间
export async function createRoom(
  roomId: string,
  hostId: string, 
  playerCount: number, 
  roles: any[],
  _enableSheriff: boolean = true,
  _winMode: 'city' | 'side' = 'side',
  _enableAutoJudge: boolean = false
): Promise<{ data: Room | null; error: any }> {
  // 构建插入数据，只使用基本字段
  const insertData: any = {
    id: roomId,
    host_id: hostId,
    player_count: playerCount,
    roles: roles,
    status: 'waiting',
    current_phase: 'night',
  };

  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Create room error:', error);
      return { data: null, error };
    }

    // 将额外配置存储到 localStorage（因为数据库可能不支持这些字段）
    const roomConfig = {
      enable_sheriff: _enableSheriff,
      win_mode: _winMode,
      enable_auto_judge: _enableAutoJudge,
    };
    localStorage.setItem(`room_config_${roomId}`, JSON.stringify(roomConfig));
    console.log('Room config saved to localStorage:', roomConfig);

    // 尝试更新额外字段（忽略错误）
    try {
      await supabase
        .from('rooms')
        .update({
          enable_sheriff: _enableSheriff,
          win_mode: _winMode,
        })
        .eq('id', roomId);
    } catch (e) {
      console.warn('Update extra fields failed (non-critical):', e);
    }

    // 重新获取房间信息
    const { data: updatedRoom } = await getRoom(roomId);
    
    // 合并数据库数据和本地配置
    const finalRoom = updatedRoom || data;
    if (finalRoom) {
      (finalRoom as any).enable_sheriff = _enableSheriff;
      (finalRoom as any).win_mode = _winMode;
      (finalRoom as any).enable_auto_judge = _enableAutoJudge;
    }
    
    return { data: finalRoom as Room, error: null };
  } catch (e) {
    console.error('Create room exception:', e);
    return { data: null, error: e };
  }
}

// 获取房间配置（从 localStorage 或数据库）
export function getRoomConfig(roomId: string): { enable_sheriff: boolean; win_mode: 'city' | 'side'; enable_auto_judge: boolean } {
  try {
    const saved = localStorage.getItem(`room_config_${roomId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load room config:', e);
  }
  return {
    enable_sheriff: true,
    win_mode: 'side',
    enable_auto_judge: false,
  };
}

// 获取房间信息
export async function getRoom(roomId: string): Promise<{ data: Room | null; error: any }> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  return { data, error };
}

// 更新房间状态
export async function updateRoomStatus(
  roomId: string, 
  status: string
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('rooms')
    .update({ status })
    .eq('id', roomId);

  return { data, error };
}

// 更新游戏结果
export async function updateGameResult(
  roomId: string, 
  winner: 'good' | 'evil',
  reason: string
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('rooms')
    .update({ 
      game_result: {
        winner,
        reason,
        ended_at: new Date().toISOString(),
      }
    })
    .eq('id', roomId);

  return { data, error };
}

// 添加玩家
export async function addPlayer(
  playerId: string,
  roomId: string, 
  name: string, 
  isHost: boolean = false
): Promise<{ data: Player | null; error: any }> {
  const { data, error } = await supabase
    .from('players')
    .insert([
      {
        id: playerId,
        room_id: roomId,
        name,
        is_host: isHost,
        is_alive: true,
      },
    ])
    .select()
    .single();

  return { data, error };
}

// 获取房间内的所有玩家
export async function getPlayers(roomId: string): Promise<{ data: Player[] | null; error: any }> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  return { data, error };
}

// 更新玩家角色
export async function updatePlayerRole(
  playerId: string, 
  role: string
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('players')
    .update({ role })
    .eq('id', playerId);

  return { data, error };
}

// 批量更新玩家角色
export async function batchUpdatePlayerRoles(
  updates: { playerId: string; role: string }[]
): Promise<{ data: any; error: any }> {
  const promises = updates.map(({ playerId, role }) =>
    supabase.from('players').update({ role }).eq('id', playerId)
  );

  const results = await Promise.all(promises);
  const error = results.find(r => r.error)?.error;

  return { data: results.map(r => r.data), error };
}

// 更新玩家存活状态
export async function updatePlayerAlive(
  playerId: string, 
  isAlive: boolean
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('players')
    .update({ is_alive: isAlive })
    .eq('id', playerId);

  return { data, error };
}

// 更新玩家名字
export async function updatePlayerName(
  playerId: string, 
  name: string
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('players')
    .update({ name })
    .eq('id', playerId);

  return { data, error };
}

// 删除玩家
export async function removePlayer(playerId: string): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId);

  return { data, error };
}

// 订阅房间变化
export function subscribeToRoom(roomId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      callback
    )
    .subscribe();
}

// 订阅玩家变化
export function subscribeToPlayers(roomId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`players:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`,
      },
      callback
    )
    .subscribe();
}

// 离开频道
export function leaveChannel(channel: any) {
  supabase.removeChannel(channel);
}

// 更新警长
export async function updateSheriff(
  roomId: string,
  sheriffId: string | null,
  torn: boolean = false
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('rooms')
    .update({ 
      sheriff_id: sheriffId,
      sheriff_torn: torn 
    })
    .eq('id', roomId);

  return { data, error };
}
