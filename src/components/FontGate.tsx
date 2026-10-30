import type {FC, ReactNode} from 'react';
import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {fontsReady} from '../theme/fonts';

/**
 * Retient le rendu tant que les polices ne sont pas chargées : la mise en page
 * mesure le vrai texte, elle doit donc attendre les vraies polices.
 */
export const FontGate: FC<{children: ReactNode}> = ({children}) => {
	const [handle] = useState(() => delayRender('Chargement des polices'));
	const [ready, setReady] = useState(false);

	useEffect(() => {
		fontsReady
			.then(() => {
				setReady(true);
				continueRender(handle);
			})
			.catch((error: unknown) => cancelRender(error));
	}, [handle]);

	return ready ? <>{children}</> : null;
};
