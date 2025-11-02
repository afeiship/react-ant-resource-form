/**
 * @Author: aric 1290657123@qq.com
 * @Date: 2025-10-31 13:20:41
 * @LastEditors: aric 1290657123@qq.com
 * @LastEditTime: 2025-11-02 14:42:32
 */
import React, { FC } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import fromEntries from 'fromentries';
import nx from '@jswork/next';
import ReactAntResourceForm, { ReactAntResourceFormProps } from '.';

const retainKeys = (obj: Record<string, any>, keys: string[]) => {
  nx.forIn(obj, (key) => {
    if (!keys.includes(key)) {
      delete obj[key];
    }
  });
  return obj;
};


export type ReactAntResourceFormFcProps = ReactAntResourceFormProps & {
  allowFields?: string[];
}

const ReactAntResourceFormFc: FC<ReactAntResourceFormFcProps> = (props) => {
  const { params: overrideParams, allowFields, ...rest } = props;
  const params = useParams();
  const [searchParams] = useSearchParams();
  const _searchParams = fromEntries(searchParams as any);
  const _params = nx.compactObject({ ..._searchParams, ...params, ...overrideParams });
  if (allowFields?.length) retainKeys(_params, allowFields);
  return <ReactAntResourceForm params={_params} {...rest} />;
};

export default ReactAntResourceFormFc;
