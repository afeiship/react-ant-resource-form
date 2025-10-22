import ReactAntResourceForm from '@jswork/react-ant-resource-form/src/main';
import '@jswork/react-ant-form-schema/src/setup';
import '@jswork/react-ant-resource-form/src/style.scss';
import { NiceFormMeta } from '@ebay/nice-form-react/types';
import nx from '@jswork/next';

nx.set(nx, '$api', {
  posts_create: (payload) => {
    return fetch('https://68f5fcf26b852b1d6f15b6f3.mockapi.io/api/v1/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  posts_show: (payload) => {
    return fetch(`https://68f5fcf26b852b1d6f15b6f3.mockapi.io/api/v1/posts/${payload.id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then((res) => res.json());
  },
  posts_update: (payload) => {
    return fetch(`https://68f5fcf26b852b1d6f15b6f3.mockapi.io/api/v1/posts/${payload.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
});

function App() {
  const meta: NiceFormMeta = {
    layout: 'vertical',
    columns: 1,
    initialValues: {
      username: 'afei',
      password: '123456',
    },
    fields: [
      { key: 'title', label: 'Post title' },
      { key: 'content', label: 'Post content', widget: 'textarea' },
    ],
  };

  return (
    <div className="m-10 p-4 y-5 shadow bg-gray-100 text-gray-800 hover:shadow-md transition-all">
      <div className="badge badge-warning absolute right-0 top-0 m-4">Build Time: {BUILD_TIME}</div>
      {/* <ReactAntResourceFormApi name="posts" meta={meta} /> */}
      <ReactAntResourceForm
        params={{ id: 3 }}
        name="posts"
        meta={meta}
        classNames={{ body: 'bg-slate-100' }}
      />
    </div>
  );
}

export default App;
