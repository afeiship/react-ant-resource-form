// import noop from '@jswork/noop';
import cx from 'classnames';
import React, { FC } from 'react';
import { Button, ButtonProps, Card, CardProps, Space } from 'antd';
import ReactAntdFormSchema, { ReactAntdFormSchemaProps } from '@jswork/react-ant-form-schema';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

export type ReactAntResourceFormProps = {
  lang?: string;
  loading?: boolean;
  okText?: string;
  backText?: string;
  okProps?: ButtonProps;
  backProps?: ButtonProps;
  size?: CardProps['size'];
  extra?: CardProps['extra'];
  title?: CardProps['title'];
} & ReactAntdFormSchemaProps;

const CLASS_NAME = 'react-ant-resource-form';
const locales = {
  'zh-CN': {
    submit: '提交',
    back: '返回',
  },
  'en-US': {
    submit: 'Submit',
    back: 'Back',
  },
};

const defaultProps = {
  lang: 'zh-CN',
};

const ReactAntResourceForm: FC<ReactAntResourceFormProps> = (props) => {
  const {
    className,
    meta,
    children,
    lang,
    title,
    loading,
    extra,
    size,
    okText,
    backText,
    okProps,
    backProps,
    ...rest
  } = {
    ...defaultProps,
    ...props,
  };
  const t = (key: string) => locales[lang][key];
  const handleBack = () => history.back();
  const _extra = extra || (
    <Button size="small" icon={<ArrowLeftOutlined />} onClick={handleBack} {...backProps}>
      {backText || t('back')}
    </Button>
  );
  const _children = children || (
    <Space>
      <Button htmlType="submit" type="primary" icon={<SaveOutlined />} {...okProps}>
        {okText || t('submit')}
      </Button>
      <Button icon={<ArrowLeftOutlined />} onClick={handleBack} {...backProps}>
        {backText || t('back')}
      </Button>
    </Space>
  );

  return (
    <Card
      title={title}
      size={size}
      loading={loading}
      data-component={CLASS_NAME}
      className={cx(CLASS_NAME, className)}
      extra={_extra}>
      <ReactAntdFormSchema meta={meta} {...rest}>
        {_children}
      </ReactAntdFormSchema>
    </Card>
  );
};

export default ReactAntResourceForm;
