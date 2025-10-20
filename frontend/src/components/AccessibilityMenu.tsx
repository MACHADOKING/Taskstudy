import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../hooks/useTranslation';
import { useAccessibility } from '../hooks/useAccessibility';
import { useVoiceCommands } from '../hooks/useVoiceCommands';

const PANEL_WIDTH = 360;

const AccessibilityTab = styled.button<{ $isOpen: boolean }>`
  position: fixed;
  top: 50%;
  right: ${(props) => (props.$isOpen ? `${PANEL_WIDTH}px` : '0')};
  transform: translateY(-50%);
  z-index: 1000;
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 14px 0 0 14px;
  padding: 20px 12px;
  cursor: pointer;
  box-shadow: -8px 10px 22px rgba(15, 23, 42, 0.28);
  transition: right 0.3s ease, background 0.3s ease;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 2px solid rgba(255, 255, 255, 0.35);

  &:hover {
    background: ${(props) => props.theme.colors.primaryDark};
  }

  &:focus {
    outline: 3px solid ${(props) => props.theme.colors.accent};
    outline-offset: 2px;
  }

  .desktop-text {
    display: block;
  }

  .mobile-icon {
    display: none;
  }

  .accessibility-reduced-motion & {
    transition: background 0.3s ease;
  }

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    top: auto;
    bottom: 20px;
    right: 20px;
    transform: none;
    opacity: ${(props) => (props.$isOpen ? 0 : 1)};
    visibility: ${(props) => (props.$isOpen ? 'hidden' : 'visible')};
    border-radius: 50%;
    width: 56px;
    height: 56px;
    padding: 0;
    writing-mode: horizontal-tb;
    text-orientation: initial;
    font-size: 1.2rem;
    min-height: auto;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.3);
    border: none;
    transition: opacity 0.3s ease, background 0.3s ease;

    .desktop-text {
      display: none;
    }

    .mobile-icon {
      display: block;
    }
  }
`;

const AccessibilityOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  visibility: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease;
  z-index: 998;

  .accessibility-reduced-motion & {
    transition: none;
  }

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    display: none;
  }
`;

const AccessibilityPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%) translateX(${(props) => (props.$isOpen ? '0' : '100%')});
  width: ${PANEL_WIDTH}px;
  max-height: calc(100vh - 80px);
  background: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  box-shadow: -28px 0 50px rgba(15, 23, 42, 0.25);
  border-radius: 20px 0 0 20px;
  border-left: 1px solid ${(props) => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  visibility: ${(props) => (props.$isOpen ? 'visible' : 'hidden')};
  transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;
  z-index: 999;
  pointer-events: ${(props) => (props.$isOpen ? 'auto' : 'none')};

  .accessibility-reduced-motion & {
    transition: none;
  }

  .accessibility-high-contrast & {
    background: black;
    color: white;
    border-color: white;
  }

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    top: 20px;
    right: 20px;
    bottom: 20px;
    left: 20px;
    width: auto;
    max-height: none;
    border-radius: 16px;
    transform: translateY(${(props) => (props.$isOpen ? '0' : '24px')});
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.35);
    border: none;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 2px solid ${(props) => props.theme.colors.border};
  background: ${(props) => props.theme.colors.backgroundLight};

  .accessibility-high-contrast & {
    background: black;
    border-bottom-color: white;
  }
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.text};
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .accessibility-high-contrast & {
    color: white;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.text};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.hover};
  }
  
  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
  }
  
  .accessibility-high-contrast & {
    color: ${(props) => props.theme.colors.white};
    border: 1px solid ${(props) => props.theme.colors.white};
    
    &:hover {
      background: ${(props) => props.theme.colors.white};
      color: ${(props) => props.theme.colors.text};
    }
  }
`;

const PanelContent = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  
  .accessibility-high-contrast & {
    background: black;
  }
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  .accessibility-high-contrast & {
    border-bottom-color: white;
  }
`;

const SettingLabel = styled.label`
  color: ${props => props.theme.colors.text};
  font-weight: 500;
  cursor: pointer;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .accessibility-high-contrast & {
    color: white;
  }
`;

const SettingDescription = styled.span`
  font-size: 0.85rem;
  color: ${props => props.theme.colors.textLight};

  .accessibility-high-contrast & {
    color: ${(props) => props.theme.colors.white};
  }
`;

const ToggleSwitch = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  width: 50px;
  height: 26px;
  background: ${props => props.theme.colors.border};
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s ease;

  &:checked {
    background: ${props => props.theme.colors.primary};
  }

  &::before {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: ${(props) => props.theme.colors.white};
    top: 2px;
    left: 2px;
    transition: transform 0.3s ease;
  }

  &:checked::before {
    transform: translateX(24px);
  }

  &:focus {
    outline: 2px solid ${props => props.theme.colors.accent};
    outline-offset: 2px;
  }

  .accessibility-reduced-motion & {
    transition: none;
    
    &::before {
      transition: none;
    }
  }

  .accessibility-high-contrast & {
    background: ${(props) => props.theme.colors.white};
    border: 2px solid ${(props) => props.theme.colors.white};
    
    &:checked {
      background: yellow;
    }
    
    &::before {
      background: ${(props) => props.theme.colors.text};
    }
  }
`;

const VoiceButton = styled.button<{ isListening: boolean }>`
  width: 100%;
  padding: 0.75rem;
  background: ${props => props.isListening ? props.theme.colors.error : props.theme.colors.success};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.medium};
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.9;
  }

  &:focus {
    outline: 2px solid ${props => props.theme.colors.accent};
    outline-offset: 2px;
  }

  .accessibility-reduced-motion & {
    transition: none;
  }
`;

const KeyboardHint = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background: ${props => props.theme.colors.backgroundLight};
  border-radius: ${props => props.theme.borderRadius.medium};
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textLight};

  .accessibility-high-contrast & {
    background: ${(props) => props.theme.colors.white};
    color: ${(props) => props.theme.colors.text};
  }
`;

interface AccessibilityMenuProps {
  onNavigateToTasks?: () => void;
  onNavigateToDashboard?: () => void;
  onCreateTask?: () => void;
  onToggleLanguage?: () => void;
}

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  onNavigateToTasks,
  onNavigateToDashboard,
  onCreateTask,
  onToggleLanguage,
}) => {
  const { t } = useTranslation();
  const { settings, toggleSetting, announceToScreenReader } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  // Voice command configuration
  const voiceCommands = [
    {
      command: t('dashboard'),
      action: () => onNavigateToDashboard?.(),
      description: t('navigateToDashboardCommand'),
    },
    {
      command: t('tasks'),
      action: () => onNavigateToTasks?.(),
      description: t('navigateToTasksCommand'),
    },
    {
      command: t('newTask'),
      action: () => onCreateTask?.(),
      description: t('createTaskCommand'),
    },
    {
      command: 'language',
      action: () => onToggleLanguage?.(),
      description: t('toggleLanguageCommand'),
    },
  ];

  const { isListening, isSupported, startListening, stopListening } = useVoiceCommands(voiceCommands);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + A to toggle accessibility menu
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        setIsOpen(prev => !prev);
        announceToScreenReader(isOpen ? t('accessibilityMenuClosed') : t('accessibilityMenuOpened'));
      }

      // Escape to close menu
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        announceToScreenReader(t('accessibilityMenuClosed'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, announceToScreenReader, t]);

  const handleToggle = (key: keyof typeof settings) => {
    toggleSetting(key);

    const labelMap: Record<keyof typeof settings, string> = {
      screenReaderMode: t('screenReaderMode'),
      highContrast: t('highContrast'),
      largeText: t('largeText'),
      keyboardNavigation: t('keyboardNavigation'),
      reduceAnimations: t('reduceAnimations'),
      voiceCommands: t('voiceCommands'),
    };

    const template = settings[key]
      ? t('accessibilitySettingDisabled')
      : t('accessibilitySettingEnabled');

    announceToScreenReader(template.replace('{{setting}}', labelMap[key]));
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      announceToScreenReader(t('voiceListeningStopped'));
    } else {
      startListening();
      announceToScreenReader(t('voiceListeningStarted'));
    }
  };

  return (
    <>
      <AccessibilityTab
        $isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('accessibilityMenu')}
        aria-expanded={isOpen}
        title="Alt + A"
      >
        <span className="desktop-text">{t('accessibilityTab')}</span>
        <span className="mobile-icon">♿</span>
      </AccessibilityTab>

      {isOpen && (
        <AccessibilityOverlay 
          $isOpen={isOpen} 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <AccessibilityPanel
        $isOpen={isOpen}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? true : undefined}
        aria-label={t('accessibilityMenu')}
        aria-hidden={isOpen ? undefined : true}
      >
        <PanelHeader>
          <PanelTitle>
            ♿ {t('accessibilityMenu')}
          </PanelTitle>
          <CloseButton 
            onClick={() => setIsOpen(false)}
            aria-label={t('closeAccessibilityMenu')}
            title="ESC"
          >
            ×
          </CloseButton>
        </PanelHeader>
        
        <PanelContent>

        <SettingItem>
          <SettingLabel htmlFor="screen-reader">
            {t('screenReaderMode')}
            <SettingDescription id="screen-reader-desc">
              {t('screenReaderModeDescription')}
            </SettingDescription>
          </SettingLabel>
          <ToggleSwitch
            id="screen-reader"
            checked={settings.screenReaderMode}
            onChange={() => handleToggle('screenReaderMode')}
            aria-describedby="screen-reader-desc"
          />
        </SettingItem>

        <SettingItem>
          <SettingLabel htmlFor="high-contrast">
            {t('highContrast')}
            <SettingDescription id="high-contrast-desc">
              {t('highContrastDescription')}
            </SettingDescription>
          </SettingLabel>
          <ToggleSwitch
            id="high-contrast"
            checked={settings.highContrast}
            onChange={() => handleToggle('highContrast')}
            aria-describedby="high-contrast-desc"
          />
        </SettingItem>

        <SettingItem>
          <SettingLabel htmlFor="large-text">
            {t('largeText')}
            <SettingDescription id="large-text-desc">
              {t('largeTextDescription')}
            </SettingDescription>
          </SettingLabel>
          <ToggleSwitch
            id="large-text"
            checked={settings.largeText}
            onChange={() => handleToggle('largeText')}
            aria-describedby="large-text-desc"
          />
        </SettingItem>

        <SettingItem>
          <SettingLabel htmlFor="reduce-animations">
            {t('reduceAnimations')}
            <SettingDescription id="reduce-animations-desc">
              {t('reduceAnimationsDescription')}
            </SettingDescription>
          </SettingLabel>
          <ToggleSwitch
            id="reduce-animations"
            checked={settings.reduceAnimations}
            onChange={() => handleToggle('reduceAnimations')}
            aria-describedby="reduce-animations-desc"
          />
        </SettingItem>

        {isSupported && (
          <>
            <SettingItem>
              <SettingLabel htmlFor="voice-commands">
                {t('voiceCommands')}
                <SettingDescription id="voice-commands-desc">
                  {t('voiceCommandsDescription')}
                </SettingDescription>
              </SettingLabel>
              <ToggleSwitch
                id="voice-commands"
                checked={settings.voiceCommands}
                onChange={() => handleToggle('voiceCommands')}
                aria-describedby="voice-commands-desc"
              />
            </SettingItem>

            {settings.voiceCommands && (
              <VoiceButton
                isListening={isListening}
                onClick={handleVoiceToggle}
                aria-live="polite"
                aria-pressed={isListening}
              >
                {isListening ? t('stopVoiceCommands') : t('startVoiceCommands')}
              </VoiceButton>
            )}
          </>
        )}

        <KeyboardHint>
          <strong>🎯 {t('keyboardShortcutsTitle')}:</strong><br />
          • {t('keyboardShortcutToggleMenu')}<br />
          • {t('keyboardShortcutTabNavigation')}<br />
          • {t('keyboardShortcutActivate')}<br />
          • {t('keyboardShortcutClose')}
        </KeyboardHint>
        </PanelContent>
      </AccessibilityPanel>
    </>
  );
};