// import noop from '@jswork/noop';
import cx from 'classnames';
import React, { Component } from 'react';
import { Button, ButtonProps, Card, CardProps, Space, message, Spin } from 'antd';
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

  get isEdit() {
    const { params } = this.props;
    return Boolean(params?.id);
  }

  get titleView() {
    const { title } = this.props;
    return title || (this.isEdit ? this.t('update_title') : this.t('create_title'));
  }

  get extraView() {
    const { extra, backText, backProps } = this.props;
    if (extra) return extra;
    return (
      <Button size="small" icon={<ArrowLeftOutlined />} onClick={this.handleBack} {...backProps}>
        {backText || this.t('back')}
      </Button>
    );
  }

  get childrenView() {
    const { okText, backText, okProps, backProps, children } = this.props;
    const _okText = okText || (this.isEdit ? this.t('update') : this.t('create'));
    if (children) return children;

    return (
      <Space>
        <Button htmlType="submit" type="primary" icon={<SaveOutlined />} {...okProps}>
          {_okText || this.t('submit')}
        </Button>
        <Button icon={<ArrowLeftOutlined />} onClick={this.handleBack} {...backProps}>
          {backText || this.t('back')}
        </Button>
      </Space>
    );
  }

  get formInstance() {
    return this.formRef?.current;
  }

  constructor(props: ReactAntResourceFormProps) {
    super(props);
    this.state = {
      loading: false,
    };

    this.handleStateRequest = this.handleStateRequest.bind(this);
    this.handleStateResponse = this.handleStateResponse.bind(this);
    this.initDetailIfNeeded = this.initDetailIfNeeded.bind(this);
  }

  private t(key: string) {
    const { lang } = this.props;
    return API_FORM_LOCALES[lang!][key];
  }

  private handleBack = () => {
    history.back();
  };

  handleStateRequest(stagePayload: StagePayload) {
    this.setState({ loading: true });
    return this.props.transformRequest?.(stagePayload) || stagePayload.payload;
  }

  handleStateResponse(res: StageData) {
    const { name } = this.props;
    this.setState({ loading: false });
    nx.$event?.emit?.(`${name}:refetch`);
    return this.props.transformResponse?.(res) || res.data;
  }

  handleFinish = (values: any) => {
    const { params, name } = this.props;
    const resourceEdit = `${name}_update`;
    const resourceCreate = `${name}_create`;

    if (this.isEdit) {
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
  };

  // hotkey save handler (replaces useKeyboardSave hook)
  handleKeydown = (e: KeyboardEvent) => {
    const isSave = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
    if (isSave) {
      e.preventDefault();
      if (!this.props.disableHotkeySave) {
        // submit the form via ref
        try {
          this.formInstance?.submit();
        } catch (err) {
          // ignore if submit not available yet
        }
      }
    }
  };

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
      this.initDetailIfNeeded();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    this._isMounted = false;
  }

  initDetailIfNeeded() {
    const { params, name } = this.props;
    const resourceShow = `${name}_show`;

    if (this.isEdit) {
      const payload = { id: params!.id };
      const _payload = this.handleStateRequest({ stage: 'show', payload });

      nx.$api[resourceShow](_payload)
        .then((res: any) => {
          if (!this._isMounted) return; // 👈 关键：防止操作已卸载组件
          const data = this.handleStateResponse({ stage: 'show', data: res });
          // set fields value on the form via ref
          try {
            this.formInstance?.setFieldsValue?.(data);
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

    return (
      <Card
        title={this.titleView}
        extra={this.extraView}
        size={size}
        classNames={classNames}
        data-component={CLASS_NAME}
        className={cx(CLASS_NAME, className)}>
        <Spin spinning={this.state.loading}>
          <ReactAntdFormSchema
            meta={meta}
            ref={this.formRef}
            onFinish={this.handleFinish}
            {...rest}>
            {this.childrenView}
          </ReactAntdFormSchema>
        </Spin>
      </Card>
    );
  }
}

export default ReactAntResourceForm;
