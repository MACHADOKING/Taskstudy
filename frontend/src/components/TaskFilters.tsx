import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../hooks/useTranslation';

export interface TaskFilters {
	status: string;
	subject: string;
	type: string;
	priority: string;
	sortBy: string;
	search: string;
	dueDateFrom: string;
	dueDateTo: string;
}

interface TaskFiltersProps {
	filters: TaskFilters;
	onFiltersChange: (filters: TaskFilters) => void;
	subjects: string[];
	collapsed?: boolean;
	onToggleCollapse?: () => void;
}

const FiltersContainer = styled.div<{ $collapsed?: boolean }>`
	background: ${(props) => props.theme.colors.white};
	padding: ${(props) => (props.$collapsed ? '1.15rem 1.6rem' : '1.6rem')};
	border-radius: ${(props) => props.theme.borderRadius.large};
	box-shadow: ${(props) => props.theme.shadows.medium};
	border: 1px solid ${(props) => props.theme.colors.borderLight};
	margin: 0 0 1.5rem;
	transition: padding 0.2s ease, box-shadow 0.2s ease;
	width: 100%;

	@media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
		padding: ${(props) => (props.$collapsed ? '1rem 1.1rem' : '1.3rem 1.2rem')};
		border-radius: ${(props) => props.theme.borderRadius.medium};
		box-shadow: ${(props) => props.theme.shadows.small};
	}

	@media (max-width: 480px) {
		padding: ${(props) => (props.$collapsed ? '0.95rem 0.9rem' : '1.15rem 1rem')};
		margin-left: 0;
		margin-right: 0;
	}
`;

const FiltersHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
	gap: 1rem;
	flex-wrap: wrap;

	@media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
		align-items: flex-start;
	}
`;

const HeaderActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	flex-wrap: wrap;
`;

const FiltersTitle = styled.h3`
	margin: 0;
	color: ${(props) => props.theme.colors.text};
	font-size: 1.1rem;
`;

const ClearButton = styled.button`
	background: none;
	border: 1px solid ${(props) => props.theme.colors.border};
	color: ${(props) => props.theme.colors.textLight};
	padding: 0.5rem 1rem;
	border-radius: ${(props) => props.theme.borderRadius.small};
	cursor: pointer;
	font-size: 0.9rem;
	transition: all 0.2s ease;

	&:hover {
		background: ${(props) => props.theme.colors.lightGray};
		color: ${(props) => props.theme.colors.text};
	}
`;

const ToggleButton = styled.button`
	background: ${(props) => props.theme.colors.primary};
	color: #fff;
	border: none;
	border-radius: ${(props) => props.theme.borderRadius.small};
	padding: 0.45rem 0.9rem;
	font-size: 0.9rem;
	font-weight: 600;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	transition: background 0.2s ease, transform 0.2s ease;

	&:hover {
		background: ${(props) => props.theme.colors.primaryDark};
	}

	&:active {
		transform: translateY(1px);
	}
`;

const FiltersGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 1rem;
	align-items: end;
	padding: 0 1.25rem;

	@media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
		padding: 0 0.75rem;
	}

	@media (max-width: 480px) {
		padding: 0 0.5rem;
		gap: 0.85rem;
	}
`;

const FiltersContent = styled.div<{ $collapsed?: boolean }>`
	display: ${(props) => (props.$collapsed ? 'none' : 'block')};
	margin: 0 auto;
`;

const FilterGroup = styled.div`
	display: flex;
	flex-direction: column;
`;

const SearchGroup = styled(FilterGroup)`
	grid-column: 1 / -1;
`;

const DateRangeGroup = styled(FilterGroup)`
	grid-column: span 2;

	@media (max-width: 640px) {
		grid-column: span 1;
	}
`;

const DateRangeCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1rem;
	border: 2px dashed ${(props) => props.theme.colors.border};
	border-radius: ${(props) => props.theme.borderRadius.large};
	background: linear-gradient(
		135deg,
		${(props) => props.theme.colors.backgroundSecondary} 0%,
		${(props) => props.theme.colors.white} 100%
	);
`;

const DateRangeInputs = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(140px, 1fr));
	gap: 0.75rem;

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
	}
`;

const DateRangeHint = styled.span`
	font-size: 0.8rem;
	color: ${(props) => props.theme.colors.textLight};
	display: flex;
	align-items: center;
	gap: 0.35rem;

	&::before {
		content: '🗓️';
	}
`;

const FilterLabel = styled.label`
	color: ${(props) => props.theme.colors.text};
	font-weight: 600;
	margin-bottom: 0.5rem;
	font-size: 0.9rem;
`;

const FilterInput = styled.input`
	padding: 0.75rem;
	border: 2px solid ${(props) => props.theme.colors.border};
	border-radius: ${(props) => props.theme.borderRadius.medium};
	font-size: 1rem;
	background: ${(props) => props.theme.colors.backgroundSecondary};
	color: ${(props) => props.theme.colors.text};
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${(props) => props.theme.colors.primary};
	}

	&::placeholder {
		color: ${(props) => props.theme.colors.textLight};
	}
`;

const FilterSelect = styled.select`
	padding: 0.75rem;
	border: 2px solid ${(props) => props.theme.colors.border};
	border-radius: ${(props) => props.theme.borderRadius.medium};
	font-size: 1rem;
	background: ${(props) => props.theme.colors.backgroundSecondary};
	color: ${(props) => props.theme.colors.text};
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: ${(props) => props.theme.colors.primary};
	}
`;

const ActiveFiltersContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	margin: 0.75rem 0 0;
	flex-wrap: wrap;
	padding: 0 1.25rem;

	@media (max-width: ${(props) => props.theme.breakpoints.tablet}) {
		padding: 0 0.75rem;
	}

	@media (max-width: 480px) {
		padding: 0 0.5rem;
	}
`;

const ActiveFilterTag = styled.div`
	background: ${(props) => props.theme.colors.primaryLight};
	color: #ffffff;
	padding: 0.35rem 0.85rem;
	border-radius: ${(props) => props.theme.borderRadius.medium};
	font-size: 0.85rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	box-shadow: ${(props) => props.theme.shadows.small};
`;

const RemoveFilterButton = styled.button`
	background: none;
	border: none;
	color: inherit;
	cursor: pointer;
	padding: 0;
	font-size: 1rem;

	&:hover {
		opacity: 0.8;
	}
`;

type ActiveFilter = {
	key: keyof TaskFilters | 'dueDateRange';
	label: string;
	value: string;
};

export const TaskFiltersComponent: React.FC<TaskFiltersProps> = ({
	filters,
	onFiltersChange,
	subjects,
	collapsed = false,
	onToggleCollapse,
}) => {
	const { t, language } = useTranslation();
	const filterHeading = language?.startsWith('pt')
		? '🔍 Filtrar'
		: `🔍 ${t('filterSearchTasks')}`;

	const handleFilterChange = (key: keyof TaskFilters, value: string) => {
		onFiltersChange({
			...filters,
			[key]: value,
		});
	};

	const clearAllFilters = () => {
		onFiltersChange({
			status: '',
			subject: '',
			type: '',
			priority: '',
			sortBy: 'dueDate',
			search: '',
			dueDateFrom: '',
			dueDateTo: '',
		});
	};

	const removeFilter = (key: keyof TaskFilters | 'dueDateRange') => {
		if (key === 'dueDateRange') {
			onFiltersChange({
				...filters,
				dueDateFrom: '',
				dueDateTo: '',
			});
			return;
		}

		handleFilterChange(key, '');
	};

	const formatDate = (value: string) => {
		if (!value) {
			return value;
		}

		const formatter = new Intl.DateTimeFormat(
			language === 'pt-BR' ? 'pt-BR' : 'en-US',
			{
				day: '2-digit',
				month: 'short',
				year: 'numeric',
			},
		);

		try {
			if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
				const [year, month, day] = value.split('-').map(Number);
				const date = new Date(year, month - 1, day);
				if (Number.isNaN(date.getTime())) {
					return value;
				}
				return formatter.format(date);
			}

			const parsed = new Date(value);
			if (Number.isNaN(parsed.getTime())) {
				return value;
			}
			return formatter.format(parsed);
		} catch {
			return value;
		}
	};

	const getActiveFilters = (): ActiveFilter[] => {
		const active: ActiveFilter[] = [];

		const statusMap: Record<string, string> = {
			pending: t('pending'),
			completed: t('completed'),
		};

		const typeMap: Record<string, string> = {
			assignment: t('typeAssignment'),
			exam: t('typeExam'),
			reading: t('typeReading'),
		};

		const priorityMap: Record<string, string> = {
			low: t('priorityLow'),
			medium: t('priorityMedium'),
			high: t('priorityHigh'),
		};

		if (filters.status) {
			active.push({ key: 'status', label: t('status'), value: statusMap[filters.status] || filters.status });
		}
		if (filters.subject) {
			active.push({ key: 'subject', label: t('subject'), value: filters.subject });
		}
		if (filters.type) {
			active.push({ key: 'type', label: t('taskType'), value: typeMap[filters.type] || filters.type });
		}
		if (filters.priority) {
			active.push({ key: 'priority', label: t('priority'), value: priorityMap[filters.priority] || filters.priority });
		}
		if (filters.search) {
			active.push({ key: 'search', label: t('search'), value: filters.search });
		}

		if (filters.dueDateFrom || filters.dueDateTo) {
			let value = '';
			if (filters.dueDateFrom && filters.dueDateTo) {
				value = `${formatDate(filters.dueDateFrom)} • ${formatDate(filters.dueDateTo)}`;
			} else if (filters.dueDateFrom) {
				value = `${t('from')} ${formatDate(filters.dueDateFrom)}`;
			} else if (filters.dueDateTo) {
				value = `${t('until')} ${formatDate(filters.dueDateTo)}`;
			}

			active.push({ key: 'dueDateRange', label: t('dueDateRange'), value });
		}

		return active;
	};

	const activeFilters = getActiveFilters();
	const contentId = React.useId();
	const isCollapsed = collapsed;
	const showActions = Boolean(onToggleCollapse) || activeFilters.length > 0;

	return (
		<FiltersContainer $collapsed={isCollapsed}>
			<FiltersHeader>
				<FiltersTitle>{filterHeading}</FiltersTitle>
				{showActions && (
					<HeaderActions>
						{onToggleCollapse && (
							<ToggleButton
								type="button"
								onClick={onToggleCollapse}
								aria-expanded={!isCollapsed}
								aria-controls={contentId}
							>
								<span aria-hidden>{isCollapsed ? '▸' : '▾'}</span>
								{isCollapsed ? t('filtersShow') : t('filtersHide')}
							</ToggleButton>
						)}
						{activeFilters.length > 0 && (
							<ClearButton type="button" onClick={clearAllFilters}>
								{t('clearAllFilters')}
							</ClearButton>
						)}
					</HeaderActions>
				)}
			</FiltersHeader>

			{activeFilters.length > 0 && (
				<ActiveFiltersContainer>
					{activeFilters.map((filter) => (
						<ActiveFilterTag key={filter.key}>
							<span>
								{filter.label}: <strong>{filter.value}</strong>
							</span>
							<RemoveFilterButton
								type="button"
								onClick={() => removeFilter(filter.key)}
								aria-label={`${t('removeFilter')} ${filter.label}`}
							>
								×
							</RemoveFilterButton>
						</ActiveFilterTag>
					))}
				</ActiveFiltersContainer>
			)}

			<FiltersContent
				id={contentId}
				$collapsed={isCollapsed}
				aria-hidden={isCollapsed}
				hidden={isCollapsed}
			>
				<FiltersGrid>
					<SearchGroup>
						<FilterLabel htmlFor="search">{t('search')}</FilterLabel>
						<FilterInput
							id="search"
							type="text"
							placeholder={t('searchPlaceholder')}
							value={filters.search}
							onChange={(e) => handleFilterChange('search', e.target.value)}
						/>
					</SearchGroup>

					<FilterGroup>
						<FilterLabel htmlFor="status">{t('status')}</FilterLabel>
						<FilterSelect
							id="status"
							value={filters.status}
							onChange={(e) => handleFilterChange('status', e.target.value)}
						>
							<option value="">{t('allStatuses')}</option>
							<option value="pending">{t('pending')}</option>
							<option value="completed">{t('completed')}</option>
						</FilterSelect>
					</FilterGroup>

					<FilterGroup>
						<FilterLabel htmlFor="subject">{t('subject')}</FilterLabel>
						<FilterSelect
							id="subject"
							value={filters.subject}
							onChange={(e) => handleFilterChange('subject', e.target.value)}
						>
							<option value="">{t('allSubjects')}</option>
							{subjects.map((subject) => (
								<option key={subject} value={subject}>
									{subject}
								</option>
							))}
						</FilterSelect>
					</FilterGroup>

					<FilterGroup>
						<FilterLabel htmlFor="type">{t('taskType')}</FilterLabel>
						<FilterSelect
							id="type"
							value={filters.type}
							onChange={(e) => handleFilterChange('type', e.target.value)}
						>
							<option value="">{t('allTypes')}</option>
							<option value="assignment">{t('typeAssignment')}</option>
							<option value="exam">{t('typeExam')}</option>
							<option value="reading">{t('typeReading')}</option>
						</FilterSelect>
					</FilterGroup>

					<FilterGroup>
						<FilterLabel htmlFor="priority">{t('priority')}</FilterLabel>
						<FilterSelect
							id="priority"
							value={filters.priority}
							onChange={(e) => handleFilterChange('priority', e.target.value)}
						>
							<option value="">{t('allPriorities')}</option>
							<option value="high">{t('priorityHigh')}</option>
							<option value="medium">{t('priorityMedium')}</option>
							<option value="low">{t('priorityLow')}</option>
						</FilterSelect>
					</FilterGroup>

					<DateRangeGroup>
						<FilterLabel>{t('dueDateRange')}</FilterLabel>
						<DateRangeCard>
							<DateRangeInputs>
								<FilterInput
									id="dueDateFrom"
									type="date"
									value={filters.dueDateFrom}
									onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
									placeholder={t('from')}
									aria-label={t('from')}
									max={filters.dueDateTo || undefined}
								/>
								<FilterInput
									id="dueDateTo"
									type="date"
									value={filters.dueDateTo}
									onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
									placeholder={t('to')}
									aria-label={t('to')}
									min={filters.dueDateFrom || undefined}
								/>
							</DateRangeInputs>
							<DateRangeHint>{t('dueDateRangeHint')}</DateRangeHint>
						</DateRangeCard>
					</DateRangeGroup>
				</FiltersGrid>

				<FiltersGrid style={{ marginTop: '1rem' }}>
					<FilterGroup>
						<FilterLabel htmlFor="sortBy">{t('sortBy')}</FilterLabel>
						<FilterSelect
							id="sortBy"
							value={filters.sortBy}
							onChange={(e) => handleFilterChange('sortBy', e.target.value)}
						>
							<option value="dueDate">{t('sortByDueDate')}</option>
							<option value="createdAt">{t('sortByCreatedAt')}</option>
							<option value="title">{t('sortByTitle')}</option>
							<option value="priority">{t('sortByPriority')}</option>
							<option value="subject">{t('sortBySubject')}</option>
						</FilterSelect>
					</FilterGroup>
				</FiltersGrid>
			</FiltersContent>
		</FiltersContainer>
	);
};
