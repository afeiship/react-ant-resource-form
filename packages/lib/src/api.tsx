import React, { FC, useEffect, useState } from 'react';
import ReactAntResourceForm, { ReactAntResourceFormProps } from '.';
import { Form, message } from 'antd';

type StagePayload = {
  stage: 'show' | 'create' | 'update';
  payload: any;
};

type StageData = {
  stage: 'show' | 'create' | 'update';
  data: any;
};

export type ReactAntResourceFormApiProps = ReactAntResourceFormProps & {
  context: any;
  lang?: string;
  params?: Record<string, any>;
  onRequest?: (payload: StagePayload) => any;
  onResponse?: (res: StageData) => void;
};

const locales = {
  'zh-CN': {
    create_success: '创建成功',
    update_success: '更新成功',
  },
  'en-US': {
    create_success: 'Create success',
    update_success: 'Update success',
  },
};

const defaultProps = {
  lang: 'zh-CN',
};

const ReactAntResourceFormApi: FC<ReactAntResourceFormApiProps> = (props) => {
  const { name, context, params, lang, onRequest, onResponse, ...rest } = {
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
  const handleStateRequest = (payload: StagePayload) => {
    setLoading(true);
    return onRequest?.(payload) || payload;
  };
  const handleStateResponse = (res: StageData) => {
    onResponse?.(res);
    setLoading(false);
  };

  const handleFinish = (values) => {
    if (isEdit) {
      const payload = { id: params!.id, ...values };
      const _payload = handleStateRequest({ stage: 'update', payload });

      context[resourceEdit](_payload)
        .then((res) => {
          message.success(t('update_success'));
          handleStateResponse({ stage: 'update', data: res });
        })
        .finally(() => setLoading(false));
    } else {
      const payload = { ...values };
      const _payload = handleStateRequest({ stage: 'create', payload });

      context[resourceCreate](_payload)
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
      const _payload = handleStateRequest({ stage: 'update', payload });
      context[resourceShow](_payload)
        .then((res) => {
          form.setFieldsValue(res);
          handleStateResponse({ stage: 'show', data: res });
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit]);

  return <ReactAntResourceForm loading={loading} form={form} onFinish={handleFinish} {...rest} />;
};

export default ReactAntResourceFormApi;
