import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Task, CreateTaskData, taskService, TaskAttachment } from '../services/taskService';
import { useTranslation } from '../hooks/useTranslation';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => void;
  editingTask?: Task | null;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${(props) => props.theme.colors.white};
  border-radius: ${(props) => props.theme.borderRadius.large};
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${(props) => props.theme.shadows.large};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  color: ${(props) => props.theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${(props) => props.theme.colors.textLight};
  padding: 0.5rem;
  
  &:hover {
    color: ${(props) => props.theme.colors.text};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormColumns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
`;

const MainColumn = styled.div`
  flex: 2 1 360px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AttachmentsColumn = styled.div`
  flex: 1 1 260px;
  display: flex;
`;

const AttachmentsCard = styled.div`
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.medium};
  background: ${(props) => props.theme.colors.backgroundLight};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
`;

const AttachmentsTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: ${(props) => props.theme.colors.text};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: ${(props) => props.theme.colors.text};
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.medium};
  font-size: 1rem;
  background: ${(props) => props.theme.colors.white};
  color: ${(props) => props.theme.colors.text};
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.medium};
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  background: ${(props) => props.theme.colors.white};
  color: ${(props) => props.theme.colors.text};
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.medium};
  font-size: 1rem;
  background: ${(props) => props.theme.colors.white};
  color: ${(props) => props.theme.colors.text};
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.medium};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: ${props.theme.colors.primary};
    color: white;
    
    &:hover {
      background: ${props.theme.colors.primaryDark};
    }
  ` : `
    background: ${props.theme.colors.lightGray};
    color: ${props.theme.colors.text};
    
    &:hover {
      background: ${props.theme.colors.border};
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: ${(props) => props.theme.colors.error};
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const FileInput = styled.input`
  padding: 0.75rem;
  border: 2px dashed ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.medium};
  background: ${(props) => props.theme.colors.backgroundLight};
  color: ${(props) => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const AttachmentHint = styled.p`
  font-size: 0.85rem;
  color: ${(props) => props.theme.colors.textLight};
  margin-top: 0.5rem;
`;

const AttachmentList = styled.ul`
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AttachmentItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.medium};
  background: ${(props) => props.theme.colors.backgroundLight};
  gap: 1rem;
  flex-wrap: wrap;
`;

const AttachmentInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: ${(props) => props.theme.colors.text};

  span {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  small {
    color: ${(props) => props.theme.colors.textLight};
  }
`;

const AttachmentActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const AttachmentLink = styled.a`
  color: ${(props) => props.theme.colors.primary};
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const RemoveAttachmentButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.error};
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

type FormState = CreateTaskData & {
  dueTime: string;
  attachments: TaskAttachment[];
};

const ATTACHMENTS_INPUT_ID = 'task-form-attachments-input';

interface AttachmentsPanelProps {
  attachments: TaskAttachment[];
  error?: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  labels: {
    title: string;
    addHint: string;
    limitHint: string;
    download: string;
    remove: string;
  };
}

const AttachmentsPanel: React.FC<AttachmentsPanelProps> = ({
  attachments,
  error,
  onFileChange,
  onRemoveAttachment,
  labels,
}) => (
  <AttachmentsCard>
    <AttachmentsTitle as="label" htmlFor={ATTACHMENTS_INPUT_ID}>
      {labels.title}
    </AttachmentsTitle>
    <FileInput
      id={ATTACHMENTS_INPUT_ID}
      name="attachments"
      type="file"
      accept=".pdf,image/*"
      multiple
      onChange={onFileChange}
    />
    <AttachmentHint>{labels.addHint}</AttachmentHint>
    <AttachmentHint>{labels.limitHint}</AttachmentHint>
    {error && <ErrorMessage>{error}</ErrorMessage>}

    {attachments.length > 0 && (
      <AttachmentList>
        {attachments.map((attachment, index) => (
          <AttachmentItem key={`${attachment.name}-${index}`}>
            <AttachmentInfo>
              <span>📎 {attachment.name}</span>
              <small>
                {(attachment.size / 1024).toFixed(1)} KB • {attachment.type}
              </small>
            </AttachmentInfo>
            <AttachmentActions>
              <AttachmentLink href={attachment.data} download={attachment.name}>
                {labels.download}
              </AttachmentLink>
              <RemoveAttachmentButton
                type="button"
                onClick={() => onRemoveAttachment(index)}
              >
                {labels.remove}
              </RemoveAttachmentButton>
            </AttachmentActions>
          </AttachmentItem>
        ))}
      </AttachmentList>
    )}
  </AttachmentsCard>
);

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTask
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormState>({
    title: '',
    description: '',
    subject: '',
    type: 'assignment',
    dueDate: '',
    priority: 'medium',
    dueTime: '',
    attachments: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const extractDateAndTime = (isoString: string) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return { date: '', time: '' };
    }

    const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
    const [datePart, timePartWithMs] = localISO.split('T');
    const timePart = timePartWithMs?.slice(0, 5) ?? '';

    return { date: datePart, time: timePart };
  };

  useEffect(() => {
    if (editingTask) {
      const { date, time } = extractDateAndTime(editingTask.dueDate);
      setFormData({
        title: editingTask.title,
        description: editingTask.description,
        subject: editingTask.subject,
        type: editingTask.type,
        dueDate: date,
        priority: editingTask.priority,
        dueTime: time,
        attachments: editingTask.attachments || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        subject: '',
        type: 'assignment',
        dueDate: '',
        priority: 'medium',
        dueTime: '',
        attachments: [],
      });
    }
    setErrors({});
  }, [editingTask, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (!formData.dueTime) {
      newErrors.dueTime = 'Due time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetAttachmentInput = (input: HTMLInputElement | null) => {
    if (input) {
      input.value = '';
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    const fileList = files ? Array.from(files) : [];

    if (!fileList.length) {
      resetAttachmentInput(event.target);
      return;
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const oversizedFiles = fileList.filter(file => file.size > 5 * 1024 * 1024);
    const unsupportedFiles = fileList.filter(file => !allowedTypes.includes(file.type));

    if (unsupportedFiles.length > 0) {
      setErrors(prev => ({ ...prev, attachments: t('unsupportedAttachmentType') }));
    } else if (oversizedFiles.length > 0) {
      setErrors(prev => ({ ...prev, attachments: t('attachmentLimitWarning') }));
    } else {
      setErrors(prev => ({ ...prev, attachments: '' }));
    }

    const validFiles = fileList.filter(file => allowedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024);

    const toAttachment = (file: File) => new Promise<TaskAttachment>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: typeof reader.result === 'string' ? reader.result : '',
        });
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });

    try {
      const newAttachments = await Promise.all(validFiles.map(toAttachment));
      if (newAttachments.length) {
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...newAttachments],
        }));
      }
    } catch (error) {
      console.error('Attachment processing error:', error);
      setErrors(prev => ({ ...prev, attachments: t('anErrorOccurred') }));
    } finally {
      resetAttachmentInput(event.target);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const { dueTime, attachments, ...rest } = formData;
      const dueDateTime = new Date(`${formData.dueDate}T${dueTime}`);

      if (Number.isNaN(dueDateTime.getTime())) {
        setErrors(prev => ({ ...prev, dueDate: 'Invalid due date' }));
        return;
      }

      const payload: CreateTaskData = {
        ...rest,
        dueDate: dueDateTime.toISOString(),
        attachments,
      };

      let result: Task;

      if (editingTask) {
        result = await taskService.updateTask(editingTask.id, payload);
      } else {
        result = await taskService.createTask(payload);
      }
      
      onSubmit(result);
      onClose();
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response && 
        'data' in error.response && typeof error.response.data === 'object' && 
        error.response.data && 'message' in error.response.data 
        ? String(error.response.data.message) 
        : t('anErrorOccurred');
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
  <Overlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <Modal>
        <Header>
          <Title>{editingTask ? t('editTask') : t('createNewTask')}</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <FormColumns>
            <MainColumn>
              <FormGroup>
                <Label htmlFor="title">{t('titleRequired')}</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t('enterTaskTitle')}
                />
                {errors.title && <ErrorMessage>{errors.title}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="subject">{t('subjectRequired')}</Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t('subjectPlaceholder')}
                />
                {errors.subject && <ErrorMessage>{errors.subject}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="type">{t('taskType')}</Label>
                <Select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="assignment">{t('typeAssignment')}</option>
                  <option value="exam">{t('typeExam')}</option>
                  <option value="reading">{t('typeReading')}</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="priority">{t('priority')}</Label>
                <Select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="low">{t('priorityLow')}</option>
                  <option value="medium">{t('priorityMedium')}</option>
                  <option value="high">{t('priorityHigh')}</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="dueDate">{t('dueDateRequired')}</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
                {errors.dueDate && <ErrorMessage>{errors.dueDate}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="dueTime">{t('dueTimeRequired')}</Label>
                <Input
                  id="dueTime"
                  name="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={handleChange}
                />
                {errors.dueTime && <ErrorMessage>{errors.dueTime}</ErrorMessage>}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="description">{t('taskDescription')}</Label>
                <TextArea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('descriptionPlaceholder')}
                />
              </FormGroup>
            </MainColumn>

            <AttachmentsColumn>
              <AttachmentsPanel
                attachments={formData.attachments}
                error={errors.attachments}
                onFileChange={handleFileChange}
                onRemoveAttachment={handleRemoveAttachment}
                labels={{
                  title: t('attachments'),
                  addHint: t('addAttachments'),
                  limitHint: t('attachmentLimitWarning'),
                  download: t('downloadAttachment'),
                  remove: t('removeAttachment'),
                }}
              />
            </AttachmentsColumn>
          </FormColumns>

          {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}

          <ButtonGroup>
            <Button type="button" $variant="secondary" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" $variant="primary" disabled={loading}>
              {loading ? t('saving') : editingTask ? t('updateTask') : t('createTask')}
            </Button>
          </ButtonGroup>
        </Form>
      </Modal>
    </Overlay>
  );
};