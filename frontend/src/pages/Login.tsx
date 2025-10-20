import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';

const Container = styled.div`
  min-height: calc(100vh - 70px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const FormCard = styled.div`
  background: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 3rem;
  border-radius: ${(props) => props.theme.borderRadius.large};
  box-shadow: ${(props) => props.theme.shadows.large};
  width: 100%;
  max-width: 450px;
`;

const Title = styled.h1`
  color: ${(props) => props.theme.colors.primary};
  margin-bottom: 0.5rem;
  text-align: center;
`;

const Subtitle = styled.p`
  color: ${(props) => props.theme.colors.textLight};
  text-align: center;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.medium};
  font-size: 1rem;
  background: ${(props) => props.theme.colors.white};
  color: ${(props) => props.theme.colors.text};
  transition: border-color 0.2s;
  
  &:focus {
    border-color: ${(props) => props.theme.colors.primary};
    outline: none;
  }
  
  &::placeholder {
    color: ${(props) => props.theme.colors.textMuted};
  }
`;

const Button = styled.button`
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  padding: 0.875rem;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${(props) => props.theme.colors.primaryDark};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinkText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: ${(props) => props.theme.colors.textLight};
  
  a {
    color: ${(props) => props.theme.colors.primary};
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1.5rem;
  color: ${(props) => props.theme.colors.textMuted};
  font-size: 0.9rem;
`;

const DividerLine = styled.span`
  flex: 1;
  height: 1px;
  background: ${(props) => props.theme.colors.border};
`;

const GoogleLabel = styled.p`
  text-align: center;
  color: ${(props) => props.theme.colors.textLight};
  margin-bottom: 0.75rem;
  font-weight: 500;
`;

const GoogleWrapper = styled.div<{ disabled?: boolean }>`
  display: flex;
  justify-content: center;
  pointer-events: ${(props) => (props.disabled ? 'none' : 'auto')};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  padding: 0.25rem;
  border-radius: 999px;
  background: ${(props) => props.theme.mode === 'dark' ? props.theme.colors.backgroundSecondary : props.theme.colors.white};
  border: 1px solid ${(props) => props.theme.mode === 'dark' ? props.theme.colors.borderLight : props.theme.colors.border};
  box-shadow: ${(props) => props.theme.shadows.small};
  max-width: 320px;
  margin: 0 auto;
`;

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const hasGoogleSignIn = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      // O erro já é tratado pelo authService com toast
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      showToast.error('toastGoogleLoginError');
      return;
    }

    setGoogleLoading(true);

    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Google login error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    showToast.error('toastGoogleLoginError');
  };

  return (
    <Container>
      <FormCard>
        <Title>{t('welcome')} 👋</Title>
        <Subtitle>{t('loginSubtitle')}</Subtitle>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              required
              minLength={8}
            />
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? t('loggingIn') : t('login')}
          </Button>
        </Form>

        {hasGoogleSignIn && (
          <>
            <Divider>
              <DividerLine />
              <span>{t('or')}</span>
              <DividerLine />
            </Divider>

            <GoogleLabel>{t('continueWithGoogle')}</GoogleLabel>
            <GoogleWrapper disabled={googleLoading}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                shape="pill"
                text="continue_with"
                theme="filled_black"
                size="large"
                width="320"
                logo_alignment="left"
              />
            </GoogleWrapper>
          </>
        )}
        
        <LinkText>
          {t('dontHaveAccount')} <Link to="/register">{t('registerHere')}</Link>
        </LinkText>
      </FormCard>
    </Container>
  );
};