// import noop from '@jswork/noop';
import cx from 'classnames';
import React, { FC } from 'react';
import { Button, Card, CardProps, Form, Space } from 'antd';
import ReactAntdFormSchema from '@jswork/react-ant-form-schema';
import { NiceFormMeta } from '@ebay/nice-form-react';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

const CLASS_NAME = 'react-ant-resource-form';
// const uuid = () => Math.random().toString(36).substring(2, 9);
export type ReactAntResourceFormProps = {
  lang: string;
  meta: NiceFormMeta;
} & CardProps;

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
  const { className, children, meta, lang, ...rest } = { ...defaultProps, ...props };
  const [form] = Form.useForm();
  const t = (key: string) => locales[lang][key];
  return (
    <Card data-component={CLASS_NAME} className={cx(CLASS_NAME, className)} {...rest}>
      {children}
      <ReactAntdFormSchema form={form} meta={meta}>
        <Space>
          <Button htmlType="submit" type="primary" icon={<SaveOutlined />}>
            {t('submit')}
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.back()}>
            {t('back')}
          </Button>
        </Space>
      </ReactAntdFormSchema>
    </Card>
  );
};

export default ReactAntResourceForm;
