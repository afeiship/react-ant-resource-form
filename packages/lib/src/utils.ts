/**
 * @Author: aric 1290657123@qq.com
 * @Date: 2025-10-31 16:46:34
 * @LastEditors: aric 1290657123@qq.com
 * @LastEditTime: 2025-10-31 16:51:16
 *
 * AI(filterPayload): https://chat.qwen.ai/c/5213efdf-e88d-4367-9bd1-bd4d23af6223
 */

export interface PayloadFieldConfig {
  include?: string[];
  exclude?: string[];
}

/**
 * 根据 include/exclude 规则过滤 payload 对象
 * @param payload 原始对象（会被浅拷贝，不修改原对象）
 * @param config 字段过滤配置
 * @returns 过滤后的新对象
 */
export function filterPayload(
  payload: Record<string, any> | null | undefined,
  config: PayloadFieldConfig = {},
): Record<string, any> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  const { include, exclude } = config;
  let result = { ...payload }; // 浅拷贝（ES5 兼容写法见下方备注）

  // --- include: 白名单 ---
  if (Array.isArray(include) && include.length > 0) {
    const allowed: Record<string, any> = {};
    const includeSet: Record<string, boolean> = {};
    for (let i = 0; i < include.length; i++) {
      includeSet[include[i]] = true;
    }
    for (const key in result) {
      if (result.hasOwnProperty(key) && includeSet[key]) {
        allowed[key] = result[key];
      }
    }
    result = allowed;
  }

  // --- exclude: 黑名单 ---
  if (Array.isArray(exclude) && exclude.length > 0) {
    const final: Record<string, any> = {};
    const excludeSet: Record<string, boolean> = {};
    for (let i = 0; i < exclude.length; i++) {
      excludeSet[exclude[i]] = true;
    }
    for (const key in result) {
      if (result.hasOwnProperty(key) && !excludeSet[key]) {
        final[key] = result[key];
      }
    }
    result = final;
  }

  return result;
}
