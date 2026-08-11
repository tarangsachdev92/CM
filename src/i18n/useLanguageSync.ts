import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import i18n from './index';
import { RootState } from '../store';

export const useLanguageSync = () => {
  const language = useSelector((state: RootState) => state.userLanguage.data);

  useEffect(() => {
    if (!language?.languageCode) {
      return;
    }
    const next = language.languageCode.toLowerCase();
    if (i18n.language?.toLowerCase() !== next) {
      void i18n.changeLanguage(next);
    }
  }, [language]);
};
