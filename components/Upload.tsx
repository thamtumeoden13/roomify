import React, {useState} from 'react'
import {useOutletContext} from "react-router";
import {CheckCircleIcon, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../lib/constants";

interface UploadProps {
    onComplete?: (data: string) => void;
}

const Upload = ({onComplete}: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);

    const {isSignedIn} = useOutletContext<AuthContext>();

    const processFile = (file: File) => {
        setFile(file);
        setProgress(0);

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target?.result as string;

            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            onComplete?.(base64Data);
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
            processFile(droppedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
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
                            <p className={"help"}>Maximum file size: 5MB</p>
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
