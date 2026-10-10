import { Switch, Tooltip } from '@mui/material';
import { useTranslation } from '../i18n/LanguageProvider';

export default function ColorModeToggle({ mode, onToggle }) {
  const { t } = useTranslation();
  const label = mode === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark');

  return (
    <Tooltip title={label}>
      <Switch
        checked={mode === 'dark'}
        onChange={onToggle}
        size="small"
        color="secondary"
        inputProps={{ 'aria-label': label }}
        sx={{
          '& .MuiSwitch-track': { backgroundColor: 'rgba(255, 255, 255, 0.55)' },
          '& .MuiSwitch-switchBase.Mui-checked': { color: '#8be0b7' },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#65d6a5' },
        }}
      />
    </Tooltip>
  );
}
