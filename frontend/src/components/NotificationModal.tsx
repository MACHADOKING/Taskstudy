import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { notificationService, NotificationItem } from '../services/notificationService';

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};
  width: 560px;
  max-width: 90vw;
  border-radius: ${(p) => p.theme.borderRadius.large};
  box-shadow: ${(p) => p.theme.shadows.large};
  overflow: hidden;
`;

const Header = styled.div`
  padding: 16px 20px;
  background: ${(p) => p.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const CloseBtn = styled.button`
  background: rgba(255,255,255,0.15);
  color: white;
  border-radius: ${(p) => p.theme.borderRadius.small};
  padding: 6px 10px;
  border: 1px solid rgba(255,255,255,0.25);
  transition: filter .15s ease;
  &:hover { filter: brightness(0.95); }
`;

const Content = styled.div`
  max-height: 60vh;
  overflow: auto;
`;

const Item = styled.div<{ unread: boolean }>`
  padding: 14px 16px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => (p.unread ? 'rgba(255, 193, 7, 0.12)' : 'transparent')};
`;

const ItemTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

const ItemMessage = styled.div`
  font-size: 0.95rem;
  opacity: 0.9;
`;

const Footer = styled.div`
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ActionBtn = styled.button`
  padding: 10px 14px;
  border-radius: ${(p) => p.theme.borderRadius.small};
  background: ${(p) => p.theme.colors.primary};
  color: #fff;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  transition: transform .05s ease, filter .15s ease;
  &:active { transform: translateY(1px); }
  &:hover { filter: brightness(1.03); }
`;

type Props = { open: boolean; onClose: () => void; onMarkedAll?: () => void };

export const NotificationModal: React.FC<Props> = ({ open, onClose, onMarkedAll }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { notifications, unreadCount } = await notificationService.list();
      setItems(notifications);
      setUnreadCount(unreadCount);
    })();
  }, [open]);

  const handleMarkAll = async () => {
    await notificationService.markAllRead();
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnreadCount(0);
    onMarkedAll?.();
  };

  if (!open) return null;
  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Notificações">
        <Header>
          <Title>Notificações {unreadCount ? `(${unreadCount})` : ''}</Title>
          <CloseBtn onClick={onClose}>Fechar</CloseBtn>
        </Header>
        <Content>
          {items.length === 0 ? (
            <Item unread={false}>Nenhuma notificação por aqui.</Item>
          ) : (
            items.map((n) => (
              <Item key={n.id} unread={!n.read}>
                <ItemTitle>{n.title}</ItemTitle>
                <ItemMessage>{n.message}</ItemMessage>
              </Item>
            ))
          )}
        </Content>
        <Footer>
          <ActionBtn onClick={handleMarkAll}>Marcar todas como lidas</ActionBtn>
        </Footer>
      </Modal>
    </Backdrop>
  );
};
