import React, {useEffect, useRef, useState} from 'react'
import {useOutletContext} from "react-router";
import {CheckCircleIcon, ImageIcon, UploadIcon} from "lucide-react";
import {MAX_UPLOAD_BYTES, PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../lib/constants";

interface UploadProps {
    onComplete?: (data: string) => void;
    onError?: (error: string) => void;
}

const Upload = ({onComplete, onError}: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const {isSignedIn} = useOutletContext<AuthContext>();

    const clearTimers = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const processFile = (file: File) => {
        if (file.size > MAX_UPLOAD_BYTES) {
            const errorMsg = `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`;
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        clearTimers();
        setError(null);
        setFile(file);
        setProgress(0);

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target?.result as string;

            intervalRef.current = setInterval(() => {
                if (!isMounted.current) {
                    clearTimers();
                    return;
                }

                setProgress((prev) => {
                    if (prev >= 100) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        timeoutRef.current = setTimeout(() => {
                            if (isMounted.current) {
                                onComplete?.(base64Data);
                            }
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return prev + PROGRESS_STEP;
                });
            }, PROGRESS_INTERVAL_MS);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (!isSignedIn) return;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            if (droppedFile.size > MAX_UPLOAD_BYTES) {
                const errorMsg = `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`;
                setError(errorMsg);
                onError?.(errorMsg);
                return;
            }
            processFile(droppedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) {
            e.target.value = '';
            return;
        }

        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > MAX_UPLOAD_BYTES) {
                const errorMsg = `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`;
                setError(errorMsg);
                onError?.(errorMsg);
                e.target.value = '';
                return;
            }
            processFile(selectedFile);
        }
        e.target.value = '';
    };

    return (
        <div className={"upload"}>
            {!file ? (
                    <div
                        className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            className="drop-input"
                            accept=".jpg, .jpeg, .png"
                            disabled={!isSignedIn}
                            onChange={handleFileChange}
                        />

                        <div className="drop-content">
                            <div className="drop-icon">
                                <UploadIcon size={20}/>
                            </div>

                            <p>
                                {isSignedIn
                                    ? "Click to upload or just drag and drop"
                                    : "Please sign in to upload your floor plan"
                                }
                            </p>
                            <p className={"help"}>Maximum file size: {MAX_UPLOAD_BYTES / (1024 * 1024)}MB</p>
                            {error && <p className="error-text"
                                         style={{color: 'red', fontSize: '12px', marginTop: '4px'}}>{error}</p>}
                        </div>
                    </div>
                ) :
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircleIcon className={"check"}/>
                            ) : (
                                <ImageIcon className={"image"}/>
                            )}
                        </div>
                    </div>

                    <h3>{file.name}</h3>

                    <div className="progress">
                        <div className="bar" style={{width: `${progress}%`}}/>

                        <p className="status-text">
                            {progress < 100 ? "Analyzing Floor Plan..." : "Redirecting..."}
                        </p>
                    </div>
                </div>
            }
        </div>
    )
}
export default Upload
