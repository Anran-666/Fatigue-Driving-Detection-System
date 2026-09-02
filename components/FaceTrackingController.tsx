
import React, { useEffect, useRef } from 'react';
import { CameraStatus, SimulationInput } from '../types';

declare const JEELIZFACEFILTER: any;

interface FaceTrackingControllerProps {
    isActive: boolean;
    onUpdate: (faceData: Partial<SimulationInput>) => void;
    onStatusChange: (status: CameraStatus) => void;
}

const FaceTrackingController: React.FC<FaceTrackingControllerProps> = ({ isActive, onUpdate, onStatusChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isInitialized = useRef(false);

    // Refs for calculating metrics over time
    const eyeClosureHistory = useRef<number[]>([]);
    const lastYawnTime = useRef<number>(0);
    const yawnCount = useRef<number>(0);
    const yawnCooldown = 5000; // 5 seconds cooldown per yawn
    const perclosWindow = 60; // Calculate PERCLOS over 60 frames (~1 sec)
    const yawnFrequencyInterval = useRef<number | null>(null);

    useEffect(() => {
        const initFaceFilter = async () => {
            if (!canvasRef.current || !videoRef.current || !isActive || isInitialized.current) return;

            onStatusChange('initializing');
            
            try {
                if (typeof JEELIZFACEFILTER === 'undefined') {
                    throw new Error("JeelizFaceFilter library not loaded yet.");
                }

                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 480, facingMode: 'user' } 
                });
                videoRef.current.srcObject = stream;

                JEELIZFACEFILTER.init({
                    canvas: canvasRef.current,
                    NNCPath: 'https://cdn.jsdelivr.net/npm/jeeliz-facefilter@1.8.5/dist/NNC.json',
                    videoSettings: {
                        videoElement: videoRef.current,
                    },
                    callbackReady: (errCode: any) => {
                        if (errCode) {
                            console.error('JEELIZFACEFILTER 初始化失败:', errCode);
                            onStatusChange('error');
                            return;
                        }
                        console.log('JEELIZFACEFILTER 初始化成功');
                        isInitialized.current = true;
                        onStatusChange('running');
                        JEELIZFACEFILTER.toggle_pause(false, true); // Start detection loop
                    },
                    callbackTrack: (detectState: any) => {
                        if (detectState.detected < 0.8) {
                            onStatusChange('notfound');
                            return;
                        }
                        onStatusChange('running');

                        // 1. Calculate Head Pose (Nodding)
                        // Rotation X: positive when looking down, negative when looking up
                        const headPose = Math.max(0, Math.min(100, (detectState.rx + 0.5) * 100));

                        // 2. Calculate PERCLOS (Eye Closure)
                        // detectState.expressions[0] is mouth opening, [1] is eyebrow up, [2] is right eye closed, [3] is left eye closed
                        const rightEyeClosed = detectState.expressions[2];
                        const leftEyeClosed = detectState.expressions[3];
                        const avgEyeClosure = (rightEyeClosed + leftEyeClosed) / 2;
                        
                        eyeClosureHistory.current.push(avgEyeClosure > 0.7 ? 1 : 0);
                        if (eyeClosureHistory.current.length > perclosWindow) {
                            eyeClosureHistory.current.shift();
                        }
                        const closedFrames = eyeClosureHistory.current.reduce((sum, val) => sum + val, 0);
                        const perclos = (closedFrames / eyeClosureHistory.current.length) * 100;
                        
                        // 3. Calculate Yawn Frequency
                        const mouthOpen = detectState.expressions[0];
                        const currentTime = Date.now();
                        if (mouthOpen > 0.6 && currentTime - lastYawnTime.current > yawnCooldown) {
                            yawnCount.current += 1;
                            lastYawnTime.current = currentTime;
                        }

                        onUpdate({
                            headPose: headPose,
                            perclos: perclos,
                        });
                    },
                });

                 // Set up an interval to update yawn frequency per minute
                if (yawnFrequencyInterval.current) window.clearInterval(yawnFrequencyInterval.current);
                yawnFrequencyInterval.current = window.setInterval(() => {
                    onUpdate({ yawnFrequency: yawnCount.current });
                    yawnCount.current = 0; // Reset count every minute
                }, 60000);
            } catch (err) {
                console.error("Face tracking initialization failed:", err);
                onStatusChange('error');
            }
        };

        const stopFaceFilter = () => {
            if (isInitialized.current) {
                JEELIZFACEFILTER.toggle_pause(true, true);
                JEELIZFACEFILTER.release();
                isInitialized.current = false;
                onStatusChange('idle');

                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
                if(yawnFrequencyInterval.current) {
                    window.clearInterval(yawnFrequencyInterval.current);
                }
            }
        };

        if (isActive) {
            initFaceFilter();
        } else {
            stopFaceFilter();
        }

        return () => {
            stopFaceFilter();
        };
    }, [isActive, onStatusChange, onUpdate]);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, visibility: 'hidden' }}>
            <video ref={videoRef} playsInline autoPlay muted />
            <canvas ref={canvasRef} width="640" height="480" />
        </div>
    );
};

export default FaceTrackingController;
