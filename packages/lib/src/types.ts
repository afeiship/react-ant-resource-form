export type StagePayload = {
  stage: 'show' | 'create' | 'update';
  payload: any;
};

export type StageData = {
  stage: 'show' | 'create' | 'update';
  data: any;
};

export type MutateArgs = {
  name?: string;
  params?: Record<string, any>;
  payload: any;
  isEdit: boolean;
  values: any;
};

export type MsgType = 'info' | 'success' | 'warning' | 'error';

export type InitGuardArgs = {
  name?: string;
  params?: Record<string, any>;
  payload: any;
  isEdit: boolean;
};

export type SubmitGuardArgs = {
  name?: string;
  params?: Record<string, any>;
  payload: any;
  isEdit: boolean;
  values: any;
};

