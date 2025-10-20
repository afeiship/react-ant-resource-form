// import noop from '@jswork/noop';
import cx from 'classnames';
import React, { FC } from 'react';
import { Button, Card, CardProps, Form, Space } from 'antd';
import ReactAntdFormSchema, { ReactAntdFormSchemaProps } from '@jswork/react-ant-form-schema';
import { NiceFormMeta } from '@ebay/nice-form-react';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

export type ReactAntResourceFormProps = {
  meta: NiceFormMeta;
  lang?: string;
  loading?: boolean;
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
  const { className, meta, children, lang, title, loading, extra, ...rest } = {
    ...defaultProps,
    ...props,
  };
  const [form] = Form.useForm();
  const t = (key: string) => locales[lang][key];
  const handleBack = () => history.back();
  const _extra = extra || (
    <Button size="small" icon={<ArrowLeftOutlined />} onClick={handleBack}>
      {t('back')}
    </Button>
  );
  const _children = children || (
    <Space>
      <Button htmlType="submit" type="primary" icon={<SaveOutlined />}>
        {t('submit')}
      </Button>
      <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
        {t('back')}
      </Button>
    </Space>
  );

  return (
    <Card
      title={title}
      loading={loading}
      data-component={CLASS_NAME}
      className={cx(CLASS_NAME, className)}
      extra={_extra}>
      <ReactAntdFormSchema form={form} meta={meta} {...rest}>
        {_children}
      </ReactAntdFormSchema>
    </Card>
  );
};

export default ReactAntResourceForm;
