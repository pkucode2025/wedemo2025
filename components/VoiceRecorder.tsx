import React, { useState, useRef } from 'react';

/**
 * Simple voice recorder using the MediaRecorder API.
 * It records audio, creates a Blob, and passes the File to a callback.
 */
interface VoiceRecorderProps {
    onRecordComplete: (file: File) => void;
    token: string; // auth token for upload
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordComplete, token }) => {
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            alert('Your browser does not support audio recording');
            return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
            onRecordComplete(file);
            chunksRef.current = [];
        };
        mediaRecorder.start();
        setRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    return (
        <div className="flex items-center space-x-2">
            {recording ? (
                <button
                    onClick={stopRecording}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                >
                    Stop
                </button>
            ) : (
                <button
                    onClick={startRecording}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                >
                    Record Voice
                </button>
            )}
        </div>
    );
};

export default VoiceRecorder;
