// GoatCounter 统计服务
// 免费开源的网页统计服务，支持实时数据展示
// 官网：https://www.goatcounter.com/

// ============================================
// 配置 - 请修改为你的 GoatCounter 站点信息
// ============================================

// GoatCounter 站点代码（注册后获得）
// 格式如：your-site-code
const GOATCOUNTER_CODE = 'YOUR_GOATCOUNTER_CODE';

// GoatCounter API 密钥（从设置页面获取）
const GOATCOUNTER_API_KEY = 'YOUR_GOATCOUNTER_API_KEY';

// ============================================
// 类型定义
// ============================================

export interface GoatCounterStats {
  totalVisits: number;
  totalPageviews: number;
  uniqueVisitors: number;
  todayVisits: number;
  todayPageviews: number;
  browsers: { name: string; count: number; percentage: number }[];
  systems: { name: string; count: number; percentage: number }[];
  devices: { name: string; count: number; percentage: number }[];
  pages: { path: string; count: number; percentage: number }[];
  referrers: { name: string; count: number; percentage: number }[];
  locations: { name: string; count: number; percentage: number }[];
  hourlyStats: { hour: number; count: number }[];
  dailyStats: { date: string; count: number }[];
}

export interface GoatCounterVisit {
  path: string;
  title: string;
  created_at: string;
  browser: string;
  system: string;
  device: string;
  country: string;
  referrer: string;
  size: [number, number];
}

// ============================================
// 脚本加载
// ============================================

/**
 * 加载 GoatCounter 统计脚本
 */
export function loadGoatCounterScript(): void {
  if (typeof window === 'undefined' || GOATCOUNTER_CODE === 'YOUR_GOATCOUNTER_CODE') {
    return;
  }

  // 检查是否已经加载
  if (document.getElementById('goatcounter-script')) {
    return;
  }

  const script = document.createElement('script');
  script.id = 'goatcounter-script';
  script.async = true;
  script.src = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  
  // 设置数据属性
  script.setAttribute('data-goatcounter', `https://${GOATCOUNTER_CODE}.goatcounter.com/count`);
  
  document.body.appendChild(script);
}

/**
 * 手动发送页面访问
 */
export function trackGoatCounterPageView(path?: string, title?: string): void {
  if (typeof window === 'undefined' || GOATCOUNTER_CODE === 'YOUR_GOATCOUNTER_CODE') {
    return;
  }

  // 使用 GoatCounter 的计数 API
  const url = `https://${GOATCOUNTER_CODE}.goatcounter.com/count?` +
    `p=${encodeURIComponent(path || window.location.pathname)}&` +
    `t=${encodeURIComponent(title || document.title)}&` +
    `r=${encodeURIComponent(document.referrer)}&` +
    `s=${window.screen.width}x${window.screen.height}&` +
    `b=${encodeURIComponent(navigator.userAgent)}`;

  // 使用图片请求发送数据（避免跨域问题）
  const img = new Image();
  img.src = url;
  img.style.display = 'none';
  document.body.appendChild(img);
  
  // 清理
  setTimeout(() => {
    if (img.parentNode) {
      img.parentNode.removeChild(img);
    }
  }, 1000);
}

// ============================================
// API 调用
// ============================================

/**
 * 检查 GoatCounter 是否已配置
 */
export function isGoatCounterConfigured(): boolean {
  return GOATCOUNTER_CODE !== 'YOUR_GOATCOUNTER_CODE';
}

/**
 * 获取统计概览数据
 */
export async function getGoatCounterStats(startDate?: string, endDate?: string): Promise<GoatCounterStats | null> {
  if (!isGoatCounterConfigured()) {
    return null;
  }

  try {
    // 设置默认日期范围（最近30天）
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 获取总体统计
    const statsResponse = await fetch(
      `https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/stats/total?start=${start}&end=${end}`,
      {
        headers: {
          'Authorization': `Bearer ${GOATCOUNTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!statsResponse.ok) {
      throw new Error('Failed to fetch stats');
    }

    const statsData = await statsResponse.json();

    // 获取浏览器统计
    const browsersResponse = await fetch(
      `https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/stats/browser?start=${start}&end=${end}`,
      {
        headers: {
          'Authorization': `Bearer ${GOATCOUNTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const browsersData = browsersResponse.ok ? await browsersResponse.json() : { browsers: [] };

    // 获取系统统计
    const systemsResponse = await fetch(
      `https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/stats/system?start=${start}&end=${end}`,
      {
        headers: {
          'Authorization': `Bearer ${GOATCOUNTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const systemsData = systemsResponse.ok ? await systemsResponse.json() : { systems: [] };

    // 获取页面统计
    const pagesResponse = await fetch(
      `https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/stats/pages?start=${start}&end=${end}`,
      {
        headers: {
          'Authorization': `Bearer ${GOATCOUNTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const pagesData = pagesResponse.ok ? await pagesResponse.json() : { pages: [] };

    // 获取今日统计
    const today = new Date().toISOString().split('T')[0];
    const todayResponse = await fetch(
      `https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/stats/total?start=${today}&end=${today}`,
      {
        headers: {
          'Authorization': `Bearer ${GOATCOUNTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const todayData = todayResponse.ok ? await todayResponse.json() : { total: 0, total_visits: 0 };

    return {
      totalVisits: statsData.total_visits || 0,
      totalPageviews: statsData.total || 0,
      uniqueVisitors: statsData.total_unique || 0,
      todayVisits: todayData.total_visits || 0,
      todayPageviews: todayData.total || 0,
      browsers: browsersData.browsers || [],
      systems: systemsData.systems || [],
      devices: [], // GoatCounter 不直接提供设备统计
      pages: pagesData.pages || [],
      referrers: [],
      locations: [],
      hourlyStats: [],
      dailyStats: [],
    };
  } catch (error) {
    console.error('获取 GoatCounter 统计失败:', error);
    return null;
  }
}

/**
 * 获取实时访问记录
 */
export async function getGoatCounterVisits(limit: number = 50): Promise<GoatCounterVisit[]> {
  if (!isGoatCounterConfigured()) {
    return [];
  }

  try {
    const response = await fetch(
      `https://${GOATCOUNTER_CODE}.goatcounter.com/api/v0/hits?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${GOATCOUNTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch visits');
    }

    const data = await response.json();
    return data.hits || [];
  } catch (error) {
    console.error('获取 GoatCounter 访问记录失败:', error);
    return [];
  }
}

/**
 * 获取 GoatCounter 后台地址
 */
export function getGoatCounterDashboardUrl(): string {
  if (!isGoatCounterConfigured()) {
    return 'https://www.goatcounter.com/';
  }
  return `https://${GOATCOUNTER_CODE}.goatcounter.com/`;
}

/**
 * 初始化 GoatCounter
 */
export function initGoatCounter(): void {
  if (!isGoatCounterConfigured()) {
    console.log('[GoatCounter] 未配置，跳过初始化');
    return;
  }

  // 加载脚本
  loadGoatCounterScript();
  
  // 发送页面访问
  trackGoatCounterPageView();
  
  console.log('[GoatCounter] 已初始化');
}
