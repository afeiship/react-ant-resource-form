// import noop from '@jswork/noop';
import cx from 'classnames';
import React, { FC, ReactNode } from 'react';
import { Button, Card, CardProps, Form, FormProps, Space } from 'antd';
import ReactAntdFormSchema from '@jswork/react-ant-form-schema';
import { NiceFormMeta } from '@ebay/nice-form-react';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

export type ReactAntResourceFormProps = {
  meta: NiceFormMeta;
  lang?: string;
  header?: ReactNode;
  loading?: boolean;
  cardProps?: Omit<CardProps, 'title' | 'loading'>;
} & FormProps;

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
  const { className, children, meta, lang, header, loading, cardProps, ...rest } = {
    ...defaultProps,
    ...props,
  };
  const [form] = Form.useForm();
  const t = (key: string) => locales[lang][key];
  const handleBack = () => {
    history.back();
  };

  const handleFinish = (values: any) => {
    console.log('values: ', values);
  };

  return (
    <Card
      loading={loading}
      data-component={CLASS_NAME}
      className={cx(CLASS_NAME, className)}
      extra={
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={handleBack}>
          {t('back')}
        </Button>
      }
      {...cardProps}>
      {header}
      <ReactAntdFormSchema form={form} meta={meta} onFinish={handleFinish} {...rest}>
        <Space>
          <Button htmlType="submit" type="primary" icon={<SaveOutlined />}>
            {t('submit')}
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {t('back')}
          </Button>
        </Space>
      </ReactAntdFormSchema>
      {children as ReactNode}
    </Card>
  );
};

export default ReactAntResourceForm;
