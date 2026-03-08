/**
 * @Author: aric 1290657123@qq.com
 * @Date: 2025-10-31 13:20:41
 * @LastEditors: aric 1290657123@qq.com
 * @LastEditTime: 2025-11-02 14:42:32
 */
import React, { FC, useState } from 'react';
import { useBlocker, useParams, useSearchParams } from 'react-router-dom';
import fromEntries from 'fromentries';
import nx from '@jswork/next';
import ReactAntResourceForm, { ReactAntResourceFormProps } from '.';
import { Modal } from 'antd';
import { API_FORM_LOCALES } from './locales';

const retainKeys = (obj: Record<string, any>, keys: string[]) => {
  nx.forIn(obj, (key) => {
    if (!keys.includes(key)) {
      delete obj[key];
    }
  });
  return obj;
};

export type ReactAntResourceFormFcProps = ReactAntResourceFormProps & {
  allowFields?: string[];
  /** 启用路由离开拦截（当表单有未保存更改时） */
  enableBlocker?: boolean;
  /** 拦截确认消息 */
  blockerMessage?: string;
}

const ReactAntResourceFormFc: FC<ReactAntResourceFormFcProps> = (props) => {
  const { params: overrideParams, allowFields, enableBlocker, blockerMessage, lang = 'zh-CN', ...rest } = props;
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [touched, setTouched] = useState(false);
  const [showBlockerModal, setShowBlockerModal] = useState(false);

  const _searchParams = fromEntries(searchParams as any);
  const _params = nx.compactObject({ ..._searchParams, ...params, ...overrideParams });
  if (allowFields?.length) retainKeys(_params, allowFields);

  // 获取翻译文本
  const t = (key: string) => API_FORM_LOCALES[lang]?.[key] || API_FORM_LOCALES['zh-CN'][key];

  // 路由拦截器
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }: any) => {
      const hasChanges = Boolean(touched);
      const isDifferentPath = currentLocation.pathname !== nextLocation.pathname;
      return enableBlocker === true && hasChanges && isDifferentPath;
    },
  );

  // 处理拦截状态变化
  if (blocker.state === 'blocked' && !showBlockerModal) {
    setShowBlockerModal(true);
  }

  // 确认离开
  const handleConfirmLeave = () => {
    setShowBlockerModal(false);
    blocker.proceed?.();
  };

  // 取消离开
  const handleCancelLeave = () => {
    setShowBlockerModal(false);
    blocker.reset?.();
  };

  return (
    <>
      <ReactAntResourceForm
        params={_params}
        lang={lang}
        onTouchedChange={setTouched}
        {...rest}
      />
      <Modal
        title={t('blocker_title')}
        open={showBlockerModal}
        onOk={handleConfirmLeave}
        onCancel={handleCancelLeave}
        okText={t('blocker_confirm')}
        cancelText={t('blocker_cancel')}>
        <p>{blockerMessage || t('blocker_message')}</p>
      </Modal>
    </>
  );
};

export default ReactAntResourceFormFc;
