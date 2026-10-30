import type {FC, ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import type {Camera} from '../camera/camera';
import {cameraTransform} from '../camera/camera';

/** Conteneur du monde : tout ce qu'il contient est filmé par la caméra. */
export const CameraContainer: FC<{camera: Camera; children: ReactNode}> = ({camera, children}) => (
	<AbsoluteFill style={{overflow: 'hidden'}}>
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				transformOrigin: '0 0',
				transform: cameraTransform(camera),
			}}
		>
			{children}
		</div>
	</AbsoluteFill>
);
