"use client"

import React from 'react';
import MoleculeVisualization from '@/app/components/MoleculeVisualization';

export default function Home() {
    const [content, setContent] = React.useState('');
    const handleClickFile = (content: string) => {
        setContent(content);
    }

    return (
        <div className="flex flex-col items-center justify-between p-32 h-screen">
            <h1>3D Molecule Visualization</h1>
            <div className="w-full h-full">
                <MoleculeVisualization />
            </div>
        </div>
    );
}