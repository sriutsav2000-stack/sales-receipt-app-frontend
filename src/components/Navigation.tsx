// src/components/Navigation.tsx
import React from 'react';
import { 
  IonButton, 
  IonIcon, 
  IonButtons, 
  IonToolbar, 
  IonTitle 
} from '@ionic/react';
import { home, arrowBack } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import '../styles/main.css';

const Navigation: React.FC<{ title: string; showBack?: boolean }> = ({ 
  title, 
  showBack = true 
}) => {
  const history = useHistory();
  const location = useLocation();

  const isHome = location.pathname === '/' || location.pathname === '/home';

  return (
 <IonToolbar className="navx-toolbar">
  <IonButtons slot="start">
    {!isHome && (
      <div className="navx-btn-group">
        {showBack && (
          <IonButton
            onClick={() => history.goBack()}
            className="navx-btn navx-back"
            fill="clear"
            size="small"
          >
            <IonIcon icon={arrowBack} slot="start" />
            <span>Back</span>
          </IonButton>
        )}

        <IonButton
          routerLink="/home"
          routerDirection="root"
          className="navx-btn navx-home"
          fill="clear"
          size="small"
        >
          <IonIcon icon={home} slot="start" />
          <span>Home</span>
        </IonButton>
      </div>
    )}
  </IonButtons>

  <IonTitle className="navx-title navx-text-gradient">
    {title}
  </IonTitle>
</IonToolbar>

  );
};

export default Navigation;