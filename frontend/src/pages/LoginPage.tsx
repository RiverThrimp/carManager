import { Button, Card, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100%' }}>
      <Card title="登录" style={{ width: 320 }}>
        <Typography.Paragraph>使用后台发放的账号登录系统。</Typography.Paragraph>
        <Form layout="vertical" onFinish={handleFinish} autoComplete="off">
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
            <Input placeholder="admin" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
