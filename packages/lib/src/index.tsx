// import noop from '@jswork/noop';
import cx from 'classnames';
import React, { Component, FC } from 'react';
import type { FormInstance } from 'antd';
import { Button, ButtonProps, Card, CardProps, message, Space, Spin } from 'antd';
import ReactAntdFormSchema, { ReactAntdFormSchemaProps } from '@jswork/react-ant-form-schema';
import { ArrowLeftOutlined, DiffOutlined, SaveOutlined } from '@ant-design/icons';
import { API_FORM_LOCALES } from './locales';
import nx from '@jswork/next';
import '@jswork/next-compact-object';
import '@jswork/next-pick';
import { useParams, useSearchParams } from 'react-router-dom';
import deepEqual from 'fast-deep-equal';
import fromEntries from 'fromentries';

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

type InitGuardArgs = {
  name?: string;
  params?: Record<string, any>;
  payload: any;
  isEdit: boolean;
};

type SubmitGuardArgs = {
  name?: string;
  params?: Record<string, any>;
  payload: any;
  isEdit: boolean;
  values: any;
};

export type ReactAntResourceFormProps = {
  lang?: string;
  loading?: boolean;
  okText?: string;
  backText?: string;
  params?: Record<string, any>;
  blocker?: boolean;
  disableHotkeySave?: boolean;
  initGuard?: (args: InitGuardArgs) => Promise<void>;
  submitGuard?: (args: SubmitGuardArgs) => Promise<void>;
  transformRequest?: (payload: StagePayload) => any;
  transformResponse?: (res: StageData) => any;
  okProps?: ButtonProps;
  backProps?: ButtonProps;
  classNames?: CardProps['classNames'];
  size?: CardProps['size'];
  extra?: CardProps['extra'];
  title?: CardProps['title'];
  onInit?: (ctx: ReactAntResourceForm) => void;
} & ReactAntdFormSchemaProps;

type IState = {
  loading: boolean;
  touched: boolean;
};

const CLASS_NAME = 'react-ant-resource-form';

const retainKeys = (obj: Record<string, any>, keys: string[]) => {
  nx.forIn(obj, (key) => {
    if (!keys.includes(key)) {
      delete obj[key];
    }
  });
  return obj;
};

/**
 * 当前 card loading 不要直接使用，因为这个 loading 会导致 Card 里的 formRef 被设置成 null
 * 这个情况仅在 class component 里才会出现，function component 里不会：
 * 报错示例:
 *
 * this.formRef?:  null
 * index.tsx:229 this.formRef?:  {getFieldValue: ƒ, getFieldsValue: ƒ, getFieldError: ƒ, getFieldWarning: ƒ, getFieldsError: ƒ, …}
 * index.tsx:229 this.formRef?:  null
 *
 * initGuard | submitGuard:
 * https://chat.qwen.ai/c/60329863-0e5e-47f9-a075-a65ad30940cc
 */

class ReactAntResourceForm extends Component<ReactAntResourceFormProps, IState> {
  public static defaultProps = {
    lang: 'zh-CN',
    disableHotkeySave: false,
    blocker: false,
    initGuard: () => Promise.resolve(),
    submitGuard: () => Promise.resolve(),
  };

  private formRef = React.createRef<FormInstance>(); // 注意类型
  private _isMounted = false;
  private _initialValues = null;

  get isEdit() {
    const { params } = this.props;
    return Boolean(params?.id);
  }

  get canSave() {
    const { touched, loading } = this.state;
    if (!this.isEdit) return !loading;
    return touched && !loading;
  }

  get titleView() {
    const { title } = this.props;
    const _title = title || (this.isEdit ? this.t('update_title') : this.t('create_title'));
    return (
      <Space>
        {_title}
        <span>{this.touchedView}</span>
      </Space>
    );
  }

  get touchedView() {
    if (!this.isEdit) return null;
    return this.state.touched ? (
      <em style={{ color: '#f60' }}>
        <DiffOutlined />
      </em>
    ) : null;
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
        <Button
          disabled={!this.canSave}
          htmlType="submit"
          type="primary"
          icon={<SaveOutlined />}
          {...okProps}>
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
      loading: props.loading!,
      touched: false,
    };

    this.handleStateRequest = this.handleStateRequest.bind(this);
    this.handleStateResponse = this.handleStateResponse.bind(this);
    this.initDetailIfNeeded = this.initDetailIfNeeded.bind(this);

    props.onInit?.(this);
  }

  private t(key: string) {
    const { lang } = this.props;
    return API_FORM_LOCALES[lang!][key];
  }

  private handleBack = () => {
    history.back();
  };

  private setInitialValues = (values?: any) => {
    this._initialValues = values || this.formInstance?.getFieldsValue() || {};
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
    const { params, name, submitGuard } = this.props;
    const resourceEdit = `${name}_update`;
    const resourceCreate = `${name}_create`;

    if (!this.canSave) {
      void message.info(this.t('no_change'));
      return;
    }

    if (this.isEdit) {
      const payload = { id: params!.id, ...values, ...params };
      const _payload = this.handleStateRequest({ stage: 'update', payload });
      const submitGuardArgs: SubmitGuardArgs = {
        name,
        payload: _payload,
        isEdit: true,
        values,
        params,
      };

      submitGuard?.(submitGuardArgs).then(() => {
        nx.$api[resourceEdit](_payload)
          .then((res: any) => {
            void message.success(this.t('update_success'));
            this.handleStateResponse({ stage: 'update', data: res });
          })
          .finally(() => {
            this.setState({ loading: false });
            this.setInitialValues();
            this.handleValuesChange(null, this._initialValues);
          });
      });
    } else {
      const payload = { ...values, ...params };
      const _payload = this.handleStateRequest({ stage: 'create', payload });
      const submitGuardArgs: SubmitGuardArgs = {
        name,
        payload: _payload,
        isEdit: false,
        values,
        params,
      };

      submitGuard?.(submitGuardArgs).then(() => {
        nx.$api[resourceCreate](_payload)
          .then((res: any) => {
            void message.success(this.t('create_success'));
            this.handleStateResponse({ stage: 'create', data: res });
            this.formInstance?.resetFields();
            history.back();
          })
          .finally(() => this.setState({ loading: false }));
      });
    }
  };

  // hotkey save handler (replaces useKeyboardSave hook)
  handleKeydown = (e: KeyboardEvent) => {
    const { disableHotkeySave } = this.props;
    const isSave = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
    if (isSave) {
      e.preventDefault();
      if (!disableHotkeySave) {
        this.formInstance?.submit();
      }
    }
  };

  handleValuesChange = (_: any, allValues: any) => {
    this.setState({
      touched: !deepEqual(this._initialValues, allValues),
    });
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

    // loading update
    if (prevProps.loading !== this.props.loading) {
      this.setState({ loading: this.props.loading! });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    this._isMounted = false;
  }

  initDetailIfNeeded() {
    const { params, name, initGuard } = this.props;
    const resourceShow = `${name}_show`;

    if (this.isEdit) {
      const payload = { id: params!.id };
      const _payload = this.handleStateRequest({ stage: 'show', payload });
      const initGuardArgs: InitGuardArgs = {
        name,
        payload: _payload,
        isEdit: true,
        params,
      };
      initGuard?.(initGuardArgs).then(() => {
        nx.$api[resourceShow](_payload)
          .then((res: any) => {
            if (!this._isMounted) return; // 👈 关键：防止操作已卸载组件
            const data = this.handleStateResponse({ stage: 'show', data: res });
            this.formInstance?.setFieldsValue?.(data);
          })
          .finally(() => {
            this.setState({ loading: false });
            this.setInitialValues();
          });
      });
    } else {
      const initGuardArgs: InitGuardArgs = {
        name,
        payload: null,
        isEdit: false,
        params,
      };
      initGuard?.(initGuardArgs).then(() => {
        this.setInitialValues();
        this.setState({ loading: false });
      });
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
      blocker,
      onInit,
      initGuard,
      submitGuard,
      loading,
      ...rest
    } = this.props;

    return (
      <Card
        title={this.titleView}
        extra={this.extraView}
        size={size}
        classNames={classNames}
        data-component={CLASS_NAME}
        data-blocker={blocker}
        className={cx(CLASS_NAME, className)}>
        <Spin spinning={this.state.loading}>
          <ReactAntdFormSchema
            meta={meta}
            ref={this.formRef}
            onValuesChange={this.handleValuesChange}
            onFinish={this.handleFinish}
            {...rest}>
            {this.childrenView}
          </ReactAntdFormSchema>
        </Spin>
      </Card>
    );
  }
}

export type ReactAntResourceFormFcProps = ReactAntResourceFormProps & {
  allowFields?: string[];
}

const ReactAntResourceFormFc: FC<ReactAntResourceFormFcProps> = (props) => {
  const { params: overrideParams, allowFields, ...rest } = props;
  const params = useParams();
  const [searchParams] = useSearchParams();
  const _searchParams = fromEntries(searchParams as any);
  const _params = nx.compactObject({ ..._searchParams, ...params, ...overrideParams });
  if (allowFields?.length && allowFields.length > 0) retainKeys(_params, allowFields);
  return <ReactAntResourceForm params={_params} {...rest} />;
};

export default ReactAntResourceForm;
export { ReactAntResourceFormFc };
