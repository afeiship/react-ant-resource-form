import React, { FC, useEffect, useState } from 'react';
import ReactAntResourceForm, { ReactAntResourceFormProps } from '.';
import { Form, message } from 'antd';

type Payload = {
  stage: 'show' | 'create' | 'update';
  data: any;
};

type ReactAntResourceFormApiProps = ReactAntResourceFormProps & {
  context: any;
  lang?: string;
  params?: Record<string, any>;
  onResponse?: (res: Payload) => void;
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
  const { name, context, params, lang, onResponse, ...rest } = { ...defaultProps, ...props };
  const resourceEdit = `${name}_update`;
  const resourceCreate = `${name}_create`;
  const resourceShow = `${name}_show`;
  const [form] = Form.useForm();
  const isEdit = Boolean(params?.id);
  const t = (key: string) => locales[lang!][key];
  const [loading, setLoading] = useState(false);
  const handleStateResponse = (res: Payload) => {
    onResponse?.(res);
    setLoading(false);
  };

  const handleFinish = (values) => {
    setLoading(true);
    if (isEdit) {
      context[resourceEdit]({ id: params!.id, ...values })
        .then((res) => {
          message.success(t('update_success'));
          handleStateResponse({ stage: 'update', data: res });
        })
        .finally(() => setLoading(false));
    } else {
      context[resourceCreate](values)
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
      setLoading(true);
      context[resourceShow]({ id: params!.id })
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
