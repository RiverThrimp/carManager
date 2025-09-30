import { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { api } from '../api/client';

interface Vehicle {
  id: string;
  vin: string;
  plateNumber: string;
  deviceId?: string | null;
  status: 'active' | 'inactive';
  driver?: { id: string; name: string } | null;
}

interface DriverOption {
  id: string;
  name: string;
}

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await api.get<Vehicle[]>('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      message.error('无法加载车辆列表');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await api.get<DriverOption[]>('/drivers');
      setDrivers(response.data);
    } catch (error) {
      message.error('无法加载司机列表');
      console.error(error);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadDrivers();
  }, []);

  const columns: ColumnsType<Vehicle> = [
    { title: '车牌', dataIndex: 'plateNumber' },
    { title: 'VIN', dataIndex: 'vin' },
    { title: '终端号', dataIndex: 'deviceId', render: (value?: string) => value ?? '未绑定' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: Vehicle['status']) => (
        <Tag color={status === 'active' ? 'green' : 'volcano'}>{status === 'active' ? '运行中' : '停用'}</Tag>
      )
    },
    {
      title: '司机',
      dataIndex: ['driver', 'name'],
      render: (value: string | undefined) => value ?? '未分配'
    }
  ];

  const closeModal = () => {
    setModalOpen(false);
    setEditingVehicle(null);
    form.resetFields();
  };

  const openCreate = () => {
    setEditingVehicle(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.setFieldsValue({
      plateNumber: vehicle.plateNumber,
      vin: vehicle.vin,
      deviceId: vehicle.deviceId ?? undefined,
      status: vehicle.status,
      driverId: vehicle.driver?.id
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        plateNumber: values.plateNumber,
        vin: values.vin,
        status: values.status,
        deviceId: values.deviceId?.trim() || null,
        driverId: values.driverId ?? null
      };

      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, payload);
        message.success('车辆信息已更新');
      } else {
        await api.post('/vehicles', payload);
        message.success('车辆已创建');
      }

      closeModal();
      loadVehicles();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  const tableColumns: ColumnsType<Vehicle> = [
    ...columns,
    {
      title: '操作',
      key: 'actions',
      render: (_value, record) => (
        <Button type="link" onClick={() => openEdit(record)}>
          编辑
        </Button>
      )
    }
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Button type="primary" onClick={openCreate}>
        新增车辆
      </Button>
      <Table rowKey="id" loading={loading} columns={tableColumns} dataSource={vehicles} />

      <Modal
        title={editingVehicle ? '编辑车辆' : '新增车辆'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="车牌号码" name="plateNumber" rules={[{ required: true }]}>
            <Input placeholder="浙A12345" />
          </Form.Item>
          <Form.Item label="VIN" name="vin" rules={[{ required: true, len: 17 }]}>
            <Input placeholder="17位VIN码" maxLength={17} />
          </Form.Item>
          <Form.Item label="终端号" name="deviceId" tooltip="与JT/T 808 终端手机号一致">
            <Input placeholder="例如 013812345678" maxLength={12} />
          </Form.Item>
          <Form.Item label="关联司机" name="driverId">
            <Select
              allowClear
              placeholder="选择司机"
              options={drivers.map((driver) => ({ label: driver.name, value: driver.id }))}
            />
          </Form.Item>
          <Form.Item label="状态" name="status" initialValue="active">
            <Select
              options={[
                { value: 'active', label: '运行中' },
                { value: 'inactive', label: '停用' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
