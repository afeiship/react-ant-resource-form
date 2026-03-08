// import noop from '@jswork/noop';
import cx from 'classnames';
import React, { Component } from 'react';
import { ButtonProps, CardProps, FormInstance } from 'antd';
import { Button, Card, message, Space, Spin } from 'antd';
import ReactAntdFormSchema, { ReactAntdFormSchemaProps } from '@jswork/react-ant-form-schema';
import { ArrowLeftOutlined, DiffOutlined, SaveOutlined } from '@ant-design/icons';
import deepEqual from 'fast-deep-equal';
import {
  InitGuardArgs,
  MsgType,
  MutateArgs,
  StageData,
  StagePayload,
  SubmitGuardArgs,
} from './types';
import { API_FORM_LOCALES } from './locales';
import nx from '@jswork/next';
import '@jswork/next-compact-object';
import { filterPayload } from './utils';

declare global {
  interface NxStatic {
    $api: Record<string, any>;
    $event: any;
  }
}

const CLASS_NAME = 'react-ant-resource-form';

export type ReactAntResourceFormProps = {
  name?: string;
  lang?: string;
  loading?: boolean;
  okText?: string;
  backText?: string;
  params?: Record<string, any>;
  blocker?: boolean;
  mute?: boolean;
  disableHotkeySave?: boolean;
  disableBackWhenEdit?: boolean;
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
  onMutate?: (args: MutateArgs) => void;
  onTouchedChange?: (touched: boolean) => void;
  payloadFields?: { include?: string[]; exclude?: string[] }
} & ReactAntdFormSchemaProps;

export type IState = {
  loading: boolean;
  touched: boolean;
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
 *
 * onMutate:
 * 在 create/update 成功后，需要刷新列表，可以用 onMutate 继续后续处理。
 *
 * blocker:
 * 这个解决的问题是，目前 nice-form 里默认是 grid layout，导致部分情况下，卡片内部的 style 表现很不正常。
 * 特别是有非 antd 组件的情况下，比如我自己的 react-ckeditor
 *
 * transformRequest:
 * 当你提交表单的时候，需要对参数进行一些预处理，比如加密，或者添加一些默认值，这个时候就可以用 transformRequest。
 */

class ReactAntResourceForm extends Component<ReactAntResourceFormProps, IState> {
  public static defaultProps = {
    lang: 'zh-CN',
    disableHotkeySave: false,
    disableBackWhenEdit: false,
    blocker: false,
    mute: false,
    initGuard: () => Promise.resolve(),
    submitGuard: () => Promise.resolve(),
    payloadFields: { include: [], exclude: [] },
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

  private msg(msg: string, type: MsgType = 'success') {
    const { mute } = this.props;
    if (!mute) message[type](msg);
  }

  private handleBack = () => {
    history.back();
  };

  private setInitialValues = () => {
    this._initialValues = this.formInstance?.getFieldsValue();
  };

  handleStateRequest(stagePayload: StagePayload) {
    const { payloadFields, transformRequest } = this.props;
    this.setState({ loading: true });
    const rawPayload = transformRequest?.(stagePayload) || stagePayload.payload;
    return filterPayload(rawPayload, payloadFields);
  }

  handleStateResponse(res: StageData) {
    const { name } = this.props;
    this.setState({ loading: false });
    nx.$event?.emit?.(`${name}:refetch`);
    return this.props.transformResponse?.(res) || res.data;
  }

  handleFinish = (values: any) => {
    if (!this.canSave) {
      this.msg(this.t('no_change'), 'info');
      return;
    }
    this.isEdit ? this.onResourceUpdate(values) : this.onResourceCreate(values);
  };

  private onResourceUpdate = (values: any) => {
    const { params, name, submitGuard, onMutate } = this.props;
    const payload = { id: params!.id, ...values, ...params };
    const _payload = this.handleStateRequest({ stage: 'update', payload });
    const submitGuardArgs: SubmitGuardArgs = {
      name,
      payload: _payload,
      isEdit: true,
      values,
      params,
    };
    const mutateArgs: MutateArgs = {
      name,
      payload: _payload,
      isEdit: true,
      values,
    };

    submitGuard?.(submitGuardArgs).then(() => {
      nx.$api[`${name}_update`](_payload)
        .then((res: any) => {
          this.msg(this.t('update_success'));
          this.handleStateResponse({ stage: 'update', data: res });
          onMutate?.({ ...mutateArgs, data: res });
        })
        .finally(() => {
          this.setState({ loading: false });
          this.setInitialValues();
          this.props.onTouchedChange?.(false);
        });
    });
  };

  private onResourceCreate = (values: any) => {
    const { params, name, disableBackWhenEdit, submitGuard, onMutate } = this.props;
    const payload = { ...values, ...params };
    const _payload = this.handleStateRequest({ stage: 'create', payload });
    const submitGuardArgs: SubmitGuardArgs = {
      name,
      payload: _payload,
      isEdit: false,
      values,
      params,
    };

    const mutateArgs: MutateArgs = {
      name,
      payload: _payload,
      isEdit: false,
      values,
    };

    submitGuard?.(submitGuardArgs).then(() => {
      nx.$api[`${name}_create`](_payload)
        .then((res: any) => {
          this.msg(this.t('create_success'));
          this.handleStateResponse({ stage: 'create', data: res });
          this.formInstance?.resetFields();
          onMutate?.({ ...mutateArgs, data: res });
          this.props.onTouchedChange?.(false);
          if (!disableBackWhenEdit) history.back();
        })
        .finally(() => this.setState({ loading: false }));
    });
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
    if (this._isMounted && this._initialValues !== null) {
      const newTouched = !deepEqual(this._initialValues, allValues);
      this.setState({
        touched: newTouched,
      });
      this.props.onTouchedChange?.(newTouched);
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
            this.props.onTouchedChange?.(false);
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
        this.props.onTouchedChange?.(false);
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
      disableBackWhenEdit,
      blocker,
      mute,
      onInit,
      onMutate,
      initGuard,
      submitGuard,
      loading,
      payloadFields,
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


export default ReactAntResourceForm;
