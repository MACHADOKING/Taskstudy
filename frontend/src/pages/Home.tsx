import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';

const HomeContainer = styled.div`
  min-height: calc(100vh - 60px);
  padding: 2rem;
  background: ${props => props.theme.colors.background};
  background-image: linear-gradient(135deg, ${props => props.theme.colors.primary}15, ${props => props.theme.colors.secondary}15);
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const HeroSection = styled.section`
  text-align: center;
  max-width: 800px;
  margin-bottom: 4rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 1rem;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  color: ${props => props.theme.colors.text};
  margin-bottom: 2rem;
  font-weight: 300;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.7;
  margin-bottom: 2rem;
`;

const FeaturesSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 4rem;
`;

const FeatureCard = styled.div`
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 0.75rem;
  font-weight: 600;
  text-align: center;
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.6;
  text-align: center;
`;

const HowToUseSection = styled.section`
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.primary}20;
  border-radius: 16px;
  padding: 3rem;
  width: 100%;
  max-width: 900px;
  margin-bottom: 4rem;
  
  @media (max-width: 768px) {
    padding: 2rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 600;
`;

const StepsList = styled.ol`
  list-style: none;
  counter-reset: step-counter;
  padding: 0;
`;

const Step = styled.li`
  counter-increment: step-counter;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  
  &::before {
    content: counter(step-counter);
    background: ${props => props.theme.colors.primary};
    color: white;
    font-weight: bold;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
    font-size: 0.9rem;
  }
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const StepDescription = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.5;
  margin: 0;
`;

const CTASection = styled.section`
  text-align: center;
  max-width: 600px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
`;

const Button = styled(Link)`
  display: inline-block;
  padding: 1rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  min-width: 140px;
  text-align: center;
  
  &.primary {
    background: ${props => props.theme.colors.primary};
    color: white;
    
    &:hover {
      background: ${props => props.theme.colors.primaryDark || props.theme.colors.primary};
      transform: translateY(-2px);
    }
  }
  
  &.secondary {
    background: transparent;
    color: ${props => props.theme.colors.primary};
    border: 2px solid ${props => props.theme.colors.primary};
    
    &:hover {
      background: ${props => props.theme.colors.primary};
      color: white;
      transform: translateY(-2px);
    }
  }
`;

const AccessibilityNote = styled.div`
  margin-top: 3rem;
  padding: 1.5rem;
  background: ${props => props.theme.colors.info}15;
  border-left: 4px solid ${props => props.theme.colors.info};
  border-radius: 0 8px 8px 0;
  text-align: left;
  max-width: 800px;
`;

const AccessibilityTitle = styled.h3`
  color: ${props => props.theme.colors.info};
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
`;

const AccessibilityText = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin: 0;
  line-height: 1.6;
`;

export const Home: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <HomeContainer>
      <HeroSection>
        <Title>{t('homeTitle')}</Title>
        <Subtitle>{t('homeSubtitle')}</Subtitle>
        <Description>{t('homeDescription')}</Description>
      </HeroSection>

      <FeaturesSection>
        <FeatureCard>
          <FeatureIcon>📚</FeatureIcon>
          <FeatureTitle>{t('academicOrganization')}</FeatureTitle>
          <FeatureDescription>{t('academicOrganizationDesc')}</FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>📊</FeatureIcon>
          <FeatureTitle>{t('progressAnalytics')}</FeatureTitle>
          <FeatureDescription>{t('progressAnalyticsDesc')}</FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>♿</FeatureIcon>
          <FeatureTitle>{t('fullyAccessible')}</FeatureTitle>
          <FeatureDescription>{t('fullyAccessibleDesc')}</FeatureDescription>
        </FeatureCard>

      </FeaturesSection>

      <HowToUseSection>
        <SectionTitle>{t('howToUse')}</SectionTitle>
        <StepsList>
          <Step>
            <StepContent>
              <StepTitle>{t('step1Title')}</StepTitle>
              <StepDescription>{t('step1Desc')}</StepDescription>
            </StepContent>
          </Step>
          
          <Step>
            <StepContent>
              <StepTitle>{t('step2Title')}</StepTitle>
              <StepDescription>{t('step2Desc')}</StepDescription>
            </StepContent>
          </Step>
          
          <Step>
            <StepContent>
              <StepTitle>{t('step3Title')}</StepTitle>
              <StepDescription>{t('step3Desc')}</StepDescription>
            </StepContent>
          </Step>
          
          <Step>
            <StepContent>
              <StepTitle>{t('step4Title')}</StepTitle>
              <StepDescription>{t('step4Desc')}</StepDescription>
            </StepContent>
          </Step>
        </StepsList>
      </HowToUseSection>

      <CTASection>
        <ButtonGroup>
          {user ? (
            <Button to="/dashboard" className="primary">
              {t('goToDashboard')}
            </Button>
          ) : (
            <>
              <Button to="/register" className="primary">
                {t('getStarted')}
              </Button>
              <Button to="/login" className="secondary">
                {t('signIn')}
              </Button>
            </>
          )}
        </ButtonGroup>
      </CTASection>

      <AccessibilityNote>
        <AccessibilityTitle>{t('accessibilityFeatures')}</AccessibilityTitle>
        <AccessibilityText>{t('accessibilityNote')}</AccessibilityText>
      </AccessibilityNote>
    </HomeContainer>
  );
};