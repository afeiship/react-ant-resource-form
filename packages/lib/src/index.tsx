// import noop from '@jswork/noop';
import cx from 'classnames';
import React, { FC, useEffect, useState } from 'react';
import { Button, ButtonProps, Card, CardProps, Space, Form, message } from 'antd';
import ReactAntdFormSchema, { ReactAntdFormSchemaProps } from '@jswork/react-ant-form-schema';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { API_FORM_LOCALES } from './locales';
import { useKeyboardSave } from './hooks';
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

export type ReactAntResourceFormProps = {
  lang?: string;
  loading?: boolean;
  okText?: string;
  backText?: string;
  params?: Record<string, any>;
  disableHotkeySave?: boolean;
  transformRequest?: (payload: StagePayload) => any;
  transformResponse?: (res: StageData) => any;
  okProps?: ButtonProps;
  backProps?: ButtonProps;
  classNames?: CardProps['classNames'];
  size?: CardProps['size'];
  extra?: CardProps['extra'];
  title?: CardProps['title'];
} & ReactAntdFormSchemaProps;

const CLASS_NAME = 'react-ant-resource-form';

const defaultProps = {
  lang: 'zh-CN',
  disableHotkeySave: false,
};

const ReactAntResourceForm: FC<ReactAntResourceFormProps> = (props) => {
  const {
    className,
    name,
    meta,
    children,
    lang,
    title,
    extra,
    size,
    okText,
    backText,
    okProps,
    backProps,
    classNames,
    params,
    transformRequest,
    transformResponse,
    disableHotkeySave,
    ...rest
  } = {
    ...defaultProps,
    ...props,
  };

  const t = (key: string) => API_FORM_LOCALES[lang!][key];
  const handleBack = () => history.back();
  const resourceEdit = `${name}_update`;
  const resourceCreate = `${name}_create`;
  const resourceShow = `${name}_show`;
  const [form] = Form.useForm();
  const isEdit = Boolean(params?.id);
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

  // hotkey save
  useKeyboardSave(() => {
    if (!disableHotkeySave) form.submit();
  });

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

  const _okText = okText || (isEdit ? t('update') : t('create'));
  const _title = title || (isEdit ? t('update_title') : t('create_title'));

  const _extra = extra || (
    <Button size="small" icon={<ArrowLeftOutlined />} onClick={handleBack} {...backProps}>
      {backText || t('back')}
    </Button>
  );

  const _children = children || (
    <Space>
      <Button htmlType="submit" type="primary" icon={<SaveOutlined />} {...okProps}>
        {_okText || t('submit')}
      </Button>
      <Button icon={<ArrowLeftOutlined />} onClick={handleBack} {...backProps}>
        {backText || t('back')}
      </Button>
    </Space>
  );

  return (
    <Card
      title={_title}
      size={size}
      loading={loading}
      classNames={classNames}
      data-component={CLASS_NAME}
      className={cx(CLASS_NAME, className)}
      extra={_extra}>
      <ReactAntdFormSchema meta={meta} form={form} onFinish={handleFinish} {...rest}>
        {_children}
      </ReactAntdFormSchema>
    </Card>
  );
};

export default ReactAntResourceForm;
