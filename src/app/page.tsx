"use client";

import {useState} from 'react';
import MoleculeVisualization from '@/app/components/MoleculeVisualization';
import TopBar from "@/app/components/TopBar";

export default function Home() {
    const [content, setContent] = useState('');
    const handleClickFile = (content: string) => {
        setContent(content);
    };

    return (
        <div>
            <TopBar handleClickFile={handleClickFile} />
            <div className="flex flex-col items-center justify-between p-32 h-screen">
                <h1>3D Molecule Visualization</h1>
                <div className="w-full h-full">
                    <MoleculeVisualization content={content} />
                </div>
            </div>
        </div>
    );
}