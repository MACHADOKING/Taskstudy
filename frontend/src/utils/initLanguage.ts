// Initialize Portuguese language as default
export const initializePortugueseLanguage = () => {
  if (!localStorage.getItem('taskstudy-language')) {
    localStorage.setItem('taskstudy-language', 'pt-BR');
  }
};