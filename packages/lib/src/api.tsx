import React, { FC, useEffect, useState } from 'react';
import ReactAntResourceForm, { ReactAntResourceFormProps } from '.';
import { Form, message } from 'antd';
import nx from '@jswork/next';

declare global {
  interface NxStatic {
    $api: Record<string, any>;
    $event: any;
  }
}

type StagePayload = {
  stage: 'show' | 'create' | 'update';
  payload: any;
};

type StageData = {
  stage: 'show' | 'create' | 'update';
  data: any;
};

export type ReactAntResourceFormApiProps = ReactAntResourceFormProps & {
  lang?: string;
  params?: Record<string, any>;
  transformRequest?: (payload: StagePayload) => any;
  transformResponse?: (res: StageData) => any;
};

const locales = {
  'zh-CN': {
    create: '创建',
    update: '保存',
    create_title: '创建',
    update_title: '更新',
    create_success: '创建成功',
    update_success: '更新成功',
  },
  'en-US': {
    create: 'Create',
    update: 'Save',
    create_title: 'Create',
    update_title: 'Update',
    create_success: 'Create success',
    update_success: 'Update success',
  },
};

const defaultProps = {
  lang: 'zh-CN',
};

const ReactAntResourceFormApi: FC<ReactAntResourceFormApiProps> = (props) => {
  const { name, params, lang, transformRequest, transformResponse, ...rest } = {
    ...defaultProps,
    ...props,
  };

  const resourceEdit = `${name}_update`;
  const resourceCreate = `${name}_create`;
  const resourceShow = `${name}_show`;
  const [form] = Form.useForm();
  const isEdit = Boolean(params?.id);
  const t = (key: string) => locales[lang!][key];
  const [loading, setLoading] = useState(false);
  const handleStateRequest = (stagePayload: StagePayload) => {
    setLoading(true);
    return transformRequest?.(stagePayload) || stagePayload.payload;
  };
  const handleStateResponse = (res: StageData) => {
    setLoading(false);
    nx.$event?.emit?.(`${name}:refetch`);
    return transformResponse?.(res) || res.data;
  };

  const handleFinish = (values) => {
    if (isEdit) {
      const payload = { id: params!.id, ...values };
      const _payload = handleStateRequest({ stage: 'update', payload });

      nx.$api[resourceEdit](_payload)
        .then((res) => {
          message.success(t('update_success'));
          handleStateResponse({ stage: 'update', data: res });
        })
        .finally(() => setLoading(false));
    } else {
      const payload = { ...values };
      const _payload = handleStateRequest({ stage: 'create', payload });

      nx.$api[resourceCreate](_payload)
        .then((res) => {
          message.success(t('create_success'));
          handleStateResponse({ stage: 'create', data: res });
        })
        .finally(() => setLoading(false));
    }
  };

  // init detail
  useEffect(() => {
    if (isEdit) {
      const payload = { id: params!.id };
      const _payload = handleStateRequest({ stage: 'show', payload });
      nx.$api[resourceShow](_payload)
        .then((res) => {
          const data = handleStateResponse({ stage: 'show', data: res });
          form.setFieldsValue(data);
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, params?.id]);

  const okText = isEdit ? t('update') : t('create');
  const title = isEdit ? t('update_title') : t('create_title');

  return (
    <ReactAntResourceForm
      loading={loading}
      form={form}
      onFinish={handleFinish}
      okText={okText}
      title={title}
      {...rest}
    />
  );
};

export default ReactAntResourceFormApi;
