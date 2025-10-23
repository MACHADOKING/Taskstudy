import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import { NotificationModal } from './NotificationModal';
import { notificationService } from '../services/notificationService';

const Nav = styled.nav`
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  padding: 0.85rem 1.75rem;
  box-shadow: ${(props) => props.theme.shadows.medium};

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    padding: 0.75rem 1.1rem;
  }
`;

const NavContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  row-gap: 0.75rem;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    gap: 1rem;
    row-gap: 0.5rem;
    padding: 0;
  }
`;

const Logo = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  text-decoration: none;
  flex-shrink: 0;
  
  &:hover { opacity: 0.9; }
`;

const LogoImg = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  object-fit: cover;
`;

const Brand = styled.span`
  font-size: 1.25rem;
  font-weight: 800;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    font-size: 1.05rem;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 0 0 auto;
  min-width: 0;
  flex-wrap: nowrap;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    order: 3;
    width: 100%;
    flex: 1 1 100%;
    justify-content: space-around;
    gap: 1rem;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
`;

const MenuTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-radius: ${(p) => p.theme.borderRadius.large};
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.12);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.75);
    outline-offset: 2px;
  }
`;

const AvatarBadge = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
`;

const UserAvatarImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.45);
`;

const TriggerName = styled.span`
  font-weight: 600;
`;

const Caret = styled.span`
  font-size: 0.75rem;
  opacity: 0.85;
`;

const UserMenu = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 260px;
  border-radius: ${(p) => p.theme.borderRadius.large};
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  z-index: 120;
  animation: dropdownFade 0.16s ease;

  @keyframes dropdownFade {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MenuHeader = styled.div`
  padding: 18px 18px 16px;
  background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.05));
  display: flex;
  gap: 12px;
  align-items: center;
`;

const MenuAvatar = styled(AvatarBadge)`
  width: 40px;
  height: 40px;
  font-size: 0.95rem;
`;

const MenuAvatarImage = styled(UserAvatarImage)`
  width: 44px;
  height: 44px;
  border-color: rgba(59, 130, 246, 0.35);
`;

const MenuHeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MenuTitle = styled.span`
  font-weight: 700;
  font-size: 0.95rem;
  color: ${(p) => p.theme.colors.text};
`;

const MenuSubtitle = styled.span`
  font-size: 0.8rem;
  color: ${(p) => p.theme.colors.textLight};
`;

const MenuDivider = styled.hr`
  margin: 0;
  border: none;
  height: 1px;
  background: ${(p) => p.theme.colors.border};
`;

const MenuList = styled.div`
  padding: 8px 0;
  display: flex;
  flex-direction: column;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 10px 18px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
  justify-content: flex-start;
  text-align: left;

  &:hover {
    background: ${(p) => p.theme.colors.backgroundLight};
    transform: translateX(2px);
  }

  &:focus-visible {
    outline: none;
    background: ${(p) => p.theme.colors.backgroundLight};
  }
`;

const MenuIcon = styled.span`
  font-size: 1rem;
`;

const MenuLabel = styled.span`
  font-weight: 600;
  text-align: left;
  width: 100%;
`;

const MenuHint = styled.span`
  display: block;
  font-size: 0.75rem;
  color: ${(p) => p.theme.colors.textLight};
  text-align: left;
`;

const SettingsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const DesktopNavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    display: none;
  }
`;

const DesktopSettings = styled(SettingsContainer)`
  gap: 0.65rem;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    display: none;
  }
`;

const UserCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.75rem;

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    margin-left: auto;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${(p) => p.theme.borderRadius.medium};
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.12);
  color: white;
  font-size: 1.15rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.75);
    outline-offset: 2px;
  }

  @media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
    display: inline-flex;
  }
`;

const MobileMenuOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 130;
  display: flex;
  justify-content: flex-end;
`;

const MobileMenuPanel = styled.div`
  width: min(320px, 85vw);
  height: 100%;
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};
  box-shadow: -12px 0 30px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  border-top-left-radius: ${(p) => p.theme.borderRadius.large};
  border-bottom-left-radius: ${(p) => p.theme.borderRadius.large};
  overflow: hidden;
`;

const MobileMenuHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.05));
`;

const MobileMenuTitle = styled.span`
  font-weight: 700;
  font-size: 1rem;
`;

const MobileMenuClose = styled.button`
  border: none;
  background: transparent;
  color: ${(p) => p.theme.colors.text};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.2rem;

  &:hover {
    opacity: 0.75;
  }
`;

const MobileMenuContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MobileMenuSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const MobileMenuSectionTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${(p) => p.theme.colors.textLight};
`;

const MobileMenuLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.85rem;
  border-radius: ${(p) => p.theme.borderRadius.medium};
  background: ${(p) => p.theme.colors.backgroundLight};
  color: ${(p) => p.theme.colors.text};
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);

  &:hover {
    background: ${(p) => p.theme.colors.hover};
  }
`;

const MobileMenuAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.85rem;
  border-radius: ${(p) => p.theme.borderRadius.medium};
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};
  font-weight: 600;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${(p) => p.theme.colors.backgroundLight};
  }
`;

const MobileMenuDivider = styled.hr`
  border: none;
  height: 1px;
  background: ${(p) => p.theme.colors.border};
  margin: 0.5rem 0;
`;

const SettingsButton = styled.button`
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.5rem;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  min-width: 40px;
  height: 40px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const BellWrapper = styled.div`
  position: relative;
`;

const Badge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 999px;
  min-width: 18px;
  text-align: center;
  font-weight: 700;
  box-shadow: 0 6px 12px rgba(239,68,68,.35);
`;

const LanguageButton = styled(SettingsButton)`
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 68px;
  padding: 0.5rem 0.75rem;
  gap: 0.4rem;
  justify-content: center;
`;

const MenuText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
`;

const LanguageIcon = styled.img`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
`;

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleLanguage, toggleTheme, language, theme } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const { unreadCount } = await notificationService.list(1);
        if (mounted) setUnread(unreadCount || 0);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  // Function to abbreviate user name
  const abbreviateName = (fullName: string): string => {
    if (!fullName) return '';
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0];
    
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    // If first name has more than 1 character, show first letter + dot
    const firstInitial = firstName.length > 1 ? firstName.charAt(0) + '.' : firstName;
    
    return `${firstInitial} ${lastName}`;
  };

  const initials = React.useMemo(() => {
    if (!user?.name) return '👤';
    const parts = user.name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '👤';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }, [user?.name]);

  const userEmail = user?.email || '—';
  const avatarSrc = user?.avatarUrl && user.avatarUrl.trim().length > 0
    ? user.avatarUrl
    : user?.googlePictureUrl || '';
  const languageDisplay = language === 'en'
    ? { icon: '/estados-unidos.svg', code: 'EN' }
    : { icon: '/brasil.svg', code: 'BR' };

  return (
    <>
      {/* Skip Links for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <Nav role="navigation" aria-label="Main navigation">
        <NavContainer>
          <Logo to={isAuthenticated ? '/dashboard' : '/'} title="TaskStudy" aria-label="TaskStudy Home">
            <LogoImg src="/Taskstudy%20icon%202.0.png" alt="TaskStudy" />
            <Brand>TaskStudy</Brand>
          </Logo>
        
        {isAuthenticated ? (
          <>
            <DesktopNavGroup>
              <NavLinks>
                <NavLink to="/dashboard">{t('dashboard')}</NavLink>
              </NavLinks>
              <DesktopSettings>
                <LanguageButton onClick={toggleLanguage} title={t('language')}>
                  <LanguageIcon src={languageDisplay.icon} alt="" aria-hidden="true" />
                  <span>{languageDisplay.code}</span>
                </LanguageButton>
                <SettingsButton onClick={toggleTheme} title={t('theme')}>
                  {theme === 'light' ? '🌙' : '☀️'}
                </SettingsButton>
                <BellWrapper>
                  <SettingsButton
                    onClick={() => setNotifOpen(true)}
                    title={t('mobileMenuNotifications')}
                    aria-label={t('mobileMenuNotifications')}
                  >
                    🔔
                  </SettingsButton>
                  {unread > 0 && (
                    <Badge aria-label={`${unread} notificações não lidas`}>
                      {unread > 99 ? '99+' : unread}
                    </Badge>
                  )}
                </BellWrapper>
              </DesktopSettings>
            </DesktopNavGroup>

            <UserCluster>
              <MobileMenuButton
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  setMobileMenuOpen(true);
                }}
                aria-haspopup="dialog"
                aria-expanded={mobileMenuOpen}
                aria-label={t('mobileMenuOpenLabel')}
              >
                ☰
              </MobileMenuButton>
              <UserInfo>
                <MenuTrigger
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  title="Abrir menu de usuário"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  {avatarSrc ? (
                    <UserAvatarImage src={avatarSrc} alt={user?.name || t('profileAvatarPreviewAlt')} />
                  ) : (
                    <AvatarBadge aria-hidden>{initials}</AvatarBadge>
                  )}
                  <TriggerName>{abbreviateName(user?.name || '')}</TriggerName>
                  <Caret aria-hidden>▾</Caret>
                </MenuTrigger>
                {userMenuOpen && (
                  <UserMenu ref={menuRef} role="menu" aria-label="Menu de usuário">
                    <MenuHeader>
                      {avatarSrc ? (
                        <MenuAvatarImage src={avatarSrc} alt={user?.name || t('profileAvatarPreviewAlt')} />
                      ) : (
                        <MenuAvatar aria-hidden>{initials}</MenuAvatar>
                      )}
                      <MenuHeaderText>
                        <MenuTitle>{user?.name}</MenuTitle>
                        <MenuSubtitle>{userEmail}</MenuSubtitle>
                      </MenuHeaderText>
                    </MenuHeader>
                    <MenuDivider />
                    <MenuList>
                      <MenuItem
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/account');
                        }}
                      >
                        <MenuIcon>⚙️</MenuIcon>
                        <MenuText>
                          <MenuLabel>{t('accountMenuSettingsLabel')}</MenuLabel>
                          <MenuHint>{t('accountMenuSettingsHint')}</MenuHint>
                        </MenuText>
                      </MenuItem>
                      <MenuItem
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <MenuIcon>🚪</MenuIcon>
                        <MenuText>
                          <MenuLabel>{t('logout')}</MenuLabel>
                          <MenuHint>{t('accountMenuLogoutHint')}</MenuHint>
                        </MenuText>
                      </MenuItem>
                    </MenuList>
                  </UserMenu>
                )}
              </UserInfo>
            </UserCluster>
          </>
        ) : (
          <>
            <DesktopNavGroup>
              <NavLinks>
                <NavLink to="/">{t('home')}</NavLink>
                <NavLink to="/login">{t('login')}</NavLink>
                <NavLink to="/register">{t('register')}</NavLink>
              </NavLinks>
              <DesktopSettings>
                <LanguageButton onClick={toggleLanguage} title={t('language')}>
                  <LanguageIcon src={languageDisplay.icon} alt="" aria-hidden="true" />
                  <span>{languageDisplay.code}</span>
                </LanguageButton>
                <SettingsButton onClick={toggleTheme} title={t('theme')}>
                  {theme === 'light' ? '🌙' : '☀️'}
                </SettingsButton>
              </DesktopSettings>
            </DesktopNavGroup>

            <MobileMenuButton
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                setMobileMenuOpen(true);
              }}
              aria-haspopup="dialog"
              aria-expanded={mobileMenuOpen}
              aria-label={t('mobileMenuOpenLabel')}
            >
              ☰
            </MobileMenuButton>
          </>
        )}
      </NavContainer>

      {mobileMenuOpen && (
        <MobileMenuOverlay onClick={closeMobileMenu} role="presentation">
          <MobileMenuPanel
            role="dialog"
            aria-modal="true"
            aria-label={t('mobileMenuTitle')}
            onClick={(event) => event.stopPropagation()}
          >
            <MobileMenuHeader>
              <MobileMenuTitle>{t('mobileMenuTitle')}</MobileMenuTitle>
              <MobileMenuClose
                type="button"
                onClick={closeMobileMenu}
                aria-label={t('mobileMenuCloseLabel')}
              >
                ×
              </MobileMenuClose>
            </MobileMenuHeader>
            <MobileMenuContent>
              <MobileMenuSection>
                <MobileMenuSectionTitle>{t('mobileMenuNavigationTitle')}</MobileMenuSectionTitle>
                {isAuthenticated ? (
                  <MobileMenuLink to="/dashboard" onClick={closeMobileMenu}>
                    <span role="img" aria-hidden>📊</span>
                    <span>{t('dashboard')}</span>
                  </MobileMenuLink>
                ) : (
                  <>
                    <MobileMenuLink to="/" onClick={closeMobileMenu}>
                      <span role="img" aria-hidden>🏠</span>
                      <span>{t('home')}</span>
                    </MobileMenuLink>
                    <MobileMenuLink to="/login" onClick={closeMobileMenu}>
                      <span role="img" aria-hidden>🔑</span>
                      <span>{t('login')}</span>
                    </MobileMenuLink>
                    <MobileMenuLink to="/register" onClick={closeMobileMenu}>
                      <span role="img" aria-hidden>🆕</span>
                      <span>{t('register')}</span>
                    </MobileMenuLink>
                  </>
                )}
              </MobileMenuSection>

              {isAuthenticated && (
                <MobileMenuSection>
                  <MobileMenuSectionTitle>{t('mobileMenuAccountTitle')}</MobileMenuSectionTitle>
                  <MobileMenuAction
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/account');
                    }}
                  >
                    <span role="img" aria-hidden>⚙️</span>
                    <span>{t('accountMenuSettingsLabel')}</span>
                  </MobileMenuAction>
                  <MobileMenuAction
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                  >
                    <span role="img" aria-hidden>🚪</span>
                    <span>{t('logout')}</span>
                  </MobileMenuAction>
                </MobileMenuSection>
              )}

              <MobileMenuDivider />

              <MobileMenuSection>
                <MobileMenuSectionTitle>{t('mobileMenuPreferencesTitle')}</MobileMenuSectionTitle>
                {isAuthenticated && (
                  <MobileMenuAction
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      setNotifOpen(true);
                    }}
                  >
                    <span role="img" aria-hidden>🔔</span>
                    <span>{t('mobileMenuNotifications')}</span>
                  </MobileMenuAction>
                )}
                <MobileMenuAction type="button" onClick={toggleLanguage}>
                  <span role="img" aria-hidden>🌐</span>
                  <span>
                    {t('language')}
                    {': '}
                    {languageDisplay.code}
                  </span>
                </MobileMenuAction>
                <MobileMenuAction type="button" onClick={toggleTheme}>
                  <span role="img" aria-hidden>{theme === 'light' ? '🌙' : '☀️'}</span>
                  <span>{theme === 'light' ? t('darkMode') : t('lightMode')}</span>
                </MobileMenuAction>
              </MobileMenuSection>
            </MobileMenuContent>
          </MobileMenuPanel>
        </MobileMenuOverlay>
      )}
    </Nav>
    <NotificationModal open={notifOpen} onClose={() => setNotifOpen(false)} onMarkedAll={() => setUnread(0)} />
    </>
  );
};