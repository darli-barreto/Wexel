"use client";

import { Toaster as Sonner } from 'sonner';
import { COLORS } from '../../config/colors';
import './sonner.css';

export function Toaster() {
  return <Sonner theme="light" position="bottom-right" offset={40} mobileOffset={16} visibleToasts={3}
    containerAriaLabel="Notificaciones" closeButton duration={4000}
    toastOptions={{ closeButtonAriaLabel: 'Cerrar notificación', style: {
      fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12, borderRadius: 3,
      background: COLORS.excel.cell, border: `1px solid ${COLORS.app.border}`, color: COLORS.app.secondary,
      padding: '12px 14px', boxShadow: '0 4px 16px #00000014',
    } }} />;
}
