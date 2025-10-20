import React from 'react';
import { showToast } from '../utils/toast';
import { useTranslation } from '../hooks/useTranslation';

export const TestToast: React.FC = () => {
  const { t } = useTranslation();

  const testSuccess = () => {
    showToast.success('toastTestSuccess');
  };

  const testError = () => {
    showToast.error('toastTestError');
  };

  const testWarning = () => {
    showToast.warning('toastTestWarning');
  };

  const testInfo = () => {
    showToast.info('toastTestInfo');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{t('toastTestTitle')}</h2>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={testSuccess}>{t('toastTestSuccess')}</button>
        <button onClick={testError}>{t('toastTestError')}</button>
        <button onClick={testWarning}>{t('toastTestWarning')}</button>
        <button onClick={testInfo}>{t('toastTestInfo')}</button>
      </div>
    </div>
  );
};