import { Layout, Menu } from 'antd';
import { useMemo } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  CarOutlined,
  TeamOutlined,
  AlertOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { LoginPage } from './pages/LoginPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { PlaybackPage } from './pages/PlaybackPage';
import { ReportsPage } from './pages/ReportsPage';
import { AlarmsPage } from './pages/AlarmsPage';
import { DriversPage } from './pages/DriversPage';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/monitor', icon: <DashboardOutlined />, label: <Link to="/monitor">实时监控</Link> },
  { key: '/vehicles', icon: <CarOutlined />, label: <Link to="/vehicles">车辆管理</Link> },
  { key: '/drivers', icon: <TeamOutlined />, label: <Link to="/drivers">司机管理</Link> },
  { key: '/playback', icon: <DashboardOutlined />, label: <Link to="/playback">轨迹回放</Link> },
  { key: '/reports', icon: <BarChartOutlined />, label: <Link to="/reports">报表</Link> },
  { key: '/alarms', icon: <AlertOutlined />, label: <Link to="/alarms">告警中心</Link> }
];

const AppShell = () => {
  const location = useLocation();
  const selectedKeys = useMemo(() => {
    const item = menuItems.find((entry) => location.pathname.startsWith(entry.key));
    return item ? [item.key] : [];
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100%' }}>
      <Sider collapsible>
        <div style={{ color: 'white', textAlign: 'center', padding: '16px' }}>Venicars</div>
        <Menu theme="dark" mode="inline" selectedKeys={selectedKeys} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', fontWeight: 600 }}>车队管理平台</Header>
        <Content style={{ margin: '24px', padding: 24, background: '#fff' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/monitor" element={<MonitoringPage />} />
            <Route path="/playback" element={<PlaybackPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/alarms" element={<AlarmsPage />} />
            <Route path="*" element={<MonitoringPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default function App() {
  return <AppShell />;
}
