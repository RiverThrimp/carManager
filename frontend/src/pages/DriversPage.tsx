import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Space, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../api/client';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone?: string;
}

export const DriversPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get<Driver[]>('/drivers');
      setDrivers(response.data);
    } catch (error) {
      message.error('加载司机失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: ColumnsType<Driver> = [
    { title: '姓名', dataIndex: 'name' },
    { title: '驾照号', dataIndex: 'licenseNumber' },
    { title: '联系方式', dataIndex: 'phone', render: (value?: string) => value ?? '未提供' }
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/drivers', values);
      message.success('司机已创建');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Button type="primary" onClick={() => setModalOpen(true)}>
        新增司机
      </Button>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={drivers} />

      <Modal title="新增司机" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSubmit}>
        <Form layout="vertical" form={form}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="licenseNumber" label="驾照号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="联系方式">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
