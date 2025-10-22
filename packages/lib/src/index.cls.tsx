// import noop from '@jswork/noop';
import cx from 'classnames';
import React, { Component } from 'react';
import { Button, ButtonProps, Card, CardProps, Space, Form, message } from 'antd';
import type { FormInstance } from 'antd';
import ReactAntdFormSchema, { ReactAntdFormSchemaProps } from '@jswork/react-ant-form-schema';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { API_FORM_LOCALES } from './locales';
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

type IState = {
  loading: boolean;
};

const CLASS_NAME = 'react-ant-resource-form';

class ReactAntResourceForm extends Component<ReactAntResourceFormProps, IState> {
  public static defaultProps = {
    lang: 'zh-CN',
    disableHotkeySave: false,
  };

  private formRef = React.createRef<FormInstance>(); // 注意类型
  private _isMounted = false;
  constructor(props: ReactAntResourceFormProps) {
    super(props);
    this.state = {
      loading: false,
    };

    this.handleFinish = this.handleFinish.bind(this);
    this.handleBack = this.handleBack.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleStateRequest = this.handleStateRequest.bind(this);
    this.handleStateResponse = this.handleStateResponse.bind(this);
    this.initDetailIfNeeded = this.initDetailIfNeeded.bind(this);
  }

  private t(key: string) {
    const { lang } = this.props;
    return API_FORM_LOCALES[lang!][key];
  }

  private handleBack() {
    history.back();
  }

  handleStateRequest(stagePayload: StagePayload) {
    this.setState({ loading: true });
    return this.props.transformRequest?.(stagePayload) || stagePayload.payload;
  }

  handleStateResponse(res: StageData) {
    this.setState({ loading: false });
    const name = this.props.name;
    nx.$event?.emit?.(`${name}:refetch`);
    return this.props.transformResponse?.(res) || res.data;
  }

  handleFinish(values: any) {
    const { params, name } = this.props;
    const isEdit = Boolean(params?.id);
    const resourceEdit = `${name}_update`;
    const resourceCreate = `${name}_create`;

    if (isEdit) {
      const payload = { id: params!.id, ...values };
      const _payload = this.handleStateRequest({ stage: 'update', payload });

      nx.$api[resourceEdit](_payload)
        .then((res: any) => {
          message.success(this.t('update_success'));
          this.handleStateResponse({ stage: 'update', data: res });
        })
        .finally(() => this.setState({ loading: false }));
    } else {
      const payload = { ...values };
      const _payload = this.handleStateRequest({ stage: 'create', payload });

      nx.$api[resourceCreate](_payload)
        .then((res: any) => {
          message.success(this.t('create_success'));
          this.handleStateResponse({ stage: 'create', data: res });
        })
        .finally(() => this.setState({ loading: false }));
    }
  }

  // hotkey save handler (replaces useKeyboardSave hook)
  handleKeydown(e: KeyboardEvent) {
    const isSave = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
    if (isSave) {
      e.preventDefault();
      if (!this.props.disableHotkeySave) {
        // submit the form via ref
        try {
          this.formRef?.current?.submit();
        } catch (err) {
          // ignore if submit not available yet
        }
      }
    }
  }

  componentDidMount() {
    this._isMounted = true;
    // attach hotkey listener
    window.addEventListener('keydown', this.handleKeydown);
    // initialize detail if editing
    this.initDetailIfNeeded();
  }

  componentDidUpdate(prevProps: ReactAntResourceFormProps) {
    const prevId = prevProps.params?.id;
    const curId = this.props.params?.id;
    // re-init when id changed or from create -> edit
    if (prevId !== curId) {
      console.log('render?');
      this.initDetailIfNeeded();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    this._isMounted = false;
  }

  initDetailIfNeeded() {
    const { params, name } = this.props;
    const isEdit = Boolean(params?.id);
    const resourceShow = `${name}_show`;

    if (isEdit) {
      const payload = { id: params!.id };
      const _payload = this.handleStateRequest({ stage: 'show', payload });
      const form = this.formRef?.current;

      nx.$api[resourceShow](_payload)
        .then((res: any) => {
          if (!this._isMounted) return; // 👈 关键：防止操作已卸载组件
          const data = this.handleStateResponse({ stage: 'show', data: res });
          // set fields value on the form via ref
          try {
            form?.setFieldsValue?.(data);
          } catch (err) {
            // ignore if not available yet
          }
        })
        .finally(() => this.setState({ loading: false }));
    }
  }

  render() {
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
    } = this.props;

    const isEdit = Boolean(params?.id);
    const _okText = okText || (isEdit ? this.t('update') : this.t('create'));
    const _title = title || (isEdit ? this.t('update_title') : this.t('create_title'));

    const _extra =
      extra ||
      ((
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={this.handleBack} {...backProps}>
          {backText || this.t('back')}
        </Button>
      ) as any);

    const _children =
      children ||
      ((
        <Space>
          <Button htmlType="submit" type="primary" icon={<SaveOutlined />} {...okProps}>
            {_okText || this.t('submit')}
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={this.handleBack} {...backProps}>
            {backText || this.t('back')}
          </Button>
        </Space>
      ) as any);

    console.log('render...');

    return (
      <Card
        title={_title}
        size={size}
        loading={this.state.loading}
        classNames={classNames}
        data-component={CLASS_NAME}
        className={cx(CLASS_NAME, className)}
        extra={_extra}>
        <ReactAntdFormSchema meta={meta} ref={this.formRef} onFinish={this.handleFinish} {...rest}>
          {_children}
        </ReactAntdFormSchema>
      </Card>
    );
  }
}

export default ReactAntResourceForm;
