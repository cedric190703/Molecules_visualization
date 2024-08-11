"use client";

import {useState} from "react";
import TopBar from "@/app/components/TopBar";

const AboutPage  = () => {
    const [content, setContent] = useState('');
    const handleClickFile = (content: string) => {
        setContent(content);
    };

    return (
        <div>
            <TopBar handleClickFile={handleClickFile} />
            <div className="flex flex-col items-center justify-between p-32">
                <h1 className="text-2xl p-14">This is a simple molecules visualizer</h1>
                <p className="text-xl">I made this using three JS for the 3D visualization, Next JS for the application structure and Tailwind for the style.</p>
            </div>
        </div>
    )
}

export default AboutPage;