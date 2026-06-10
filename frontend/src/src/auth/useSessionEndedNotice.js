import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { peekSessionEndedNotice } from './sessionNavigation';

/** Aviso de sesión cerrada (persiste hasta un login exitoso). */
export function useSessionEndedNotice() {
    const location = useLocation();
    const [notice, setNotice] = useState('');

    useEffect(() => {
        const msg = peekSessionEndedNotice();
        setNotice(msg);
    }, [location.pathname, location.key]);

    return notice;
}
