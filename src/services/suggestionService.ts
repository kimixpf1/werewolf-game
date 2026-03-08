// 建议信箱服务
// 使用 Supabase 实现跨设备实时同步

// Supabase 配置
const SUPABASE_URL = 'https://ejeiuqcmkznfbglvbkbe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_akyDKiNsa1ZCQcqpTa-3LQ_6SYEfxGg';

export interface Suggestion {
  id: string;
  name: string;
  content: string;
  timestamp: number;
  date: string;
  time: string;
  status: 'unread' | 'read' | 'replied';
  user_agent?: string;
}

const SUGGESTIONS_KEY = 'site_suggestions';
const USE_SUPABASE = true; // 已配置 Supabase

/**
 * 检查 Supabase 是否已配置
 */
export function isSupabaseConfigured(): boolean {
  return USE_SUPABASE;
}

/**
 * 提交建议到 Supabase
 */
async function submitToSupabase(suggestion: Suggestion): Promise<boolean> {
  try {
    const payload: any = {
      id: suggestion.id,
      name: suggestion.name,
      content: suggestion.content,
      date: suggestion.date,
      time: suggestion.time,
      status: suggestion.status,
    };
    
    // 可选字段
    if (suggestion.user_agent) payload.user_agent = suggestion.user_agent;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/suggestions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase 错误:', errorText);
    }
    return response.ok;
  } catch (error) {
    console.error('提交到 Supabase 失败:', error);
    return false;
  }
}

/**
 * 从 Supabase 获取建议
 */
async function getFromSupabase(): Promise<Suggestion[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/suggestions?select=*&order=timestamp.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      console.log('[Supabase] 获取到建议:', data.length, '条');
      // 转换 Supabase 数据格式为前端格式
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        content: item.content,
        timestamp: Date.now(), // 简化处理
        date: item.date,
        time: item.time,
        status: item.status,
        user_agent: item.user_agent,
      }));
    } else {
      console.error('[Supabase] 获取建议失败:', response.status, await response.text());
    }
    return [];
  } catch (error) {
    console.error('从 Supabase 获取失败:', error);
    return [];
  }
}

/**
 * 提交建议
 */
export async function submitSuggestion(name: string, content: string): Promise<boolean> {
  try {
    const now = new Date();
    const suggestion: Suggestion = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      content: content.trim(),
      timestamp: now.getTime(),
      date: now.toLocaleDateString('zh-CN'),
      time: now.toLocaleTimeString('zh-CN'),
      status: 'unread',
      user_agent: navigator.userAgent,
    };

    // 如果配置了 Supabase，优先使用 Supabase
    if (isSupabaseConfigured()) {
      const success = await submitToSupabase(suggestion);
      if (success) return true;
    }

    // 回退到 localStorage
    const existing = getSuggestionsFromStorage();
    const updated = [suggestion, ...existing];
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(updated));
    
    // 同时保存到共享存储（用于同一设备不同浏览器）
    saveToSharedStorage(suggestion);
    
    return true;
  } catch (error) {
    console.error('提交建议失败:', error);
    return false;
  }
}

/**
 * 保存到共享存储（使用 BroadcastChannel 或轮询）
 */
function saveToSharedStorage(suggestion: Suggestion): void {
  try {
    // 尝试使用 BroadcastChannel 通知其他标签页
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('suggestions_channel');
      channel.postMessage({ type: 'new_suggestion', data: suggestion });
      channel.close();
    }
  } catch (e) {
    // 忽略错误
  }
}

/**
 * 从 localStorage 获取建议
 */
function getSuggestionsFromStorage(): Suggestion[] {
  try {
    const data = localStorage.getItem(SUGGESTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 获取所有建议
 */
export async function getSuggestions(): Promise<Suggestion[]> {
  // 如果配置了 Supabase，优先使用 Supabase
  if (isSupabaseConfigured()) {
    const supabaseData = await getFromSupabase();
    if (supabaseData.length > 0) {
      // 同步到 localStorage 以便离线使用
      localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(supabaseData));
      return supabaseData;
    }
  }

  // 回退到 localStorage
  return getSuggestionsFromStorage();
}

/**
 * 获取未读建议数量
 */
export async function getUnreadCount(): Promise<number> {
  const suggestions = await getSuggestions();
  return suggestions.filter(s => s.status === 'unread').length;
}

/**
 * 标记建议为已读
 */
export async function markAsRead(id: string): Promise<boolean> {
  if (!id) {
    console.error('markAsRead: id is empty');
    return false;
  }
  
  console.log('Marking suggestion as read:', id);
  
  // 如果配置了 Supabase，同步更新
  if (isSupabaseConfigured()) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/suggestions?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'read' }),
      });
      if (!response.ok) {
        console.error('Supabase update failed:', await response.text());
      }
    } catch (e) {
      console.error('更新 Supabase 失败:', e);
    }
  }
  
  // 更新 localStorage
  const suggestions = await getSuggestions();
  const updated = suggestions.map(s => 
    s.id === id ? { ...s, status: 'read' as const } : s
  );
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(updated));
  
  return true;
}

/**
 * 批量标记建议为已读
 */
export async function markMultipleAsRead(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) {
    console.error('markMultipleAsRead: ids is empty');
    return false;
  }
  
  console.log('Marking multiple suggestions as read:', ids);
  
  // 如果配置了 Supabase，逐条更新
  if (isSupabaseConfigured()) {
    try {
      for (const id of ids) {
        await fetch(`${SUPABASE_URL}/rest/v1/suggestions?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'read' }),
        });
      }
    } catch (e) {
      console.error('批量更新 Supabase 失败:', e);
    }
  }
  
  // 更新 localStorage
  const suggestions = await getSuggestions();
  const updated = suggestions.map(s => 
    ids.includes(s.id) ? { ...s, status: 'read' as const } : s
  );
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(updated));
  
  return true;
}

/**
 * 标记建议为已回复
 */
export async function markAsReplied(id: string): Promise<void> {
  const suggestions = await getSuggestions();
  const updated = suggestions.map(s => 
    s.id === id ? { ...s, status: 'replied' as const } : s
  );
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(updated));
}

/**
 * 删除建议
 */
export async function deleteSuggestion(id: string): Promise<boolean> {
  if (!id) {
    console.error('deleteSuggestion: id is empty');
    return false;
  }
  
  console.log('Deleting suggestion:', id);
  
  // 如果配置了 Supabase，同步删除
  if (isSupabaseConfigured()) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/suggestions?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      if (!response.ok) {
        console.error('Supabase delete failed:', await response.text());
      }
    } catch (e) {
      console.error('从 Supabase 删除失败:', e);
    }
  }
  
  // 更新 localStorage
  const suggestions = await getSuggestions();
  const updated = suggestions.filter(s => s.id !== id);
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(updated));
  
  return true;
}

/**
 * 批量删除建议
 */
export async function deleteMultipleSuggestions(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) {
    console.error('deleteMultipleSuggestions: ids is empty');
    return false;
  }
  
  console.log('Deleting multiple suggestions:', ids);
  
  // 如果配置了 Supabase，逐条删除
  if (isSupabaseConfigured()) {
    try {
      for (const id of ids) {
        await fetch(`${SUPABASE_URL}/rest/v1/suggestions?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
      }
    } catch (e) {
      console.error('批量删除 Supabase 失败:', e);
    }
  }
  
  // 更新 localStorage
  const suggestions = await getSuggestions();
  const updated = suggestions.filter(s => !ids.includes(s.id));
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(updated));
  
  return true;
}

/**
 * 清空所有建议
 */
export async function clearAllSuggestions(): Promise<void> {
  console.log('Clearing all suggestions');
  
  // 如果配置了 Supabase，清空 Supabase 表
  if (isSupabaseConfigured()) {
    try {
      // 获取所有建议的 ID
      const suggestions = await getFromSupabase();
      console.log('Deleting', suggestions.length, 'suggestions from Supabase');
      // 逐条删除（Supabase 不支持批量删除）
      for (const s of suggestions) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/suggestions?id=eq.${encodeURIComponent(s.id)}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        if (!response.ok) {
          console.error('Failed to delete suggestion:', s.id, await response.text());
        }
      }
    } catch (e) {
      console.error('清空 Supabase 失败:', e);
    }
  }
  
  // 清空 localStorage
  localStorage.removeItem(SUGGESTIONS_KEY);
}

/**
 * 设置 BroadcastChannel 监听器（用于同一设备实时同步）
 */
export function setupSuggestionListener(callback: (suggestions: Suggestion[]) => void): () => void {
  if (typeof BroadcastChannel === 'undefined') {
    // 如果不支持 BroadcastChannel，使用轮询
    const interval = setInterval(async () => {
      const suggestions = await getSuggestions();
      callback(suggestions);
    }, 3000);
    return () => clearInterval(interval);
  }

  const channel = new BroadcastChannel('suggestions_channel');
  
  channel.onmessage = async (event) => {
    if (event.data.type === 'new_suggestion') {
      const suggestions = await getSuggestions();
      callback(suggestions);
    }
  };

  // 同时启动轮询作为备份
  const interval = setInterval(async () => {
    const suggestions = await getSuggestions();
    callback(suggestions);
  }, 5000);

  return () => {
    channel.close();
    clearInterval(interval);
  };
}
