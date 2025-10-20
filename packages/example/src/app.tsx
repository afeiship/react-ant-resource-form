import ReactAntResourceForm from '@jswork/react-ant-resource-form/src/main';
import '@jswork/react-ant-form-schema/src/setup';
import '@jswork/react-ant-resource-form/src/style.scss';
import { NiceFormMeta } from '@ebay/nice-form-react/types';

function App() {
  const meta:NiceFormMeta = {
    layout: 'vertical',
    columns: 1,
    initialValues: {
      username: 'afei',
      password: '123456',
    },
    fields: [
      { key: 'username', label: 'User Name' },
      { key: 'password', label: 'Password', widget: 'password' },
    ],
  };

  return (
    <div className="m-10 p-4 shadow bg-gray-100 text-gray-800 hover:shadow-md transition-all">
      <div className="badge badge-warning absolute right-0 top-0 m-4">Build Time: {BUILD_TIME}</div>
      <ReactAntResourceForm meta={meta} title="Antd resources" />
    </div>
  );
}

export default App;
