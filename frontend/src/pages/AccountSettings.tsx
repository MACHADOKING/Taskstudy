import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { PrivateRoute } from '../components/PrivateRoute';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import { accountService, AccountProfile, NotificationSettingsPayload } from '../services/accountService';
import { useAuth } from '../hooks/useAuth';

const Page = styled.main`
  max-width: 960px;
  margin: 32px auto 56px;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Hero = styled.section`
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(14, 116, 144, 0.08));
  border-radius: ${(p) => p.theme.borderRadius.large};
  padding: 28px 32px;
  color: ${(p) => p.theme.colors.text};
  box-shadow: ${(p) => p.theme.shadows.medium};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HeroBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.38);
  font-size: 1.4rem;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
`;

const HeroSubtitle = styled.p`
  margin: 0;
  font-size: 1rem;
  color: ${(p) => p.theme.colors.textLight};
  max-width: 640px;
`;

const CardStack = styled.section`
  display: grid;
  gap: 24px;
`;

const Card = styled.section`
  background: ${(p) => p.theme.colors.white};
  border-radius: ${(p) => p.theme.borderRadius.large};
  box-shadow: ${(p) => p.theme.shadows.medium};
  border: 1px solid ${(p) => p.theme.colors.border};
  padding: 28px 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 720px) {
    padding: 22px;
  }
`;

const CardHeader = styled.header`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: ${(p) => p.theme.colors.text};
`;

const CardDescription = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: ${(p) => p.theme.colors.textLight};
`;

const FieldGrid = styled.div`
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: ${(p) => p.theme.colors.text};
`;

const HelperText = styled.span`
  font-size: 0.85rem;
  color: ${(p) => p.theme.colors.textLight};
`;

const AvatarSection = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: center;
`;

const AvatarPreview = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(37, 99, 235, 0.25);
  background: ${(p) => p.theme.colors.backgroundLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.6rem;
  color: ${(p) => p.theme.colors.primary};
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const OutlineButton = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1.3rem;
  border-radius: ${(p) => p.theme.borderRadius.medium};
  border: 1px solid ${(p) => (p.$primary ? p.theme.colors.primary : p.theme.colors.border)};
  background: ${(p) => (p.$primary ? p.theme.colors.primary : 'transparent')};
  color: ${(p) => (p.$primary ? '#fff' : p.theme.colors.text)};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background: ${(p) => (p.$primary ? p.theme.colors.primaryDark : p.theme.colors.backgroundLight)};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    transform: none;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.16);
  color: #15803d;
  font-weight: 600;
  font-size: 0.85rem;
`;

const GoogleActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const GoogleWrapper = styled.div<{ $disabled?: boolean }>`
  display: inline-flex;
  pointer-events: ${(p) => (p.$disabled ? 'none' : 'auto')};
  opacity: ${(p) => (p.$disabled ? 0.6 : 1)};
  padding: 0.35rem;
  border-radius: 999px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.background};
  box-shadow: ${(p) => p.theme.shadows.small};
  max-width: max-content;
`;

const TextInput = styled.input`
  height: 44px;
  padding: 0 14px;
  border-radius: ${(p) => p.theme.borderRadius.medium};
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;

const ReadonlyInput = styled(TextInput)`
  background: ${(p) => p.theme.colors.backgroundLight};
  border-style: dashed;
  cursor: not-allowed;
`;

const ToggleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ToggleItem = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.borderRadius.medium};
  background: ${(p) => (p.$disabled ? p.theme.colors.backgroundLight : p.theme.colors.background)};
  opacity: ${(p) => (p.$disabled ? 0.6 : 1)};
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: ${(p) => (p.$disabled ? p.theme.colors.border : p.theme.colors.primary)};
    box-shadow: ${(p) => (p.$disabled ? 'none' : '0 12px 24px rgba(15, 23, 42, 0.08)')};
  }
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: ${(p) => p.theme.colors.primary};
`;

const ToggleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ToggleTitle = styled.span`
  font-weight: 600;
  color: ${(p) => p.theme.colors.text};
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`;

const ToggleDescription = styled.span`
  font-size: 0.85rem;
  color: ${(p) => p.theme.colors.textLight};
`;

const ToggleIcon = styled.img`
  width: 20px;
  height: 20px;
`;

const Tip = styled.span`
  font-size: 0.85rem;
  color: ${(p) => p.theme.colors.textLight};
`;

const IntegrationNotice = styled.div`
  margin-top: 16px;
  padding: 18px 20px;
  border-radius: ${(p) => p.theme.borderRadius.medium};
  border: 1px dashed ${(p) => p.theme.colors.primary};
  background: linear-gradient(135deg, ${(p) => p.theme.colors.primary}12, ${(p) => p.theme.colors.backgroundLight});
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const IntegrationTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${(p) => p.theme.colors.primary};
`;

const IntegrationDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${(p) => p.theme.colors.textLight};
`;

const IntegrationSteps = styled.ol`
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  color: ${(p) => p.theme.colors.text};

  li {
    line-height: 1.5;
  }
`;

const IntegrationActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const CodeBadge = styled.code`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.95rem;
  border-radius: ${(p) => p.theme.borderRadius.medium};
  background: ${(p) => p.theme.colors.background};
  border: 1px solid ${(p) => p.theme.colors.primary};
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
`;

const CopyCodeButton = styled.button`
  border: none;
  background: ${(p) => p.theme.colors.primary};
  color: #fff;
  padding: 0.45rem 0.95rem;
  border-radius: ${(p) => p.theme.borderRadius.small};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: ${(p) => p.theme.colors.primaryDark};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const OpenBotButton = styled.button`
  border: 1px solid ${(p) => p.theme.colors.primary};
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.primary};
  padding: 0.45rem 0.95rem;
  border-radius: ${(p) => p.theme.borderRadius.small};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;

  &:hover {
    background: ${(p) => p.theme.colors.primaryLight ?? '#dbeafe'};
    color: ${(p) => p.theme.colors.primaryDark ?? '#1d4ed8'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const IntegrationStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${(p) => p.theme.colors.success ?? '#15803d'};
`;

const BotLink = styled.a`
  color: ${(p) => p.theme.colors.primary};
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const SaveBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
`;

const SaveButton = styled.button<{ $loading?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0.85rem 1.8rem;
  border-radius: ${(p) => p.theme.borderRadius.large};
  border: none;
  background: ${(p) => p.theme.colors.primary};
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 18px 36px rgba(37, 99, 235, 0.25);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 22px 40px rgba(37, 99, 235, 0.28);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    transform: none;
    box-shadow: none;
  }
`;

const LoadingCard = styled.div`
  background: ${(p) => p.theme.colors.white};
  border-radius: ${(p) => p.theme.borderRadius.large};
  padding: 36px;
  box-shadow: ${(p) => p.theme.shadows.medium};
  display: flex;
  justify-content: center;
  color: ${(p) => p.theme.colors.textLight};
`;

export const AccountSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateCurrentUser } = useAuth();
  const hasGoogleSignIn = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<{ linked: boolean; linkCode: string | null; botUsername: string }>(
    {
      linked: false,
      linkCode: null,
      botUsername: '',
    }
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<NotificationSettingsPayload>({
    notificationEmail: '',
    phone: '',
    notifyByEmail: true,
    notifyByTelegram: false,
    notifyByWhatsApp: false,
    consentGiven: false,
  });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [settingsData, profileData] = await Promise.all([
          accountService.getNotificationSettings(),
          accountService.getProfile(),
        ]);

        if (!isMounted) {
          return;
        }

        const effectiveEmail =
          (settingsData.notificationEmail?.trim?.() ?? '') ||
          profileData.notificationEmail ||
          profileData.email;

        const mergedForm: NotificationSettingsPayload = {
          notificationEmail: effectiveEmail,
          phone: settingsData.phone ?? profileData.phone ?? '',
          notifyByEmail: settingsData.notifyByEmail,
          notifyByTelegram: settingsData.notifyByTelegram,
          notifyByWhatsApp: settingsData.notifyByWhatsApp,
          consentGiven: settingsData.consentGiven,
        };

        setForm(mergedForm);

        setTelegramStatus({
          linked: settingsData.telegramLinked,
          linkCode: settingsData.telegramLinked ? null : settingsData.telegramLinkCode ?? null,
          botUsername: settingsData.telegramBotUsername ?? '',
        });

        const derivedProfile: AccountProfile = {
          ...profileData,
          notificationEmail: effectiveEmail,
          phone: profileData.phone ?? settingsData.phone ?? '',
        };

        setProfile(derivedProfile);

        const previewSource =
          derivedProfile.avatarUrl ||
          derivedProfile.googlePictureUrl ||
          '';

        setAvatarPreview(previewSource);

        updateCurrentUser({
          notificationEmail: effectiveEmail,
          avatarUrl: previewSource || undefined,
          googleConnected: derivedProfile.googleConnected,
          googlePictureUrl: derivedProfile.googlePictureUrl,
        });
      } catch (error) {
        if (isMounted) {
          console.warn('Falha ao carregar preferências', error);
          showToast.apiError(error, 'toastNotificationSettingsError');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [updateCurrentUser, user?.id]);

  const avatarInitials = React.useMemo(() => {
    const sourceName = profile?.name ?? user?.name ?? '';
    const parts = sourceName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) {
      return '🙂';
    }
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }, [profile?.name, user?.name]);

  const botMention = React.useMemo(() => {
    if (!telegramStatus.botUsername || telegramStatus.botUsername.trim().length === 0) {
      return '';
    }
    const username = telegramStatus.botUsername.trim();
    return username.startsWith('@') ? username : `@${username}`;
  }, [telegramStatus.botUsername]);

  const botBaseHref = React.useMemo(() => {
    if (!botMention) {
      return '';
    }
    return `https://t.me/${botMention.slice(1)}`;
  }, [botMention]);

  const botDeepLink = React.useMemo(() => {
    if (!botBaseHref) {
      return '';
    }
    const rawCode = telegramStatus.linkCode?.trim();
    if (!rawCode) {
      return botBaseHref;
    }
    return `${botBaseHref}?start=${encodeURIComponent(rawCode)}`;
  }, [botBaseHref, telegramStatus.linkCode]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCopyTelegramCode = async () => {
    if (!telegramStatus.linkCode) {
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      showToast.error('toastTelegramCopyError');
      return;
    }

    try {
      await navigator.clipboard.writeText(telegramStatus.linkCode);
      showToast.success('toastTelegramCopySuccess');
    } catch (error) {
      showToast.apiError(error, 'toastTelegramCopyError');
    }
  };

  const handleOpenTelegramBot = () => {
    if (!botBaseHref) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const destination = botDeepLink || botBaseHref;
    window.open(destination, '_blank', 'noopener,noreferrer');
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload: NotificationSettingsPayload = {
        ...form,
        notifyByEmail: form.consentGiven ? form.notifyByEmail : false,
        notifyByTelegram: form.consentGiven ? form.notifyByTelegram : false,
        notifyByWhatsApp: form.consentGiven ? form.notifyByWhatsApp : false,
      };

      const response = await accountService.updateNotificationSettings(payload);
      setForm(payload);
      setProfile((prev) =>
        prev
          ? { ...prev, notificationEmail: payload.notificationEmail, phone: payload.phone }
          : prev
      );
      updateCurrentUser({ notificationEmail: payload.notificationEmail });

      setTelegramStatus((previous) => ({
        botUsername: previous.botUsername,
        linked: response.telegramLinked,
        linkCode: response.telegramLinked ? null : response.telegramLinkCode ?? null,
      }));

      let displayedToast = false;

      if (payload.notifyByTelegram) {
        if (response.telegramLinked) {
          showToast.success('toastTelegramLinkedSuccess');
          displayedToast = true;
        } else if (response.telegramLinkCode) {
          showToast.info('toastTelegramLinkInstructions', { autoClose: 6000 });
          displayedToast = true;
        }
      }

      if (!displayedToast) {
        showToast.success('toastNotificationSettingsSaved');
      }
    } catch (error) {
      showToast.apiError(error, 'toastNotificationSettingsError');
    } finally {
      setSaving(false);
    }
  };

  const normalizedPhone = (form.phone ?? '').replace(/\D/g, '');
  const hasPhoneNumber = normalizedPhone.length >= 10;
  const channelsDisabled = !form.consentGiven;
  const messagingDisabled = channelsDisabled || !hasPhoneNumber;

  useEffect(() => {
    if (!messagingDisabled) {
      return;
    }

    setForm((previous) => {
      if (!previous.notifyByTelegram && !previous.notifyByWhatsApp) {
        return previous;
      }

      return {
        ...previous,
        notifyByTelegram: false,
        notifyByWhatsApp: false,
      };
    });
  }, [messagingDisabled]);

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast.error('toastProfilePhotoError');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setPendingAvatar(result);
    };
    reader.onerror = () => {
      showToast.error('toastProfilePhotoError');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleUploadAvatar = async () => {
    if (!pendingAvatar) {
      return;
    }

    try {
      setAvatarUploading(true);
      const response = await accountService.updateProfilePhoto(pendingAvatar);
      setAvatarPreview(response.avatarUrl);
      setPendingAvatar(null);
      setProfile((prev) =>
        prev ? { ...prev, avatarUrl: response.avatarUrl } : prev
      );
      updateCurrentUser({ avatarUrl: response.avatarUrl });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showToast.success('toastProfilePhotoUpdated');
    } catch (error) {
      showToast.apiError(error, 'toastProfilePhotoError');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      showToast.error('toastGoogleConnectError');
      return;
    }

    try {
      setGoogleSyncing(true);
      const connected = await accountService.connectGoogleAccount(credentialResponse.credential);

      setProfile((prev) => ({
        ...(prev ?? connected),
        ...connected,
      }));

      const previewSource =
        connected.avatarUrl ||
        connected.googlePictureUrl ||
        avatarPreview;

      setAvatarPreview(previewSource);
      setPendingAvatar(null);

      updateCurrentUser({
        avatarUrl: connected.avatarUrl || connected.googlePictureUrl || undefined,
        googleConnected: connected.googleConnected,
        googlePictureUrl: connected.googlePictureUrl,
        notificationEmail: connected.notificationEmail,
      });

      if (connected.notificationEmail) {
        setForm((prev) => ({
          ...prev,
          notificationEmail: connected.notificationEmail,
        }));
      }

      showToast.success('toastGoogleConnectSuccess');
    } catch (error) {
      showToast.apiError(error, 'toastGoogleConnectError');
    } finally {
      setGoogleSyncing(false);
    }
  };

  const handleGoogleError = () => {
    showToast.error('toastGoogleConnectError');
  };

  if (loading) {
    return (
      <Page>
        <Hero>
          <HeroBadge>⚙️</HeroBadge>
          <HeroTitle>{t('accountSettingsTitle')}</HeroTitle>
          <HeroSubtitle>{t('accountSettingsSubtitle')}</HeroSubtitle>
        </Hero>
        <LoadingCard>{t('loading')}</LoadingCard>
      </Page>
    );
  }

  return (
    <Page>
      <Hero>
        <HeroBadge>⚙️</HeroBadge>
        <HeroTitle>{t('accountSettingsTitle')}</HeroTitle>
        <HeroSubtitle>{t('accountSettingsSubtitle')}</HeroSubtitle>
      </Hero>

      <CardStack>
        <Card>
          <CardHeader>
            <CardTitle>{t('profileIdentityTitle')}</CardTitle>
            <CardDescription>{t('profileIdentityDescription')}</CardDescription>
          </CardHeader>

          <Field>
            <Label htmlFor="primaryEmail">{t('primaryEmailLabel')}</Label>
            <ReadonlyInput
              id="primaryEmail"
              value={profile?.email ?? user?.email ?? ''}
              readOnly
              aria-readonly="true"
              tabIndex={-1}
            />
            <HelperText>{t('primaryEmailHint')}</HelperText>
          </Field>

          <AvatarSection>
            <AvatarPreview aria-label={t('profileAvatarPreviewAlt')}>
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt={t('profileAvatarPreviewAlt')} />
              ) : (
                avatarInitials
              )}
            </AvatarPreview>
            <AvatarActions>
              <Label as="span">{t('profileAvatarLabel')}</Label>
              <HelperText>{t('profileAvatarHint')}</HelperText>
              <ActionButtons>
                <OutlineButton type="button" onClick={handleChoosePhoto} disabled={avatarUploading}>
                  {t('profileAvatarUpload')}
                </OutlineButton>
                <OutlineButton
                  type="button"
                  onClick={handleUploadAvatar}
                  disabled={!pendingAvatar || avatarUploading}
                  $primary
                >
                  {avatarUploading ? t('profileAvatarLoading') : t('profileAvatarSave')}
                </OutlineButton>
              </ActionButtons>
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelection}
              />
            </AvatarActions>
          </AvatarSection>

          <GoogleActions>
            <Label as="span">{t('googleConnectTitle')}</Label>
            {profile?.googleConnected ? (
              <>
                <StatusBadge aria-live="polite">✅ {t('googleConnectedStatus')}</StatusBadge>
                <HelperText>{t('googleConnectedDescription')}</HelperText>
              </>
            ) : (
              <HelperText>{t('googleConnectDescription')}</HelperText>
            )}
            {hasGoogleSignIn && !profile?.googleConnected && (
              <>
                <GoogleWrapper $disabled={googleSyncing} aria-label={t('googleConnectButton')}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signin_with"
                    shape="pill"
                    theme="outline"
                    size="large"
                    width="280"
                    logo_alignment="left"
                  />
                </GoogleWrapper>
                {googleSyncing && <HelperText>{t('googleConnectButtonLoading')}</HelperText>}
              </>
            )}
          </GoogleActions>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('contactInformationTitle')}</CardTitle>
            <CardDescription>{t('contactInformationDescription')}</CardDescription>
          </CardHeader>

          <FieldGrid>
            <Field>
              <Label htmlFor="notificationEmail">{t('contactEmailLabel')}</Label>
              <TextInput
                id="notificationEmail"
                name="notificationEmail"
                type="email"
                placeholder="nome@exemplo.com"
                value={form.notificationEmail}
                onChange={onChange}
              />
              <HelperText>{t('contactEmailHint')}</HelperText>
            </Field>

            <Field>
              <Label htmlFor="phone">{t('contactPhoneLabel')}</Label>
              <TextInput
                id="phone"
                name="phone"
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={onChange}
              />
              <HelperText>{t('contactPhoneHint')}</HelperText>
            </Field>
          </FieldGrid>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('consentTitle')}</CardTitle>
            <CardDescription>{t('consentDescription')}</CardDescription>
          </CardHeader>

          <ToggleItem>
            <Checkbox
              type="checkbox"
              name="consentGiven"
              checked={form.consentGiven}
              onChange={onChange}
            />
            <ToggleText>
              <ToggleTitle>{t('consentToggleTitle')}</ToggleTitle>
              <ToggleDescription>{t('consentToggleDescription')}</ToggleDescription>
            </ToggleText>
          </ToggleItem>
          <Tip>{t('consentTip')}</Tip>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('notificationChannelsTitle')}</CardTitle>
            <CardDescription>{t('notificationChannelsDescription')}</CardDescription>
          </CardHeader>

          <ToggleList>
            <ToggleItem $disabled={channelsDisabled}>
              <Checkbox
                type="checkbox"
                name="notifyByEmail"
                checked={form.notifyByEmail && !channelsDisabled}
                onChange={onChange}
                disabled={channelsDisabled}
              />
              <ToggleText>
                <ToggleTitle>
                  <ToggleIcon src="/o-email-removebg.png" alt="" aria-hidden="true" />
                  {t('channelEmailTitle')}
                </ToggleTitle>
                <ToggleDescription>{t('channelEmailDescription')}</ToggleDescription>
              </ToggleText>
            </ToggleItem>

            <ToggleItem $disabled={messagingDisabled}>
              <Checkbox
                type="checkbox"
                name="notifyByTelegram"
                checked={form.notifyByTelegram && !messagingDisabled}
                onChange={onChange}
                disabled={messagingDisabled}
              />
              <ToggleText>
                <ToggleTitle>
                  <ToggleIcon src="/telegrama-removebg.png" alt="" aria-hidden="true" />
                  {t('channelTelegramTitle')}
                </ToggleTitle>
                <ToggleDescription>{t('channelTelegramDescription')}</ToggleDescription>
              </ToggleText>
            </ToggleItem>

            <ToggleItem $disabled={messagingDisabled}>
              <Checkbox
                type="checkbox"
                name="notifyByWhatsApp"
                checked={form.notifyByWhatsApp && !messagingDisabled}
                onChange={onChange}
                disabled={messagingDisabled}
              />
              <ToggleText>
                <ToggleTitle>
                  <ToggleIcon src="/whatsapp-removebg.png" alt="" aria-hidden="true" />
                  {t('channelWhatsAppTitle')}
                </ToggleTitle>
                <ToggleDescription>{t('channelWhatsAppDescription')}</ToggleDescription>
              </ToggleText>
            </ToggleItem>
          </ToggleList>

          {form.notifyByTelegram && !messagingDisabled && (
            <IntegrationNotice>
              {telegramStatus.linked ? (
                <IntegrationStatus>
                  <span>✅</span>
                  {t('telegramLinkConnectedStatus')}
                </IntegrationStatus>
              ) : (
                <>
                  <IntegrationTitle>{t('telegramLinkTitle')}</IntegrationTitle>
                  <IntegrationDescription>{t('telegramLinkDescription')}</IntegrationDescription>
                  <IntegrationSteps>
                    <li>
                      {t('telegramLinkStepOpenBot')}
                      {botMention && botBaseHref && (
                        <>
                          {' '}
                          <BotLink
                            href={botDeepLink || botBaseHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {botMention}
                          </BotLink>
                        </>
                      )}
                    </li>
                    <li>{t('telegramLinkStepSendCode')}</li>
                    <li>{t('telegramLinkStepWaitConfirmation')}</li>
                  </IntegrationSteps>
                  {(botBaseHref || telegramStatus.linkCode) && (
                    <IntegrationActions>
                      {botBaseHref && (
                        <OpenBotButton type="button" onClick={handleOpenTelegramBot}>
                          {t('telegramOpenBotButton')}
                        </OpenBotButton>
                      )}
                      {telegramStatus.linkCode && (
                        <>
                          <CodeBadge>{telegramStatus.linkCode}</CodeBadge>
                          <CopyCodeButton type="button" onClick={handleCopyTelegramCode}>
                            {t('telegramCopyCode')}
                          </CopyCodeButton>
                        </>
                      )}
                    </IntegrationActions>
                  )}
                  {!telegramStatus.linkCode && (
                    <IntegrationDescription>{t('telegramLinkAwaitCode')}</IntegrationDescription>
                  )}
                </>
              )}
            </IntegrationNotice>
          )}

          {channelsDisabled && <Tip>{t('channelsDisabledHint')}</Tip>}
          {!channelsDisabled && !hasPhoneNumber && (
            <Tip>{t('channelsPhoneRequiredHint')}</Tip>
          )}
        </Card>
      </CardStack>

      <SaveBar>
        <SaveButton onClick={save} disabled={saving} $loading={saving}>
          {saving ? '⏳ ' : '💾 '}
          {saving ? t('savingStatus') : t('savePreferences')}
        </SaveButton>
      </SaveBar>
    </Page>
  );
};

export default function AccountSettingsRoute() {
  return (
    <PrivateRoute>
      <AccountSettings />
    </PrivateRoute>
  );
}
