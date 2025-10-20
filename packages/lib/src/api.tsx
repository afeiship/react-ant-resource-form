import React, { FC, useEffect } from 'react';
import ReactAntResourceForm, { ReactAntResourceFormProps } from '.';
import { Form, message } from 'antd';

type Payload = {
  action: 'show' | 'create' | 'update';
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
  const handleFinish = (values) => {
    if (isEdit) {
      context[resourceEdit]({ id: params!.id, ...values }).then((res) => {
        message.success(t('update_success'));
        onResponse?.({ action: 'update', data: res });
      });
    } else {
      context[resourceCreate](values).then((res) => {
        message.success(t('create_success'));
        onResponse?.({ action: 'create', data: res });
      });
    }
  };

  // init detail
  useEffect(() => {
    if (isEdit) {
      context[resourceShow]({ id: params!.id }).then((res) => {
        form.setFieldsValue(res);
        onResponse?.({ action: 'show', data: res });
      });
    }
  }, [isEdit]);

  return <ReactAntResourceForm form={form} onFinish={handleFinish} {...rest} />;
};

export default ReactAntResourceFormApi;
